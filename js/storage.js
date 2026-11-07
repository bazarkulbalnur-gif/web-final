'use strict';

class JsonStore {
    constructor(key, fallback) {
        this.key = key;
        this.fallback = fallback;
    }

    getFallback() {
        return this.fallback !== null && typeof this.fallback === 'object'
            ? JSON.parse(JSON.stringify(this.fallback))
            : this.fallback;
    }

    read() {
        try {
            const raw = window.localStorage.getItem(this.key);
            return raw === null ? this.getFallback() : JSON.parse(raw);
        } catch (error) {
            return this.getFallback();
        }
    }

    write(value) {
        try {
            window.localStorage.setItem(this.key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    remove() {
        try { window.localStorage.removeItem(this.key); } catch (error) { /* ignore */ }
    }
}
