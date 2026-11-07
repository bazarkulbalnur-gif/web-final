'use strict';

function checkRequired(value, label) { return value.trim() === '' ? label + ' is required.' : ''; }
function checkMinLength(value, label, min) { return value.trim().length < min ? label + ' must contain at least ' + min + ' characters.' : ''; }
function checkEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? '' : 'Enter a valid email, for example name@mail.com.'; }
function checkPhone(value) {
    const digits = value.replace(/\D/g, '');
    return /^\+?[0-9\s()\-]+$/.test(value.trim()) && digits.length >= 7 && digits.length <= 15 ? '' : 'Enter a valid phone number (7-15 digits).';
}
function checkRange(value, label, min, max) {
    const n = Number(value);
    return value.trim() === '' || !Number.isInteger(n) || n < min || n > max ? label + ' must be a whole number from ' + min + ' to ' + max + '.' : '';
}
function checkFutureDate(value) {
    if (value === '') { return 'Start date is required.'; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(value) < today ? 'Start date cannot be in the past.' : '';
}

function setError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const box = document.getElementById(fieldId + '-error');
    field.classList.toggle('is-invalid', message !== '');
    field.classList.toggle('is-valid', message === '' && field.type !== 'checkbox');
    field.setAttribute('aria-invalid', message !== '');
    box.textContent = message;
    box.classList.toggle('d-block', message !== '');
}

function validateForm(rules) {
    let valid = true;
    let firstInvalid = null;
    Object.keys(rules).forEach(function (id) {
        const message = rules[id]();
        setError(id, message);
        if (message !== '' && valid) { firstInvalid = id; }
        if (message !== '') { valid = false; }
    });
    if (firstInvalid) { document.getElementById(firstInvalid).focus(); }
    return valid;
}

function attachLiveValidation(rules) {
    Object.keys(rules).forEach(function (id) {
        const field = document.getElementById(id);
        field.addEventListener(field.tagName === 'SELECT' || field.type === 'checkbox' ? 'change' : 'blur', function () { setError(id, rules[id]()); });
        field.addEventListener('input', function () { if (field.classList.contains('is-invalid')) { setError(id, rules[id]()); } });
    });
}

function val(id) { return document.getElementById(id).value; }

function initContactForm() {
    const form = document.getElementById('contact-form');
    const select = document.getElementById('passType');
    passes.forEach(function (p) {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name + ' ($' + p.price + ')';
        select.appendChild(option);
    });
    const preselected = new URLSearchParams(window.location.search).get('pass');
    if (preselected) { select.value = preselected; }

    const rules = {
        fullName: function () { return checkRequired(val('fullName'), 'Full name') || checkMinLength(val('fullName'), 'Full name', 3); },
        email: function () { return checkRequired(val('email'), 'Email') || checkEmail(val('email')); },
        phone: function () { return checkRequired(val('phone'), 'Phone number') || checkPhone(val('phone')); },
        passType: function () { return val('passType') === '' ? 'Please choose a pass.' : ''; },
        message: function () { return checkRequired(val('message'), 'Message') || checkMinLength(val('message'), 'Message', 10); },
        terms: function () { return document.getElementById('terms').checked ? '' : 'You must accept the terms to continue.'; }
    };
    attachLiveValidation(rules);

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!validateForm(rules)) { showToast('Please fix the highlighted fields.', 'danger'); return; }
        const name = val('fullName').trim().split(' ')[0];
        document.getElementById('success-text').textContent = 'Thank you, ' + name + '! Your details were saved and your pass request is confirmed.';
        $('#form-success').hide().removeClass('d-none').fadeIn(400);
        form.reset();
        form.querySelectorAll('.is-valid').forEach(function (el) { el.classList.remove('is-valid'); });
    });
}

function buildItinerary(days, selectedLabels) {
    const plan = [];
    for (let day = 1; day <= days; day++) {
        plan.push({ day: day, activity: selectedLabels[(day - 1) % selectedLabels.length] });
    }
    return plan;
}

function initPlanForm() {
    const form = document.getElementById('plan-form');
    const start = document.getElementById('startDate');
    start.min = new Date().toISOString().split('T')[0];

    const rules = {
        fullName: function () { return checkRequired(val('fullName'), 'Full name') || checkMinLength(val('fullName'), 'Full name', 3); },
        email: function () { return checkRequired(val('email'), 'Email') || checkEmail(val('email')); },
        startDate: function () { return checkFutureDate(val('startDate')); },
        duration: function () { return val('duration') === '' ? 'Please choose a duration.' : ''; },
        travelers: function () { return checkRange(val('travelers'), 'Travelers count', 1, 10); },
        'activities-group': function () { return document.querySelectorAll('.activity-check:checked').length === 0 ? 'Select at least one activity.' : ''; }
    };
    const group = document.getElementById('activities-group');
    group.type = 'group';
    ['fullName', 'email', 'startDate', 'duration', 'travelers'].forEach(function (id) {
        const sub = {}; sub[id] = rules[id]; attachLiveValidation(sub);
    });
    group.addEventListener('change', function () { setError('activities-group', rules['activities-group']()); });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!validateForm(rules)) { showToast('Please fix the highlighted fields.', 'danger'); return; }
        const duration = durations.find(function (d) { return d.id === val('duration'); });
        const labels = Array.from(document.querySelectorAll('.activity-check:checked')).map(function (box) {
            return activities.find(function (a) { return a.id === box.value; }).label;
        });
        const list = document.getElementById('itinerary-list');
        list.innerHTML = '';
        buildItinerary(duration.days, labels).forEach(function (step) {
            const row = document.createElement('div');
            row.className = 'itinerary-day';
            row.innerHTML = '<strong>Day ' + step.day + '</strong><div class="small text-muted-brand">' + step.activity + '</div>';
            list.appendChild(row);
        });
        document.getElementById('success-text').textContent = 'Itinerary ready for ' + val('fullName').trim() + '! Estimated total: ' + document.getElementById('total-price').textContent + '.';
        const result = $('#form-success');
        result.hide().removeClass('d-none').slideDown(350);
        result[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('contact-form')) { initContactForm(); }
    if (document.getElementById('plan-form')) { initPlanForm(); }
});
