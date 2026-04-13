import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('dice-roller');

export default function render(container) {
    container.innerHTML = `
        <div class="dice-roller">
            <div class="dr-header">
                <span class="dr-icon">🎲</span>
                <div>
                    <h3>Házení kostkou</h3>
                    <p>Klasická kostka nebo vlastní rozsah</p>
                </div>
            </div>

            <!-- Typ kostky -->
            <div class="dr-section">
                <label class="dr-label">🎲 Typ kostky</label>
                <div class="dr-dice-types">
                    <button data-sides="6" class="dr-dice-btn active">🎲 6</button>
                    <button data-sides="8" class="dr-dice-btn">🎲 8</button>
                    <button data-sides="10" class="dr-dice-btn">🎲 10</button>
                    <button data-sides="12" class="dr-dice-btn">🎲 12</button>
                    <button data-sides="20" class="dr-dice-btn">🎲 20</button>
                    <button data-sides="custom" class="dr-dice-btn">⚙️ Vlastní</button>
                </div>
            </div>

            <!-- Vlastní rozsah (skrytý) -->
            <div id="dr-custom-range" class="dr-section" style="display: none;">
                <label class="dr-label">⚙️ Vlastní rozsah</label>
                <div class="dr-custom">
                    <div class="dr-custom-input">
                        <span>Od:</span>
                        <input type="number" id="dr-min" class="dr-custom-num" value="1" min="1">
                    </div>
                    <div class="dr-custom-input">
                        <span>Do:</span>
                        <input type="number" id="dr-max" class="dr-custom-num" value="100" min="2">
                    </div>
                </div>
            </div>

            <!-- Počet hodů -->
            <div class="dr-section">
                <label class="dr-label">🔢 Počet hodů</label>
                <div class="dr-count-control">
                    <button id="dr-count-minus" class="dr-count-btn">−</button>
                    <input type="number" id="dr-count" class="dr-count-input" value="1" min="1" max="20" step="1">
                    <button id="dr-count-plus" class="dr-count-btn">+</button>
                </div>
                <div class="dr-hint">Až 20 hodů najednou</div>
            </div>

            <!-- Tlačítko Házet -->
            <button id="dr-roll" class="dr-roll-btn">🎲 Házet kostkou</button>

            <!-- Animace kostky -->
            <div id="dr-animation" class="dr-animation">
                <div class="dr-dice" id="dr-dice">🎲</div>
            </div>

            <!-- Výsledky -->
            <div class="dr-results-section">
                <div class="dr-results-header">
                    <span>📊 Výsledky hodů</span>
                    <button id="dr-copy" class="dr-small-btn">📋 Kopírovat</button>
                    <button id="dr-clear" class="dr-small-btn">🗑️ Vyčistit</button>
                </div>
                <div id="dr-results" class="dr-results">
                    <div class="dr-empty">Klikni na "Házet kostkou"</div>
                </div>
            </div>

            <!-- Statistiky -->
            <div class="dr-stats">
                <div class="dr-stat-card">
                    <div class="dr-stat-value" id="dr-total-rolls">0</div>
                    <div class="dr-stat-label">celkem hodů</div>
                </div>
                <div class="dr-stat-card">
                    <div class="dr-stat-value" id="dr-average">0</div>
                    <div class="dr-stat-label">průměr</div>
                </div>
                <div class="dr-stat-card">
                    <div class="dr-stat-value" id="dr-highest">0</div>
                    <div class="dr-stat-label">nejvyšší</div>
                </div>
                <div class="dr-stat-card">
                    <div class="dr-stat-value" id="dr-lowest">0</div>
                    <div class="dr-stat-label">nejnižší</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="dr-tip">
                💡 <strong>Tip:</strong> Můžeš házet více kostkami najednou (až 20). Výsledky se ukládají do historie.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const diceBtns = document.querySelectorAll('.dr-dice-btn');
    const customRangeDiv = document.getElementById('dr-custom-range');
    const minInput = document.getElementById('dr-min');
    const maxInput = document.getElementById('dr-max');
    const countInput = document.getElementById('dr-count');
    const countMinus = document.getElementById('dr-count-minus');
    const countPlus = document.getElementById('dr-count-plus');
    const rollBtn = document.getElementById('dr-roll');
    const copyBtn = document.getElementById('dr-copy');
    const clearBtn = document.getElementById('dr-clear');
    const resultsDiv = document.getElementById('dr-results');
    const diceDiv = document.getElementById('dr-dice');
    const totalRollsSpan = document.getElementById('dr-total-rolls');
    const averageSpan = document.getElementById('dr-average');
    const highestSpan = document.getElementById('dr-highest');
    const lowestSpan = document.getElementById('dr-lowest');

    let currentSides = 6;
    let rollHistory = [];
    let isRolling = false;

    // Nastavení typu kostky
    diceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            diceBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const sides = btn.dataset.sides;
            if (sides === 'custom') {
                customRangeDiv.style.display = 'block';
                currentSides = 'custom';
            } else {
                customRangeDiv.style.display = 'none';
                currentSides = parseInt(sides);
            }
            saveSettings();
        });
    });

    // Počítadlo
    countMinus.addEventListener('click', () => {
        let val = parseInt(countInput.value) || 1;
        if (val > 1) countInput.value = val - 1;
        saveSettings();
    });

    countPlus.addEventListener('click', () => {
        let val = parseInt(countInput.value) || 1;
        if (val < 20) countInput.value = val + 1;
        saveSettings();
    });

    countInput.addEventListener('change', () => {
        let val = parseInt(countInput.value);
        if (val < 1) countInput.value = 1;
        if (val > 20) countInput.value = 20;
        saveSettings();
    });

    // Animace kostky
    function animateDice(finalValue) {
        return new Promise((resolve) => {
            let rolls = 0;
            const maxRolls = 10;
            const interval = setInterval(() => {
                const randomValue = Math.floor(Math.random() * 6) + 1;
                const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                diceDiv.textContent = diceFaces[randomValue - 1];
                rolls++;
                if (rolls >= maxRolls) {
                    clearInterval(interval);
                    const diceFacesFinal = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                    diceDiv.textContent = diceFacesFinal[finalValue - 1] || '🎲';
                    resolve();
                }
            }, 50);
        });
    }

    // Generování náhodného čísla
    function getRandomNumber() {
        if (currentSides === 'custom') {
            const min = parseInt(minInput.value) || 1;
            const max = parseInt(maxInput.value) || 100;
            if (min >= max) {
                showNotification('Min musí být menší než Max', 'warning');
                return null;
            }
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return Math.floor(Math.random() * currentSides) + 1;
    }

    // Hlavní funkce hodu
    async function rollDice() {
        if (isRolling) return;
        
        const count = parseInt(countInput.value) || 1;
        const results = [];
        
        isRolling = true;
        rollBtn.disabled = true;
        rollBtn.textContent = '🎲 Házím...';
        
        for (let i = 0; i < count; i++) {
            const value = getRandomNumber();
            if (value === null) {
                isRolling = false;
                rollBtn.disabled = false;
                rollBtn.textContent = '🎲 Házet kostkou';
                return;
            }
            results.push(value);
            
            if (count === 1) {
                await animateDice(value);
            }
        }
        
        if (count > 1) {
            // Pro více hodů jednoduchá animace
            for (let i = 0; i < 5; i++) {
                const randomVal = Math.floor(Math.random() * currentSides) + 1;
                const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                diceDiv.textContent = diceFaces[randomVal - 1] || '🎲';
                await new Promise(r => setTimeout(r, 50));
            }
            const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            diceDiv.textContent = diceFaces[results[0] - 1] || '🎲';
        }
        
        // Přidání do historie
        rollHistory.unshift(...results);
        if (rollHistory.length > 50) rollHistory = rollHistory.slice(0, 50);
        
        updateResults(results);
        updateStatistics();
        
        isRolling = false;
        rollBtn.disabled = false;
        rollBtn.textContent = '🎲 Házet kostkou';
        
        saveSettings();
    }

    // Aktualizace zobrazení výsledků
    function updateResults(newRolls) {
        if (rollHistory.length === 0) {
            resultsDiv.innerHTML = '<div class="dr-empty">Klikni na "Házet kostkou"</div>';
            return;
        }
        
        resultsDiv.innerHTML = rollHistory.map((value, index) => {
            const isNew = index < newRolls.length;
            return `
                <div class="dr-result-item ${isNew ? 'dr-new' : ''}">
                    <span class="dr-result-num">#${rollHistory.length - index}</span>
                    <span class="dr-result-value">${value}</span>
                    <span class="dr-result-date">${new Date().toLocaleTimeString()}</span>
                </div>
            `;
        }).join('');
        
        // Automatický scroll na začátek
        resultsDiv.scrollTop = 0;
    }

    // Aktualizace statistik
    function updateStatistics() {
        const total = rollHistory.length;
        const sum = rollHistory.reduce((a, b) => a + b, 0);
        const average = total > 0 ? (sum / total).toFixed(2) : 0;
        const highest = total > 0 ? Math.max(...rollHistory) : 0;
        const lowest = total > 0 ? Math.min(...rollHistory) : 0;
        
        totalRollsSpan.textContent = total;
        averageSpan.textContent = average;
        highestSpan.textContent = highest;
        lowestSpan.textContent = lowest;
    }

    // Kopírování výsledků
    async function copyResults() {
        if (rollHistory.length === 0) {
            showNotification('Žádné výsledky ke kopírování', 'warning');
            return;
        }
        
        const text = rollHistory.map((v, i) => `${i + 1}. ${v}`).join('\n');
        await copyToClipboard(text);
        showNotification(`Zkopírováno ${rollHistory.length} výsledků`);
    }

    // Vyčištění historie
    function clearHistory() {
        if (rollHistory.length > 0) {
            rollHistory = [];
            updateResults([]);
            updateStatistics();
            showNotification('Historie vyčištěna');
            saveSettings();
        }
    }

    // Eventy
    rollBtn.addEventListener('click', rollDice);
    copyBtn.addEventListener('click', copyResults);
    clearBtn.addEventListener('click', clearHistory);
    
    minInput.addEventListener('change', () => {
        if (currentSides === 'custom') saveSettings();
    });
    maxInput.addEventListener('change', () => {
        if (currentSides === 'custom') saveSettings();
    });

    // Ukládání/načítání
    function saveSettings() {
        storage.set('diceType', currentSides === 'custom' ? 'custom' : currentSides);
        storage.set('customMin', minInput.value);
        storage.set('customMax', maxInput.value);
        storage.set('rollCount', countInput.value);
        storage.set('history', rollHistory);
    }

    function loadSettings() {
        const savedType = storage.get('diceType', 6);
        const savedMin = storage.get('customMin', 1);
        const savedMax = storage.get('customMax', 100);
        const savedCount = storage.get('rollCount', 1);
        const savedHistory = storage.get('history', []);
        
        countInput.value = savedCount;
        minInput.value = savedMin;
        maxInput.value = savedMax;
        
        if (savedHistory.length) {
            rollHistory = savedHistory;
            updateResults([]);
            updateStatistics();
        }
        
        // Nastavení aktivního typu kostky
        let found = false;
        diceBtns.forEach(btn => {
            const sides = btn.dataset.sides;
            if ((sides === 'custom' && savedType === 'custom') || parseInt(sides) === savedType) {
                btn.click();
                found = true;
            }
        });
        if (!found) {
            document.querySelector('[data-sides="6"]').click();
        }
    }

    loadSettings();
}

export function cleanup() {
    console.log('Dice Roller se zavírá');
}