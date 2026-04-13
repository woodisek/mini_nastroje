import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('bmr-calculator');

export default function render(container) {
    container.innerHTML = `
        <div class="bmr-calculator">
            <div class="bmr-header">
                <span class="bmr-icon">🩺</span>
                <div>
                    <h3>Kalkulačka bazálního metabolismu (BMR)</h3>
                    <p>Zjisti svou denní spotřebu kalorií</p>
                </div>
            </div>

            <!-- Pohlaví -->
            <div class="bmr-section">
                <label class="bmr-label">👤 Pohlaví</label>
                <div class="bmr-gender">
                    <button data-gender="male" class="bmr-gender-btn active">👨 Muž</button>
                    <button data-gender="female" class="bmr-gender-btn">👩 Žena</button>
                </div>
            </div>

            <!-- Věk -->
            <div class="bmr-section">
                <label class="bmr-label">🎂 Věk (roky)</label>
                <div class="bmr-input-group">
                    <input type="number" id="bmr-age" class="bmr-input" value="30" step="1" min="15" max="100">
                    <span class="bmr-unit">let</span>
                </div>
            </div>

            <!-- Výška -->
            <div class="bmr-section">
                <label class="bmr-label">📏 Výška (cm)</label>
                <div class="bmr-input-group">
                    <input type="number" id="bmr-height" class="bmr-input" value="175" step="1" min="100" max="250">
                    <span class="bmr-unit">cm</span>
                </div>
            </div>

            <!-- Váha -->
            <div class="bmr-section">
                <label class="bmr-label">⚖️ Váha (kg)</label>
                <div class="bmr-input-group">
                    <input type="number" id="bmr-weight" class="bmr-input" value="75" step="1" min="30" max="250">
                    <span class="bmr-unit">kg</span>
                </div>
            </div>

            <!-- Úroveň aktivity -->
            <div class="bmr-section">
                <label class="bmr-label">🏃 Úroveň aktivity</label>
                <select id="bmr-activity" class="bmr-select">
                    <option value="1.2">🛋️ Sedavý (žádný / minimální pohyb)</option>
                    <option value="1.375">🚶 Lehce aktivní (sport 1-3x týdně)</option>
                    <option value="1.55">🏃 Středně aktivní (sport 3-5x týdně)</option>
                    <option value="1.725">💪 Velmi aktivní (sport 6-7x týdně)</option>
                    <option value="1.9">🏋️ Extrémně aktivní (fyzická práce + sport)</option>
                </select>
            </div>

            <!-- Cíl -->
            <div class="bmr-section">
                <label class="bmr-label">🎯 Cíl</label>
                <select id="bmr-goal" class="bmr-select">
                    <option value="maintain">⚖️ Udržení váhy</option>
                    <option value="lose">📉 Hubnutí (deficit 500 kcal)</option>
                    <option value="lose-fast">📉📉 Rychlé hubnutí (deficit 1000 kcal)</option>
                    <option value="gain">📈 Nabírání (surplus 500 kcal)</option>
                </select>
            </div>

            <!-- Tlačítka -->
            <div class="bmr-buttons">
                <button id="bmr-calculate" class="bmr-btn bmr-btn-primary">📊 Spočítat BMR</button>
                <button id="bmr-clear" class="bmr-btn bmr-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="bmr-result-section">
                <div class="bmr-result-header">
                    <span>📊 Tvé výsledky</span>
                    <button id="bmr-copy" class="bmr-small-btn">📋 Kopírovat</button>
                </div>
                <div id="bmr-result" class="bmr-result">
                    <div class="bmr-empty">Vyplň údaje a klikni na "Spočítat BMR"</div>
                </div>
            </div>

            <!-- Info -->
            <details class="bmr-details">
                <summary>📖 Co je BMR?</summary>
                <div class="bmr-info">
                    <p>🔬 <strong>Bazální metabolismus (BMR)</strong> je množství energie (kalorií), které tvé tělo spálí v naprostém klidu pro udržení základních životních funkcí (dýchání, tlukot srdce, udržování teploty).</p>
                    <p>📊 <strong>TDEE (Total Daily Energy Expenditure)</strong> je celková denní spotřeba energie včetně fyzické aktivity.</p>
                    <p>💡 Pro hubnutí se doporučuje deficit 500-1000 kcal denně, pro nabírání surplus 500 kcal.</p>
                    <p>📐 <strong>Vzorce:</strong><br>
                    👨 Muži: BMR = 88.362 + (13.397 × váha) + (4.799 × výška) - (5.677 × věk)<br>
                    👩 Ženy: BMR = 447.593 + (9.247 × váha) + (3.098 × výška) - (4.330 × věk)</p>
                </div>
            </details>

            <!-- Tip -->
            <div class="bmr-tip">
                💡 <strong>Tip:</strong> Výsledky jsou orientační. Pro přesné nastavení jídelníčku se poraď s odborníkem na výživu.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const genderBtns = document.querySelectorAll('.bmr-gender-btn');
    const ageInput = document.getElementById('bmr-age');
    const heightInput = document.getElementById('bmr-height');
    const weightInput = document.getElementById('bmr-weight');
    const activitySelect = document.getElementById('bmr-activity');
    const goalSelect = document.getElementById('bmr-goal');
    const calculateBtn = document.getElementById('bmr-calculate');
    const clearBtn = document.getElementById('bmr-clear');
    const copyBtn = document.getElementById('bmr-copy');
    const resultDiv = document.getElementById('bmr-result');

    let selectedGender = 'male';
    let currentResult = null;

    function calculateBMR() {
        const age = parseFloat(ageInput.value) || 0;
        const height = parseFloat(heightInput.value) || 0;
        const weight = parseFloat(weightInput.value) || 0;
        const activity = parseFloat(activitySelect.value);
        const goal = goalSelect.value;
        
        if (age <= 0 || height <= 0 || weight <= 0) {
            resultDiv.innerHTML = '<div class="bmr-error">❌ Zadej platné hodnoty (věk, výška, váha)</div>';
            return;
        }
        
        let bmr;
        if (selectedGender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
        
        const tdee = bmr * activity;
        
        let goalText = '';
        let goalCalories = tdee;
        let goalColor = '';
        
        switch (goal) {
            case 'lose':
                goalCalories = tdee - 500;
                goalText = 'Hubnutí (deficit 500 kcal)';
                goalColor = '#ff9800';
                break;
            case 'lose-fast':
                goalCalories = tdee - 1000;
                goalText = 'Rychlé hubnutí (deficit 1000 kcal)';
                goalColor = '#f44336';
                break;
            case 'gain':
                goalCalories = tdee + 500;
                goalText = 'Nabírání (surplus 500 kcal)';
                goalColor = '#4caf50';
                break;
            default:
                goalText = 'Udržení váhy';
                goalColor = '#667eea';
        }
        
        currentResult = {
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            goalCalories: Math.round(goalCalories),
            goalText: goalText,
            age: age,
            height: height,
            weight: weight,
            gender: selectedGender === 'male' ? 'muž' : 'žena'
        };
        
        resultDiv.innerHTML = `
            <div class="bmr-result-card">
                <div class="bmr-result-grid">
                    <div class="bmr-result-item">
                        <div class="bmr-result-value">${Math.round(bmr)}</div>
                        <div class="bmr-result-label">BMR (klidový metabolismus)</div>
                    </div>
                    <div class="bmr-result-item">
                        <div class="bmr-result-value">${Math.round(tdee)}</div>
                        <div class="bmr-result-label">TDEE (celková spotřeba)</div>
                    </div>
                    <div class="bmr-result-item" style="border-top: 3px solid ${goalColor}">
                        <div class="bmr-result-value" style="color: ${goalColor}">${Math.round(goalCalories)}</div>
                        <div class="bmr-result-label">${goalText}</div>
                    </div>
                </div>
                
                <div class="bmr-result-details">
                    <div class="bmr-detail-row">
                        <span>📏 Výška:</span>
                        <strong>${height} cm</strong>
                    </div>
                    <div class="bmr-detail-row">
                        <span>⚖️ Váha:</span>
                        <strong>${weight} kg</strong>
                    </div>
                    <div class="bmr-detail-row">
                        <span>🎂 Věk:</span>
                        <strong>${age} let</strong>
                    </div>
                    <div class="bmr-detail-row">
                        <span>👤 Pohlaví:</span>
                        <strong>${selectedGender === 'male' ? 'Muž' : 'Žena'}</strong>
                    </div>
                    <div class="bmr-detail-row">
                        <span>🏃 Aktivita:</span>
                        <strong>${activitySelect.options[activitySelect.selectedIndex].text.split('(')[0].trim()}</strong>
                    </div>
                </div>
                
                <div class="bmr-result-note">
                    💡 Pro ${goalText.toLowerCase()} potřebuješ denně přijmout přibližně <strong>${Math.round(goalCalories)} kcal</strong>.
                    ${goal === 'lose' || goal === 'lose-fast' ? ' Doporučuje se kombinovat s pohybem.' : ''}
                    ${goal === 'gain' ? ' Zaměř se na kvalitní bílkoviny a silový trénink.' : ''}
                </div>
            </div>
        `;
        
        showNotification(`BMR: ${Math.round(bmr)} kcal/den`, 'success');
        saveSettings();
    }

    async function copyResult() {
        if (!currentResult) {
            showNotification('Nejprve spočítej BMR', 'warning');
            return;
        }
        
        const text = `📊 MOJE VÝSLEDKY BMR\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📏 Výška: ${currentResult.height} cm\n` +
            `⚖️ Váha: ${currentResult.weight} kg\n` +
            `🎂 Věk: ${currentResult.age} let\n` +
            `👤 Pohlaví: ${currentResult.gender}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🩺 BMR (klidový): ${currentResult.bmr} kcal/den\n` +
            `🏃 TDEE (celková): ${currentResult.tdee} kcal/den\n` +
            `🎯 Cíl (${currentResult.goalText}): ${currentResult.goalCalories} kcal/den`;
        
        await copyToClipboard(text);
        showNotification('Výsledek zkopírován');
    }

    function clearAll() {
        ageInput.value = '30';
        heightInput.value = '175';
        weightInput.value = '75';
        activitySelect.value = '1.375';
        goalSelect.value = 'maintain';
        resultDiv.innerHTML = '<div class="bmr-empty">Vyplň údaje a klikni na "Spočítat BMR"</div>';
        currentResult = null;
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Eventy
    genderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genderBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedGender = btn.dataset.gender;
            saveSettings();
        });
    });
    
    calculateBtn.addEventListener('click', calculateBMR);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    
    ageInput.addEventListener('input', saveSettings);
    heightInput.addEventListener('input', saveSettings);
    weightInput.addEventListener('input', saveSettings);
    activitySelect.addEventListener('change', saveSettings);
    goalSelect.addEventListener('change', saveSettings);
    
    // Enter klávesa
    const inputs = [ageInput, heightInput, weightInput];
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') calculateBMR();
        });
    });
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('gender', selectedGender);
        storage.set('age', ageInput.value);
        storage.set('height', heightInput.value);
        storage.set('weight', weightInput.value);
        storage.set('activity', activitySelect.value);
        storage.set('goal', goalSelect.value);
    }
    
    function loadSettings() {
        selectedGender = storage.get('gender', 'male');
        ageInput.value = storage.get('age', '30');
        heightInput.value = storage.get('height', '175');
        weightInput.value = storage.get('weight', '75');
        activitySelect.value = storage.get('activity', '1.375');
        goalSelect.value = storage.get('goal', 'maintain');
        
        genderBtns.forEach(btn => {
            if (btn.dataset.gender === selectedGender) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('BMR Calculator se zavírá');
}