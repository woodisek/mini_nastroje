import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('percentage-randomizer');

// Databáze kategorií s popisky výsledků
const categories = {
    programmer: {
        name: "Programátor",
        icon: "👨‍💻",
        questions: [
            "Kolik % jsi programátor?",
            "Jak moc umíš kódovat?",
            "Kolik % tvého dne tvoří programování?"
        ],
        results: {
            low: "Začátečník - každý velký kód začíná prvním řádkem! 👶",
            medium: "Už to začínáš chápat, ale občas tě překvapí chyby 🐛",
            high: "Profi! Kód píšeš ve spánku. 🚀"
        }
    },
    cool: {
        name: "Cool",
        icon: "😎",
        questions: [
            "Kolik % jsi cool?",
            "Jak moc jsi v pohodě?",
            "Na kolik procent jsi stylový?"
        ],
        results: {
            low: "Každý má špatný den, zítra to bude lepší! 🌟",
            medium: "Jsi v pohodě, ale je ještě prostor pro zlepšení 👍",
            high: "Ty jsi naprostá legenda! 😎👑"
        }
    },
    annoying: {
        name: "Otrava",
        icon: "🤪",
        questions: [
            "Kolik % jsi otravný?",
            "Jak moc dokážeš štvat ostatní?",
            "Na kolik procent jsi protivný?"
        ],
        results: {
            low: "Jsi milý a příjemný! Lidé tě mají rádi. 🥰",
            medium: "Občas umíš být protivný, ale v dobrém slova smyslu 😅",
            high: "Uf! Tvé okolí potřebuje pauzu. Zkus být chvíli tiše. 🤐"
        }
    },
    coffee: {
        name: "Káva",
        icon: "☕",
        questions: [
            "Kolik % jsi káva?",
            "Jak moc miluješ kávu?",
            "Na kolik procent tě drží při životě kafe?"
        ],
        results: {
            low: "Čaj je taky dobrý! 🍵",
            medium: "Káva ti chutná, ale obejdeš se bez ní. ☕",
            high: "Tvoje žíly tečou kávou! Bez kafe neexistuješ. 🔥"
        }
    },
    gamer: {
        name: "Hráč",
        icon: "🎮",
        questions: [
            "Kolik % jsi hráč?",
            "Jak moc jsi závislý na hrách?",
            "Na kolik procent žiješ herním světem?"
        ],
        results: {
            low: "Občas si zahraješ, ale nic vážného. 🎯",
            medium: "Hraní je tvůj koníček, ale máš i jiné zájmy. 🎲",
            high: "Pro tebe je realita jen vedlejší level! 🏆"
        }
    },
    romantic: {
        name: "Romantik",
        icon: "💕",
        questions: [
            "Kolik % jsi romantik?",
            "Jak moc věříš na lásku?",
            "Na kolik procent jsi zamilovaný do života?"
        ],
        results: {
            low: "Jsi realista, láska není pro tebe jen růže. 🌹",
            medium: "Věříš na lásku, ale nestřílíš slepě. 💘",
            high: "Jsi beznadějný romantik! Srdce na dlani. 💖"
        }
    },
    foodie: {
        name: "Gurmán",
        icon: "🍕",
        questions: [
            "Kolik % jsi gurmán?",
            "Jak moc miluješ jídlo?",
            "Na kolik procent žiješ pro jídlo?"
        ],
        results: {
            low: "Jíš, abys žil, nic víc. 🥗",
            medium: "Dobré jídlo tě potěší, ale nemusíš mít vše. 🍝",
            high: "Jídlo je tvůj život! Ochutnal jsi (téměř) vše! 👨‍🍳"
        }
    }
};

export default function render(container) {
    container.innerHTML = `
        <div class="percentage-randomizer">
            <div class="pr-header">
                <span class="pr-icon">🎲</span>
                <div>
                    <h3>Kolik % něco jsi?</h3>
                    <p>Zábavný randomizer pro různé kategorie</p>
                </div>
            </div>

            <!-- Kategorie -->
            <div class="pr-section">
                <label class="pr-label">📂 Kategorie</label>
                <div class="pr-categories">
                    ${Object.entries(categories).map(([key, cat]) => `
                        <button data-cat="${key}" class="pr-cat-btn ${key === 'programmer' ? 'active' : ''}">
                            ${cat.icon} ${cat.name}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Tlačítko Generovat -->
            <button id="pr-generate" class="pr-generate-btn">🎲 Náhodné procento</button>

            <!-- Výsledek -->
            <div class="pr-result-section">
                <div class="pr-result-header">
                    <span>📊 Tvé procento</span>
                    <button id="pr-copy" class="pr-small-btn">📋 Kopírovat</button>
                </div>
                <div id="pr-result" class="pr-result">
                    <div class="pr-empty">Vyber kategorii a klikni na "Náhodné procento"</div>
                </div>
            </div>

            <!-- Historie -->
            <details class="pr-details">
                <summary>📜 Historie výsledků</summary>
                <div id="pr-history" class="pr-history">
                    <div class="pr-empty-history">Zatím žádná historie</div>
                </div>
                <button id="pr-clear-history" class="pr-small-btn pr-clear-history">🗑️ Smazat historii</button>
            </details>

            <!-- Tip -->
            <div class="pr-tip">
                💡 <strong>Tip:</strong> Každá kategorie má vlastní otázku a popis výsledku. Procento je vždy náhodné (0-100%).
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const catBtns = document.querySelectorAll('.pr-cat-btn');
    const generateBtn = document.getElementById('pr-generate');
    const copyBtn = document.getElementById('pr-copy');
    const clearHistoryBtn = document.getElementById('pr-clear-history');
    const resultDiv = document.getElementById('pr-result');
    const historyDiv = document.getElementById('pr-history');

    let currentCategory = 'programmer';
    let history = [];

    // Načtení historie
    function loadHistory() {
        const saved = storage.get('percentHistory', []);
        history = saved;
        displayHistory();
    }

    function saveHistory() {
        storage.set('percentHistory', history.slice(0, 20));
    }

    function displayHistory() {
        if (!historyDiv) return;
        
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="pr-empty-history">Zatím žádná historie</div>';
            return;
        }
        
        historyDiv.innerHTML = history.map((item, index) => `
            <div class="pr-history-item">
                <span class="pr-history-icon">${categories[item.category]?.icon || '🎲'}</span>
                <span class="pr-history-cat">${categories[item.category]?.name || item.category}</span>
                <span class="pr-history-percent">${item.percent}%</span>
                <span class="pr-history-date">${item.date}</span>
            </div>
        `).join('');
    }

    function addToHistory(category, percent) {
        const now = new Date();
        const dateStr = `${now.getDate()}.${now.getMonth() + 1}. ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        history.unshift({
            category: category,
            percent: percent,
            date: dateStr
        });
        
        if (history.length > 20) history = history.slice(0, 20);
        saveHistory();
        displayHistory();
    }

    function getResultDescription(percent) {
        if (percent < 33) return 'low';
        if (percent < 66) return 'medium';
        return 'high';
    }

    function getRandomQuestion(category) {
        const cat = categories[category];
        if (!cat || !cat.questions) return `Kolik % jsi ${cat?.name || 'toto'}?`;
        const randomIndex = Math.floor(Math.random() * cat.questions.length);
        return cat.questions[randomIndex];
    }

    function generatePercentage() {
        const percent = Math.floor(Math.random() * 101); // 0-100
        const category = currentCategory;
        const catData = categories[category];
        const question = getRandomQuestion(category);
        const resultLevel = getResultDescription(percent);
        const message = catData?.results[resultLevel] || "To je tvůj výsledek!";
        
        // Barva podle procenta
        let colorClass = '';
        if (percent < 33) colorClass = 'pr-low';
        else if (percent < 66) colorClass = 'pr-medium';
        else colorClass = 'pr-high';
        
        // Zobrazení výsledku
        resultDiv.innerHTML = `
            <div class="pr-result-card ${colorClass}">
                <div class="pr-result-question">${question}</div>
                <div class="pr-result-percent">
                    <span class="pr-percent-value">${percent}</span>
                    <span class="pr-percent-sign">%</span>
                </div>
                <div class="pr-result-message">${message}</div>
                <div class="pr-result-category">${catData?.icon} ${catData?.name}</div>
            </div>
        `;
        
        // Animace
        resultDiv.style.animation = 'none';
        setTimeout(() => {
            resultDiv.style.animation = 'fadeIn 0.3s ease';
        }, 10);
        
        // Přidání do historie
        addToHistory(category, percent);
        
        showNotification(`${percent}% - ${catData?.name}`, 'success');
        saveSettings();
    }

    async function copyResult() {
        const resultText = resultDiv.innerText;
        if (resultText && !resultText.includes('Vyber kategorii')) {
            await copyToClipboard(resultText);
            showNotification('Výsledek zkopírován');
        } else {
            showNotification('Nejprve vygeneruj výsledek', 'warning');
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
    generateBtn.addEventListener('click', generatePercentage);
    copyBtn.addEventListener('click', copyResult);
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            saveSettings();
        });
    });

    // Ukládání/načítání
    function saveSettings() {
        storage.set('category', currentCategory);
    }
    
    function loadSettings() {
        const savedCategory = storage.get('category', 'programmer');
        currentCategory = savedCategory;
        
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
    console.log('Percentage Randomizer se zavírá');
}