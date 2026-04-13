import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('excuse-generator');

// Databáze výmluv podle kategorií
const excuses = {
    work: [
        "Měl jsem problém s připojením k internetu.",
        "Počítač se restartoval kvůli aktualizaci.",
        "Ztratil jsem heslo a nemohl jsem se přihlásit.",
        "Měl jsem rodinnou událost.",
        "Zapomněl jsem to doma.",
        "Byl jsem nemocný, ale už je mi lépe.",
        "Měl jsem technické problémy s počítačem.",
        "E-mail mi spadl do spamu."
    ],
    school: [
        "Pes mi sežvýkal domácí úkol.",
        "Zapomněl jsem si sešit ve škole.",
        "Měl jsem zubaře.",
        "Bolela mě hlava.",
        "Nerozuměl jsem zadání.",
        "Tiskárna odmítla spolupracovat.",
        "Učil jsem se na jiný předmět.",
        "Spadl mi internet a nemohl jsem to dohledat."
    ],
    relationship: [
        "Zapomněl jsem, dnes mám hodně práce.",
        "Měl jsem to v hlavě, ale vypadlo mi to.",
        "Příště to určitě napravím.",
        "Nestihl jsem to, protože mě zdrželo auto.",
        "Měl jsem toho dnes hodně.",
        "Už jsem na to myslel, jen jsem to nestihl."
    ],
    funny: [
        "Můj pes snědl můj plánovač úkolů.",
        "Můj kód fungoval, dokud jsem ho nezačal testovat.",
        "Někdo ukradl můj čas. Vážně, zmizel!",
        "Můj mozek dnes pracoval v offline režimu.",
        "Měl jsem příliš mnoho karet prohlížeče otevřených.",
        "Káva byla příliš slabá, nemohl jsem fungovat.",
        "Můj kočičí asistent zasedl klávesnici.",
        "Někdo vypnul internet v celé ulici."
    ]
};

export default function render(container) {
    container.innerHTML = `
        <div class="excuse-generator">
            <div class="eg-header">
                <span class="eg-icon">📝</span>
                <div>
                    <h3>Generátor výmluv</h3>
                    <p>Když potřebuješ rychlou omluvu nebo výmluvu</p>
                </div>
            </div>

            <!-- Kategorie -->
            <div class="eg-section">
                <label class="eg-label">📂 Kategorie</label>
                <div class="eg-categories">
                    <button data-cat="all" class="eg-cat-btn active">🎲 Všechny</button>
                    <button data-cat="work" class="eg-cat-btn">💼 Práce</button>
                    <button data-cat="school" class="eg-cat-btn">📚 Škola</button>
                    <button data-cat="relationship" class="eg-cat-btn">❤️ Vztahy</button>
                    <button data-cat="funny" class="eg-cat-btn">😂 Vtipné</button>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="eg-buttons">
                <button id="eg-generate" class="eg-btn eg-btn-primary">✨ Generovat výmluvu</button>
                <button id="eg-clear" class="eg-btn eg-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="eg-result-section">
                <div class="eg-result-header">
                    <span>📋 Výmluva</span>
                    <button id="eg-copy" class="eg-small-btn">📋 Kopírovat</button>
                </div>
                <div id="eg-result" class="eg-result">
                    <div class="eg-empty">Klikni na "Generovat výmluvu"</div>
                </div>
            </div>

            <!-- Historie -->
            <details class="eg-details">
                <summary>📜 Historie výmluv</summary>
                <div id="eg-history" class="eg-history">
                    <div class="eg-empty-history">Zatím žádná historie</div>
                </div>
                <button id="eg-clear-history" class="eg-small-btn eg-clear-history">🗑️ Smazat historii</button>
            </details>

            <div class="eg-tip">
                💡 <strong>Tip:</strong> Výmluvy používej s mírou! Nejlepší omluva je vždy upřímnost.
            </div>
        </div>
    `;

    let currentCategory = 'all';
    let history = [];

    function loadHistory() {
        const saved = storage.get('excuseHistory', []);
        history = saved;
        displayHistory();
    }

    function saveHistory() {
        storage.set('excuseHistory', history.slice(0, 20));
    }

    function displayHistory() {
        const historyDiv = document.getElementById('eg-history');
        if (!historyDiv) return;
        
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="eg-empty-history">Zatím žádná historie</div>';
            return;
        }
        
        historyDiv.innerHTML = history.map(item => `
            <div class="eg-history-item">
                <div class="eg-history-text">"${escapeHtml(item.excuse)}"</div>
                <div class="eg-history-meta">${item.category} • ${item.time}</div>
            </div>
        `).join('');
    }

    function addToHistory(excuse, category) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        const categoryName = {
            work: 'Práce', school: 'Škola', relationship: 'Vztahy', funny: 'Vtipné', all: 'Vše'
        };
        history.unshift({ excuse, category: categoryName[category] || category, time: timeStr });
        if (history.length > 20) history = history.slice(0, 20);
        displayHistory();
        saveHistory();
    }

    function getAllExcuses() {
        let all = [];
        Object.values(excuses).forEach(cat => {
            all = all.concat(cat);
        });
        return all;
    }

    function generateExcuse() {
        let source;
        let categoryName = currentCategory;
        
        if (currentCategory === 'all') {
            source = getAllExcuses();
            categoryName = 'all';
        } else {
            source = excuses[currentCategory] || getAllExcuses();
        }
        
        if (source.length === 0) {
            showNotification('Žádné výmluvy v této kategorii', 'warning');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * source.length);
        const excuse = source[randomIndex];
        
        const resultDiv = document.getElementById('eg-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="eg-excuse-card">
                    <div class="eg-excute-icon">🤷</div>
                    <div class="eg-excuse-text">${escapeHtml(excuse)}</div>
                </div>
            `;
        }
        
        addToHistory(excuse, currentCategory);
        showNotification(`Výmluva vygenerována`, 'success');
        saveSettings();
    }

    async function copyExcuse() {
        const excuseText = document.querySelector('.eg-excuse-text')?.innerText;
        if (excuseText) {
            await copyToClipboard(excuseText);
            showNotification('Výmluva zkopírována');
        } else {
            showNotification('Nejprve vygeneruj výmluvu', 'warning');
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
        const resultDiv = document.getElementById('eg-result');
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="eg-empty">Klikni na "Generovat výmluvu"</div>';
        }
        showNotification('Vyčištěno');
    }

    // Eventy
    document.querySelectorAll('.eg-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.eg-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            saveSettings();
        });
    });
    
    document.getElementById('eg-generate')?.addEventListener('click', generateExcuse);
    document.getElementById('eg-clear')?.addEventListener('click', clearAll);
    document.getElementById('eg-copy')?.addEventListener('click', copyExcuse);
    document.getElementById('eg-clear-history')?.addEventListener('click', clearHistory);
    
    function saveSettings() {
        storage.set('excuseCategory', currentCategory);
    }
    
    function loadSettings() {
        currentCategory = storage.get('excuseCategory', 'all');
        document.querySelectorAll('.eg-cat-btn').forEach(btn => {
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
    console.log('Excuse Generator se zavírá');
}