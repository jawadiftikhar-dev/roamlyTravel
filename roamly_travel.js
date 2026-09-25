// shared script on all pages.

var FALLBACK_ARCHIVE = {
    countries: [
        {
            id: 1, name: "Australia",
            cities: [
                { name: "Sydney, Australia", imageUrl: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80", description: "A vibrant city known for its iconic landmarks like the Sydney Opera House and Sydney Harbour Bridge." },
                { name: "Melbourne, Australia", imageUrl: "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&q=80", description: "A cultural hub famous for its art, food, and diverse neighborhoods." }
            ]
        },
        {
            id: 2, name: "Japan",
            cities: [
                { name: "Tokyo, Japan", imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80", description: "A bustling metropolis blending tradition and modernity, famous for its cherry blossoms and rich culture." },
                { name: "Kyoto, Japan", imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80", description: "Known for its historic temples, gardens, and traditional tea houses." }
            ]
        },
        {
            id: 3, name: "Brazil",
            cities: [
                { name: "Rio de Janeiro, Brazil", imageUrl: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80", description: "A lively city known for its stunning beaches, vibrant carnival celebrations, and iconic landmarks." },
                { name: "São Paulo, Brazil", imageUrl: "https://images.unsplash.com/photo-1543059080-f9b1272213d5?w=800&q=80", description: "The financial hub with diverse culture, arts, and a vibrant nightlife." }
            ]
        }
    ],
    temples: [
        { id: 1, name: "Angkor Wat, Cambodia", imageUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80", description: "A UNESCO World Heritage site and the largest religious monument in the world." },
        { id: 2, name: "Taj Mahal, India", imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80", description: "An iconic symbol of love and a masterpiece of Mughal architecture." }
    ],
    beaches: [
        { id: 1, name: "Bora Bora, French Polynesia", imageUrl: "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800&q=80", description: "An island known for its stunning turquoise waters and luxurious overwater bungalows." },
        { id: 2, name: "Copacabana Beach, Brazil", imageUrl: "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800&q=80", description: "A famous beach in Rio de Janeiro, Brazil, with a vibrant atmosphere and scenic views." }
    ]
};

var archive = FALLBACK_ARCHIVE;

// Try to load the real JSON. If it works, replace the fallback.
// If it fails (file://, missing file, etc.) we keep the fallback.
fetch('travel_recommendation_api.json')
    .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    })
    .then(function (data) {
        if (data && (data.beaches || data.temples || data.countries)) {
            archive = data;
            console.log('archive loaded from file');
        }
    })
    .catch(function (err) {
        console.warn('using fallback archive:', err.message);
    });

// --- navbar shadow on scroll ---
var navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', function () {
        navbar.classList.toggle('is-scrolled', window.scrollY > 20);
    }, { passive: true });
}

// --- burger menu ---
var burger = document.getElementById('burger');
var menu = document.getElementById('menu');
var searchBar = document.querySelector('.search-bar');

if (burger) {
    burger.addEventListener('click', function () {
        burger.classList.toggle('is-open');
        if (menu) menu.classList.toggle('is-open');
        if (searchBar) searchBar.classList.toggle('is-open');

        // prevent body scroll when the mobile menu is open
        document.body.classList.toggle(
            'no-scroll',
            menu && menu.classList.contains('is-open')
        );
    });
}

var menuLinks = document.querySelectorAll('.menu-link');
for (var i = 0; i < menuLinks.length; i++) {
    menuLinks[i].addEventListener('click', function () {
        if (burger) burger.classList.remove('is-open');
        if (menu) menu.classList.remove('is-open');
        if (searchBar) searchBar.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
    });
}

// --- search ---
var searchInput = document.getElementById('searchInput');
var searchBtn = document.getElementById('searchBtn');
var resetBtn = document.getElementById('resetBtn');
var resultsSection = document.getElementById('resultsSection');
var resultsTitle = document.getElementById('resultsTitle');
var resultsCount = document.getElementById('resultsCount');
var resultsBox = document.getElementById('results');

if (searchBtn) searchBtn.addEventListener('click', runSearch);
if (resetBtn) resetBtn.addEventListener('click', clearSearch);
if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            runSearch();
        }
    });
}

// Normalise a keyword so "Beach", "beaches", " BEACH " all match.
function normaliseKey(s) {
    return String(s || '').trim().toLowerCase().replace(/[^a-z]/g, '');
}

function runSearch() {
    if (!searchInput || !resultsBox) return;

    var key = normaliseKey(searchInput.value);
    if (!key) {
        showMessage('Enter a keyword — try "beach", "temple", or "country".');
        return;
    }

    var items = [];
    var label = '';

    // match singular + plural
    if (key === 'beach' || key === 'beaches') {
        items = archive.beaches || [];
        label = 'Beaches';
    } else if (key === 'temple' || key === 'temples') {
        items = archive.temples || [];
        label = 'Temples';
    } else if (key === 'country' || key === 'countries') {
        // Flatten the nested countries[].cities[] into one flat list.
        var countries = archive.countries || [];
        for (var c = 0; c < countries.length; c++) {
            var cities = countries[c].cities || [];
            for (var j = 0; j < cities.length; j++) {
                items.push(cities[j]);
            }
        }
        label = 'Countries';
    } else {
        showMessage('No results for "' + searchInput.value + '". Try beach, temple, or country.');
        return;
    }

    render(items, label);
}

function render(items, label) {
    resultsBox.innerHTML = '';
    resultsTitle.innerHTML = 'Curated <em>' + label + '</em>';
    resultsCount.textContent = items.length + (items.length === 1 ? ' viewplate' : ' viewplates');

    if (!items.length) {
        showMessage('Nothing in this collection yet.');
        return;
    }

    for (var i = 0; i < items.length; i++) {
        var place = items[i];
        var card = document.createElement('article');
        card.className = 'result-card';

        var n = (i + 1) < 10 ? '0' + (i + 1) : String(i + 1);
        var fallbackImg = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80';

        card.innerHTML =
            '<img src="' + escapeAttr(place.imageUrl) + '" alt="' + escapeAttr(place.name) + '" loading="lazy" ' +
            'onerror="this.onerror=null;this.src=\'' + fallbackImg + '\'">' +
            '<div class="result-card-body">' +
            '<span class="cat-num">Study No. ' + n + '</span>' +
            '<h3>' + escapeHtml(place.name) + '</h3>' +
            '<p>' + escapeHtml(place.description) + '</p>' +
            '</div>';

        resultsBox.appendChild(card);
    }

    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showMessage(text) {
    resultsBox.innerHTML = '<p class="empty-state">' + escapeHtml(text) + '</p>';
    resultsTitle.textContent = 'No Results';
    if (resultsCount) resultsCount.textContent = '';
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearSearch() {
    if (resultsBox) resultsBox.innerHTML = '';
    if (searchInput) searchInput.value = '';
    if (resultsSection) resultsSection.hidden = true;
    if (resultsCount) resultsCount.textContent = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Small helpers to keep user input from breaking the DOM.
function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

// Used by the category buttons and footer links.
function quickSearch(term) {
    if (!searchInput) {
        window.location.href = 'roamly_travel.html?q=' + encodeURIComponent(term);
        return;
    }
    searchInput.value = term;
    runSearch();
}

// Handle ?q=keyword in the URL.
window.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q && searchInput) {
        searchInput.value = q;
        setTimeout(runSearch, 400);
    }
});

// --- scroll fade ---
function setupFade() {
    var targets = document.querySelectorAll(
        '.intro-layout, .case-layout, .cat-card, .gal-item, .cap-item, ' +
        '.quote, .team-card, .chrono-row, .contact-side, .contact-form-wrap, ' +
        '.faq, .cta-box, .hero-fig'
    );

    if (!('IntersectionObserver' in window)) return;

    for (var i = 0; i < targets.length; i++) {
        targets[i].classList.add('fade');
    }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    for (var j = 0; j < targets.length; j++) {
        io.observe(targets[j]);
    }
}

// --- animated counters ---
function runCounters() {
    var nums = document.querySelectorAll('[data-count]');
    for (var i = 0; i < nums.length; i++) {
        (function (el) {
            if (el.dataset.done) return;
            el.dataset.done = '1';

            var goal = parseInt(el.dataset.count, 10) || 0;
            var start = performance.now();
            var duration = 1400;

            function tick(now) {
                var t = Math.min((now - start) / duration, 1);
                var eased = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.floor(eased * goal);
                if (t < 1) requestAnimationFrame(tick);
                else el.textContent = goal;
            }
            requestAnimationFrame(tick);
        })(nums[i]);
    }
}

// --- contact form ---
function setupContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var success = document.getElementById('formSuccess');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;

        ok = checkField('name', 'Please enter your name.') && ok;
        ok = checkField('email', 'Please enter a valid email address.', true) && ok;
        ok = checkField('message', 'Please enter a message.') && ok;

        if (ok) {
            form.reset();
            if (success) {
                success.hidden = false;
                setTimeout(function () { success.hidden = true; }, 5000);
            }
        }
    });

    var inputs = form.querySelectorAll('input, textarea');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('input', function () {
            var wrap = this.closest('.field');
            var err = wrap ? wrap.querySelector('.field-error') : null;
            if (wrap) wrap.classList.remove('has-error');
            if (err) err.textContent = '';
        });
    }
}

function checkField(id, message, isEmail) {
    var input = document.getElementById(id);
    if (!input) return true;

    var wrap = input.closest('.field');
    var err = wrap ? wrap.querySelector('.field-error') : null;
    var val = input.value.trim();

    var bad = !val;
    if (!bad && isEmail) bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    if (bad) {
        if (wrap) wrap.classList.add('has-error');
        if (err) err.textContent = message;
        return false;
    }
    if (wrap) wrap.classList.remove('has-error');
    if (err) err.textContent = '';
    return true;
}

document.addEventListener('DOMContentLoaded', function () {
    setupFade();
    setupContactForm();
    runCounters();
});