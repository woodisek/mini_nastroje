import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('nickname-generator');

// Databáze prefixů, přípon a stylů
const prefixes = {
    cool: ['Shadow', 'Night', 'Dark', 'Light', 'Storm', 'Thunder', 'Blaze', 'Frost', 'Venom', 'Phantom'],
    cute: ['Cuddly', 'Fluffy', 'Sparkly', 'Sunny', 'Rainbow', 'Honey', 'Sugar', 'Sweet', 'Bubbly', 'Dreamy'],
    smart: ['Wise', 'Clever', 'Genius', 'Mind', 'Logic', 'Brain', 'Knight', 'Scholar', 'Sage', 'Master'],
    funny: ['Silly', 'Wacky', 'Goofy', 'Loony', 'Zany', 'Quirky', 'Nutty', 'Crazy', 'Jolly', 'Bouncy']
};

const suffixes = {
    cool: ['Walker', 'Hunter', 'Rider', 'Killer', 'Slayer', 'Lord', 'King', 'Wolf', 'Hawk', 'Dragon'],
    cute: ['Bear', 'Bunny', 'Kitty', 'Panda', 'Koala', 'Cookie', 'Cupcake', 'Sparkle', 'Smile', 'Pie'],
    smart: ['Mind', 'Thinker', 'Solver', 'Wizard', 'Sage', 'Oracle', 'Professor', 'Doctor', 'Phd', 'Logic'],
    funny: ['Pants', 'Monkey', 'Chicken', 'Noodle', 'Waffle', 'Pickle', 'Potato', 'Burrito', 'Doodle', 'Giggles']
};

const animals = ['Wolf', 'Fox', 'Hawk', 'Eagle', 'Lion', 'Tiger', 'Panther', 'Falcon', 'Raven', 'Phoenix'];
const colors = ['Red', 'Blue', 'Green', 'Gold', 'Silver', 'Crimson', 'Azure', 'Emerald', 'Ruby', 'Sapphire'];
const numbers = ['01', '07', '13', '42', '69', '99', '007', '404', '777', '1337'];

export default function render(container) {
    container.innerHTML = `
        <div class="nickname-generator">
            <div class="ng-header">
                <span class="ng-icon">🎭</span>
                <div>
                    <h3>Generátor přezdívek</h3>
                    <p>Vytvoř si jedinečnou přezdívku pro hry, profily a sítě</p>
                </div>
            </div>

            <!-- Jméno (volitelné) -->
            <div class="ng-section">
                <label class="ng-label">👤 Tvé jméno (volitelné)</label>
                <input type="text" id="ng-name" class="ng-input" placeholder="Např. Jan, Petr, Eva">
                <div class="ng-hint">Pokud zadáš jméno, přizpůsobíme přezdívku</div>
            </div>

            <!-- Styl -->
            <div class="ng-section">
                <label class="ng-label">🎨 Styl</label>
                <div class="ng-styles">
                    <button data-style="cool" class="ng-style-btn active">😎 Cool</button>
                    <button data-style="cute" class="ng-style-btn">🥰 Roztomilý</button>
                    <button data-style="smart" class="ng-style-btn">🧠 Chytrý</button>
                    <button data-style="funny" class="ng-style-btn">😂 Vtipný</button>
                    <button data-style="random" class="ng-style-btn">🎲 Náhodný</button>
                </div>
            </div>

            <!-- Možnosti -->
            <div class="ng-section">
                <label class="ng-label">⚙️ Možnosti</label>
                <div class="ng-options">
                    <label class="ng-checkbox">
                        <input type="checkbox" id="ng-add-number" checked>
                        <span>🔢 Přidat číslo</span>
                    </label>
                    <label class="ng-checkbox">
                        <input type="checkbox" id="ng-capitalize">
                        <span>🔠 Velká písmena</span>
                    </label>
                    <label class="ng-checkbox">
                        <input type="checkbox" id="ng-leet">
                        <span>💻 Leet speak (1337)</span>
                    </label>
                </div>
            </div>

            <!-- Počet přezdívek -->
            <div class="ng-section">
                <label class="ng-label">🔢 Počet přezdívek</label>
                <div class="ng-count-control">
                    <button id="ng-count-minus" class="ng-count-btn">−</button>
                    <input type="number" id="ng-count" class="ng-count-input" value="5" min="1" max="20">
                    <button id="ng-count-plus" class="ng-count-btn">+</button>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="ng-buttons">
                <button id="ng-generate" class="ng-btn ng-btn-primary">✨ Generovat přezdívky</button>
                <button id="ng-clear" class="ng-btn ng-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="ng-result-section">
                <div class="ng-result-header">
                    <span>📋 Vygenerované přezdívky</span>
                    <button id="ng-copy" class="ng-small-btn">📋 Kopírovat vše</button>
                </div>
                <div id="ng-result" class="ng-result">
                    <div class="ng-empty">Klikni na "Generovat přezdívky"</div>
                </div>
            </div>

            <!-- Historie -->
            <details class="ng-details">
                <summary>📜 Historie</summary>
                <div id="ng-history" class="ng-history">
                    <div class="ng-empty-history">Zatím žádná historie</div>
                </div>
                <button id="ng-clear-history" class="ng-small-btn ng-clear-history">🗑️ Smazat historii</button>
            </details>

            <div class="ng-tip">
                💡 <strong>Tip:</strong> Můžeš si vybrat styl a přidat číslo pro jedinečnost. Skvělé pro hry, Discord, Twitch!
            </div>
        </div>
    `;

    let currentStyle = 'cool';
    let history = [];

    function loadHistory() {
        const saved = storage.get('nickHistory', []);
        history = saved;
        displayHistory();
    }

    function saveHistory() {
        storage.set('nickHistory', history.slice(0, 20));
    }

    function displayHistory() {
        const historyDiv = document.getElementById('ng-history');
        if (!historyDiv) return;
        
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="ng-empty-history">Zatím žádná historie</div>';
            return;
        }
        
        historyDiv.innerHTML = history.map(item => `
            <div class="ng-history-item">
                <span class="ng-history-nick">${escapeHtml(item.nickname)}</span>
                <span class="ng-history-time">${item.time}</span>
            </div>
        `).join('');
    }

    function addToHistory(nickname) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        history.unshift({ nickname, time: timeStr });
        if (history.length > 20) history = history.slice(0, 20);
        displayHistory();
        saveHistory();
    }

    function leetSpeak(text) {
        const leetMap = {
            'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7', 'b': '8', 'g': '9'
        };
        return text.toLowerCase().split('').map(c => leetMap[c] || c).join('');
    }

    function generateNickname(name) {
        let style = currentStyle;
        if (style === 'random') {
            const styles = ['cool', 'cute', 'smart', 'funny'];
            style = styles[Math.floor(Math.random() * styles.length)];
        }
        
        let nickname = '';
        
        if (name && name.trim()) {
            const cleanName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
            const prefix = prefixes[style][Math.floor(Math.random() * prefixes[style].length)];
            const suffix = suffixes[style][Math.floor(Math.random() * suffixes[style].length)];
            nickname = `${prefix}${cleanName}${suffix}`;
        } else {
            const prefix = prefixes[style][Math.floor(Math.random() * prefixes[style].length)];
            const suffix = suffixes[style][Math.floor(Math.random() * suffixes[style].length)];
            const animal = animals[Math.floor(Math.random() * animals.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const variants = [
                `${prefix}${suffix}`,
                `${color}${animal}`,
                `${prefix}${animal}`,
                `${color}${suffix}`
            ];
            nickname = variants[Math.floor(Math.random() * variants.length)];
        }
        
        // Přidání čísla
        if (document.getElementById('ng-add-number')?.checked) {
            const number = numbers[Math.floor(Math.random() * numbers.length)];
            nickname += number;
        }
        
        // Velká písmena
        if (document.getElementById('ng-capitalize')?.checked) {
            nickname = nickname.toUpperCase();
        }
        
        // Leet speak
        if (document.getElementById('ng-leet')?.checked) {
            nickname = leetSpeak(nickname);
        }
        
        return nickname;
    }

    function generateNicknames() {
        const name = document.getElementById('ng-name')?.value || '';
        const count = parseInt(document.getElementById('ng-count')?.value) || 5;
        
        const nicknames = [];
        for (let i = 0; i < count; i++) {
            nicknames.push(generateNickname(name));
        }
        
        const resultDiv = document.getElementById('ng-result');
        if (resultDiv) {
            resultDiv.innerHTML = nicknames.map((nick, idx) => `
                <div class="ng-result-item">
                    <span class="ng-result-number">${idx + 1}.</span>
                    <span class="ng-result-nick">${escapeHtml(nick)}</span>
                    <button class="ng-result-copy" data-nick="${escapeHtml(nick)}">📋</button>
                </div>
            `).join('');
        }
        
        // Uložení prvního do historie
        if (nicknames.length > 0) {
            addToHistory(nicknames[0]);
        }
        
        // Eventy pro kopírování
        document.querySelectorAll('.ng-result-copy').forEach(btn => {
            btn.addEventListener('click', async () => {
                const nick = btn.dataset.nick;
                await copyToClipboard(nick);
                showNotification(`Zkopírováno: ${nick}`);
            });
        });
        
        showNotification(`Vygenerováno ${nicknames.length} přezdívek`, 'success');
        saveSettings();
    }

    async function copyAll() {
        const nicks = Array.from(document.querySelectorAll('.ng-result-nick')).map(el => el.textContent);
        if (nicks.length === 0) {
            showNotification('Žádné přezdívky ke kopírování', 'warning');
            return;
        }
        await copyToClipboard(nicks.join('\n'));
        showNotification(`Zkopírováno ${nicks.length} přezdívek`);
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
        document.getElementById('ng-name').value = '';
        document.getElementById('ng-result').innerHTML = '<div class="ng-empty">Klikni na "Generovat přezdívky"</div>';
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Eventy
    document.querySelectorAll('.ng-style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ng-style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStyle = btn.dataset.style;
            saveSettings();
        });
    });
    
    document.getElementById('ng-generate')?.addEventListener('click', generateNicknames);
    document.getElementById('ng-clear')?.addEventListener('click', clearAll);
    document.getElementById('ng-copy')?.addEventListener('click', copyAll);
    document.getElementById('ng-clear-history')?.addEventListener('click', clearHistory);
    
    const countInput = document.getElementById('ng-count');
    const countMinus = document.getElementById('ng-count-minus');
    const countPlus = document.getElementById('ng-count-plus');
    
    countMinus?.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val > 1) countInput.value = val - 1;
    });
    countPlus?.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val < 20) countInput.value = val + 1;
    });
    
    function saveSettings() {
        storage.set('style', currentStyle);
        storage.set('addNumber', document.getElementById('ng-add-number')?.checked);
        storage.set('capitalize', document.getElementById('ng-capitalize')?.checked);
        storage.set('leet', document.getElementById('ng-leet')?.checked);
    }
    
    function loadSettings() {
        currentStyle = storage.get('style', 'cool');
        document.getElementById('ng-add-number').checked = storage.get('addNumber', true);
        document.getElementById('ng-capitalize').checked = storage.get('capitalize', false);
        document.getElementById('ng-leet').checked = storage.get('leet', false);
        
        document.querySelectorAll('.ng-style-btn').forEach(btn => {
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
    console.log('Nickname Generator se zavírá');
}
