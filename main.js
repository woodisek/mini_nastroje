import { apps } from './apps-manifest.js';
import { showNotification } from './utils/notify.js';

// ========== STORAGE PRO OBLÍBENÉ ==========
const FAVORITES_KEY = 'favorite_apps';
const RECENT_KEY = 'recent_apps';

// ========== PANEL AKTUALIZACÍ ==========

function initUpdatePanel() {
    const updateList = document.getElementById('update-list');
    const updatePanel = document.getElementById('update-panel');
    const updateClose = document.getElementById('update-close');
    
    // Panel se vždy zobrazí (žádné ukládání do localStorage)
    if (updatePanel) {
        updatePanel.classList.remove('hidden');
    }
    
    // Seznam aktualizací (nejnovější nahoře)
    const updates = [
        {
            date: "13.4.2026",
            text: "💬 Generátor citátů: přidáno přes 1300+ nových citátů",
            badge: "Vylepšení"
        },
        {
            date: "13.4.2026",
            text: "📊 Počítadlo řádků: nová funkce pro rychlé počítání řádků v textu",
            badge: "Novinka"
        },
        {
            date: "13.4.2026",
            text: "💡 Zajímavé fakty: nová funkce pro generování náhodných faktů",
            badge: "Novinka"
        }
    ];
    
    // Naplnění seznamu aktualizací (zobrazíme posledních 5)
    if (updateList) {
        const latestUpdates = updates.slice(0, 5);
        updateList.innerHTML = latestUpdates.map(update => `
            <div class="update-item">
                <span class="update-date">${update.date}</span>
                <span class="update-text">${update.text}</span>
                <span class="update-badge">${update.badge}</span>
            </div>
        `).join('');
    }
    
    // Zavření panelu (pouze pro tuto relaci, po obnovení stránky se znovu objeví)
    if (updateClose) {
        updateClose.addEventListener('click', () => {
            if (updatePanel) {
                updatePanel.classList.add('hidden');
            }
        });
    }
}

// Odstranění diakritiky pro vyhledávání
function removeDiacritics(str) {
    const diacriticsMap = {
        'á': 'a', 'ä': 'a', 'â': 'a', 'ă': 'a', 'ā': 'a', 'à': 'a', 'å': 'a', 'ã': 'a', 'ą': 'a',
        'č': 'c', 'ć': 'c', 'ç': 'c', 'ĉ': 'c', 'ċ': 'c',
        'ď': 'd', 'đ': 'd', 'ð': 'd',
        'é': 'e', 'ě': 'e', 'ë': 'e', 'ê': 'e', 'ē': 'e', 'è': 'e', 'ę': 'e', 'ė': 'e',
        'ř': 'r', 'ŕ': 'r', 'ŗ': 'r',
        'š': 's', 'ś': 's', 'ş': 's', 'ŝ': 's', 'ș': 's',
        'ť': 't', 'ţ': 't', 'ț': 't', 'ŧ': 't',
        'ú': 'u', 'ů': 'u', 'ü': 'u', 'û': 'u', 'ū': 'u', 'ù': 'u', 'ų': 'u', 'ű': 'u',
        'ý': 'y', 'ÿ': 'y', 'ŷ': 'y',
        'ž': 'z', 'ź': 'z', 'ż': 'z',
        'í': 'i', 'î': 'i', 'ï': 'i', 'ī': 'i', 'ì': 'i', 'į': 'i', 'ı': 'i',
        'ó': 'o', 'ö': 'o', 'ô': 'o', 'ō': 'o', 'ò': 'o', 'ő': 'o', 'ø': 'o', 'õ': 'o',
        'ň': 'n', 'ñ': 'n', 'ń': 'n', 'ņ': 'n',
        'ľ': 'l', 'ĺ': 'l', 'ļ': 'l', 'ł': 'l',
        'ģ': 'g', 'ğ': 'g',
        'ķ': 'k', 'ĸ': 'k',
        'ß': 'ss'
    };
    
    return str.replace(/[áäâăāàåãąčćçĉċďđðéěëêēèęėřŕŗšśşŝșťţțŧúůüûūùųűýÿŷžźżíîïīìįıóöôōòőøõňñńņľĺļłģğķĸ]/g, function(match) {
        return diacriticsMap[match] || match;
    });
}

function getFavorites() {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function toggleFavorite(appId) {
    let favorites = getFavorites();
    if (favorites.includes(appId)) {
        favorites = favorites.filter(id => id !== appId);
        showNotification('Odstraněno z oblíbených');
    } else {
        favorites.push(appId);
        showNotification('Přidáno do oblíbených ⭐');
    }
    saveFavorites(favorites);
    loadAppsGrid(); // Znovu načíst grid
    updateStats();
    return favorites.includes(appId);
}

function isFavorite(appId) {
    return getFavorites().includes(appId);
}

function addToRecent(appId) {
    let recent = localStorage.getItem(RECENT_KEY);
    recent = recent ? JSON.parse(recent) : [];
    recent = [appId, ...recent.filter(id => id !== appId)].slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

function getRecent() {
    const recent = localStorage.getItem(RECENT_KEY);
    return recent ? JSON.parse(recent) : [];
}

// ========== VYHLEDÁVÁNÍ A FILTROVÁNÍ ==========
let currentFilter = 'all';
let currentSearch = '';

function filterApps(appsList) {
    let filtered = [...appsList];
    
    // Filtrování podle kategorie
    if (currentFilter === 'favorites') {
        const favorites = getFavorites();
        filtered = filtered.filter(app => favorites.includes(app.id));
    } else if (currentFilter === 'recent') {
        const recent = getRecent();
        filtered = filtered.filter(app => recent.includes(app.id));
    }
    
    // Filtrování podle vyhledávání (bez diakritiky)
    if (currentSearch) {
        const searchNormalized = removeDiacritics(currentSearch.toLowerCase());
        filtered = filtered.filter(app => {
            const nameNormalized = removeDiacritics(app.name.toLowerCase());
            const descNormalized = removeDiacritics(app.description.toLowerCase());
            return nameNormalized.includes(searchNormalized) || 
                descNormalized.includes(searchNormalized);
        });
    }
    
    // Seřazení: oblíbené nahoře
    const favorites = getFavorites();
    filtered.sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 1 : 0;
        const bFav = favorites.includes(b.id) ? 1 : 0;
        return bFav - aFav;
    });
    
    return filtered;
}

function updateStats() {
    const favorites = getFavorites();
    document.getElementById('favorites-count').textContent = favorites.length;
    document.getElementById('total-apps').textContent = apps.length;
}

// ========== NAČTENÍ GRIDU ==========
let currentModal = null;

async function loadAppsGrid() {
    const grid = document.getElementById('apps-grid');
    const emptyState = document.getElementById('empty-state');
    const filteredApps = filterApps(apps);
    
    if (filteredApps.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    const favorites = getFavorites();
    
    grid.innerHTML = filteredApps.map(app => `
        <div class="app-card" data-app-id="${app.id}">
            ${favorites.includes(app.id) ? '<span class="favorite-badge">⭐</span>' : ''}
            <div class="app-icon">${app.icon || '🛠️'}</div>
            <h3>${app.name}</h3>
            <p>${app.description}</p>
        </div>
    `).join('');
    
    document.querySelectorAll('.app-card').forEach(card => {
        card.addEventListener('click', () => openApp(card.dataset.appId));
    });
}

// ========== OTEVŘENÍ APLIKACE ==========
async function openApp(appId) {
    const app = apps.find(a => a.id === appId);
    if (!app) {
        showNotification('Nástroj nebyl nalezen', 'error');
        return;
    }
    
    addToRecent(appId);
    
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalIcon = document.getElementById('modal-icon');
    const favoriteToggle = document.getElementById('favorite-toggle');
    
    modalIcon.textContent = app.icon || '🛠️';
    modalTitle.textContent = app.name;
    favoriteToggle.textContent = isFavorite(appId) ? '★' : '☆';
    favoriteToggle.classList.toggle('active', isFavorite(appId));
    favoriteToggle.onclick = () => {
        const isNowFavorite = toggleFavorite(appId);
        favoriteToggle.textContent = isNowFavorite ? '★' : '☆';
        favoriteToggle.classList.toggle('active', isNowFavorite);
        loadAppsGrid();
        updateStats();
    };
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>Načítání nástroje...</span></div>';
    modal.classList.remove('hidden');
    currentModal = modal;
    
    try {
        const module = await app.component();
        const appComponent = module.default;
        modalBody.innerHTML = '';
        
        if (typeof appComponent === 'function') {
            appComponent(modalBody);
        } else if (appComponent.render) {
            appComponent.render(modalBody);
        } else {
            throw new Error('Neplatná struktura aplikace');
        }
        
        if (appComponent.cleanup) {
            modal.cleanup = appComponent.cleanup;
        }
    } catch (error) {
        console.error(`Chyba při načítání aplikace ${appId}:`, error);
        modalBody.innerHTML = `
            <div class="error-state">
                <p>❌ Nepodařilo se načíst nástroj</p>
                <button class="btn btn-secondary" onclick="location.reload()">Zkusit znovu</button>
            </div>
        `;
        showNotification('Chyba při načítání nástroje', 'error');
    }
}

function closeModal() {
    if (currentModal) {
        if (currentModal.cleanup && typeof currentModal.cleanup === 'function') {
            currentModal.cleanup();
        }
        currentModal.classList.add('hidden');
        currentModal = null;
    }
}

// ========== VYHLEDÁVÁNÍ A FILTRY ==========
function setupSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const resetBtn = document.getElementById('reset-filters');
    
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        clearSearch.style.display = currentSearch ? 'block' : 'none';
        loadAppsGrid();
    });
    
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        clearSearch.style.display = 'none';
        loadAppsGrid();
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadAppsGrid();
        });
    });
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearch = '';
            clearSearch.style.display = 'none';
            filterBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-filter="all"]').classList.add('active');
            currentFilter = 'all';
            loadAppsGrid();
        });
    }
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', () => {
    loadAppsGrid();
    updateStats();
    setupSearchAndFilters();
    initUpdatePanel();
    
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    const modal = document.getElementById('app-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentModal) closeModal();
    });
});

window.__appSystem = { openApp, closeModal };
