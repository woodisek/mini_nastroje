import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('cooking-calculator');

export default function render(container) {
    container.innerHTML = `
        <div class="cooking-calculator">
            <div class="cc-header">
                <span class="cc-icon">🍳</span>
                <div>
                    <h3>Kalkulačka vaření</h3>
                    <p>Přepočet surovin podle počtu porcí</p>
                </div>
            </div>

            <!-- Počet porcí -->
            <div class="cc-section">
                <label class="cc-label">👥 Počet porcí (základ)</label>
                <div class="cc-count-control">
                    <button id="cc-base-minus" class="cc-count-btn">−</button>
                    <input type="number" id="cc-base-portions" class="cc-count-input" value="4" min="1" max="50" step="1">
                    <button id="cc-base-plus" class="cc-count-btn">+</button>
                </div>
                <div class="cc-hint">Pro kolik porcí je recept napsán?</div>
            </div>

            <div class="cc-section">
                <label class="cc-label">👥 Požadovaný počet porcí</label>
                <div class="cc-count-control">
                    <button id="cc-target-minus" class="cc-count-btn">−</button>
                    <input type="number" id="cc-target-portions" class="cc-count-input" value="2" min="1" max="50" step="1">
                    <button id="cc-target-plus" class="cc-count-btn">+</button>
                </div>
                <div class="cc-hint">Kolik porcí chceš uvařit?</div>
            </div>

            <!-- Seznam surovin -->
            <div class="cc-section">
                <div class="cc-ingredients-header">
                    <label class="cc-label">📝 Seznam surovin</label>
                    <div class="cc-ingredients-actions">
                        <button id="cc-add-ingredient" class="cc-small-btn">➕ Přidat surovinu</button>
                        <button id="cc-clear-ingredients" class="cc-small-btn">🗑️ Smazat vše</button>
                    </div>
                </div>
                <div id="cc-ingredients-list" class="cc-ingredients-list">
                    <div class="cc-empty-ingredients">Přidej suroviny pro tvůj recept</div>
                </div>
                <div class="cc-hint">💡 Každá surovina má název, množství a jednotku</div>
            </div>

            <!-- Tlačítka -->
            <div class="cc-buttons">
                <button id="cc-calculate" class="cc-btn cc-btn-primary">🔄 Přepočítat suroviny</button>
                <button id="cc-clear" class="cc-btn cc-btn-secondary">🗑️ Vyčistit vše</button>
            </div>

            <!-- Výsledek -->
            <div class="cc-result-section">
                <div class="cc-result-header">
                    <span>📊 Přepočtené suroviny (pro ${storage.get('targetPortions', 2)} porcí)</span>
                    <button id="cc-copy" class="cc-small-btn">📋 Kopírovat</button>
                    <button id="cc-clear-result" class="cc-small-btn">🗑️ Smazat výsledky</button>
                </div>
                <div id="cc-result" class="cc-result">
                    <div class="cc-empty">Přidej suroviny a klikni na "Přepočítat suroviny"</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="cc-tip">
                💡 <strong>Tip:</strong> Přidávej suroviny jednu po druhé. Po přepočtu uvidíš přesné množství pro požadovaný počet porcí.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const basePortionsInput = document.getElementById('cc-base-portions');
    const baseMinus = document.getElementById('cc-base-minus');
    const basePlus = document.getElementById('cc-base-plus');
    const targetPortionsInput = document.getElementById('cc-target-portions');
    const targetMinus = document.getElementById('cc-target-minus');
    const targetPlus = document.getElementById('cc-target-plus');
    const ingredientsList = document.getElementById('cc-ingredients-list');
    const addIngredientBtn = document.getElementById('cc-add-ingredient');
    const clearIngredientsBtn = document.getElementById('cc-clear-ingredients');
    const calculateBtn = document.getElementById('cc-calculate');
    const clearBtn = document.getElementById('cc-clear');
    const copyBtn = document.getElementById('cc-copy');
    const clearResultBtn = document.getElementById('cc-clear-result');
    const resultDiv = document.getElementById('cc-result');
    const resultHeaderSpan = document.querySelector('.cc-result-header span');

    let ingredients = [];
    let currentResult = [];

    // Načtení uložených surovin
    function loadIngredients() {
        const saved = storage.get('ingredients', []);
        if (saved.length > 0) {
            ingredients = saved;
            renderIngredientsList();
        }
    }

    function saveIngredients() {
        storage.set('ingredients', ingredients);
    }

    function renderIngredientsList() {
        if (ingredients.length === 0) {
            ingredientsList.innerHTML = '<div class="cc-empty-ingredients">Přidej suroviny pro tvůj recept</div>';
            return;
        }
        
        ingredientsList.innerHTML = ingredients.map((ing, index) => `
            <div class="cc-ingredient-item" data-index="${index}">
                <input type="text" class="cc-ingredient-name" value="${escapeHtml(ing.name)}" placeholder="Název suroviny">
                <input type="number" class="cc-ingredient-amount" value="${ing.amount}" step="any" placeholder="Množství">
                <input type="text" class="cc-ingredient-unit" value="${escapeHtml(ing.unit)}" placeholder="Jednotka (g, ks, lžíce)">
                <button class="cc-ingredient-delete" data-index="${index}">🗑️</button>
            </div>
        `).join('');
        
        // Eventy pro editaci
        document.querySelectorAll('.cc-ingredient-name').forEach((input, idx) => {
            input.addEventListener('change', (e) => {
                ingredients[idx].name = e.target.value;
                saveIngredients();
            });
        });
        
        document.querySelectorAll('.cc-ingredient-amount').forEach((input, idx) => {
            input.addEventListener('change', (e) => {
                ingredients[idx].amount = parseFloat(e.target.value) || 0;
                saveIngredients();
            });
        });
        
        document.querySelectorAll('.cc-ingredient-unit').forEach((input, idx) => {
            input.addEventListener('change', (e) => {
                ingredients[idx].unit = e.target.value;
                saveIngredients();
            });
        });
        
        document.querySelectorAll('.cc-ingredient-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                ingredients.splice(index, 1);
                renderIngredientsList();
                saveIngredients();
                showNotification('Surovina smazána');
            });
        });
    }

    function addIngredient() {
        ingredients.push({
            name: 'Nová surovina',
            amount: 100,
            unit: 'g'
        });
        renderIngredientsList();
        saveIngredients();
        showNotification('Nová surovina přidána');
    }

    function clearIngredients() {
        if (ingredients.length > 0 && confirm('Opravdu chceš smazat všechny suroviny?')) {
            ingredients = [];
            renderIngredientsList();
            saveIngredients();
            showNotification('Všechny suroviny smazány');
        }
    }

    function calculatePortions() {
        const basePortions = parseInt(basePortionsInput.value) || 1;
        const targetPortions = parseInt(targetPortionsInput.value) || 1;
        
        if (basePortions <= 0 || targetPortions <= 0) {
            showNotification('Zadej platný počet porcí', 'warning');
            return;
        }
        
        if (ingredients.length === 0) {
            showNotification('Přidej nejprve suroviny', 'warning');
            return;
        }
        
        const ratio = targetPortions / basePortions;
        
        currentResult = ingredients.map(ing => ({
            name: ing.name,
            amount: ing.amount * ratio,
            unit: ing.unit,
            originalAmount: ing.amount
        }));
        
        resultHeaderSpan.textContent = `📊 Přepočtené suroviny (pro ${targetPortions} porcí)`;
        
        resultDiv.innerHTML = currentResult.map(res => `
            <div class="cc-result-item">
                <span class="cc-result-name">${escapeHtml(res.name)}</span>
                <span class="cc-result-amount">${formatAmount(res.amount)} ${escapeHtml(res.unit)}</span>
                <span class="cc-result-original">(původně: ${formatAmount(res.originalAmount)} ${escapeHtml(res.unit)})</span>
            </div>
        `).join('');
        
        showNotification(`Přepočteno z ${basePortions} na ${targetPortions} porcí`, 'success');
        saveSettings();
    }

    function formatAmount(amount) {
        // Zaokrouhlení na 1 desetinné místo
        return Math.round(amount * 10) / 10;
    }

    async function copyResult() {
        if (currentResult.length === 0) {
            showNotification('Žádné výsledky ke kopírování', 'warning');
            return;
        }
        
        const targetPortions = targetPortionsInput.value;
        let text = `📋 Suroviny pro ${targetPortions} porcí:\n`;
        text += '─'.repeat(40) + '\n';
        
        currentResult.forEach(res => {
            text += `${res.name}: ${formatAmount(res.amount)} ${res.unit}`;
            if (res.originalAmount !== res.amount) {
                text += ` (původně ${formatAmount(res.originalAmount)} ${res.unit})`;
            }
            text += '\n';
        });
        
        await copyToClipboard(text);
        showNotification('Seznam surovin zkopírován');
    }

    function clearResult() {
        currentResult = [];
        resultDiv.innerHTML = '<div class="cc-empty">Přidej suroviny a klikni na "Přepočítat suroviny"</div>';
        showNotification('Výsledky smazány');
    }

    function clearAll() {
        basePortionsInput.value = '4';
        targetPortionsInput.value = '2';
        ingredients = [];
        currentResult = [];
        renderIngredientsList();
        clearResult();
        saveIngredients();
        saveSettings();
        showNotification('Vše vyčištěno');
    }

    // Eventy
    baseMinus.addEventListener('click', () => {
        let val = parseInt(basePortionsInput.value);
        if (val > 1) basePortionsInput.value = val - 1;
        saveSettings();
    });
    
    basePlus.addEventListener('click', () => {
        let val = parseInt(basePortionsInput.value);
        if (val < 50) basePortionsInput.value = val + 1;
        saveSettings();
    });
    
    targetMinus.addEventListener('click', () => {
        let val = parseInt(targetPortionsInput.value);
        if (val > 1) targetPortionsInput.value = val - 1;
        saveSettings();
    });
    
    targetPlus.addEventListener('click', () => {
        let val = parseInt(targetPortionsInput.value);
        if (val < 50) targetPortionsInput.value = val + 1;
        saveSettings();
    });
    
    addIngredientBtn.addEventListener('click', addIngredient);
    clearIngredientsBtn.addEventListener('click', clearIngredients);
    calculateBtn.addEventListener('click', calculatePortions);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    clearResultBtn.addEventListener('click', clearResult);
    
    basePortionsInput.addEventListener('change', saveSettings);
    targetPortionsInput.addEventListener('change', saveSettings);
    
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    function saveSettings() {
        storage.set('basePortions', basePortionsInput.value);
        storage.set('targetPortions', targetPortionsInput.value);
    }
    
    function loadSettings() {
        basePortionsInput.value = storage.get('basePortions', '4');
        targetPortionsInput.value = storage.get('targetPortions', '2');
    }
    
    loadIngredients();
    loadSettings();
}

export function cleanup() {
    console.log('Cooking Calculator se zavírá');
}