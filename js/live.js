'use strict';

const LIVE_PREFS_KEY = 'wanderlens:live-prefs';
const LIVE_CACHE_KEY = 'wanderlens:live-cache';
const LIVE_REGIONS = ['All', 'Europe', 'Asia', 'Americas', 'Oceania'];
const LIVE_SORTS = ['name', 'warm', 'cool', 'wind', 'beach'];

function initLivePage() {
    const api = new WeatherApi();
    const spots = coastalSpots.map(function (data) { return new CoastalSpot(data); });
    const prefsStore = new JsonStore(LIVE_PREFS_KEY, {});
    const cacheStore = new JsonStore(LIVE_CACHE_KEY, null);
    const $ = function (id) { return document.getElementById(id); };
    const els = {
        search: $('live-search'), sort: $('live-sort'), unit: $('live-unit'), refresh: $('live-refresh'),
        updated: $('live-updated'), note: $('live-note'), status: $('live-status'),
        loading: $('live-loading'), error: $('live-error'), errorText: $('live-error-text'), retry: $('live-retry'),
        empty: $('live-empty'), emptyText: $('live-empty-text'), reset: $('live-empty-reset'),
        content: $('live-content'), stats: $('live-stats'), grid: $('live-grid'),
        regionButtons: document.querySelectorAll('[data-region]')
    };

    function loadPrefs() {
        const saved = prefsStore.read();
        const p = saved && typeof saved === 'object' ? saved : {};
        return {
            query: typeof p.query === 'string' ? p.query.slice(0, 60) : '',
            region: LIVE_REGIONS.includes(p.region) ? p.region : 'All',
            sort: LIVE_SORTS.includes(p.sort) ? p.sort : 'name',
            unit: p.unit === 'F' ? 'F' : 'C'
        };
    }
    const state = loadPrefs();
    function savePrefs() { prefsStore.write(state); }

    function showOnly(name) {
        els.loading.classList.toggle('d-none', name !== 'loading');
        els.error.classList.toggle('d-none', name !== 'error');
        els.empty.classList.toggle('d-none', name !== 'empty');
        els.content.classList.toggle('d-none', name !== 'content');
    }
    function showEmpty(message, canReset) {
        els.emptyText.textContent = message;
        els.reset.classList.toggle('d-none', !canReset);
        showOnly('empty');
    }
    function setNote(message) {
        els.note.textContent = message;
        els.note.classList.toggle('d-none', message === '');
    }

    function applyPayloads(list) {
        let ok = 0;
        spots.forEach(function (spot, i) { if (spot.applyWeather(list[i])) { ok++; } });
        return ok;
    }
    function readCache() {
        const c = cacheStore.read();
        return c && typeof c === 'object' && typeof c.savedAt === 'number' && c.payloads && typeof c.payloads === 'object' ? c : null;
    }

    async function load() {
        showOnly('loading');
        els.refresh.disabled = true;
        els.status.textContent = 'Loading live weather...';
        try {
            const list = await api.fetchWeather(spots);
            applyPayloads(list);
            const payloads = {};
            spots.forEach(function (spot, i) { payloads[spot.id] = list[i]; });
            cacheStore.write({ savedAt: Date.now(), payloads: payloads });
            els.updated.textContent = 'Updated at ' + formatTime(Date.now());
            setNote('');
        } catch (error) {
            const cached = readCache();
            if (cached) {
                applyPayloads(spots.map(function (s) { return cached.payloads[s.id]; }));
                els.updated.textContent = 'Saved copy from ' + formatTime(cached.savedAt);
                setNote(error.message + ' Showing the last saved data instead.');
            } else {
                els.errorText.textContent = error.message;
                els.status.textContent = 'Weather could not be loaded.';
                showOnly('error');
                els.refresh.disabled = false;
                return;
            }
        }
        els.refresh.disabled = false;
        render();
    }

    function visibleSpots() {
        const text = state.query.trim().toLowerCase();
        const list = spots.filter(function (s) {
            const inRegion = state.region === 'All' || s.region === state.region;
            return inRegion && (!text || (s.name + ' ' + s.country).toLowerCase().includes(text));
        });
        function byValue(getter, direction) {
            return function (a, b) {
                if (!a.hasWeather && !b.hasWeather) { return a.name.localeCompare(b.name); }
                if (!a.hasWeather) { return 1; }
                if (!b.hasWeather) { return -1; }
                return direction * (getter(a) - getter(b));
            };
        }
        const sorters = {
            name: function (a, b) { return a.name.localeCompare(b.name); },
            warm: byValue(function (s) { return s.weather.temp; }, -1),
            cool: byValue(function (s) { return s.weather.temp; }, 1),
            wind: byValue(function (s) { return s.weather.wind; }, -1),
            beach: byValue(function (s) { return s.beachScore; }, -1)
        };
        return list.sort(sorters[state.sort]);
    }

    function degrees(celsius) { return Math.round(CoastalSpot.convert(celsius, state.unit)) + '\u00B0' + state.unit; }

    function createStat(caption, value, small) {
        const col = createEl('div', 'col-6 col-lg-3');
        const tile = createEl('div', 'stat-tile');
        tile.appendChild(createEl('div', 'stat-value', value));
        if (small) { tile.appendChild(createEl('div', 'stat-small', small)); }
        tile.appendChild(createEl('div', 'stat-caption', caption));
        col.appendChild(tile);
        return col;
    }

    function renderStats(list) {
        const withData = list.filter(function (s) { return s.hasWeather; });
        els.stats.innerHTML = '';
        els.stats.appendChild(createStat('Spots shown', String(list.length)));
        if (withData.length === 0) { return; }
        const avg = withData.reduce(function (sum, s) { return sum + s.weather.temp; }, 0) / withData.length;
        const warmest = withData.reduce(function (a, b) { return b.weather.temp > a.weather.temp ? b : a; });
        const best = withData.reduce(function (a, b) { return b.beachScore > a.beachScore ? b : a; });
        els.stats.appendChild(createStat('Average temperature', degrees(avg)));
        els.stats.appendChild(createStat('Warmest now', degrees(warmest.weather.temp), warmest.name));
        els.stats.appendChild(createStat('Best beach day', best.beachScore + '/100', best.name));
    }

    function createMetric(icon, text) {
        const box = createEl('span', 'spot-metric');
        const i = createEl('i', 'fa-solid ' + icon);
        i.setAttribute('aria-hidden', 'true');
        box.appendChild(i);
        box.appendChild(document.createTextNode(' ' + text));
        return box;
    }

    function createSpotCard(spot) {
        const col = createEl('div', 'col-12 col-md-6 col-lg-4');
        const card = createEl('article', 'wl-card spot-card h-100 p-4 d-flex flex-column');
        card.setAttribute('aria-label', spot.name + ', ' + spot.country);

        const head = createEl('div', 'mb-3');
        head.appendChild(createEl('span', 'tag-soft', spot.region));
        head.appendChild(createEl('h3', 'h5 mt-2 mb-0', spot.name));
        head.appendChild(createEl('div', 'card-text-sm', spot.country));
        card.appendChild(head);

        if (!spot.hasWeather) {
            card.appendChild(createEl('p', 'card-text-sm fst-italic', 'No weather data for this destination right now.'));
        } else {
            const w = spot.weather;
            const main = createEl('div', 'd-flex align-items-center justify-content-between mb-3');
            main.appendChild(createEl('div', 'spot-temp', degrees(w.temp)));
            const cond = createEl('div', 'text-end');
            const icon = createEl('i', 'fa-solid ' + spot.condition.icon + ' spot-icon');
            icon.setAttribute('aria-hidden', 'true');
            cond.appendChild(icon);
            cond.appendChild(createEl('div', 'small fw-semibold', spot.condition.label));
            main.appendChild(cond);
            card.appendChild(main);

            const metrics = createEl('div', 'd-flex flex-wrap gap-3 mb-3 card-text-sm');
            metrics.appendChild(createMetric('fa-arrow-up', 'High ' + degrees(w.high)));
            metrics.appendChild(createMetric('fa-arrow-down', 'Low ' + degrees(w.low)));
            metrics.appendChild(createMetric('fa-wind', Math.round(w.wind) + ' km/h'));
            metrics.appendChild(createMetric('fa-droplet', Math.round(w.humidity) + '%'));
            card.appendChild(metrics);

            const score = createEl('div', 'mb-3');
            score.appendChild(createEl('div', 'small fw-semibold mb-1', 'Beach day: ' + spot.scoreLabel + ' (' + spot.beachScore + '/100)'));
            const bar = createEl('div', 'score-bar');
            bar.setAttribute('aria-hidden', 'true');
            const fill = createEl('div', 'score-fill');
            fill.style.width = spot.beachScore + '%';
            bar.appendChild(fill);
            score.appendChild(bar);
            card.appendChild(score);
        }

        const link = createEl('a', 'btn-wl btn-block-r mt-auto', 'Plan a trip');
        link.href = 'plan-trip.html';
        card.appendChild(link);
        col.appendChild(card);
        return col;
    }

    function render() {
        if (!spots.some(function (s) { return s.hasWeather; })) {
            els.status.textContent = 'No weather data returned.';
            showEmpty('The weather service did not return any data. Please try again later.', false);
            return;
        }
        const list = visibleSpots();
        els.status.textContent = list.length + ' destinations shown.';
        if (list.length === 0) {
            showEmpty('No destinations match your search or filter.', true);
            return;
        }
        els.grid.innerHTML = '';
        list.forEach(function (spot) { els.grid.appendChild(createSpotCard(spot)); });
        renderStats(list);
        showOnly('content');
    }

    function syncControls() {
        els.search.value = state.query;
        els.sort.value = state.sort;
        els.unit.textContent = '\u00B0' + state.unit;
        els.unit.setAttribute('aria-label', 'Temperature unit: ' + (state.unit === 'C' ? 'Celsius' : 'Fahrenheit') + '. Click to switch.');
        els.regionButtons.forEach(function (b) {
            const active = b.dataset.region === state.region;
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', active);
        });
    }
    function update() { savePrefs(); syncControls(); render(); }

    els.search.addEventListener('input', function () { state.query = els.search.value; savePrefs(); render(); });
    els.search.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { state.query = ''; update(); }
    });
    els.sort.addEventListener('change', function () { state.sort = els.sort.value; update(); });
    els.unit.addEventListener('click', function () { state.unit = state.unit === 'C' ? 'F' : 'C'; update(); });
    els.regionButtons.forEach(function (b) {
        b.addEventListener('click', function () { state.region = b.dataset.region; update(); });
    });
    els.reset.addEventListener('click', function () { state.query = ''; state.region = 'All'; update(); });
    els.refresh.addEventListener('click', load);
    els.retry.addEventListener('click', load);

    syncControls();
    load();
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('live-grid')) { initLivePage(); }
});
