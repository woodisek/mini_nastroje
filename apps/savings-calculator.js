import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('savings-calculator');

// Databáze návyků
const habits = {
    smoking: {
        name: "Kouření",
        icon: "🚬",
        color: "#ff9800",
        items: [
            { name: "Krabička cigaret", defaultPrice: 135, unit: "krabička", perDay: 1 },
            { name: "Krabička cigaret (levné)", defaultPrice: 110, unit: "krabička", perDay: 1 },
            { name: "Krabička cigaret (drahé)", defaultPrice: 160, unit: "krabička", perDay: 1 }
        ],
        tip: "Kouření škodí zdraví i peněžence. Po roce bez cigaret si můžeš koupit nový telefon nebo dovolenou!"
    },
    coffee: {
        name: "Káva v kavárně",
        icon: "☕",
        color: "#795548",
        items: [
            { name: "Caffè latte", defaultPrice: 65, unit: "šálek", perDay: 1 },
            { name: "Espresso", defaultPrice: 45, unit: "šálek", perDay: 1 },
            { name: "Káva s sebou", defaultPrice: 55, unit: "kelímek", perDay: 1 }
        ],
        tip: "Domácí káva vyjde na pár korun. Ušetřené peníze můžeš investovat do kvalitního kávovaru!"
    },
    fastfood: {
        name: "Fastfood",
        icon: "🍔",
        color: "#f44336",
        items: [
            { name: "McDonald's menu", defaultPrice: 160, unit: "menu", perDay: 1 },
            { name: "Kebab", defaultPrice: 150, unit: "porce", perDay: 1 },
            { name: "Pizza", defaultPrice: 200, unit: "kus", perDay: 1 }
        ],
        tip: "Vaření doma je zdravější a výrazně levnější. Za rok ušetříš na novou lednici nebo sporák!"
    },
    soda: {
        name: "Slazené nápoje",
        icon: "🥤",
        color: "#2196f3",
        items: [
            { name: "Cola (0.5l)", defaultPrice: 25, unit: "láhev", perDay: 1 },
            { name: "Energetický nápoj", defaultPrice: 35, unit: "plechovka", perDay: 1 },
            { name: "Džus", defaultPrice: 30, unit: "láhev", perDay: 1 }
        ],
        tip: "Pití vody je zdarma a zdravé. Za rok ušetříš tisíce korun!"
    },
    snacks: {
        name: "Sladkosti",
        icon: "🍫",
        color: "#e91e63",
        items: [
            { name: "Čokoláda", defaultPrice: 40, unit: "tabule", perDay: 1 },
            { name: "Sušenky", defaultPrice: 30, unit: "balení", perDay: 1 },
            { name: "Zmrzlina", defaultPrice: 35, unit: "kopeček", perDay: 1 }
        ],
        tip: "Sladké chutná, ale peněženka pláče. Zkus domácí alternativy!"
    },
    taxi: {
        name: "Taxi / Uber",
        icon: "🚕",
        color: "#4caf50",
        items: [
            { name: "Cesta po městě", defaultPrice: 150, unit: "jízda", perDay: 0.5 },
            { name: "Cesta na letiště", defaultPrice: 500, unit: "jízda", perDay: 0.2 },
            { name: "Cesta z party", defaultPrice: 200, unit: "jízda", perDay: 0.3 }
        ],
        tip: "MHD nebo kolo jsou mnohem levnější. Ušetřené peníze dej na dovolenou!"
    }
};

export default function render(container) {
    container.innerHTML = `
        <div class="savings-calculator">
            <div class="sav-header">
                <span class="sav-icon">💰</span>
                <div>
                    <h3>Kolik ušetřím, když přestanu X?</h3>
                    <p>Vypočítej si úspory při odvykání</p>
                </div>
            </div>

            <!-- Výběr návyku -->
            <div class="sav-section">
                <label class="sav-label">🚫 Návyk</label>
                <div class="sav-habits">
                    ${Object.entries(habits).map(([key, habit]) => `
                        <button data-habit="${key}" class="sav-habit-btn ${key === 'smoking' ? 'active' : ''}">
                            ${habit.icon} ${habit.name}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Specifická položka -->
            <div class="sav-section">
                <label class="sav-label">📦 Konkrétní položka</label>
                <select id="sav-item" class="sav-select"></select>
            </div>

            <!-- Cena a frekvence -->
            <div class="sav-section">
                <label class="sav-label">💰 Cena za jednotku</label>
                <div class="sav-input-group">
                    <input type="number" id="sav-price" class="sav-input" step="5">
                    <span class="sav-currency">Kč</span>
                </div>
            </div>

            <div class="sav-section">
                <label class="sav-label">📅 Kolik za den / týden?</label>
                <div class="sav-input-group">
                    <input type="number" id="sav-quantity" class="sav-input" step="0.5" value="1">
                    <select id="sav-period" class="sav-select-small">
                        <option value="day">za den</option>
                        <option value="week">za týden</option>
                        <option value="month">za měsíc</option>
                    </select>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="sav-buttons">
                <button id="sav-calculate" class="sav-btn sav-btn-primary">💰 Spočítat úspory</button>
                <button id="sav-clear" class="sav-btn sav-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="sav-result-section">
                <div class="sav-result-header">
                    <span>📊 Kolik ušetříš</span>
                    <button id="sav-copy" class="sav-small-btn">📋 Kopírovat</button>
                </div>
                <div id="sav-result" class="sav-result">
                    <div class="sav-empty">Vyber návyk a klikni na "Spočítat úspory"</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="sav-tip">
                💡 <strong>Tip:</strong> Malé úspory se sčítají. I zdánlivě drobné výdaje ti za rok ušetří tisíce korun!
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const habitBtns = document.querySelectorAll('.sav-habit-btn');
    const itemSelect = document.getElementById('sav-item');
    const priceInput = document.getElementById('sav-price');
    const quantityInput = document.getElementById('sav-quantity');
    const periodSelect = document.getElementById('sav-period');
    const calculateBtn = document.getElementById('sav-calculate');
    const clearBtn = document.getElementById('sav-clear');
    const copyBtn = document.getElementById('sav-copy');
    const resultDiv = document.getElementById('sav-result');

    let currentHabit = 'smoking';
    let currentItems = habits.smoking.items;

    // Aktualizace položek podle vybraného návyku
    function updateItems() {
        const habit = habits[currentHabit];
        currentItems = habit.items;
        
        itemSelect.innerHTML = currentItems.map((item, index) => `
            <option value="${index}">${item.name} (${item.price !== undefined ? item.price : item.defaultPrice} Kč/${item.unit})</option>
        `).join('');
        
        // Nastavení ceny podle první položky
        const firstItem = currentItems[0];
        priceInput.value = firstItem.price !== undefined ? firstItem.price : firstItem.defaultPrice;
        
        // Barevné zvýraznění tlačítka
        document.querySelector('.sav-result-section').style.borderTop = `3px solid ${habit.color}`;
    }

    // Výpočet úspor
    function calculateSavings() {
        const price = parseFloat(priceInput.value) || 0;
        let quantity = parseFloat(quantityInput.value) || 0;
        const period = periodSelect.value;
        const selectedItemIndex = parseInt(itemSelect.value);
        const selectedItem = currentItems[selectedItemIndex];
        
        if (price <= 0) {
            resultDiv.innerHTML = '<div class="sav-error">❌ Zadej platnou cenu</div>';
            return;
        }
        
        if (quantity <= 0) {
            resultDiv.innerHTML = '<div class="sav-error">❌ Zadej platné množství</div>';
            return;
        }
        
        // Přepočet na denní výdaj
        let dailyCost = price * quantity;
        if (period === 'week') dailyCost = dailyCost / 7;
        if (period === 'month') dailyCost = dailyCost / 30.4;
        
        const weeklyCost = dailyCost * 7;
        const monthlyCost = dailyCost * 30.4;
        const yearlyCost = dailyCost * 365;
        
        const habit = habits[currentHabit];
        const habitColor = habit.color;
        
        // Návrhy, co se dá koupit za ušetřené peníze
        let suggestions = [];
        if (yearlyCost >= 50000) {
            suggestions.push("🌴 Dovolená u moře");
            suggestions.push("📱 Nový telefon");
            suggestions.push("💻 Notebook");
        } else if (yearlyCost >= 20000) {
            suggestions.push("🎮 Herní konzole");
            suggestions.push("🚲 Kolo");
            suggestions.push("📺 Nová televize");
        } else if (yearlyCost >= 10000) {
            suggestions.push("📱 Tablet");
            suggestions.push("👟 Kvalitní boty");
            suggestions.push("🎧 Sluchátka");
        } else if (yearlyCost >= 5000) {
            suggestions.push("📚 Knížky na rok");
            suggestions.push("🎫 Vstupenky na koncert");
            suggestions.push("🍽️ Večeře v restauraci");
        } else {
            suggestions.push("☕ Káva každý den na měsíc");
            suggestions.push("🍕 Pizza s přáteli");
            suggestions.push("🎬 Kino pro dva");
        }
        
        resultDiv.innerHTML = `
            <div class="sav-result-card" style="border-top: 4px solid ${habitColor}">
                <div class="sav-result-habit">
                    ${habit.icon} ${habit.name}
                </div>
                <div class="sav-result-stats">
                    <div class="sav-stat-item">
                        <span class="sav-stat-label">📅 Denně</span>
                        <span class="sav-stat-value">${dailyCost.toFixed(0)} Kč</span>
                    </div>
                    <div class="sav-stat-item">
                        <span class="sav-stat-label">📆 Týdně</span>
                        <span class="sav-stat-value">${weeklyCost.toFixed(0)} Kč</span>
                    </div>
                    <div class="sav-stat-item">
                        <span class="sav-stat-label">📅 Měsíčně</span>
                        <span class="sav-stat-value">${monthlyCost.toFixed(0)} Kč</span>
                    </div>
                    <div class="sav-stat-item sav-stat-yearly">
                        <span class="sav-stat-label">🎯 Ročně</span>
                        <span class="sav-stat-value">${yearlyCost.toFixed(0)} Kč</span>
                    </div>
                </div>
                <div class="sav-result-suggestions">
                    <div class="sav-suggestions-title">🎁 Za ušetřené peníze si můžeš pořídit:</div>
                    <div class="sav-suggestions-list">
                        ${suggestions.map(s => `<span class="sav-suggestion">${s}</span>`).join('')}
                    </div>
                </div>
                <div class="sav-result-tip">
                    💡 ${habit.tip}
                </div>
            </div>
        `;
        
        showNotification(`Úspora: ${yearlyCost.toFixed(0)} Kč za rok`, 'success');
        saveSettings();
    }

    async function copyResult() {
        const resultText = resultDiv.innerText;
        if (resultText && !resultText.includes('Vyber návyk')) {
            await copyToClipboard(resultText);
            showNotification('Výsledek zkopírován');
        } else {
            showNotification('Nejprve spočítej úspory', 'warning');
        }
    }

    function clearAll() {
        priceInput.value = currentItems[0]?.defaultPrice || 100;
        quantityInput.value = 1;
        periodSelect.value = 'day';
        resultDiv.innerHTML = '<div class="sav-empty">Vyber návyk a klikni na "Spočítat úspory"</div>';
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Eventy
    habitBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            habitBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentHabit = btn.dataset.habit;
            updateItems();
            saveSettings();
        });
    });
    
    itemSelect.addEventListener('change', () => {
        const selectedIndex = parseInt(itemSelect.value);
        const selectedItem = currentItems[selectedIndex];
        if (selectedItem) {
            priceInput.value = selectedItem.price !== undefined ? selectedItem.price : selectedItem.defaultPrice;
        }
        saveSettings();
    });
    
    calculateBtn.addEventListener('click', calculateSavings);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    
    priceInput.addEventListener('input', saveSettings);
    quantityInput.addEventListener('input', saveSettings);
    periodSelect.addEventListener('change', saveSettings);

    // Ukládání/načítání
    function saveSettings() {
        storage.set('habit', currentHabit);
        storage.set('itemIndex', itemSelect.value);
        storage.set('price', priceInput.value);
        storage.set('quantity', quantityInput.value);
        storage.set('period', periodSelect.value);
    }
    
    function loadSettings() {
        const savedHabit = storage.get('habit', 'smoking');
        const savedItemIndex = storage.get('itemIndex', 0);
        const savedPrice = storage.get('price', '');
        const savedQuantity = storage.get('quantity', 1);
        const savedPeriod = storage.get('period', 'day');
        
        currentHabit = savedHabit;
        habitBtns.forEach(btn => {
            if (btn.dataset.habit === savedHabit) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        updateItems();
        
        if (savedItemIndex) {
            itemSelect.value = savedItemIndex;
            const selectedItem = currentItems[parseInt(savedItemIndex)];
            if (selectedItem) {
                priceInput.value = savedPrice || selectedItem.defaultPrice;
            }
        }
        
        quantityInput.value = savedQuantity;
        periodSelect.value = savedPeriod;
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Savings Calculator se zavírá');
}