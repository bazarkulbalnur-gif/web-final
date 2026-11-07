'use strict';

function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
}

function formatDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!match) { return iso || ''; }
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMoney(amount) {
    return '$' + Number(amount).toLocaleString('en-US');
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
