import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('unit-converter');

export default function render(container) {
    container.innerHTML = `
        <div class="unit-converter">
            <div class="uc-header">
                <span class="uc-icon">📏</span>
                <div>
                    <h3>Převodník jednotek</h3>
                    <p>Délka, hmotnost, objem, teplota a další</p>
                </div>
            </div>

            <!-- Kategorie -->
            <div class="uc-section">
                <div class="uc-categories">
                    <button data-category="length" class="uc-cat-btn active">📏 Délka</button>
                    <button data-category="weight" class="uc-cat-btn">⚖️ Hmotnost</button>
                    <button data-category="volume" class="uc-cat-btn">🧴 Objem</button>
                    <button data-category="temperature" class="uc-cat-btn">🌡️ Teplota</button>
                    <button data-category="area" class="uc-cat-btn">📐 Plocha</button>
                    <button data-category="speed" class="uc-cat-btn">⚡ Rychlost</button>
                </div>
            </div>

            <!-- DÉLKA -->
            <div id="uc-length" class="uc-converter active">
                <div class="uc-converter-row">
                    <div class="uc-input-group">
                        <label class="uc-label">Z:</label>
                        <input type="number" id="length-from" class="uc-input" value="1" step="any">
                        <select id="length-from-unit" class="uc-select">
                            <option value="m">metry (m)</option>
                            <option value="km">kilometry (km)</option>
                            <option value="cm">centimetry (cm)</option>
                            <option value="mm">milimetry (mm)</option>
                            <option value="mi">míle (mi)</option>
                            <option value="ft">stopy (ft)</option>
                            <option value="in">palce (in)</option>
                        </select>
                    </div>
                    <div class="uc-converter-icon">→</div>
                    <div class="uc-input-group">
                        <label class="uc-label">Na:</label>
                        <input type="number" id="length-to" class="uc-input" value="1" step="any" readonly>
                        <select id="length-to-unit" class="uc-select">
                            <option value="m" selected>metry (m)</option>
                            <option value="km">kilometry (km)</option>
                            <option value="cm">centimetry (cm)</option>
                            <option value="mm">milimetry (mm)</option>
                            <option value="mi">míle (mi)</option>
                            <option value="ft">stopy (ft)</option>
                            <option value="in">palce (in)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- HMOTNOST -->
            <div id="uc-weight" class="uc-converter">
                <div class="uc-converter-row">
                    <div class="uc-input-group">
                        <label class="uc-label">Z:</label>
                        <input type="number" id="weight-from" class="uc-input" value="1" step="any">
                        <select id="weight-from-unit" class="uc-select">
                            <option value="kg">kilogramy (kg)</option>
                            <option value="g">gramy (g)</option>
                            <option value="mg">miligramy (mg)</option>
                            <option value="t">tuny (t)</option>
                            <option value="lb">libry (lb)</option>
                            <option value="oz">unce (oz)</option>
                        </select>
                    </div>
                    <div class="uc-converter-icon">→</div>
                    <div class="uc-input-group">
                        <label class="uc-label">Na:</label>
                        <input type="number" id="weight-to" class="uc-input" value="1" step="any" readonly>
                        <select id="weight-to-unit" class="uc-select">
                            <option value="kg" selected>kilogramy (kg)</option>
                            <option value="g">gramy (g)</option>
                            <option value="mg">miligramy (mg)</option>
                            <option value="t">tuny (t)</option>
                            <option value="lb">libry (lb)</option>
                            <option value="oz">unce (oz)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- OBJEM -->
            <div id="uc-volume" class="uc-converter">
                <div class="uc-converter-row">
                    <div class="uc-input-group">
                        <label class="uc-label">Z:</label>
                        <input type="number" id="volume-from" class="uc-input" value="1" step="any">
                        <select id="volume-from-unit" class="uc-select">
                            <option value="l">litry (l)</option>
                            <option value="ml">mililitry (ml)</option>
                            <option value="m3">metry krychlové (m³)</option>
                            <option value="gal">galony (gal)</option>
                            <option value="qt">litry (qt)</option>
                        </select>
                    </div>
                    <div class="uc-converter-icon">→</div>
                    <div class="uc-input-group">
                        <label class="uc-label">Na:</label>
                        <input type="number" id="volume-to" class="uc-input" value="1" step="any" readonly>
                        <select id="volume-to-unit" class="uc-select">
                            <option value="l" selected>litry (l)</option>
                            <option value="ml">mililitry (ml)</option>
                            <option value="m3">metry krychlové (m³)</option>
                            <option value="gal">galony (gal)</option>
                            <option value="qt">litry (qt)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- TEPLOTA -->
            <div id="uc-temperature" class="uc-converter">
                <div class="uc-converter-row">
                    <div class="uc-input-group">
                        <label class="uc-label">Z:</label>
                        <input type="number" id="temp-from" class="uc-input" value="0" step="any">
                        <select id="temp-from-unit" class="uc-select">
                            <option value="c">Celsius (°C)</option>
                            <option value="f">Fahrenheit (°F)</option>
                            <option value="k">Kelvin (K)</option>
                        </select>
                    </div>
                    <div class="uc-converter-icon">→</div>
                    <div class="uc-input-group">
                        <label class="uc-label">Na:</label>
                        <input type="number" id="temp-to" class="uc-input" value="32" step="any" readonly>
                        <select id="temp-to-unit" class="uc-select">
                            <option value="c">Celsius (°C)</option>
                            <option value="f" selected>Fahrenheit (°F)</option>
                            <option value="k">Kelvin (K)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- PLOCHA -->
            <div id="uc-area" class="uc-converter">
                <div class="uc-converter-row">
                    <div class="uc-input-group">
                        <label class="uc-label">Z:</label>
                        <input type="number" id="area-from" class="uc-input" value="1" step="any">
                        <select id="area-from-unit" class="uc-select">
                            <option value="m2">metry čtvereční (m²)</option>
                            <option value="km2">kilometry čtvereční (km²)</option>
                            <option value="cm2">centimetry čtvereční (cm²)</option>
                            <option value="ha">hektary (ha)</option>
                            <option value="a">ary (a)</option>
                        </select>
                    </div>
                    <div class="uc-converter-icon">→</div>
                    <div class="uc-input-group">
                        <label class="uc-label">Na:</label>
                        <input type="number" id="area-to" class="uc-input" value="1" step="any" readonly>
                        <select id="area-to-unit" class="uc-select">
                            <option value="m2" selected>metry čtvereční (m²)</option>
                            <option value="km2">kilometry čtvereční (km²)</option>
                            <option value="cm2">centimetry čtvereční (cm²)</option>
                            <option value="ha">hektary (ha)</option>
                            <option value="a">ary (a)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- RYCHLOST -->
            <div id="uc-speed" class="uc-converter">
                <div class="uc-converter-row">
                    <div class="uc-input-group">
                        <label class="uc-label">Z:</label>
                        <input type="number" id="speed-from" class="uc-input" value="1" step="any">
                        <select id="speed-from-unit" class="uc-select">
                            <option value="kmh">km/h</option>
                            <option value="ms">m/s</option>
                            <option value="mph">mph</option>
                            <option value="knot">uzly (knot)</option>
                        </select>
                    </div>
                    <div class="uc-converter-icon">→</div>
                    <div class="uc-input-group">
                        <label class="uc-label">Na:</label>
                        <input type="number" id="speed-to" class="uc-input" value="1" step="any" readonly>
                        <select id="speed-to-unit" class="uc-select">
                            <option value="kmh" selected>km/h</option>
                            <option value="ms">m/s</option>
                            <option value="mph">mph</option>
                            <option value="knot">uzly (knot)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="uc-buttons">
                <button id="uc-swap" class="uc-btn uc-btn-secondary">🔄 Prohodit jednotky</button>
                <button id="uc-copy" class="uc-btn uc-btn-secondary">📋 Kopírovat výsledek</button>
                <button id="uc-clear" class="uc-btn uc-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Tip -->
            <div class="uc-tip">
                💡 <strong>Tip:</strong> Můžeš převádět mezi různými jednotkami v rámci jedné kategorie. Hodnoty se aktualizují automaticky.
            </div>
        </div>
    `;

    // ========== PŘEVODNÍ FAKTORY ==========
    const lengthFactors = {
        m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254
    };
    
    const weightFactors = {
        kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.453592, oz: 0.0283495
    };
    
    const volumeFactors = {
        l: 1, ml: 0.001, m3: 1000, gal: 3.78541, qt: 0.946353
    };
    
    const areaFactors = {
        m2: 1, km2: 1000000, cm2: 0.0001, ha: 10000, a: 100
    };
    
    const speedFactors = {
        kmh: 1, ms: 3.6, mph: 1.60934, knot: 1.852
    };
    
    function convert(value, fromUnit, toUnit, factors) {
        const inBase = value * factors[fromUnit];
        return inBase / factors[toUnit];
    }
    
    function convertTemperature(value, from, to) {
        let celsius;
        switch (from) {
            case 'c': celsius = value; break;
            case 'f': celsius = (value - 32) * 5/9; break;
            case 'k': celsius = value - 273.15; break;
            default: celsius = value;
        }
        
        switch (to) {
            case 'c': return celsius;
            case 'f': return celsius * 9/5 + 32;
            case 'k': return celsius + 273.15;
            default: return celsius;
        }
    }
    
    // ========== DOM elementy ==========
    const catBtns = document.querySelectorAll('.uc-cat-btn');
    const converters = document.querySelectorAll('.uc-converter');
    const swapBtn = document.getElementById('uc-swap');
    const copyBtn = document.getElementById('uc-copy');
    const clearBtn = document.getElementById('uc-clear');
    
    let currentCategory = 'length';
    
    // Přepínání kategorií
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            converters.forEach(c => c.classList.remove('active'));
            
            currentCategory = btn.dataset.category;
            document.getElementById(`uc-${currentCategory}`).classList.add('active');
            saveSettings();
        });
    });
    
    // ========== PŘEVODY ==========
    function updateLength() {
        const fromVal = parseFloat(document.getElementById('length-from').value) || 0;
        const fromUnit = document.getElementById('length-from-unit').value;
        const toUnit = document.getElementById('length-to-unit').value;
        const result = convert(fromVal, fromUnit, toUnit, lengthFactors);
        document.getElementById('length-to').value = result.toFixed(6);
    }
    
    function updateWeight() {
        const fromVal = parseFloat(document.getElementById('weight-from').value) || 0;
        const fromUnit = document.getElementById('weight-from-unit').value;
        const toUnit = document.getElementById('weight-to-unit').value;
        const result = convert(fromVal, fromUnit, toUnit, weightFactors);
        document.getElementById('weight-to').value = result.toFixed(6);
    }
    
    function updateVolume() {
        const fromVal = parseFloat(document.getElementById('volume-from').value) || 0;
        const fromUnit = document.getElementById('volume-from-unit').value;
        const toUnit = document.getElementById('volume-to-unit').value;
        const result = convert(fromVal, fromUnit, toUnit, volumeFactors);
        document.getElementById('volume-to').value = result.toFixed(6);
    }
    
    function updateTemperature() {
        const fromVal = parseFloat(document.getElementById('temp-from').value) || 0;
        const fromUnit = document.getElementById('temp-from-unit').value;
        const toUnit = document.getElementById('temp-to-unit').value;
        const result = convertTemperature(fromVal, fromUnit, toUnit);
        document.getElementById('temp-to').value = result.toFixed(2);
    }
    
    function updateArea() {
        const fromVal = parseFloat(document.getElementById('area-from').value) || 0;
        const fromUnit = document.getElementById('area-from-unit').value;
        const toUnit = document.getElementById('area-to-unit').value;
        const result = convert(fromVal, fromUnit, toUnit, areaFactors);
        document.getElementById('area-to').value = result.toFixed(6);
    }
    
    function updateSpeed() {
        const fromVal = parseFloat(document.getElementById('speed-from').value) || 0;
        const fromUnit = document.getElementById('speed-from-unit').value;
        const toUnit = document.getElementById('speed-to-unit').value;
        const result = convert(fromVal, fromUnit, toUnit, speedFactors);
        document.getElementById('speed-to').value = result.toFixed(6);
    }
    
    // Prohození jednotek
    function swapUnits() {
        if (currentCategory === 'length') {
            const fromUnit = document.getElementById('length-from-unit');
            const toUnit = document.getElementById('length-to-unit');
            const fromVal = document.getElementById('length-from');
            const toVal = document.getElementById('length-to');
            [fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value];
            [fromVal.value, toVal.value] = [toVal.value, fromVal.value];
            updateLength();
        } else if (currentCategory === 'weight') {
            const fromUnit = document.getElementById('weight-from-unit');
            const toUnit = document.getElementById('weight-to-unit');
            const fromVal = document.getElementById('weight-from');
            const toVal = document.getElementById('weight-to');
            [fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value];
            [fromVal.value, toVal.value] = [toVal.value, fromVal.value];
            updateWeight();
        } else if (currentCategory === 'volume') {
            const fromUnit = document.getElementById('volume-from-unit');
            const toUnit = document.getElementById('volume-to-unit');
            const fromVal = document.getElementById('volume-from');
            const toVal = document.getElementById('volume-to');
            [fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value];
            [fromVal.value, toVal.value] = [toVal.value, fromVal.value];
            updateVolume();
        } else if (currentCategory === 'temperature') {
            const fromUnit = document.getElementById('temp-from-unit');
            const toUnit = document.getElementById('temp-to-unit');
            const fromVal = document.getElementById('temp-from');
            const toVal = document.getElementById('temp-to');
            [fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value];
            [fromVal.value, toVal.value] = [toVal.value, fromVal.value];
            updateTemperature();
        } else if (currentCategory === 'area') {
            const fromUnit = document.getElementById('area-from-unit');
            const toUnit = document.getElementById('area-to-unit');
            const fromVal = document.getElementById('area-from');
            const toVal = document.getElementById('area-to');
            [fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value];
            [fromVal.value, toVal.value] = [toVal.value, fromVal.value];
            updateArea();
        } else if (currentCategory === 'speed') {
            const fromUnit = document.getElementById('speed-from-unit');
            const toUnit = document.getElementById('speed-to-unit');
            const fromVal = document.getElementById('speed-from');
            const toVal = document.getElementById('speed-to');
            [fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value];
            [fromVal.value, toVal.value] = [toVal.value, fromVal.value];
            updateSpeed();
        }
        showNotification('Jednotky prohozeny');
        saveSettings();
    }
    
    // Kopírování výsledku
    async function copyResult() {
        let result = '';
        if (currentCategory === 'length') {
            result = document.getElementById('length-to').value;
        } else if (currentCategory === 'weight') {
            result = document.getElementById('weight-to').value;
        } else if (currentCategory === 'volume') {
            result = document.getElementById('volume-to').value;
        } else if (currentCategory === 'temperature') {
            result = document.getElementById('temp-to').value;
        } else if (currentCategory === 'area') {
            result = document.getElementById('area-to').value;
        } else if (currentCategory === 'speed') {
            result = document.getElementById('speed-to').value;
        }
        
        if (result) {
            await copyToClipboard(result);
        } else {
            showNotification('Žádný výsledek ke kopírování', 'warning');
        }
    }
    
    // Vyčištění
    function clearAll() {
        const inputs = document.querySelectorAll('.uc-input');
        inputs.forEach(input => {
            if (!input.readOnly) input.value = '';
        });
        showNotification('Vyčištěno');
        saveSettings();
    }
    
    // Eventy
    swapBtn.addEventListener('click', swapUnits);
    copyBtn.addEventListener('click', copyResult);
    clearBtn.addEventListener('click', clearAll);
    
    // Přidání event listenerů pro všechny převody
    document.getElementById('length-from').addEventListener('input', updateLength);
    document.getElementById('length-from-unit').addEventListener('change', updateLength);
    document.getElementById('length-to-unit').addEventListener('change', updateLength);
    
    document.getElementById('weight-from').addEventListener('input', updateWeight);
    document.getElementById('weight-from-unit').addEventListener('change', updateWeight);
    document.getElementById('weight-to-unit').addEventListener('change', updateWeight);
    
    document.getElementById('volume-from').addEventListener('input', updateVolume);
    document.getElementById('volume-from-unit').addEventListener('change', updateVolume);
    document.getElementById('volume-to-unit').addEventListener('change', updateVolume);
    
    document.getElementById('temp-from').addEventListener('input', updateTemperature);
    document.getElementById('temp-from-unit').addEventListener('change', updateTemperature);
    document.getElementById('temp-to-unit').addEventListener('change', updateTemperature);
    
    document.getElementById('area-from').addEventListener('input', updateArea);
    document.getElementById('area-from-unit').addEventListener('change', updateArea);
    document.getElementById('area-to-unit').addEventListener('change', updateArea);
    
    document.getElementById('speed-from').addEventListener('input', updateSpeed);
    document.getElementById('speed-from-unit').addEventListener('change', updateSpeed);
    document.getElementById('speed-to-unit').addEventListener('change', updateSpeed);
    
    // Ukládání
    function saveSettings() {
        storage.set('category', currentCategory);
    }
    
    function loadSettings() {
        const savedCategory = storage.get('category', 'length');
        catBtns.forEach(btn => {
            if (btn.dataset.category === savedCategory) {
                btn.click();
            }
        });
    }
    
    // Počáteční výpočty
    updateLength();
    updateWeight();
    updateVolume();
    updateTemperature();
    updateArea();
    updateSpeed();
    loadSettings();
}

export function cleanup() {
    console.log('Unit Converter se zavírá');
}