const FAV_KEY = 'wanderlens:favorites';
const THEME_KEY = 'wanderlens:theme';
const allItems = attractions.concat(experiences); 

function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}
function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { }
}

function getFavorites() { return readStorage(FAV_KEY, []); }

function filterItems(items, query, category) {
    const text = query.trim().toLowerCase();
    return items.filter(function (item) {
        const matchesCategory = category === 'All' || item.category === category;
        const matchesText = item.title.toLowerCase().includes(text) || item.tag.toLowerCase().includes(text);
        return matchesCategory && matchesText;
    });
}

function calculateTotal(pricePerPerson, travelers, extrasPerPerson) {
    return (pricePerPerson + extrasPerPerson) * travelers;
}

function showToast(message, type) {
    let box = document.getElementById('toast-box');
    if (!box) {
        box = document.createElement('div');
        box.id = 'toast-box';
        box.className = 'toast-container position-fixed top-0 end-0 p-3';
        box.style.zIndex = 2000;
        document.body.appendChild(box);
    }
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-bg-' + (type || 'success') + ' border-0';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = '<div class="d-flex"><div class="toast-body"></div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>';
    toast.querySelector('.toast-body').textContent = message;
    box.appendChild(toast);
    toast.addEventListener('hidden.bs.toast', function () { toast.remove(); });
    new bootstrap.Toast(toast, { delay: 2200 }).show();
}

function createCard(item, layout) {
    const isFav = getFavorites().includes(item.id);
    const col = document.createElement('div');
    const heart = '<button type="button" class="fav-btn' + (isFav ? ' active' : '') + '" data-id="' + item.id +
        '" aria-pressed="' + isFav + '" aria-label="Add ' + item.title + ' to favorites"><i class="fa-' + (isFav ? 'solid' : 'regular') + ' fa-heart"></i></button>';

    if (layout === 'horizontal') {
        col.className = 'col-12 col-md-6';
        col.innerHTML =
            '<div class="wl-card h-100 d-flex flex-column flex-sm-row" style="border-radius:1rem">' +
            '<div class="card-img-box flex-shrink-0 col-sm-5" style="height:auto;min-height:12rem"><img src="' + item.img + '" alt="' + item.title + '" loading="lazy">' + heart + '</div>' +
            '<div class="p-4 d-flex flex-column justify-content-between"><div>' +
            '<span class="small fw-bold text-brand">' + item.tag + '</span>' +
            '<h3 class="h5 mt-1">' + item.title + '</h3><p class="card-text-sm mt-1">' + item.text + '</p></div>' +
            '<a href="pass.html" class="text-brand fw-semibold small mt-3 d-inline-flex align-items-center gap-2">Book experience <i class="fa-solid fa-arrow-right"></i></a></div></div>';
    } else {
        col.className = 'col-12 col-md-6 col-lg-4';
        col.innerHTML =
            '<div class="wl-card wl-card-sm h-100 d-flex flex-column" style="border-radius:1rem;padding:1.25rem">' +
            '<div class="card-img-box mb-3" style="height:12rem;border-radius:.75rem"><img src="' + item.img + '" alt="' + item.title + '" loading="lazy">' + heart + '</div>' +
            '<div><span class="tag-soft">' + item.tag + '</span><h3 class="h5 mt-2 mb-1">' + item.title + '</h3>' +
            '<p class="card-text-sm mb-3">' + item.text + '</p></div>' +
            '<a href="pass.html" class="btn-wl btn-block-r mt-auto" style="background:var(--primary)">Get Pass Access</a></div>';
    }
    return col;
}

function renderCards(items, container, layout) {
    container.innerHTML = '';
    items.forEach(function (item) {
        container.appendChild(createCard(item, layout));
    });
}

function initCatalog(items, layout) {
    const grid = document.getElementById('catalog-grid');
    const search = document.getElementById('search-input');
    const count = document.getElementById('results-count');
    const empty = document.getElementById('empty-state');
    const filterButtons = document.querySelectorAll('.filter-btn');
    let activeCategory = 'All';

    function update() {
        const result = filterItems(items, search.value, activeCategory);
        renderCards(result, grid, layout);
        count.textContent = result.length + ' of ' + items.length + ' shown';
        empty.classList.toggle('d-none', result.length > 0);
    }

    search.addEventListener('input', update);
    search.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { search.value = ''; update(); }
    });
    filterButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            filterButtons.forEach(function (b) { b.classList.remove('active'); });
            button.classList.add('active');
            activeCategory = button.dataset.category;
            update();
        });
    });
    document.getElementById('reset-filters').addEventListener('click', function () {
        search.value = '';
        filterButtons[0].click();
    });
    update();
}

function updateFavoritesUI() {
    const favorites = getFavorites();
    const badge = document.getElementById('fav-count');
    badge.textContent = favorites.length;
    badge.classList.toggle('d-none', favorites.length === 0);

    document.querySelectorAll('.fav-btn').forEach(function (btn) {
        const active = favorites.includes(btn.dataset.id);
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active);
        btn.firstElementChild.className = 'fa-' + (active ? 'solid' : 'regular') + ' fa-heart';
    });

    const list = document.getElementById('favorites-list');
    list.innerHTML = '';
    for (const id of favorites) {
        const item = allItems.find(function (x) { return x.id === id; });
        if (!item) { continue; }
        const row = document.createElement('li');
        row.className = 'list-group-item d-flex align-items-center gap-3';
        row.innerHTML = '<img src="' + item.img + '" alt="" width="56" height="56" class="rounded-3" style="object-fit:cover">' +
            '<div class="flex-grow-1"><div class="fw-semibold small">' + item.title + '</div><div class="card-text-sm">' + item.tag + '</div></div>' +
            '<button type="button" class="btn btn-sm btn-outline-danger remove-fav" data-id="' + id + '" aria-label="Remove ' + item.title + '"><i class="fa-solid fa-trash"></i></button>';
        list.appendChild(row);
    }
    document.getElementById('favorites-empty').classList.toggle('d-none', favorites.length > 0);
}

function toggleFavorite(id) {
    let favorites = getFavorites();
    const wasFav = favorites.includes(id);
    favorites = wasFav ? favorites.filter(function (x) { return x !== id; }) : favorites.concat(id);
    writeStorage(FAV_KEY, favorites);
    updateFavoritesUI();
    showToast(wasFav ? 'Removed from favorites' : 'Added to favorites', wasFav ? 'secondary' : 'success');
}

function createFavoritesPanel() {
    const panel = document.createElement('div');
    panel.className = 'offcanvas offcanvas-end';
    panel.id = 'favoritesPanel';
    panel.tabIndex = -1;
    panel.setAttribute('aria-labelledby', 'favoritesTitle');
    panel.innerHTML =
        '<div class="offcanvas-header"><h2 class="offcanvas-title h5 font-serif-custom" id="favoritesTitle">My Favorites</h2>' +
        '<button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button></div>' +
        '<div class="offcanvas-body"><p id="favorites-empty" class="text-muted small">No favorites yet. Tap the heart on any attraction or experience.</p>' +
        '<ul id="favorites-list" class="list-group list-group-flush"></ul></div>';
    document.body.appendChild(panel);
    panel.addEventListener('click', function (event) {
        const btn = event.target.closest('.remove-fav');
        if (btn) { toggleFavorite(btn.dataset.id); }
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    writeStorage(THEME_KEY, theme);
    const icon = document.querySelector('#theme-toggle i');
    if (icon) { icon.className = 'fa-solid ' + (theme === 'dark' ? 'fa-sun' : 'fa-moon'); }
}

function renderDiscover() {
    const grid = document.getElementById('discover-grid');
    destinations.forEach(function (d) {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-4 destination-card';
        col.innerHTML =
            '<div class="wl-card h-100 d-flex flex-column"><div class="card-img-box"><img src="' + d.img + '" alt="' + d.title + '" loading="lazy"></div>' +
            '<div class="p-4 flex-grow-1"><span class="tag-soft text-uppercase" style="font-size:10px;letter-spacing:.05em">' + d.tag + '</span>' +
            '<h3 class="h4 mt-3 mb-2">' + d.title + '</h3><p class="card-text-sm mb-3">' + d.text + '</p>' +
            '<p class="destination-details card-text-sm fst-italic" style="display:none">' + d.more + ' <a href="attractions.html" class="text-brand fw-bold">See attractions</a></p></div>' +
            '<div class="px-4 pb-4"><button type="button" class="learn-toggle link-arrow bg-transparent border-0 p-0">' +
            '<span class="learn-label">Learn more</span> <i class="fa-solid fa-arrow-right"></i></button></div></div>';
        grid.appendChild(col);
    });
}

function renderPasses() {
    const grid = document.getElementById('pass-grid');
    passes.forEach(function (p) {
        const perks = p.perks.map(function (perk) { return '<li><i class="fa-solid fa-check"></i>' + perk + '</li>'; }).join('');
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6';
        col.innerHTML =
            '<div class="wl-card h-100 p-4 p-lg-4 d-flex flex-column justify-content-between" style="border-radius:1rem;' + (p.popular ? 'border:2px solid var(--primary)' : '') + '">' +
            '<div><span class="tag-soft rounded-pill px-3">' + p.label + '</span><h3 class="h3 mt-3">' + p.name + '</h3>' +
            '<div class="price my-3">$' + p.price + ' <span class="small fw-normal text-muted">/ person</span></div>' +
            '<ul class="perk-list mb-4">' + perks + '</ul></div>' +
            '<a href="contact.html?pass=' + p.id + '" class="' + (p.popular ? 'btn-wl' : 'btn-wl-dark') + ' btn-block-r py-3" style="border-radius:.75rem">Purchase ' + p.name.replace(' Coastal', '').replace(' All-Access', '') + '</a></div>';
        grid.appendChild(col);
    });
}

function renderFaq() {
    const box = document.getElementById('faq-list');
    faqs.forEach(function (f) {
        const item = document.createElement('div');
        item.className = 'faq-item';
        item.innerHTML = '<button type="button" class="faq-question" aria-expanded="false">' + f.q + '<i class="fa-solid fa-chevron-down"></i></button>' +
            '<div class="faq-answer">' + f.a + '</div>';
        box.appendChild(item);
    });
}

function initPlanner() {
    const select = document.getElementById('duration');
    const group = document.getElementById('activities-group');

    durations.forEach(function (d) {
        const option = document.createElement('option');
        option.value = d.id;
        option.textContent = d.label;
        select.appendChild(option);
    });
    activities.forEach(function (a) {
        const wrap = document.createElement('div');
        wrap.className = 'col-6 col-sm-4';
        wrap.innerHTML = '<div class="form-check"><input class="form-check-input activity-check" type="checkbox" id="act-' + a.id + '" value="' + a.id + '"' + (a.checked ? ' checked' : '') + '>' +
            '<label class="form-check-label small text-muted-brand" for="act-' + a.id + '">' + a.label + (a.extra ? ' (+$' + a.extra + ')' : '') + '</label></div>';
        group.appendChild(wrap);
    });

    function updateTotal() {
        const duration = durations.find(function (d) { return d.id === select.value; });
        const travelers = parseInt(document.getElementById('travelers').value, 10);
        const display = document.getElementById('total-price');
        if (!duration || isNaN(travelers) || travelers < 1 || travelers > 10) { display.textContent = '—'; return; }
        let extras = 0;
        document.querySelectorAll('.activity-check:checked').forEach(function (box) {
            extras += activities.find(function (a) { return a.id === box.value; }).extra;
        });
        display.textContent = '$' + calculateTotal(duration.price, travelers, extras);
    }
    ['change', 'input'].forEach(function (type) {
        document.getElementById('plan-form').addEventListener(type, updateTotal);
    });
    updateTotal();
}

document.addEventListener('DOMContentLoaded', function () {
    setTheme(readStorage(THEME_KEY, 'light'));
    createFavoritesPanel();

    if (document.getElementById('featured-grid')) { renderCards(attractions.slice(0, 3), document.getElementById('featured-grid'), 'vertical'); }
    if (document.getElementById('discover-grid')) { renderDiscover(); }
    if (document.getElementById('pass-grid')) { renderPasses(); renderFaq(); }
    if (document.body.dataset.page === 'attractions') { initCatalog(attractions, 'vertical'); }
    if (document.body.dataset.page === 'experiences') { initCatalog(experiences, 'horizontal'); }
    if (document.getElementById('plan-form')) { initPlanner(); }

    updateFavoritesUI();

    document.getElementById('theme-toggle').addEventListener('click', function () {
        setTheme(document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark');
    });
    document.addEventListener('click', function (event) {
        const btn = event.target.closest('.fav-btn');
        if (btn) { event.preventDefault(); toggleFavorite(btn.dataset.id); }
    });
});
