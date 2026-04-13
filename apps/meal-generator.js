import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('meal-generator');

// Databáze jídel podle kategorií
const meals = {
    czech: [
        "Svíčková na smetaně s knedlíkem",
        "Vepřo knedlo zelo",
        "Guláš s knedlíkem",
        "Pečená kachna s červeným zelím",
        "Bramboráky s uzeným masem",
        "Koprovka s vejcem",
        "Rajská omáčka s knedlíkem",
        "Špenát s vejcem a bramborem"
    ],
    italian: [
        "Pizza Margherita",
        "Těstoviny Carbonara",
        "Lasagne",
        "Rizoto s houbami",
        "Bruschetta s rajčaty",
        "Těstoviny s pestem",
        "Risotto s mořskými plody",
        "Pizza Prosciutto"
    ],
    asian: [
        "Kung Pao kuře",
        "Smažené nudle s tofu",
        "Phở polévka",
        "Sushi rolky",
        "Pad Thai",
        "Kari s kokosovým mlékem",
        "Dim sum knedlíčky",
        "Teriyaki losos s rýží"
    ],
    vegetarian: [
        "Zeleninové rizoto",
        "Pečená zelenina s quinoou",
        "Čočková polévka",
        "Falafel s hummusem",
        "Cuketové placky",
        "Batátové kari",
        "Těstoviny s avokádem",
        "Grillovaný halloumi"
    ],
    quick: [
        "Tousty se sýrem a šunkou",
        "Míchaná vejce s chlebem",
        "Instantní ramen",
        "Sendvič s tuňákem",
        "Palačinky s marmeládou",
        "Těstoviny s máslem a parmazánem",
        "Omeleta se sýrem"
    ]
};

export default function render(container) {
    container.innerHTML = `
        <div class="meal-generator">
            <div class="mg-header">
                <span class="mg-icon">🍕</span>
                <div>
                    <h3>Co dnes k večeři?</h3>
                    <p>Generátor nápadů na jídlo</p>
                </div>
            </div>

            <!-- Kategorie -->
            <div class="mg-section">
                <label class="mg-label">📂 Kategorie</label>
                <div class="mg-categories">
                    <button data-cat="all" class="mg-cat-btn active">🎲 Všechny</button>
                    <button data-cat="czech" class="mg-cat-btn">🇨🇿 Česká</button>
                    <button data-cat="italian" class="mg-cat-btn">🇮🇹 Italská</button>
                    <button data-cat="asian" class="mg-cat-btn">🥢 Asijská</button>
                    <button data-cat="vegetarian" class="mg-cat-btn">🥬 Bez masa</button>
                    <button data-cat="quick" class="mg-cat-btn">⚡ Rychlé</button>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="mg-buttons">
                <button id="mg-generate" class="mg-btn mg-btn-primary">🍽️ Co k večeři?</button>
                <button id="mg-clear" class="mg-btn mg-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="mg-result-section">
                <div class="mg-result-header">
                    <span>📋 Dnešní menu</span>
                    <button id="mg-copy" class="mg-small-btn">📋 Kopírovat</button>
                </div>
                <div id="mg-result" class="mg-result">
                    <div class="mg-empty">Klikni na "Co k večeři?"</div>
                </div>
            </div>

            <!-- Historie -->
            <details class="mg-details">
                <summary>📜 Historie jídel</summary>
                <div id="mg-history" class="mg-history">
                    <div class="mg-empty-history">Zatím žádná historie</div>
                </div>
                <button id="mg-clear-history" class="mg-small-btn mg-clear-history">🗑️ Smazat historii</button>
            </details>

            <div class="mg-tip">
                💡 <strong>Tip:</strong> Vyber kategorii podle nálady nebo nech rozhodnout náhodu. Dobrou chuť!
            </div>
        </div>
    `;

    let currentCategory = 'all';
    let history = [];

    function loadHistory() {
        const saved = storage.get('mealHistory', []);
        history = saved;
        displayHistory();
    }

    function saveHistory() {
        storage.set('mealHistory', history.slice(0, 20));
    }

    function displayHistory() {
        const historyDiv = document.getElementById('mg-history');
        if (!historyDiv) return;
        
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="mg-empty-history">Zatím žádná historie</div>';
            return;
        }
        
        historyDiv.innerHTML = history.map(item => `
            <div class="mg-history-item">
                <div class="mg-history-meal">🍽️ ${escapeHtml(item.meal)}</div>
                <div class="mg-history-meta">${item.category} • ${item.time}</div>
            </div>
        `).join('');
    }

    function addToHistory(meal, category) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        const categoryName = {
            czech: 'Česká', italian: 'Italská', asian: 'Asijská', vegetarian: 'Bez masa', quick: 'Rychlá', all: 'Vše'
        };
        history.unshift({ meal, category: categoryName[category] || category, time: timeStr });
        if (history.length > 20) history = history.slice(0, 20);
        displayHistory();
        saveHistory();
    }

    function getAllMeals() {
        let all = [];
        Object.values(meals).forEach(cat => {
            all = all.concat(cat);
        });
        return all;
    }

    function generateMeal() {
        let source;
        let categoryName = currentCategory;
        
        if (currentCategory === 'all') {
            source = getAllMeals();
            categoryName = 'all';
        } else {
            source = meals[currentCategory] || getAllMeals();
        }
        
        if (source.length === 0) {
            showNotification('Žádná jídla v této kategorii', 'warning');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * source.length);
        const meal = source[randomIndex];
        
        const resultDiv = document.getElementById('mg-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="mg-meal-card">
                    <div class="mg-meal-icon">🍽️</div>
                    <div class="mg-meal-name">${escapeHtml(meal)}</div>
                    <div class="mg-meal-bonus">💡 Tip: Nezapomeň na přílohu!</div>
                </div>
            `;
        }
        
        addToHistory(meal, currentCategory);
        showNotification(`Doporučujeme: ${meal}`, 'success');
        saveSettings();
    }

    async function copyMeal() {
        const mealText = document.querySelector('.mg-meal-name')?.innerText;
        if (mealText) {
            await copyToClipboard(mealText);
            showNotification(`Zkopírováno: ${mealText}`);
        } else {
            showNotification('Nejprve vygeneruj jídlo', 'warning');
        }
    }

    function clearHistory() {
        if (history.length > 0 && confirm('Opravdu chceš smazat historii?')) {
            history = [];
            displayHistory();
            saveHistory();
            showNotification('Historie smazána');
        }
    }

    function clearAll() {
        const resultDiv = document.getElementById('mg-result');
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="mg-empty">Klikni na "Co k večeři?"</div>';
        }
        showNotification('Vyčištěno');
    }

    // Eventy
    document.querySelectorAll('.mg-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mg-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            saveSettings();
        });
    });
    
    document.getElementById('mg-generate')?.addEventListener('click', generateMeal);
    document.getElementById('mg-clear')?.addEventListener('click', clearAll);
    document.getElementById('mg-copy')?.addEventListener('click', copyMeal);
    document.getElementById('mg-clear-history')?.addEventListener('click', clearHistory);
    
    function saveSettings() {
        storage.set('mealCategory', currentCategory);
    }
    
    function loadSettings() {
        currentCategory = storage.get('mealCategory', 'all');
        document.querySelectorAll('.mg-cat-btn').forEach(btn => {
            if (btn.dataset.cat === currentCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    loadHistory();
    loadSettings();
}

export function cleanup() {
    console.log('Meal Generator se zavírá');
}