import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('fact-generator');

// Databáze zajímavých faktů
const facts = {
    science: [
        "Lidské tělo obsahuje dostatek železa na výrobu 7,5 cm hřebíku.",
        "Med se nikdy nekazí – byl nalezen v egyptských hrobkách starých 3000 let a stále byl jedlý.",
        "Chobotnice mají tři srdce.",
        "Bambus může vyrůst až 91 cm za jeden den.",
        "Lidský mozek vygeneruje za den více elektrických impulzů než všechny telefony světa dohromady.",
        "Oči pštrosa jsou větší než jeho mozek.",
        "Krokodýl nemůže vyplazit jazyk.",
        "Hvězdice nemají mozek.",
        "Káva je druhé nejobchodovanější zboží na světě hned po ropě."
    ],
    history: [
        "Nejstarší dosud fungující restaurace je Sobrino de Botín v Madridu, otevřená v roce 1725.",
        "Kleopatřina života byla blíže k vynálezu iPhonu než ke stavbě egyptských pyramid.",
        "Oxfordská univerzita je starší než Aztécká říše.",
        "Velká čínská zeď není vidět z vesmíru pouhým okem.",
        "Napoleon nebyl malý – měřil 168 cm, což byl v jeho době průměr.",
        "První dálnice na světě byla postavena v Itálii v roce 1924.",
        "Kolo bylo vynalezeno až po stavbě pyramid."
    ],
    animals: [
        "Plameňáci jsou růžoví díky své stravě bohaté na karotenoidy.",
        "Delfíni si dávají jména a volají na sebe.",
        "Koala spí až 22 hodin denně.",
        "Tučňáci mají orgán, který přeměňuje slanou vodu na sladkou.",
        "Hroši potí přírodní opalovací krém.",
        "Sova nemůže otočit oči, musí otáčet celou hlavou.",
        "Klokaní samice může mít současně mládě v děloze i ve vaku."
    ],
    food: [
        "Banány jsou technicky bobule.",
        "Jahody nejsou bobule, ale arašídy ano.",
        "Hořká čokoláda je zdravá – obsahuje antioxidanty.",
        "Pizza byla původně jídlo chudých v Itálii.",
        "Pomerančová kůra obsahuje více vitamínu C než samotný pomeranč.",
        "Káva byla objevena kozami, které po jejím pozření byly plné energie."
    ],
    random: [
        "Průměrný člověk stráví 6 měsíců svého života čekáním na červenou.",
        "Tvoje bříško má vlastní nervový systém – někdy nazývaný druhý mozek.",
        "Špatný pocit z nevyřízeného úkolu v práci se nazývá Zeigarnikův efekt.",
        "Ztráta mobilního signálu je stresující jako přírodní katastrofa.",
        "Lidé jsou jediná zvířata, která se červenají.",
        "Tvoje prsty si pamatují, co dělaly, i když na to nemyslíš."
    ]
};

export default function render(container) {
    container.innerHTML = `
        <div class="fact-generator">
            <div class="fg-header">
                <span class="fg-icon">💡</span>
                <div>
                    <h3>Generátor zajímavých faktů</h3>
                    <p>Nauč se něco nového každý den</p>
                </div>
            </div>

            <div class="fg-section">
                <label class="fg-label">📂 Kategorie</label>
                <div class="fg-categories">
                    <button data-cat="all" class="fg-cat-btn active">🎲 Všechny</button>
                    <button data-cat="science" class="fg-cat-btn">🔬 Věda</button>
                    <button data-cat="history" class="fg-cat-btn">📜 Historie</button>
                    <button data-cat="animals" class="fg-cat-btn">🐘 Zvířata</button>
                    <button data-cat="food" class="fg-cat-btn">🍕 Jídlo</button>
                    <button data-cat="random" class="fg-cat-btn">🎲 Náhodné</button>
                </div>
            </div>

            <div class="fg-buttons">
                <button id="fg-generate" class="fg-btn fg-btn-primary">✨ Náhodný fakt</button>
                <button id="fg-clear" class="fg-btn fg-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <div class="fg-result-section">
                <div class="fg-result-header">
                    <span>📋 Zajímavý fakt</span>
                    <button id="fg-copy" class="fg-small-btn">📋 Kopírovat</button>
                </div>
                <div id="fg-result" class="fg-result">
                    <div class="fg-empty">Klikni na "Náhodný fakt"</div>
                </div>
            </div>

            <details class="fg-details">
                <summary>📜 Historie faktů</summary>
                <div id="fg-history" class="fg-history">
                    <div class="fg-empty-history">Zatím žádná historie</div>
                </div>
                <button id="fg-clear-history" class="fg-small-btn fg-clear-history">🗑️ Smazat historii</button>
            </details>

            <div class="fg-tip">
                💡 <strong>Tip:</strong> Sdílej zajímavé fakty s přáteli. Vědomí je síla!
            </div>
        </div>
    `;

    let currentCategory = 'all';
    let history = [];

    function loadHistory() {
        const saved = storage.get('factHistory', []);
        history = saved;
        displayHistory();
    }

    function saveHistory() {
        storage.set('factHistory', history.slice(0, 20));
    }

    function displayHistory() {
        const historyDiv = document.getElementById('fg-history');
        if (!historyDiv) return;
        
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="fg-empty-history">Zatím žádná historie</div>';
            return;
        }
        
        historyDiv.innerHTML = history.map(item => `
            <div class="fg-history-item">
                <div class="fg-history-text">📌 ${escapeHtml(item.fact)}</div>
                <div class="fg-history-meta">${item.category} • ${item.time}</div>
            </div>
        `).join('');
    }

    function addToHistory(fact, category) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        const categoryName = {
            science: 'Věda', history: 'Historie', animals: 'Zvířata', food: 'Jídlo', random: 'Náhodné', all: 'Vše'
        };
        history.unshift({ fact, category: categoryName[category] || category, time: timeStr });
        if (history.length > 20) history = history.slice(0, 20);
        displayHistory();
        saveHistory();
    }

    function getAllFacts() {
        let all = [];
        Object.values(facts).forEach(cat => {
            all = all.concat(cat);
        });
        return all;
    }

    function generateFact() {
        let source;
        if (currentCategory === 'all') {
            source = getAllFacts();
        } else {
            source = facts[currentCategory] || getAllFacts();
        }
        
        if (source.length === 0) {
            showNotification('Žádné fakty v této kategorii', 'warning');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * source.length);
        const fact = source[randomIndex];
        
        const resultDiv = document.getElementById('fg-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="fg-fact-card">
                    <div class="fg-fact-icon">💡</div>
                    <div class="fg-fact-text">${escapeHtml(fact)}</div>
                </div>
            `;
        }
        
        addToHistory(fact, currentCategory);
        showNotification(`Zajímavý fakt vygenerován`, 'success');
        saveSettings();
    }

    async function copyFact() {
        const factText = document.querySelector('.fg-fact-text')?.innerText;
        if (factText) {
            await copyToClipboard(factText);
            showNotification('Fakt zkopírován');
        } else {
            showNotification('Nejprve vygeneruj fakt', 'warning');
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
        const resultDiv = document.getElementById('fg-result');
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="fg-empty">Klikni na "Náhodný fakt"</div>';
        }
        showNotification('Vyčištěno');
    }

    document.querySelectorAll('.fg-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fg-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            saveSettings();
        });
    });
    
    document.getElementById('fg-generate')?.addEventListener('click', generateFact);
    document.getElementById('fg-clear')?.addEventListener('click', clearAll);
    document.getElementById('fg-copy')?.addEventListener('click', copyFact);
    document.getElementById('fg-clear-history')?.addEventListener('click', clearHistory);
    
    function saveSettings() {
        storage.set('factCategory', currentCategory);
    }
    
    function loadSettings() {
        currentCategory = storage.get('factCategory', 'all');
        document.querySelectorAll('.fg-cat-btn').forEach(btn => {
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
    console.log('Fact Generator se zavírá');
}