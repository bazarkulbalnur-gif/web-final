'use strict';

/**
 * utils.js - small shared helpers used by the final-stage scripts.
 * Everything is built with createElement / textContent so user-entered text can never inject HTML.
 */

/** Create an element with an optional class name and text content. */
function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
}

/** "2026-12-05" -> "5 Dec 2026" (parsed manually so the time zone never shifts the day). */
function formatDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!match) { return iso || ''; }
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** 1234 -> "$1,234" */
function formatMoney(amount) {
    return '$' + Number(amount).toLocaleString('en-US');
}

/** Timestamp -> "14:05" */
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
