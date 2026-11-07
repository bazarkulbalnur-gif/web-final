'use strict';

class WeatherApi {
    constructor(options) {
        const o = options || {};
        this.baseUrl = o.baseUrl || 'https://api.open-meteo.com/v1/forecast';
        this.timeoutMs = o.timeoutMs || 10000;
    }

    buildUrl(spots) {
        const lats = spots.map(function (s) { return s.lat; }).join(',');
        const lons = spots.map(function (s) { return s.lon; }).join(',');
        return this.baseUrl + '?latitude=' + lats + '&longitude=' + lons +
            '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
            '&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto';
    }

    async fetchWeather(spots) {
        if (spots.length === 0) { return []; }
        const controller = new AbortController();
        const timer = setTimeout(function () { controller.abort(); }, this.timeoutMs);
        try {
            const response = await fetch(this.buildUrl(spots), { signal: controller.signal });
            if (!response.ok) {
                throw new Error('The weather service answered with status ' + response.status + '.');
            }
            const json = await response.json();
            const list = Array.isArray(json) ? json : [json];
            if (list.length !== spots.length) {
                throw new Error('The weather service returned an unexpected amount of data.');
            }
            return list;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('The request took too long. Check your connection and try again.');
            }
            if (error.name === 'SyntaxError') {
                throw new Error('The weather service sent data in an unexpected format.');
            }
            if (error.name === 'TypeError') {
                throw new Error('Network error: the weather service could not be reached.');
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }
}
