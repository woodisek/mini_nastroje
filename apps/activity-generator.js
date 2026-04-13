import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('activity-generator');

// Databáze aktivit podle kategorií
const activities = {
    relax: [
        { text: "📖 Přečti si knížku", emoji: "📖", duration: "30-60 min" },
        { text: "🎬 Podívej se na film", emoji: "🎬", duration: "90-120 min" },
        { text: "🎧 Poslouchej hudbu", emoji: "🎧", duration: "15-30 min" },
        { text: "🧘 Udělej si jógu", emoji: "🧘", duration: "20-40 min" },
        { text: "🛁 Dej si horkou koupel", emoji: "🛁", duration: "20-30 min" },
        { text: "☕ Dej si kávu/čaj", emoji: "☕", duration: "10-15 min" },
        { text: "🌅 Sleduj západ slunce", emoji: "🌅", duration: "10-20 min" },
        { text: "🎨 Maluj nebo kresli", emoji: "🎨", duration: "30-60 min" }
    ],
    sport: [
        { text: "🏃 Jdi si zaběhat", emoji: "🏃", duration: "20-40 min" },
        { text: "🚴 Jdi na kolo", emoji: "🚴", duration: "30-60 min" },
        { text: "🏋️ Cvič doma", emoji: "🏋️", duration: "20-30 min" },
        { text: "🧘 Protáhni se", emoji: "🧘", duration: "10-15 min" },
        { text: "🏊 Jdi plavat", emoji: "🏊", duration: "30-60 min" },
        { text: "⚽ Zahraj si fotbal", emoji: "⚽", duration: "60-90 min" },
        { text: "🚶 Jdi na procházku", emoji: "🚶", duration: "20-40 min" }
    ],
    kreativni: [
        { text: "✍️ Napiš báseň nebo příběh", emoji: "✍️", duration: "30-60 min" },
        { text: "🎸 Nauč se novou píseň", emoji: "🎸", duration: "30-60 min" },
        { text: "📸 Foť", emoji: "📸", duration: "30-60 min" },
        { text: "🎨 Vytvoř něco rukama", emoji: "🎨", duration: "45-90 min" },
        { text: "🍳 Uvař něco nového", emoji: "🍳", duration: "30-60 min" },
        { text: "🪴 Zasaď kytku", emoji: "🪴", duration: "15-30 min" }
    ],
    vzdelavani: [
        { text: "📚 Uč se nový jazyk", emoji: "📚", duration: "20-40 min" },
        { text: "🎓 Sleduj edukativní video", emoji: "🎓", duration: "15-30 min" },
        { text: "🧠 Vyřeš sudoku", emoji: "🧠", duration: "15-20 min" },
        { text: "🗺️ Naplánuj výlet", emoji: "🗺️", duration: "30-60 min" },
        { text: "💻 Nauč se nový program", emoji: "💻", duration: "45-90 min" },
        { text: "📝 Zapisuj si myšlenky", emoji: "📝", duration: "15-30 min" }
    ],
    spolecenske: [
        { text: "👨‍👩‍👧‍👦 Navštiv rodinu", emoji: "👨‍👩‍👧‍👦", duration: "2-4 hod" },
        { text: "📞 Zavolej kamarádovi", emoji: "📞", duration: "15-30 min" },
        { text: "🎲 Zahraj si deskovku", emoji: "🎲", duration: "60-120 min" },
        { text: "🍽️ Jdi na večeři", emoji: "🍽️", duration: "60-90 min" },
        { text: "🎮 Hraj hry s přáteli", emoji: "🎮", duration: "60-120 min" }
    ],
    domaci: [
        { text: "🧹 Uklid si doma", emoji: "🧹", duration: "30-60 min" },
        { text: "🪴 Zalij květiny", emoji: "🪴", duration: "10-15 min" },
        { text: "🧺 Vyper prádlo", emoji: "🧺", duration: "30-60 min" },
        { text: "🍳 Uvař oběd", emoji: "🍳", duration: "30-60 min" },
        { text: "📦 Vytřiď skříň", emoji: "📦", duration: "30-60 min" },
        { text: "🪑 Zreorganizuj nábytek", emoji: "🪑", duration: "30-60 min" }
    ],
    nahodne: [
        { text: "🎲 Hoď kostkou", emoji: "🎲", duration: "5 min" },
        { text: "🔮 Zeptej se křišťálové koule", emoji: "🔮", duration: "5 min" },
        { text: "🃏 Vytáhni kartu", emoji: "🃏", duration: "5 min" },
        { text: "🍀 Dělej, co tě napadne", emoji: "🍀", duration: "?" }
    ]
};

export default function render(container) {
    container.innerHTML = `
        <div class="activity-generator">
            <div class="ag-header">
                <span class="ag-icon">🤔</span>
                <div>
                    <h3>Co dnes dělat?</h3>
                    <p>Náhodný generátor aktivit</p>
                </div>
            </div>

            <!-- Kategorie -->
            <div class="ag-section">
                <label class="ag-label">📂 Kategorie</label>
                <div class="ag-categories">
                    <button data-cat="all" class="ag-cat-btn active">🎲 Všechny</button>
                    <button data-cat="relax" class="ag-cat-btn">😌 Relax</button>
                    <button data-cat="sport" class="ag-cat-btn">🏃 Sport</button>
                    <button data-cat="kreativni" class="ag-cat-btn">🎨 Kreativní</button>
                    <button data-cat="vzdelavani" class="ag-cat-btn">📚 Vzdělávání</button>
                    <button data-cat="spolecenske" class="ag-cat-btn">👥 Společenské</button>
                    <button data-cat="domaci" class="ag-cat-btn">🏠 Domácí</button>
                    <button data-cat="nahodne" class="ag-cat-btn">🎲 Náhodné</button>
                </div>
            </div>

            <!-- Časová náročnost -->
            <div class="ag-section">
                <label class="ag-label">⏱️ Časová náročnost</label>
                <div class="ag-time">
                    <select id="ag-time" class="ag-select">
                        <option value="all">⏰ Jakýkoliv</option>
                        <option value="short">⚡ Krátký (do 30 min)</option>
                        <option value="medium">📊 Střední (30-60 min)</option>
                        <option value="long">🐢 Dlouhý (60+ min)</option>
                    </select>
                </div>
            </div>

            <!-- Tlačítko Generovat -->
            <button id="ag-generate" class="ag-generate-btn">🎲 Náhodná aktivita</button>

            <!-- Výsledek -->
            <div class="ag-result-section">
                <div class="ag-result-header">
                    <span>📊 Dnešní aktivita</span>
                    <button id="ag-copy" class="ag-small-btn">📋 Kopírovat</button>
                </div>
                <div id="ag-result" class="ag-result">
                    <div class="ag-empty">Klikni na "Náhodná aktivita"</div>
                </div>
            </div>

            <!-- Historie -->
            <details class="ag-details">
                <summary>📜 Historie aktivit</summary>
                <div id="ag-history" class="ag-history">
                    <div class="ag-empty-history">Zatím žádná historie</div>
                </div>
                <button id="ag-clear-history" class="ag-small-btn ag-clear-history">🗑️ Smazat historii</button>
            </details>

            <!-- Tip -->
            <div class="ag-tip">
                💡 <strong>Tip:</strong> Můžeš filtrovat podle kategorie a časové náročnosti. Vyber si, co ti vyhovuje!
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const catBtns = document.querySelectorAll('.ag-cat-btn');
    const timeSelect = document.getElementById('ag-time');
    const generateBtn = document.getElementById('ag-generate');
    const copyBtn = document.getElementById('ag-copy');
    const clearHistoryBtn = document.getElementById('ag-clear-history');
    const resultDiv = document.getElementById('ag-result');
    const historyDiv = document.getElementById('ag-history');

    let currentCategory = 'all';
    let history = [];

    // Načtení historie
    function loadHistory() {
        const saved = storage.get('activityHistory', []);
        history = saved;
        displayHistory();
    }

    // Uložení historie
    function saveHistory() {
        storage.set('activityHistory', history.slice(0, 20));
    }

    // Zobrazení historie
    function displayHistory() {
        if (!historyDiv) return;
        
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="ag-empty-history">Zatím žádná historie</div>';
            return;
        }
        
        historyDiv.innerHTML = history.map((item, index) => `
            <div class="ag-history-item">
                <span class="ag-history-icon">${item.emoji}</span>
                <span class="ag-history-text">${item.text}</span>
                <span class="ag-history-time">${item.duration}</span>
                <span class="ag-history-date">${item.date}</span>
            </div>
        `).join('');
    }

    // Přidání do historie
    function addToHistory(activity) {
        const now = new Date();
        const dateStr = `${now.getDate()}.${now.getMonth() + 1}. ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        history.unshift({
            ...activity,
            date: dateStr
        });
        
        if (history.length > 20) history = history.slice(0, 20);
        saveHistory();
        displayHistory();
    }

    // Filtr podle času
    function filterByTime(activitiesList, timeFilter) {
        if (timeFilter === 'all') return activitiesList;
        
        return activitiesList.filter(act => {
            const duration = act.duration;
            if (timeFilter === 'short') {
                return duration.includes('min') && parseInt(duration) <= 30;
            } else if (timeFilter === 'medium') {
                return duration.includes('min') && parseInt(duration) >= 30 && parseInt(duration) <= 60;
            } else if (timeFilter === 'long') {
                return duration.includes('hod') || (duration.includes('min') && parseInt(duration) >= 60);
            }
            return true;
        });
    }

    // Získání aktivit podle kategorie
    function getActivities() {
        if (currentCategory === 'all') {
            let all = [];
            Object.values(activities).forEach(cat => {
                all = all.concat(cat);
            });
            return all;
        }
        return activities[currentCategory] || [];
    }

    // Generování náhodné aktivity
    function generateActivity() {
        let available = getActivities();
        const timeFilter = timeSelect.value;
        
        available = filterByTime(available, timeFilter);
        
        if (available.length === 0) {
            resultDiv.innerHTML = `
                <div class="ag-empty">
                    😕 Žádná aktivita neodpovídá filtrům.<br>
                    Zkus změnit kategorii nebo časovou náročnost.
                </div>
            `;
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * available.length);
        const activity = available[randomIndex];
        
        // Zobrazení výsledku
        resultDiv.innerHTML = `
            <div class="ag-activity-card">
                <div class="ag-activity-emoji">${activity.emoji}</div>
                <div class="ag-activity-text">${activity.text}</div>
                <div class="ag-activity-duration">⏱️ ${activity.duration}</div>
                <div class="ag-activity-category">${getCategoryName(currentCategory)}</div>
            </div>
        `;
        
        // Přidání do historie
        addToHistory(activity);
        
        // Animace
        resultDiv.style.animation = 'none';
        setTimeout(() => {
            resultDiv.style.animation = 'fadeIn 0.3s ease';
        }, 10);
        
        showNotification('Aktivita vybrána!', 'success');
        saveSettings();
    }

    function getCategoryName(catId) {
        const names = {
            all: 'Všechny kategorie',
            relax: '😌 Relax',
            sport: '🏃 Sport',
            kreativni: '🎨 Kreativní',
            vzdelavani: '📚 Vzdělávání',
            spolecenske: '👥 Společenské',
            domaci: '🏠 Domácí',
            nahodne: '🎲 Náhodné'
        };
        return names[catId] || 'Aktivita';
    }

    async function copyActivity() {
        const activityText = resultDiv.innerText;
        if (activityText && !activityText.includes('Klikni na "Náhodná aktivita"')) {
            await copyToClipboard(activityText);
        } else {
            showNotification('Nejprve vygeneruj aktivitu', 'warning');
        }
    }

    function clearHistory() {
        if (history.length > 0 && confirm('Opravdu chceš smazat celou historii?')) {
            history = [];
            saveHistory();
            displayHistory();
            showNotification('Historie smazána');
        }
    }

    // Eventy
    generateBtn.addEventListener('click', generateActivity);
    copyBtn.addEventListener('click', copyActivity);
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            saveSettings();
        });
    });
    
    timeSelect.addEventListener('change', () => {
        saveSettings();
    });

    // Ukládání/načítání
    function saveSettings() {
        storage.set('category', currentCategory);
        storage.set('timeFilter', timeSelect.value);
    }
    
    function loadSettings() {
        const savedCategory = storage.get('category', 'all');
        const savedTimeFilter = storage.get('timeFilter', 'all');
        
        currentCategory = savedCategory;
        timeSelect.value = savedTimeFilter;
        
        catBtns.forEach(btn => {
            if (btn.dataset.cat === savedCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    loadHistory();
    loadSettings();
}

export function cleanup() {
    console.log('Activity Generator se zavírá');
}