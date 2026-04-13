import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('username-generator');

// Databáze prefixů a přípon
const prefixes = [
    'Cool', 'Dark', 'Light', 'Fast', 'Smart', 'Wild', 'Crazy', 'Silent', 'Brave', 'Lucky',
    'Super', 'Mega', 'Ultra', 'Hyper', 'Ninja', 'Cyber', 'Neon', 'Shadow', 'Phoenix', 'Dragon'
];

const suffixes = [
    'Wolf', 'Fox', 'Hawk', 'Tiger', 'Lion', 'Panther', 'Rider', 'Walker', 'Hunter', 'Slayer',
    'Master', 'Lord', 'King', 'Queen', 'Star', 'Hero', 'Knight', 'Wizard', 'Ghost', 'Angel'
];

const animals = ['Panda', 'Koala', 'Eagle', 'Falcon', 'Raven', 'Owl', 'Shark', 'Whale', 'Frog', 'Bee'];
const colors = ['Red', 'Blue', 'Green', 'Gold', 'Silver', 'Crimson', 'Azure', 'Emerald', 'Ruby', 'Sapphire'];
const numbers = ['1', '7', '13', '42', '69', '99', '123', '007', '404', '777', '1337', '2024'];

export default function render(container) {
    container.innerHTML = `
        <div class="username-generator">
            <div class="ug-header">
                <span class="ug-icon">👤</span>
                <div>
                    <h3>Generátor uživatelských jmen</h3>
                    <p>Vytvoř si jedinečné uživatelské jméno</p>
                </div>
            </div>

            <div class="ug-section">
                <label class="ug-label">🎨 Styl</label>
                <div class="ug-styles">
                    <button data-style="cool" class="ug-style-btn active">😎 Cool</button>
                    <button data-style="cute" class="ug-style-btn">🥰 Roztomilý</button>
                    <button data-style="epic" class="ug-style-btn">⚔️ Epic</button>
                    <button data-style="random" class="ug-style-btn">🎲 Náhodný</button>
                </div>
            </div>

            <div class="ug-section">
                <label class="ug-label">🔢 Možnosti</label>
                <div class="ug-options">
                    <label class="ug-checkbox">
                        <input type="checkbox" id="ug-add-number" checked>
                        <span>🔢 Přidat číslo</span>
                    </label>
                    <label class="ug-checkbox">
                        <input type="checkbox" id="ug-capitalize">
                        <span>🔠 VELKÁ PÍSMENA</span>
                    </label>
                    <label class="ug-checkbox">
                        <input type="checkbox" id="ug-lowercase">
                        <span>🔡 malá písmena</span>
                    </label>
                </div>
            </div>

            <div class="ug-section">
                <label class="ug-label">🔢 Počet jmen</label>
                <div class="ug-count-control">
                    <button id="ug-count-minus" class="ug-count-btn">−</button>
                    <input type="number" id="ug-count" class="ug-count-input" value="5" min="1" max="20">
                    <button id="ug-count-plus" class="ug-count-btn">+</button>
                </div>
            </div>

            <div class="ug-buttons">
                <button id="ug-generate" class="ug-btn ug-btn-primary">✨ Generovat jména</button>
                <button id="ug-clear" class="ug-btn ug-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <div class="ug-result-section">
                <div class="ug-result-header">
                    <span>📋 Vygenerovaná jména</span>
                    <button id="ug-copy" class="ug-small-btn">📋 Kopírovat vše</button>
                </div>
                <div id="ug-result" class="ug-result">
                    <div class="ug-empty">Klikni na "Generovat jména"</div>
                </div>
            </div>

            <details class="ug-details">
                <summary>📜 Historie jmen</summary>
                <div id="ug-history" class="ug-history">
                    <div class="ug-empty-history">Zatím žádná historie</div>
                </div>
                <button id="ug-clear-history" class="ug-small-btn ug-clear-history">🗑️ Smazat historii</button>
            </details>

            <div class="ug-tip">
                💡 <strong>Tip:</strong> Skvělé pro registrace, hry, Discord, Twitch a sociální sítě.
            </div>
        </div>
    `;

    let currentStyle = 'cool';
    let history = [];

    function loadHistory() {
        const saved = storage.get('usernameHistory', []);
        history = saved;
        displayHistory();
    }

    function saveHistory() {
        storage.set('usernameHistory', history.slice(0, 20));
    }

    function displayHistory() {
        const historyDiv = document.getElementById('ug-history');
        if (!historyDiv) return;
        
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="ug-empty-history">Zatím žádná historie</div>';
            return;
        }
        
        historyDiv.innerHTML = history.map(item => `
            <div class="ug-history-item">
                <span class="ug-history-name">👤 ${escapeHtml(item.username)}</span>
                <span class="ug-history-time">${item.time}</span>
            </div>
        `).join('');
    }

    function addToHistory(username) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        history.unshift({ username, time: timeStr });
        if (history.length > 20) history = history.slice(0, 20);
        displayHistory();
        saveHistory();
    }

    function generateUsername() {
        let style = currentStyle;
        if (style === 'random') {
            const styles = ['cool', 'cute', 'epic'];
            style = styles[Math.floor(Math.random() * styles.length)];
        }
        
        let username = '';
        
        if (style === 'cool') {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            username = prefix + suffix;
        } else if (style === 'cute') {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const animal = animals[Math.floor(Math.random() * animals.length)];
            username = color + animal;
        } else {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            const animal = animals[Math.floor(Math.random() * animals.length)];
            const variants = [prefix + suffix, prefix + animal, color + suffix];
            username = variants[Math.floor(Math.random() * variants.length)];
        }
        
        if (document.getElementById('ug-add-number')?.checked) {
            const number = numbers[Math.floor(Math.random() * numbers.length)];
            username += number;
        }
        
        if (document.getElementById('ug-capitalize')?.checked) {
            username = username.toUpperCase();
        } else if (document.getElementById('ug-lowercase')?.checked) {
            username = username.toLowerCase();
        }
        
        return username;
    }

    function generateUsernames() {
        const count = parseInt(document.getElementById('ug-count')?.value) || 5;
        
        const usernames = [];
        for (let i = 0; i < count; i++) {
            usernames.push(generateUsername());
        }
        
        const resultDiv = document.getElementById('ug-result');
        if (resultDiv) {
            resultDiv.innerHTML = usernames.map((name, idx) => `
                <div class="ug-result-item">
                    <span class="ug-result-number">${idx + 1}.</span>
                    <span class="ug-result-name">${escapeHtml(name)}</span>
                    <button class="ug-result-copy" data-name="${escapeHtml(name)}">📋</button>
                </div>
            `).join('');
        }
        
        if (usernames.length > 0) {
            addToHistory(usernames[0]);
        }
        
        document.querySelectorAll('.ug-result-copy').forEach(btn => {
            btn.addEventListener('click', async () => {
                const name = btn.dataset.name;
                await copyToClipboard(name);
                showNotification(`Zkopírováno: ${name}`);
            });
        });
        
        showNotification(`Vygenerováno ${usernames.length} jmen`, 'success');
        saveSettings();
    }

    async function copyAll() {
        const names = Array.from(document.querySelectorAll('.ug-result-name')).map(el => el.textContent);
        if (names.length === 0) {
            showNotification('Žádná jména ke kopírování', 'warning');
            return;
        }
        await copyToClipboard(names.join('\n'));
        showNotification(`Zkopírováno ${names.length} jmen`);
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
        const resultDiv = document.getElementById('ug-result');
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="ug-empty">Klikni na "Generovat jména"</div>';
        }
        showNotification('Vyčištěno');
    }

    document.querySelectorAll('.ug-style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ug-style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStyle = btn.dataset.style;
            saveSettings();
        });
    });
    
    document.getElementById('ug-generate')?.addEventListener('click', generateUsernames);
    document.getElementById('ug-clear')?.addEventListener('click', clearAll);
    document.getElementById('ug-copy')?.addEventListener('click', copyAll);
    document.getElementById('ug-clear-history')?.addEventListener('click', clearHistory);
    
    const countInput = document.getElementById('ug-count');
    const countMinus = document.getElementById('ug-count-minus');
    const countPlus = document.getElementById('ug-count-plus');
    
    countMinus?.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val > 1) countInput.value = val - 1;
    });
    countPlus?.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val < 20) countInput.value = val + 1;
    });
    
    function saveSettings() {
        storage.set('usernameStyle', currentStyle);
        storage.set('addNumber', document.getElementById('ug-add-number')?.checked);
        storage.set('capitalize', document.getElementById('ug-capitalize')?.checked);
        storage.set('lowercase', document.getElementById('ug-lowercase')?.checked);
    }
    
    function loadSettings() {
        currentStyle = storage.get('usernameStyle', 'cool');
        document.getElementById('ug-add-number').checked = storage.get('addNumber', true);
        document.getElementById('ug-capitalize').checked = storage.get('capitalize', false);
        document.getElementById('ug-lowercase').checked = storage.get('lowercase', false);
        
        document.querySelectorAll('.ug-style-btn').forEach(btn => {
            if (btn.dataset.style === currentStyle) {
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
    console.log('Username Generator se zavírá');
}