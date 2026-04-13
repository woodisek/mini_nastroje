import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('random-picker');

export default function render(container) {
    container.innerHTML = `
        <div class="random-picker">
            <div class="rp-header">
                <span class="rp-icon">🎲</span>
                <div>
                    <h3>Náhodný výběr ze seznamu</h3>
                    <p>Losuj, vybírej vítěze nebo náhodné položky</p>
                </div>
            </div>

            <!-- Vstupní seznam -->
            <div class="rp-section">
                <label class="rp-label">📝 Seznam položek (jedna na řádek)</label>
                <textarea id="rp-list" class="rp-textarea" rows="6" placeholder="Např.:&#10;Jirka&#10;Pavel&#10;Honza&#10;Petr&#10;Martin"></textarea>
                <div class="rp-hint">Každá položka na samostatném řádku</div>
            </div>

            <!-- Počet výběrů -->
            <div class="rp-section">
                <label class="rp-label">🔢 Počet položek k výběru</label>
                <div class="rp-count-control">
                    <button id="rp-count-minus" class="rp-count-btn">−</button>
                    <input type="number" id="rp-count" class="rp-count-input" value="1" min="1" max="100" step="1">
                    <button id="rp-count-plus" class="rp-count-btn">+</button>
                </div>
            </div>

            <!-- Možnosti -->
            <div class="rp-section">
                <label class="rp-label">⚙️ Možnosti</label>
                <div class="rp-options">
                    <label class="rp-checkbox">
                        <input type="checkbox" id="rp-unique">
                        <span>🔄 Unikátní výběr (bez opakování)</span>
                    </label>
                    <label class="rp-checkbox">
                        <input type="checkbox" id="rp-sort">
                        <span>📊 Seřadit výsledky</span>
                    </label>
                    <label class="rp-checkbox">
                        <input type="checkbox" id="rp-ignore-empty">
                        <span>🗑️ Ignorovat prázdné řádky</span>
                    </label>
                    <label class="rp-checkbox">
                        <input type="checkbox" id="rp-trim">
                        <span>✂️ Oříznout mezery</span>
                    </label>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="rp-buttons">
                <button id="rp-pick" class="rp-btn rp-btn-primary">🎲 Vybrat</button>
                <button id="rp-clear-list" class="rp-btn rp-btn-secondary">🗑️ Vyčistit seznam</button>
            </div>

            <!-- Výsledek -->
            <div class="rp-result-section">
                <div class="rp-result-header">
                    <span>📊 Výsledek výběru</span>
                    <button id="rp-copy" class="rp-small-btn">📋 Kopírovat</button>
                    <button id="rp-clear-result" class="rp-small-btn">🗑️ Vyčistit</button>
                </div>
                <div id="rp-result" class="rp-result">
                    <div class="rp-empty">Klikni na "Vybrat" pro losování</div>
                </div>
            </div>

            <!-- Statistiky -->
            <div class="rp-stats">
                <div class="rp-stat-card">
                    <div class="rp-stat-value" id="rp-total-items">0</div>
                    <div class="rp-stat-label">položek v seznamu</div>
                </div>
                <div class="rp-stat-card">
                    <div class="rp-stat-value" id="rp-selected-count">0</div>
                    <div class="rp-stat-label">vybraných položek</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="rp-tip">
                💡 <strong>Tip:</strong> Můžeš losovat vítěze soutěže, vybírat náhodné úkoly nebo generovat náhodné kombinace. Zaškrtni "Unikátní výběr" pro vyloučení opakování.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const listTextarea = document.getElementById('rp-list');
    const countInput = document.getElementById('rp-count');
    const countMinus = document.getElementById('rp-count-minus');
    const countPlus = document.getElementById('rp-count-plus');
    const uniqueCheck = document.getElementById('rp-unique');
    const sortCheck = document.getElementById('rp-sort');
    const ignoreEmptyCheck = document.getElementById('rp-ignore-empty');
    const trimCheck = document.getElementById('rp-trim');
    const pickBtn = document.getElementById('rp-pick');
    const clearListBtn = document.getElementById('rp-clear-list');
    const copyBtn = document.getElementById('rp-copy');
    const clearResultBtn = document.getElementById('rp-clear-result');
    const resultDiv = document.getElementById('rp-result');
    const totalItemsSpan = document.getElementById('rp-total-items');
    const selectedCountSpan = document.getElementById('rp-selected-count');

    let currentItems = [];
    let currentSelection = [];

    // Zpracování seznamu
    function processList() {
        let items = listTextarea.value.split(/\r?\n/);
        
        if (trimCheck.checked) {
            items = items.map(item => item.trim());
        }
        
        if (ignoreEmptyCheck.checked) {
            items = items.filter(item => item.length > 0);
        }
        
        // Odstranění duplicit pro zobrazení (ne pro výběr)
        const uniqueItems = [...new Map(items.map(item => [item, item])).values()];
        currentItems = uniqueItems;
        
        totalItemsSpan.textContent = currentItems.length;
        
        return currentItems;
    }

    // Počítadlo
    countMinus.addEventListener('click', () => {
        let val = parseInt(countInput.value) || 1;
        if (val > 1) countInput.value = val - 1;
        saveSettings();
    });

    countPlus.addEventListener('click', () => {
        let val = parseInt(countInput.value) || 1;
        if (val < 100) countInput.value = val + 1;
        saveSettings();
    });

    // Hlavní funkce pro výběr
    function pickRandom() {
        const items = processList();
        let count = parseInt(countInput.value) || 1;
        const unique = uniqueCheck.checked;
        
        if (items.length === 0) {
            showNotification('Seznam je prázdný. Přidej nějaké položky.', 'warning');
            return;
        }
        
        if (unique && count > items.length) {
            count = items.length;
            countInput.value = count;
            showNotification(`Maximální počet unikátních položek je ${items.length}`, 'warning');
        }
        
        const selected = [];
        const available = [...items];
        
        for (let i = 0; i < count; i++) {
            if (unique && available.length === 0) break;
            
            let randomIndex;
            if (unique) {
                randomIndex = Math.floor(Math.random() * available.length);
                selected.push(available[randomIndex]);
                available.splice(randomIndex, 1);
            } else {
                randomIndex = Math.floor(Math.random() * items.length);
                selected.push(items[randomIndex]);
            }
        }
        
        currentSelection = selected;
        selectedCountSpan.textContent = currentSelection.length;
        
        if (sortCheck.checked) {
            currentSelection.sort();
        }
        
        // Zobrazení výsledků
        if (currentSelection.length === 0) {
            resultDiv.innerHTML = '<div class="rp-empty">Žádné položky nebyly vybrány</div>';
            return;
        }
        
        if (currentSelection.length === 1) {
            resultDiv.innerHTML = `
                <div class="rp-winner-card">
                    <div class="rp-winner-icon">🏆</div>
                    <div class="rp-winner-text">${escapeHtml(currentSelection[0])}</div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = currentSelection.map((item, index) => `
                <div class="rp-selected-item">
                    <span class="rp-selected-num">${index + 1}.</span>
                    <span class="rp-selected-text">${escapeHtml(item)}</span>
                </div>
            `).join('');
        }
        
        showNotification(`Vybráno ${currentSelection.length} položek`, 'success');
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function copyResult() {
        if (currentSelection.length === 0) {
            showNotification('Žádné položky ke kopírování', 'warning');
            return;
        }
        
        const text = currentSelection.join('\n');
        await copyToClipboard(text);
        showNotification(`Zkopírováno ${currentSelection.length} položek`);
    }

    function clearList() {
        listTextarea.value = '';
        processList();
        showNotification('Seznam vyčištěn');
        saveSettings();
    }

    function clearResult() {
        currentSelection = [];
        selectedCountSpan.textContent = '0';
        resultDiv.innerHTML = '<div class="rp-empty">Klikni na "Vybrat" pro losování</div>';
        showNotification('Výsledek vyčištěn');
    }

    // Eventy
    pickBtn.addEventListener('click', pickRandom);
    clearListBtn.addEventListener('click', clearList);
    copyBtn.addEventListener('click', copyResult);
    clearResultBtn.addEventListener('click', clearResult);
    
    listTextarea.addEventListener('input', () => {
        processList();
        saveSettings();
    });
    
    countInput.addEventListener('input', () => {
        let val = parseInt(countInput.value);
        if (val > 100) countInput.value = 100;
        if (val < 1) countInput.value = 1;
        saveSettings();
    });
    
    uniqueCheck.addEventListener('change', () => {
        saveSettings();
    });
    
    sortCheck.addEventListener('change', () => {
        if (currentSelection.length > 0) {
            pickRandom();
        }
        saveSettings();
    });
    
    ignoreEmptyCheck.addEventListener('change', () => {
        processList();
        saveSettings();
    });
    
    trimCheck.addEventListener('change', () => {
        processList();
        saveSettings();
    });

    // Ukládání/načítání
    function saveSettings() {
        storage.set('list', listTextarea.value);
        storage.set('count', countInput.value);
        storage.set('unique', uniqueCheck.checked);
        storage.set('sort', sortCheck.checked);
        storage.set('ignoreEmpty', ignoreEmptyCheck.checked);
        storage.set('trim', trimCheck.checked);
    }

    function loadSettings() {
        const savedList = storage.get('list', '');
        listTextarea.value = savedList;
        countInput.value = storage.get('count', 1);
        uniqueCheck.checked = storage.get('unique', false);
        sortCheck.checked = storage.get('sort', false);
        ignoreEmptyCheck.checked = storage.get('ignoreEmpty', true);
        trimCheck.checked = storage.get('trim', true);
        
        processList();
    }

    loadSettings();
}

export function cleanup() {
    console.log('Random Picker se zavírá');
}