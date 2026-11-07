'use strict';

/**
 * models.js - the OOP layer of the project.
 *
 *  Trip         one saved trip (a record in "My Trips"); knows how to validate itself and calculate its price.
 *  TripManager  CRUD + search/sort + statistics for many Trip objects, persisted through JsonStore (localStorage).
 *  CoastalSpot  one destination on the "Live Coast" page; receives data from the weather API and turns it into
 *               values the interface can show (condition, temperature in C/F, beach score).
 *
 * Existing helpers from earlier stages are reused instead of duplicated:
 *   calculateTotal (main.js), buildItinerary / checkRequired / checkEmail / checkRange ... (validation.js),
 *   durations and activities (data.js).
 */

class Trip {
    constructor(data) {
        const d = data || {};
        this.id = d.id || Trip.newId();
        this.fullName = String(d.fullName || '').trim();
        this.email = String(d.email || '').trim();
        this.startDate = String(d.startDate || '');
        this.durationId = String(d.durationId || '');
        this.travelers = Number(d.travelers);
        this.activityIds = Array.isArray(d.activityIds) ? d.activityIds.map(String) : [];
        this.createdAt = d.createdAt || new Date().toISOString();
    }

    static newId() {
        return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    /** "2026-12-05" -> Date at local midnight, or null when the text is not a real calendar date. */
    static parseDate(iso) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
        if (!match) { return null; }
        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return Trip.toIso(date) === iso ? date : null;
    }

    static toIso(date) {
        const pad = function (n) { return String(n).padStart(2, '0'); };
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }

    get duration() {
        return durations.find(function (d) { return d.id === this.durationId; }, this) || null;
    }

    get days() { return this.duration ? this.duration.days : 0; }

    get activities() {
        return activities.filter(function (a) { return this.activityIds.includes(a.id); }, this);
    }

    get extrasPerPerson() {
        return this.activities.reduce(function (sum, a) { return sum + a.extra; }, 0);
    }

    get total() {
        return this.duration ? calculateTotal(this.duration.price, this.travelers, this.extrasPerPerson) : 0;
    }

    get endDate() {
        const start = Trip.parseDate(this.startDate);
        if (!start || this.days < 1) { return ''; }
        start.setDate(start.getDate() + this.days - 1);
        return Trip.toIso(start);
    }

    /** Day-by-day plan (reuses buildItinerary from validation.js). */
    itinerary() {
        const labels = this.activities.map(function (a) { return a.label; });
        return labels.length && this.days ? buildItinerary(this.days, labels) : [];
    }

    /**
     * Returns a list of error messages (empty list = valid).
     * options.checkPast = true  -> the start date may not be in the past (used when creating / editing).
     */
    validate(options) {
        const opts = options || {};
        const errors = [];
        const add = function (message) { if (message) { errors.push(message); } };

        add(checkRequired(this.fullName, 'Full name') || checkMinLength(this.fullName, 'Full name', 3));
        add(checkRequired(this.email, 'Email') || checkEmail(this.email));
        if (!Trip.parseDate(this.startDate)) {
            add('Start date is required.');
        } else if (opts.checkPast) {
            add(checkFutureDate(this.startDate));
        }
        if (!this.duration) { add('Please choose a duration.'); }
        add(checkRange(String(this.travelers), 'Travelers count', 1, 10));
        if (this.activities.length === 0) { add('Select at least one activity.'); }
        return errors;
    }

    toJSON() {
        return {
            id: this.id, fullName: this.fullName, email: this.email, startDate: this.startDate,
            durationId: this.durationId, travelers: this.travelers, activityIds: this.activityIds,
            createdAt: this.createdAt
        };
    }

    /** Rebuild a Trip from stored data; returns null for broken records so they are skipped safely. */
    static fromJSON(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) { return null; }
        const trip = new Trip(obj);
        return trip.validate().length === 0 ? trip : null;
    }
}


class TripManager {
    constructor(storageKey) {
        this.store = new JsonStore(storageKey, []);
        this.trips = this.load();
    }

    load() {
        const raw = this.store.read();
        return Array.isArray(raw) ? raw.map(Trip.fromJSON).filter(Boolean) : [];
    }

    save() {
        return this.store.write(this.trips.map(function (t) { return t.toJSON(); }));
    }

    get(id) {
        return this.trips.find(function (t) { return t.id === id; }) || null;
    }

    /** Create. Returns true when the trip was stored. */
    add(trip) {
        this.trips.push(trip);
        if (this.save()) { return true; }
        this.trips.pop();            // storage failed -> undo
        return false;
    }

    /** Update: merge new field values into an existing trip (id and creation time are kept). */
    update(id, fields) {
        const index = this.trips.findIndex(function (t) { return t.id === id; });
        if (index === -1) { return false; }
        const old = this.trips[index];
        this.trips[index] = new Trip(Object.assign({}, old.toJSON(), fields, { id: old.id, createdAt: old.createdAt }));
        if (this.save()) { return true; }
        this.trips[index] = old;
        return false;
    }

    /** Delete one trip. */
    remove(id) {
        const before = this.trips.slice();
        this.trips = this.trips.filter(function (t) { return t.id !== id; });
        if (this.save()) { return true; }
        this.trips = before;
        return false;
    }

    /** Delete everything. */
    clear() {
        const before = this.trips;
        this.trips = [];
        if (this.save()) { return true; }
        this.trips = before;
        return false;
    }

    /** Search by name / email / duration / activity and sort the result. */
    search(query, sortKey) {
        const text = String(query || '').trim().toLowerCase();
        const sorters = {
            newest: function (a, b) { return b.createdAt.localeCompare(a.createdAt); },
            date: function (a, b) { return a.startDate.localeCompare(b.startDate); },
            'total-desc': function (a, b) { return b.total - a.total; },
            'total-asc': function (a, b) { return a.total - b.total; },
            name: function (a, b) { return a.fullName.localeCompare(b.fullName); }
        };
        return this.trips
            .filter(function (t) {
                if (!text) { return true; }
                const haystack = [t.fullName, t.email, t.duration ? t.duration.label : '']
                    .concat(t.activities.map(function (a) { return a.label; })).join(' ').toLowerCase();
                return haystack.includes(text);
            })
            .sort(sorters[sortKey] || sorters.newest);
    }

    /** Numbers for the statistics panel. */
    stats() {
        const count = this.trips.length;
        const totalCost = this.trips.reduce(function (sum, t) { return sum + t.total; }, 0);
        const travelers = this.trips.reduce(function (sum, t) { return sum + t.travelers; }, 0);
        const counts = {};
        this.trips.forEach(function (t) {
            t.activities.forEach(function (a) { counts[a.label] = (counts[a.label] || 0) + 1; });
        });
        const popular = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || '—';
        return { count: count, totalCost: totalCost, avgTravelers: count ? travelers / count : 0, popularActivity: popular };
    }
}


class CoastalSpot {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.country = data.country;
        this.region = data.region;
        this.lat = data.lat;
        this.lon = data.lon;
        this.weather = null;         // filled by applyWeather()
    }

    /** Take one item of the API answer. Returns false (and keeps weather = null) when the data is unusable. */
    applyWeather(payload) {
        const c = payload && payload.current;
        const d = payload && payload.daily;
        if (!c || !Number.isFinite(c.temperature_2m)) { this.weather = null; return false; }
        const first = function (list, fallback) {
            return Array.isArray(list) && Number.isFinite(list[0]) ? list[0] : fallback;
        };
        this.weather = {
            temp: c.temperature_2m,
            wind: Number(c.wind_speed_10m) || 0,
            humidity: Number(c.relative_humidity_2m) || 0,
            code: Number(c.weather_code) || 0,
            high: first(d && d.temperature_2m_max, c.temperature_2m),
            low: first(d && d.temperature_2m_min, c.temperature_2m)
        };
        return true;
    }

    get hasWeather() { return this.weather !== null; }

    /** WMO weather code -> label + Font Awesome icon. */
    get condition() {
        const code = this.weather ? this.weather.code : -1;
        if (code === 0) { return { label: 'Clear sky', icon: 'fa-sun' }; }
        if (code === 1 || code === 2) { return { label: 'Partly cloudy', icon: 'fa-cloud-sun' }; }
        if (code === 3) { return { label: 'Overcast', icon: 'fa-cloud' }; }
        if (code === 45 || code === 48) { return { label: 'Fog', icon: 'fa-smog' }; }
        if (code >= 51 && code <= 57) { return { label: 'Drizzle', icon: 'fa-cloud-rain' }; }
        if (code >= 61 && code <= 67) { return { label: 'Rain', icon: 'fa-cloud-showers-heavy' }; }
        if (code >= 71 && code <= 77) { return { label: 'Snow', icon: 'fa-snowflake' }; }
        if (code >= 80 && code <= 82) { return { label: 'Rain showers', icon: 'fa-cloud-showers-heavy' }; }
        if (code === 85 || code === 86) { return { label: 'Snow showers', icon: 'fa-snowflake' }; }
        if (code >= 95) { return { label: 'Thunderstorm', icon: 'fa-bolt' }; }
        return { label: 'No data', icon: 'fa-cloud' };
    }

    /** Convert a Celsius value to the chosen unit ("C" or "F"). */
    static convert(celsius, unit) {
        return unit === 'F' ? celsius * 9 / 5 + 32 : celsius;
    }

    tempIn(unit) { return this.weather ? CoastalSpot.convert(this.weather.temp, unit) : NaN; }

    /** Simple 0-100 "beach day" score: best at ~27 C, calm wind, no rain / storm. */
    get beachScore() {
        if (!this.weather) { return 0; }
        const w = this.weather;
        let score = 100 - Math.min(60, Math.abs(w.temp - 27) * 4);
        score -= Math.max(0, w.wind - 15) * 1.5;
        if (w.code >= 95) { score -= 45; } else if (w.code >= 51) { score -= 25; }
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    get scoreLabel() {
        const s = this.beachScore;
        return s >= 80 ? 'Perfect' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Poor';
    }
}
