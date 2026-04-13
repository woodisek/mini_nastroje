import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('time-money');

export default function render(container) {
    container.innerHTML = `
        <div class="time-money-calculator">
            <div class="tm-header">
                <span class="tm-icon">⏰</span>
                <div>
                    <h3>Kolik času života vyměním za peníze?</h3>
                    <p>Uvědom si skutečnou hodnotu svého času</p>
                </div>
            </div>

            <!-- Měsíční příjem -->
            <div class="tm-section">
                <label class="tm-label">💰 Čistý měsíční příjem</label>
                <div class="tm-input-group">
                    <input type="number" id="tm-income" class="tm-input" value="35000" step="1000">
                    <span class="tm-currency">Kč</span>
                </div>
            </div>

            <!-- Odpracované hodiny měsíčně -->
            <div class="tm-section">
                <label class="tm-label">⏱️ Odpracované hodiny měsíčně</label>
                <div class="tm-input-group">
                    <input type="number" id="tm-hours" class="tm-input" value="160" step="8">
                    <span class="tm-unit">hod</span>
                </div>
                <div class="tm-hint">(běžně 40 hodin/týden = 160 hodin/měsíc)</div>
            </div>

            <!-- Hodnota jedné hodiny -->
            <div class="tm-result-box tm-hour-value">
                <span class="tm-result-label">⏱️ Hodnota jedné hodiny tvého času:</span>
                <span class="tm-result-value" id="tm-hour-rate">219 Kč</span>
            </div>

            <!-- Výdaj / položka -->
            <div class="tm-section">
                <label class="tm-label">🛒 Cena položky / výdaj</label>
                <div class="tm-input-group">
                    <input type="number" id="tm-cost" class="tm-input" value="5000" step="500">
                    <span class="tm-currency">Kč</span>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="tm-buttons">
                <button id="tm-calculate" class="tm-btn tm-btn-primary">⏰ Spočítat čas</button>
                <button id="tm-clear" class="tm-btn tm-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="tm-result-section">
                <div class="tm-result-header">
                    <span>📊 Za tento výdaj vyměníš</span>
                    <button id="tm-copy" class="tm-small-btn">📋 Kopírovat</button>
                </div>
                <div id="tm-result" class="tm-result">
                    <div class="tm-empty">Zadej příjem a cenu položky</div>
                </div>
            </div>

            <!-- Motivace -->
            <details class="tm-details">
                <summary>💡 Zamyšlení nad hodnotou času</summary>
                <div class="tm-info">
                    <p>⏰ Každý den máme jen 24 hodin. Z toho spíme ~8 hodin, pracujeme ~8 hodin, zbývá ~8 hodin na sebe.</p>
                    <p>💰 Když si chceš něco koupit, zeptej se: "Stojí to za X hodin mého života?"</p>
                    <p>📈 Investice do vzdělání, zdraví a vztahů se ti vrátí mnohonásobně víc než materiální věci.</p>
                </div>
            </details>

            <!-- Tip -->
            <div class="tm-tip">
                💡 <strong>Tip:</strong> Zkus se příště před nákupem zeptat: "Kolik hodin svého života za to dám?"
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const incomeInput = document.getElementById('tm-income');
    const hoursInput = document.getElementById('tm-hours');
    const costInput = document.getElementById('tm-cost');
    const hourRateSpan = document.getElementById('tm-hour-rate');
    const calculateBtn = document.getElementById('tm-calculate');
    const clearBtn = document.getElementById('tm-clear');
    const copyBtn = document.getElementById('tm-copy');
    const resultDiv = document.getElementById('tm-result');

    let currentResult = null;

    // Výpočet hodinové sazby
    function calculateHourRate() {
        const income = parseFloat(incomeInput.value) || 0;
        const hours = parseFloat(hoursInput.value) || 1;
        
        if (income <= 0 || hours <= 0) {
            hourRateSpan.textContent = '0 Kč';
            return 0;
        }
        
        const rate = income / hours;
        hourRateSpan.textContent = `${Math.round(rate)} Kč`;
        return rate;
    }

    // Formátování času
    function formatTime(hours) {
        const days = Math.floor(hours / 8);
        const remainingHours = hours % 8;
        
        if (days === 0) {
            return `${remainingHours.toFixed(1)} hodin`;
        }
        if (remainingHours === 0) {
            return `${days} pracovních dnů`;
        }
        return `${days} dnů a ${remainingHours.toFixed(1)} hodin`;
    }

    function calculateTime() {
        const cost = parseFloat(costInput.value) || 0;
        const rate = calculateHourRate();
        
        if (cost <= 0) {
            resultDiv.innerHTML = '<div class="tm-error">❌ Zadej platnou cenu položky</div>';
            return;
        }
        
        if (rate <= 0) {
            resultDiv.innerHTML = '<div class="tm-error">❌ Zadej platný příjem a počet hodin</div>';
            return;
        }
        
        const hoursNeeded = cost / rate;
        const daysNeeded = hoursNeeded / 8;
        const yearsNeeded = daysNeeded / 20; // 20 pracovních dnů v měsíci
        
        currentResult = {
            hours: hoursNeeded,
            days: daysNeeded,
            years: yearsNeeded,
            cost: cost,
            rate: rate
        };
        
        // Určení barvy a motivace podle náročnosti
        let colorClass = '';
        let motivation = '';
        
        if (hoursNeeded <= 1) {
            colorClass = 'tm-low';
            motivation = '✨ To není mnoho času. Dopřej si to!';
        } else if (hoursNeeded <= 4) {
            colorClass = 'tm-medium-low';
            motivation = '👍 Rozumná investice času. Pokud tě to potěší, jdi do toho.';
        } else if (hoursNeeded <= 20) {
            colorClass = 'tm-medium';
            motivation = '🤔 Zamysli se, jestli to opravdu potřebuješ. Stojí to za půl týdne práce?';
        } else if (hoursNeeded <= 40) {
            colorClass = 'tm-medium-high';
            motivation = '⚠️ Tohle je celý týden tvého života. Opravdu to stojí za to?';
        } else {
            colorClass = 'tm-high';
            motivation = '🔴 Vážně? Tohle jsou TÝDNY až MĚSÍCE tvého života. Zvaž to pečlivě!';
        }
        
        resultDiv.innerHTML = `
            <div class="tm-result-card ${colorClass}">
                <div class="tm-result-main">
                    <div class="tm-result-hours">
                        <span class="tm-hours-number">${hoursNeeded.toFixed(1)}</span>
                        <span class="tm-hours-label">hodin</span>
                    </div>
                    <div class="tm-result-breakdown">
                        <div class="tm-breakdown-item">
                            <span>📅 To je:</span>
                            <strong>${daysNeeded.toFixed(1)} pracovních dnů</strong>
                        </div>
                        <div class="tm-breakdown-item">
                            <span>📆 Nebo:</span>
                            <strong>${yearsNeeded.toFixed(1)} měsíců práce</strong>
                        </div>
                    </div>
                </div>
                <div class="tm-result-comparison">
                    <div class="tm-comparison-item">
                        <span>💰 Cena položky:</span>
                        <strong>${cost.toLocaleString('cs-CZ')} Kč</strong>
                    </div>
                    <div class="tm-comparison-item">
                        <span>⏱️ Tvoje hodinová sazba:</span>
                        <strong>${Math.round(rate)} Kč/hod</strong>
                    </div>
                </div>
                <div class="tm-result-motivation">
                    ${motivation}
                </div>
            </div>
        `;
        
        showNotification(`Vyměníš ${hoursNeeded.toFixed(1)} hodin svého života`, 'info');
        saveSettings();
    }

    async function copyResult() {
        if (!currentResult) {
            showNotification('Nejprve spočítej čas', 'warning');
            return;
        }
        
        const text = `Za ${currentResult.cost.toLocaleString('cs-CZ')} Kč vyměním ${currentResult.hours.toFixed(1)} hodin svého života (${currentResult.days.toFixed(1)} pracovních dnů). Moje hodinová sazba je ${Math.round(currentResult.rate)} Kč.`;
        await copyToClipboard(text);
        showNotification('Výsledek zkopírován');
    }

    function clearAll() {
        incomeInput.value = '35000';
        hoursInput.value = '160';
        costInput.value = '5000';
        calculateHourRate();
        resultDiv.innerHTML = '<div class="tm-empty">Zadej příjem a cenu položky</div>';
        currentResult = null;
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Eventy
    calculateBtn.addEventListener('click', calculateTime);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    
    incomeInput.addEventListener('input', () => {
        calculateHourRate();
        saveSettings();
    });
    hoursInput.addEventListener('input', () => {
        calculateHourRate();
        saveSettings();
    });
    costInput.addEventListener('input', saveSettings);
    
    // Enter klávesa
    costInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateTime();
    });

    // Ukládání/načítání
    function saveSettings() {
        storage.set('income', incomeInput.value);
        storage.set('hours', hoursInput.value);
        storage.set('cost', costInput.value);
    }
    
    function loadSettings() {
        incomeInput.value = storage.get('income', '35000');
        hoursInput.value = storage.get('hours', '160');
        costInput.value = storage.get('cost', '5000');
        calculateHourRate();
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Time Money Calculator se zavírá');
}