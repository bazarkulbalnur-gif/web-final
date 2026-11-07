'use strict';

/**
 * trips.js - "My Trips" feature.
 *   - CRUD (create, read, update, delete) for saved trips, stored in localStorage through TripManager,
 *   - search + sort of the saved list,
 *   - statistics panel with a bar chart built from the saved data,
 *   - "Save to My Trips" button on the Plan Your Trip page,
 *   - trip counter badge in the navbar (all pages).
 * Form validation reuses the helper functions from validation.js.
 */
const TRIPS_KEY = 'wanderlens:trips';

let tripManagerInstance = null;
function getTripManager() {
    if (!tripManagerInstance) { tripManagerInstance = new TripManager(TRIPS_KEY); }
    return tripManagerInstance;
}

function updateTripBadge() {
    const badge = document.getElementById('trip-count');
    if (!badge) { return; }
    const count = getTripManager().trips.length;
    badge.textContent = count;
    badge.classList.toggle('d-none', count === 0);
}

/* ---------------------------------------------------------------
   Plan Your Trip page: save the generated plan
---------------------------------------------------------------- */
function initPlanSave() {
    const button = document.getElementById('save-trip-btn');
    const form = document.getElementById('plan-form');
    if (!button || !form) { return; }

    function resetButton() {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-bookmark me-2"></i>Save to My Trips';
    }

    button.addEventListener('click', function () {
        const trip = new Trip({
            fullName: val('fullName'),
            email: val('email'),
            startDate: val('startDate'),
            durationId: val('duration'),
            travelers: val('travelers'),
            activityIds: Array.from(document.querySelectorAll('.activity-check:checked')).map(function (box) { return box.value; })
        });
        const errors = trip.validate({ checkPast: true });
        if (errors.length) { showToast(errors[0], 'danger'); return; }
        if (!getTripManager().add(trip)) {
            showToast('Could not save: browser storage is full or blocked.', 'danger');
            return;
        }
        updateTripBadge();
        showToast('Trip saved. Open "My Trips" (suitcase icon) to edit it.', 'success');
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-check me-2"></i>Saved';
    });
    // any change (or a new itinerary) allows saving again
    form.addEventListener('change', resetButton);
    form.addEventListener('submit', resetButton);
}

/* ---------------------------------------------------------------
   My Trips page
---------------------------------------------------------------- */
function initTripsPage() {
    const manager = getTripManager();
    const $ = function (id) { return document.getElementById(id); };
    const form = $('trip-form');
    const startInput = $('startDate');
    const listEl = $('trip-list');
    let editingId = null;
    let pendingAction = null;

    /* ----- form set-up ----- */
    durations.forEach(function (d) {
        const option = createEl('option', '', d.label + ' ($' + d.price + ')');
        option.value = d.id;
        $('duration').appendChild(option);
    });
    activities.forEach(function (a) {
        const wrap = createEl('div', 'col-6');
        const check = createEl('div', 'form-check');
        const input = createEl('input', 'form-check-input trip-activity');
        input.type = 'checkbox'; input.id = 'trip-act-' + a.id; input.value = a.id;
        input.defaultChecked = a.checked;
        const label = createEl('label', 'form-check-label small text-muted-brand', a.label + (a.extra ? ' (+$' + a.extra + ')' : ''));
        label.htmlFor = input.id;
        check.append(input, label);
        wrap.appendChild(check);
        $('activities-group').appendChild(wrap);
    });
    $('activities-group').type = 'group';
    startInput.min = new Date().toISOString().split('T')[0];

    function checkedActivities() {
        return Array.from(document.querySelectorAll('.trip-activity:checked')).map(function (b) { return b.value; });
    }

    const rules = {
        fullName: function () { return checkRequired(val('fullName'), 'Full name') || checkMinLength(val('fullName'), 'Full name', 3); },
        email: function () { return checkRequired(val('email'), 'Email') || checkEmail(val('email')); },
        startDate: function () {
            const original = editingId ? manager.get(editingId) : null;
            if (original && val('startDate') === original.startDate) { return ''; }   // keep an old date while editing
            return checkFutureDate(val('startDate'));
        },
        duration: function () { return val('duration') === '' ? 'Please choose a duration.' : ''; },
        travelers: function () { return checkRange(val('travelers'), 'Travelers count', 1, 10); },
        'activities-group': function () { return checkedActivities().length === 0 ? 'Select at least one activity.' : ''; }
    };
    ['fullName', 'email', 'startDate', 'duration', 'travelers'].forEach(function (id) {
        const single = {}; single[id] = rules[id]; attachLiveValidation(single);
    });
    $('activities-group').addEventListener('change', function () { setError('activities-group', rules['activities-group']()); });
    form.addEventListener('input', updateTotal);
    form.addEventListener('change', updateTotal);

    function updateTotal() {
        const duration = durations.find(function (d) { return d.id === val('duration'); });
        const travelers = parseInt(val('travelers'), 10);
        if (!duration || isNaN(travelers) || travelers < 1 || travelers > 10) { $('trip-total').textContent = '\u2014'; return; }
        const extras = checkedActivities().reduce(function (sum, id) {
            return sum + activities.find(function (a) { return a.id === id; }).extra;
        }, 0);
        $('trip-total').textContent = formatMoney(calculateTotal(duration.price, travelers, extras));
    }

    function clearValidation() {
        form.querySelectorAll('.is-valid, .is-invalid').forEach(function (el) { el.classList.remove('is-valid', 'is-invalid'); });
        form.querySelectorAll('.invalid-feedback').forEach(function (box) { box.textContent = ''; box.classList.remove('d-block'); });
    }

    function setMode(editing) {
        $('form-title').textContent = editing ? 'Edit trip' : 'Add a trip';
        $('trip-submit').textContent = editing ? 'Save changes' : 'Add trip';
        $('trip-cancel').classList.toggle('d-none', !editing);
    }

    function resetForm() {
        form.reset();
        editingId = null;
        clearValidation();
        setMode(false);
        updateTotal();
    }

    function startEdit(trip) {
        resetForm();
        editingId = trip.id;
        $('fullName').value = trip.fullName;
        $('email').value = trip.email;
        $('startDate').value = trip.startDate;
        $('duration').value = trip.durationId;
        $('travelers').value = trip.travelers;
        document.querySelectorAll('.trip-activity').forEach(function (b) { b.checked = trip.activityIds.includes(b.value); });
        setMode(true);
        updateTotal();
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        $('fullName').focus();
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!validateForm(rules)) { showToast('Please fix the highlighted fields.', 'danger'); return; }
        const fields = {
            fullName: val('fullName'), email: val('email'), startDate: val('startDate'),
            durationId: val('duration'), travelers: val('travelers'), activityIds: checkedActivities()
        };
        const wasEditing = editingId !== null;
        const saved = wasEditing ? manager.update(editingId, fields) : manager.add(new Trip(fields));
        if (!saved) { showToast('Could not save: browser storage is full or blocked.', 'danger'); return; }
        showToast(wasEditing ? 'Trip updated.' : 'Trip added to My Trips.', 'success');
        resetForm();
        render();
    });
    $('trip-cancel').addEventListener('click', resetForm);

    /* ----- delete confirmation (Bootstrap modal) ----- */
    const modalEl = $('confirmModal');
    function confirmAction(message, action) {
        $('confirm-text').textContent = message;
        pendingAction = action;
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
    $('confirm-ok').addEventListener('click', function () {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        if (pendingAction) { pendingAction(); pendingAction = null; }
    });

    /* ----- list ----- */
    function createTripItem(trip) {
        const item = createEl('li', 'wl-card trip-item p-3 p-md-4');
        const top = createEl('div', 'd-flex flex-wrap justify-content-between gap-2');
        const info = createEl('div');
        info.appendChild(createEl('h3', 'h6 mb-1', trip.fullName));
        info.appendChild(createEl('div', 'card-text-sm', trip.email));
        info.appendChild(createEl('div', 'small mt-1', formatDate(trip.startDate) + ' \u2192 ' + formatDate(trip.endDate)));
        top.appendChild(info);
        const price = createEl('div', 'text-end');
        price.appendChild(createEl('div', 'price fs-4', formatMoney(trip.total)));
        price.appendChild(createEl('div', 'card-text-sm', trip.travelers + (trip.travelers === 1 ? ' traveler' : ' travelers')));
        top.appendChild(price);
        item.appendChild(top);

        const tags = createEl('div', 'd-flex flex-wrap gap-2 mt-3');
        tags.appendChild(createEl('span', 'tag-soft', trip.duration.label));
        trip.activities.forEach(function (a) { tags.appendChild(createEl('span', 'tag-soft', a.label)); });
        item.appendChild(tags);

        const details = createEl('details', 'mt-3');
        details.appendChild(createEl('summary', 'small fw-semibold', 'Show itinerary'));
        trip.itinerary().forEach(function (step) {
            const row = createEl('div', 'itinerary-day mt-2');
            row.appendChild(createEl('strong', '', 'Day ' + step.day));
            row.appendChild(createEl('div', 'small text-muted-brand', step.activity));
            details.appendChild(row);
        });
        item.appendChild(details);

        const actions = createEl('div', 'd-flex gap-2 mt-3');
        const edit = createEl('button', 'btn btn-sm btn-outline-secondary', 'Edit');
        edit.type = 'button'; edit.dataset.action = 'edit'; edit.dataset.id = trip.id;
        edit.setAttribute('aria-label', 'Edit trip of ' + trip.fullName);
        const del = createEl('button', 'btn btn-sm btn-outline-danger', 'Delete');
        del.type = 'button'; del.dataset.action = 'delete'; del.dataset.id = trip.id;
        del.setAttribute('aria-label', 'Delete trip of ' + trip.fullName);
        actions.append(edit, del);
        item.appendChild(actions);
        return item;
    }

    listEl.addEventListener('click', function (event) {
        const btn = event.target.closest('button[data-action]');
        if (!btn) { return; }
        const trip = manager.get(btn.dataset.id);
        if (!trip) { return; }
        if (btn.dataset.action === 'edit') { startEdit(trip); return; }
        confirmAction('Delete the trip of ' + trip.fullName + '? This cannot be undone.', function () {
            if (editingId === trip.id) { resetForm(); }
            if (manager.remove(trip.id)) { showToast('Trip deleted.', 'secondary'); } else { showToast('Could not delete the trip.', 'danger'); }
            render();
        });
    });

    $('trip-clear').addEventListener('click', function () {
        confirmAction('Delete ALL saved trips? This cannot be undone.', function () {
            resetForm();
            if (manager.clear()) { showToast('All trips deleted.', 'secondary'); } else { showToast('Could not clear the trips.', 'danger'); }
            render();
        });
    });
    $('trip-search').addEventListener('input', render);
    $('trip-search').addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { event.target.value = ''; render(); }
    });
    $('trip-sort').addEventListener('change', render);

    /* ----- statistics panel + bar chart ----- */
    function createStat(caption, value) {
        const col = createEl('div', 'col-6 col-lg-3');
        const tile = createEl('div', 'stat-tile');
        tile.appendChild(createEl('div', 'stat-value', value));
        tile.appendChild(createEl('div', 'stat-caption', caption));
        col.appendChild(tile);
        return col;
    }

    function renderStats() {
        const s = manager.stats();
        const stats = $('trip-stats');
        stats.innerHTML = '';
        stats.append(
            createStat('Saved trips', String(s.count)),
            createStat('Total budget', formatMoney(s.totalCost)),
            createStat('Avg. travelers', s.count ? s.avgTravelers.toFixed(1) : '\u2014'),
            createStat('Top activity', s.popularActivity)
        );

        const chart = $('trip-chart');
        chart.innerHTML = '';
        const recent = manager.search('', 'newest').slice(0, 8);
        $('chart-empty').classList.toggle('d-none', recent.length > 0);
        const max = recent.reduce(function (m, t) { return Math.max(m, t.total); }, 0);
        recent.forEach(function (trip) {
            const row = createEl('div', 'chart-row');
            row.appendChild(createEl('span', 'chart-label', trip.fullName.split(' ')[0] + ' \u00B7 ' + formatDate(trip.startDate)));
            const track = createEl('div', 'chart-track');
            const bar = createEl('div', 'chart-bar');
            bar.style.width = (max ? Math.max(3, Math.round(trip.total / max * 100)) : 0) + '%';
            track.appendChild(bar);
            row.appendChild(track);
            row.appendChild(createEl('span', 'chart-value', formatMoney(trip.total)));
            chart.appendChild(row);
        });
    }

    function render() {
        const total = manager.trips.length;
        const list = manager.search($('trip-search').value, $('trip-sort').value);
        listEl.innerHTML = '';
        list.forEach(function (trip) { listEl.appendChild(createTripItem(trip)); });
        $('trip-empty').classList.toggle('d-none', total > 0);
        $('trip-toolbar').classList.toggle('d-none', total === 0);
        $('trip-noresults').classList.toggle('d-none', total === 0 || list.length > 0);
        $('trip-count-text').textContent = total ? list.length + ' of ' + total + ' shown' : '';
        renderStats();
        updateTripBadge();
    }

    setMode(false);
    updateTotal();
    render();
}

document.addEventListener('DOMContentLoaded', function () {
    updateTripBadge();
    initPlanSave();
    if (document.getElementById('trip-form')) { initTripsPage(); }
});
