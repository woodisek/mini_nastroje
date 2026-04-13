import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('bill-splitter');

export default function render(container) {
    container.innerHTML = `
        <div class="bill-splitter">
            <div class="bs-header">
                <span class="bs-icon">💰</span>
                <div>
                    <h3>Rozdělení účtu</h3>
                    <p>Spravedlivě rozděl útratu mezi přátele</p>
                </div>
            </div>

            <!-- Celková částka -->
            <div class="bs-section">
                <label class="bs-label">💰 Celková částka</label>
                <div class="bs-input-group">
                    <input type="number" id="bs-total" class="bs-input" value="1000" step="any">
                    <select id="bs-currency" class="bs-select-small">
                        <option value="czk">Kč</option>
                        <option value="eur">€</option>
                        <option value="usd">$</option>
                        <option value="gbp">£</option>
                    </select>
                </div>
            </div>

            <!-- Počet lidí -->
            <div class="bs-section">
                <label class="bs-label">👥 Počet lidí</label>
                <div class="bs-count-control">
                    <button id="bs-count-minus" class="bs-count-btn">−</button>
                    <input type="number" id="bs-count" class="bs-count-input" value="2" min="1" max="20" step="1">
                    <button id="bs-count-plus" class="bs-count-btn">+</button>
                </div>
            </div>

            <!-- Spropitné -->
            <div class="bs-section">
                <label class="bs-label">💝 Spropitné</label>
                <div class="bs-tip-buttons">
                    <button data-tip="0" class="bs-tip-btn">0%</button>
                    <button data-tip="5" class="bs-tip-btn">5%</button>
                    <button data-tip="10" class="bs-tip-btn">10%</button>
                    <button data-tip="15" class="bs-tip-btn active">15%</button>
                    <button data-tip="20" class="bs-tip-btn">20%</button>
                    <button data-tip="custom" class="bs-tip-btn">⚙️ Vlastní</button>
                </div>
                <div id="bs-custom-tip" class="bs-custom-tip" style="display: none;">
                    <input type="number" id="bs-custom-tip-value" class="bs-input-small" placeholder="Vlastní %" step="any">
                    <span>%</span>
                </div>
            </div>

            <!-- Možnosti -->
            <div class="bs-section">
                <label class="bs-label">⚙️ Možnosti</label>
                <div class="bs-options">
                    <label class="bs-checkbox">
                        <input type="checkbox" id="bs-include-self">
                        <span>👤 Zahrnout mě do rozdělení</span>
                    </label>
                    <label class="bs-checkbox">
                        <input type="checkbox" id="bs-round">
                        <span>🔄 Zaokrouhlit na celé číslo</span>
                    </label>
                </div>
            </div>

            <!-- Jména (volitelné) -->
            <details class="bs-details">
                <summary>✏️ Vlastní jména (volitelné)</summary>
                <div id="bs-names-container" class="bs-names-container">
                    <div class="bs-hint">Zadej jména pro každého člověka</div>
                </div>
            </details>

            <!-- Tlačítka -->
            <div class="bs-buttons">
                <button id="bs-calculate" class="bs-btn bs-btn-primary">🧮 Rozdělit účet</button>
                <button id="bs-clear" class="bs-btn bs-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledky -->
            <div class="bs-results-section">
                <div class="bs-results-header">
                    <span>📊 Rozdělení účtu</span>
                    <button id="bs-copy" class="bs-small-btn">📋 Kopírovat</button>
                </div>
                <div id="bs-results" class="bs-results">
                    <div class="bs-empty">Vyplň údaje a klikni na "Rozdělit účet"</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="bs-tip">
                💡 <strong>Tip:</strong> Můžeš přidat vlastní jména pro lepší přehlednost. Spropitné se počítá z celkové částky před rozdělením.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const totalInput = document.getElementById('bs-total');
    const currencySelect = document.getElementById('bs-currency');
    const countInput = document.getElementById('bs-count');
    const countMinus = document.getElementById('bs-count-minus');
    const countPlus = document.getElementById('bs-count-plus');
    const tipBtns = document.querySelectorAll('.bs-tip-btn');
    const customTipDiv = document.getElementById('bs-custom-tip');
    const customTipInput = document.getElementById('bs-custom-tip-value');
    const includeSelfCheck = document.getElementById('bs-include-self');
    const roundCheck = document.getElementById('bs-round');
    const calculateBtn = document.getElementById('bs-calculate');
    const clearBtn = document.getElementById('bs-clear');
    const copyBtn = document.getElementById('bs-copy');
    const resultsDiv = document.getElementById('bs-results');
    const namesContainer = document.getElementById('bs-names-container');

    let currentTip = 15;
    let names = [];

    // Počítadlo lidí
    countMinus.addEventListener('click', () => {
        let val = parseInt(countInput.value) || 1;
        if (val > 1) countInput.value = val - 1;
        updateNamesInputs();
        saveSettings();
    });

    countPlus.addEventListener('click', () => {
        let val = parseInt(countInput.value) || 1;
        if (val < 20) countInput.value = val + 1;
        updateNamesInputs();
        saveSettings();
    });

    countInput.addEventListener('change', () => {
        let val = parseInt(countInput.value);
        if (val < 1) countInput.value = 1;
        if (val > 20) countInput.value = 20;
        updateNamesInputs();
        saveSettings();
    });

    // Spropitné
    tipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tipBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tipValue = btn.dataset.tip;
            if (tipValue === 'custom') {
                customTipDiv.style.display = 'flex';
                currentTip = parseFloat(customTipInput.value) || 0;
            } else {
                customTipDiv.style.display = 'none';
                currentTip = parseInt(tipValue);
            }
            saveSettings();
        });
    });

    customTipInput.addEventListener('input', () => {
        currentTip = parseFloat(customTipInput.value) || 0;
        saveSettings();
    });

    // Aktualizace jmen
    function updateNamesInputs() {
        const count = parseInt(countInput.value) || 1;
        const includeSelf = includeSelfCheck.checked;
        const displayCount = includeSelf ? count : count - 1;
        
        namesContainer.innerHTML = '<div class="bs-hint">Zadej jména pro každého člověka</div>';
        
        for (let i = 0; i < count; i++) {
            const nameWrapper = document.createElement('div');
            nameWrapper.className = 'bs-name-wrapper';
            nameWrapper.innerHTML = `
                <label>${includeSelf && i === 0 ? '👤 Já:' : `👤 Člověk ${i + 1}:`}</label>
                <input type="text" id="bs-name-${i}" class="bs-name-input" placeholder="Např. ${getDefaultName(i, includeSelf)}" value="${names[i] || ''}">
            `;
            namesContainer.appendChild(nameWrapper);
        }
    }

    function getDefaultName(index, includeSelf) {
        if (includeSelf && index === 0) return 'Já';
        const defaultNames = ['Honza', 'Petra', 'Martin', 'Eva', 'Tomáš', 'Lucie', 'David', 'Anna'];
        return defaultNames[index % defaultNames.length];
    }

    // Uložení jmen
    function saveNames() {
        const count = parseInt(countInput.value) || 1;
        names = [];
        for (let i = 0; i < count; i++) {
            const input = document.getElementById(`bs-name-${i}`);
            if (input) names[i] = input.value;
        }
    }

    // Hlavní výpočet
    function calculate() {
        let total = parseFloat(totalInput.value) || 0;
        let count = parseInt(countInput.value) || 1;
        const includeSelf = includeSelfCheck.checked;
        const round = roundCheck.checked;
        const currency = currencySelect.value;
        
        if (total <= 0) {
            resultsDiv.innerHTML = '<div class="bs-error">❌ Zadej platnou částku</div>';
            return;
        }
        
        if (count <= 0) {
            resultsDiv.innerHTML = '<div class="bs-error">❌ Zadej platný počet lidí</div>';
            return;
        }
        
        // Přidání spropitného
        const tipAmount = total * (currentTip / 100);
        const totalWithTip = total + tipAmount;
        
        // Rozdělení
        const splitCount = includeSelf ? count : count - 1;
        if (splitCount <= 0) {
            resultsDiv.innerHTML = '<div class="bs-error">❌ Musí být alespoň jeden člověk k zaplacení</div>';
            return;
        }
        
        let perPerson = totalWithTip / splitCount;
        if (round) perPerson = Math.ceil(perPerson);
        
        // Zobrazení výsledků
        const currencySymbol = getCurrencySymbol(currency);
        
        let resultsHtml = `
            <div class="bs-result-summary">
                <div class="bs-result-card bs-result-main">
                    <div class="bs-result-icon">💰</div>
                    <div class="bs-result-content">
                        <div class="bs-result-value">${formatMoney(total, currency)}</div>
                        <div class="bs-result-label">Celková částka</div>
                    </div>
                </div>
                <div class="bs-result-card">
                    <div class="bs-result-icon">💝</div>
                    <div class="bs-result-content">
                        <div class="bs-result-value">${formatMoney(tipAmount, currency)} (${currentTip}%)</div>
                        <div class="bs-result-label">Spropitné</div>
                    </div>
                </div>
                <div class="bs-result-card">
                    <div class="bs-result-icon">💰</div>
                    <div class="bs-result-content">
                        <div class="bs-result-value">${formatMoney(totalWithTip, currency)}</div>
                        <div class="bs-result-label">Celkem i s tipem</div>
                    </div>
                </div>
            </div>
            
            <div class="bs-result-divider">📋 Každý zaplatí</div>
            <div class="bs-result-list">
        `;
        
        // Uložení jmen před výpočtem
        saveNames();
        
        for (let i = 0; i < count; i++) {
            if (!includeSelf && i === 0) continue;
            
            const personName = names[i] || getDefaultName(i, includeSelf);
            const personIndex = includeSelf ? i : i - 1;
            const amount = perPerson;
            
            resultsHtml += `
                <div class="bs-result-person">
                    <span class="bs-person-name">${personName}</span>
                    <span class="bs-person-amount">${formatMoney(amount, currency)}</span>
                </div>
            `;
        }
        
        resultsHtml += `
            </div>
            <div class="bs-result-note">
                ${round ? '💰 Částky byly zaokrouhleny nahoru' : '💰 Přesné rozdělení bez zaokrouhlení'}
            </div>
        `;
        
        resultsDiv.innerHTML = resultsHtml;
        
        saveSettings();
        showNotification('Účet rozdělen', 'success');
    }
    
    function getCurrencySymbol(currency) {
        const symbols = { czk: 'Kč', eur: '€', usd: '$', gbp: '£' };
        return symbols[currency] || 'Kč';
    }
    
    function formatMoney(amount, currency) {
        const symbol = getCurrencySymbol(currency);
        return `${amount.toFixed(2)} ${symbol}`;
    }
    
    async function copyResults() {
        const results = resultsDiv.innerText;
        if (results && !results.includes('Vyplň údaje')) {
            await copyToClipboard(results);
        } else {
            showNotification('Nejprve rozděl účet', 'warning');
        }
    }
    
    function clearAll() {
        totalInput.value = '1000';
        countInput.value = '2';
        currentTip = 15;
        tipBtns.forEach(btn => {
            if (btn.dataset.tip == 15) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        customTipDiv.style.display = 'none';
        customTipInput.value = '';
        includeSelfCheck.checked = false;
        roundCheck.checked = false;
        names = [];
        updateNamesInputs();
        resultsDiv.innerHTML = '<div class="bs-empty">Vyplň údaje a klikni na "Rozdělit účet"</div>';
        showNotification('Vyčištěno');
        saveSettings();
    }
    
    // Eventy
    calculateBtn.addEventListener('click', calculate);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResults);
    includeSelfCheck.addEventListener('change', () => {
        updateNamesInputs();
        saveSettings();
    });
    roundCheck.addEventListener('change', saveSettings);
    totalInput.addEventListener('input', saveSettings);
    currencySelect.addEventListener('change', saveSettings);
    
    // Auto-výpočet při změně
    let debounceTimer;
    const autoCalculate = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (totalInput.value && countInput.value) {
                calculate();
            }
        }, 500);
    };
    
    totalInput.addEventListener('input', autoCalculate);
    countInput.addEventListener('input', autoCalculate);
    includeSelfCheck.addEventListener('change', autoCalculate);
    roundCheck.addEventListener('change', autoCalculate);
    
    // Ukládání
    function saveSettings() {
        storage.set('total', totalInput.value);
        storage.set('currency', currencySelect.value);
        storage.set('count', countInput.value);
        storage.set('tip', currentTip);
        storage.set('includeSelf', includeSelfCheck.checked);
        storage.set('round', roundCheck.checked);
        storage.set('names', names);
    }
    
    function loadSettings() {
        totalInput.value = storage.get('total', '1000');
        currencySelect.value = storage.get('currency', 'czk');
        countInput.value = storage.get('count', 2);
        currentTip = storage.get('tip', 15);
        includeSelfCheck.checked = storage.get('includeSelf', false);
        roundCheck.checked = storage.get('round', false);
        names = storage.get('names', []);
        
        // Nastavení tip tlačítka
        let tipFound = false;
        tipBtns.forEach(btn => {
            const tipVal = parseInt(btn.dataset.tip);
            if (tipVal === currentTip) {
                btn.classList.add('active');
                tipFound = true;
            } else if (btn.dataset.tip !== 'custom') {
                btn.classList.remove('active');
            }
        });
        
        if (!tipFound && currentTip > 0) {
            tipBtns.forEach(btn => {
                if (btn.dataset.tip === 'custom') {
                    btn.classList.add('active');
                    customTipDiv.style.display = 'flex';
                    customTipInput.value = currentTip;
                }
            });
        }
        
        updateNamesInputs();
        
        if (totalInput.value && countInput.value) {
            setTimeout(() => calculate(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Bill Splitter se zavírá');
}