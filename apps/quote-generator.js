import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('quote-generator');

// Databáze citátů
const quotes = {
    motivation: [
        { text: "Jediný způsob, jak dělat skvělou práci, je milovat to, co děláš.", author: "Steve Jobs" },
        { text: "Neúspěch je jen příležitost začít znovu, ale chytřeji.", author: "Henry Ford" },
        { text: "Věř, že můžeš, a už jsi na půli cesty.", author: "Theodore Roosevelt" },
        { text: "Kdo si myslí, že může, nebo si myslí, že nemůže, má v obou případech pravdu.", author: "Henry Ford" },
        { text: "Tajemství úspěchu je začít.", author: "Mark Twain" },
        { text: "Není to o tom mít čas, je to o tom si ho udělat.", author: "Neznámý" },
        { text: "Každý mistr byl jednou začátečníkem.", author: "Neznámý" },
        { text: "Pokud můžeš snít o něčem, můžeš toho také dosáhnout.", author: "Walt Disney" }
    ],
    life: [
        { text: "Život je to, co se děje, zatímco si děláte jiné plány.", author: "John Lennon" },
        { text: "Buď změnou, kterou chceš vidět ve světě.", author: "Mahátma Gándí" },
        { text: "Štěstí není něco hotového. Přichází z tvých vlastních činů.", author: "Dalajláma" },
        { text: "Minulost nelze změnit, ale budoucnost je stále tvá.", author: "Neznámý" },
        { text: "Největší slávou není nikdy nespadnout, ale vždy znovu vstát.", author: "Nelson Mandela" }
    ],
    wisdom: [
        { text: "Moudrý člověk se učí z chyb druhých, hloupý ze svých vlastních.", author: "Neznámý" },
        { text: "Všechno, co opravdu potřebuji vědět, jsem se naučil ve školce.", author: "Robert Fulghum" },
        { text: "Nejlepší čas zasadit strom byl před dvaceti lety. Druhý nejlepší čas je teď.", author: "Čínské přísloví" },
        { text: "Kdo se ptá, ten se na chvíli stydí, kdo se neptá, stydí se celý život.", author: "Japonské přísloví" }
    ],
    funny: [
        { text: "Život je jako toaletní papír – čím blíž ke konci, tím rychleji ubíhá.", author: "Neznámý" },
        { text: "Neodkládej na zítřek, co můžeš udělat pozítří.", author: "Neznámý" },
        { text: "Mám rád počítače. Pořád mě poslouchají… dokud nezmáčknu špatné tlačítko.", author: "Neznámý" },
        { text: "Káva – jediný důvod, proč ráno vstávám z postele.", author: "Neznámý" }
    ],
    love: [
        { text: "Kde je láska, tam je život.", author: "Mahátma Gándí" },
        { text: "Láska není o tom, kolikrát řekneš 'miluji tě', ale o tom, kolikrát to dokážeš.", author: "Neznámý" },
        { text: "Nejlepší věci v životě nejsou věci.", author: "Neznámý" }
    ]
};

export default function render(container) {
    container.innerHTML = `
        <div class="quote-generator">
            <div class="qg-header">
                <span class="qg-icon">💬</span>
                <div>
                    <h3>Generátor citátů</h3>
                    <p>Motivace, inspirace a moudra na každý den</p>
                </div>
            </div>

            <!-- Kategorie -->
            <div class="qg-section">
                <label class="qg-label">📂 Kategorie</label>
                <div class="qg-categories">
                    <button data-cat="all" class="qg-cat-btn active">🎲 Všechny</button>
                    <button data-cat="motivation" class="qg-cat-btn">💪 Motivace</button>
                    <button data-cat="life" class="qg-cat-btn">🌿 Život</button>
                    <button data-cat="wisdom" class="qg-cat-btn">📖 Moudrost</button>
                    <button data-cat="funny" class="qg-cat-btn">😂 Humor</button>
                    <button data-cat="love" class="qg-cat-btn">❤️ Láska</button>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="qg-buttons">
                <button id="qg-generate" class="qg-btn qg-btn-primary">✨ Generovat citát</button>
                <button id="qg-clear" class="qg-btn qg-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="qg-result-section">
                <div class="qg-result-header">
                    <span>📋 Citát dne</span>
                    <button id="qg-copy" class="qg-small-btn">📋 Kopírovat</button>
                </div>
                <div id="qg-result" class="qg-result">
                    <div class="qg-empty">Klikni na "Generovat citát"</div>
                </div>
            </div>

            <!-- Historie -->
            <details class="qg-details">
                <summary>📜 Historie citátů</summary>
                <div id="qg-history" class="qg-history">
                    <div class="qg-empty-history">Zatím žádná historie</div>
                </div>
                <button id="qg-clear-history" class="qg-small-btn qg-clear-history">🗑️ Smazat historii</button>
            </details>

            <div class="qg-tip">
                💡 <strong>Tip:</strong> Citáty můžeš kopírovat a sdílet. Každý den nová dávka inspirace!
            </div>
        </div>
    `;

    let currentCategory = 'all';
    let history = [];

    function loadHistory() {
        const saved = storage.get('quoteHistory', []);
        history = saved;
        displayHistory();
    }

    function saveHistory() {
        storage.set('quoteHistory', history.slice(0, 20));
    }

    function displayHistory() {
        const historyDiv = document.getElementById('qg-history');
        if (!historyDiv) return;
        
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="qg-empty-history">Zatím žádná historie</div>';
            return;
        }
        
        historyDiv.innerHTML = history.map(item => `
            <div class="qg-history-item">
                <div class="qg-history-text">"${escapeHtml(item.text)}"</div>
                <div class="qg-history-meta">— ${escapeHtml(item.author)} • ${item.time}</div>
            </div>
        `).join('');
    }

    function addToHistory(quote) {
        const now = new Date();
        const timeStr = `${now.getDate()}.${now.getMonth() + 1}. ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        history.unshift({ ...quote, time: timeStr });
        if (history.length > 20) history = history.slice(0, 20);
        displayHistory();
        saveHistory();
    }

    function getAllQuotes() {
        let all = [];
        Object.values(quotes).forEach(cat => {
            all = all.concat(cat);
        });
        return all;
    }

    function generateQuote() {
        let source;
        if (currentCategory === 'all') {
            source = getAllQuotes();
        } else {
            source = quotes[currentCategory] || getAllQuotes();
        }
        
        if (source.length === 0) {
            showNotification('Žádné citáty v této kategorii', 'warning');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * source.length);
        const quote = source[randomIndex];
        
        const resultDiv = document.getElementById('qg-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="qg-quote-card">
                    <div class="qg-quote-icon">“</div>
                    <div class="qg-quote-text">${escapeHtml(quote.text)}</div>
                    <div class="qg-quote-author">— ${escapeHtml(quote.author)}</div>
                </div>
            `;
        }
        
        addToHistory(quote);
        showNotification(`Citát vygenerován`, 'success');
        saveSettings();
    }

    async function copyQuote() {
        const quoteText = document.querySelector('.qg-quote-text')?.innerText;
        const quoteAuthor = document.querySelector('.qg-quote-author')?.innerText;
        if (quoteText && quoteAuthor) {
            await copyToClipboard(`"${quoteText}" ${quoteAuthor}`);
            showNotification('Citát zkopírován');
        } else {
            showNotification('Nejprve vygeneruj citát', 'warning');
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

    // Eventy
    document.querySelectorAll('.qg-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.qg-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            saveSettings();
        });
    });
    
    document.getElementById('qg-generate')?.addEventListener('click', generateQuote);
    document.getElementById('qg-clear')?.addEventListener('click', () => {
        document.getElementById('qg-result').innerHTML = '<div class="qg-empty">Klikni na "Generovat citát"</div>';
        showNotification('Vyčištěno');
    });
    document.getElementById('qg-copy')?.addEventListener('click', copyQuote);
    document.getElementById('qg-clear-history')?.addEventListener('click', clearHistory);
    
    function saveSettings() {
        storage.set('category', currentCategory);
    }
    
    function loadSettings() {
        currentCategory = storage.get('category', 'all');
        document.querySelectorAll('.qg-cat-btn').forEach(btn => {
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
    console.log('Quote Generator se zavírá');
}