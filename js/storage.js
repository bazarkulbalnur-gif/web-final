'use strict';

/**
 * JsonStore - safe wrapper around localStorage for ONE key.
 *  - values are saved as JSON,
 *  - missing / broken / blocked storage never throws: the fallback value is returned instead,
 *  - write() returns true/false so the UI can tell the user when saving failed.
 */
class JsonStore {
    constructor(key, fallback) {
        this.key = key;
        this.fallback = fallback;
    }

    /** Return a fresh copy of the fallback (so callers can never mutate the shared default). */
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
            return this.getFallback();   // invalid JSON or storage blocked
        }
    }

    write(value) {
        try {
            window.localStorage.setItem(this.key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;                // quota exceeded or storage blocked
        }
    }

    remove() {
        try { window.localStorage.removeItem(this.key); } catch (error) { /* ignore */ }
    }
}
