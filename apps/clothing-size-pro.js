import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('clothing-size-pro');

export default function render(container) {
    container.innerHTML = `
        <div class="clothing-size-pro">
            <div class="csp-header">
                <span class="csp-icon">👕</span>
                <div>
                    <h3>Převod velikostí oblečení</h3>
                    <p>Převodník velikostí pro EU, US, UK, INT, FR, IT</p>
                </div>
            </div>

            <!-- Kategorie -->
            <div class="csp-section">
                <label class="csp-label">📂 Kategorie</label>
                <div class="csp-categories">
                    <button data-cat="mens" class="csp-cat-btn active">👨 Pánské</button>
                    <button data-cat="womens" class="csp-cat-btn">👩 Dámské</button>
                    <button data-cat="kids" class="csp-cat-btn">🧒 Dětské</button>
                    <button data-cat="shoes" class="csp-cat-btn">👟 Boty</button>
                    <button data-cat="jeans" class="csp-cat-btn">👖 Džíny (W/L)</button>
                </div>
            </div>

            <!-- Typ produktu -->
            <div class="csp-section">
                <label class="csp-label">📦 Typ</label>
                <div id="csp-type-container" class="csp-types"></div>
            </div>

            <!-- Zdrojová velikost -->
            <div class="csp-section">
                <label class="csp-label">📏 Zdrojová velikost</label>
                <div class="csp-row">
                    <div class="csp-input-group">
                        <select id="csp-from-system" class="csp-select">
                            <option value="eu">EU (Evropa)</option>
                            <option value="us">US / UK</option>
                            <option value="uk">UK (Velká Británie)</option>
                            <option value="int">INT (S,M,L,XL)</option>
                            <option value="fr">FR (Francie)</option>
                            <option value="it">IT (Itálie)</option>
                        </select>
                    </div>
                    <div class="csp-input-group">
                        <select id="csp-from-size" class="csp-select"></select>
                    </div>
                </div>
            </div>

            <!-- Cílová velikost -->
            <div class="csp-section">
                <label class="csp-label">🎯 Cílová velikost</label>
                <div class="csp-row">
                    <div class="csp-input-group">
                        <select id="csp-to-system" class="csp-select">
                            <option value="eu">EU (Evropa)</option>
                            <option value="us" selected>US / UK</option>
                            <option value="uk">UK (Velká Británie)</option>
                            <option value="int">INT (S,M,L,XL)</option>
                            <option value="fr">FR (Francie)</option>
                            <option value="it">IT (Itálie)</option>
                        </select>
                    </div>
                    <div class="csp-input-group">
                        <input type="text" id="csp-result" class="csp-input csp-result" readonly placeholder="Výsledek">
                    </div>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="csp-buttons">
                <button id="csp-convert" class="csp-btn csp-btn-primary">🔄 Převést</button>
                <button id="csp-swap" class="csp-btn csp-btn-secondary">↔️ Prohodit systémy</button>
                <button id="csp-clear" class="csp-btn csp-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Tabulka velikostí -->
            <details class="csp-details" open>
                <summary>📋 Tabulka velikostí</summary>
                <div id="csp-size-chart" class="csp-size-chart">
                    <div class="csp-chart-loading">Načítání tabulky...</div>
                </div>
            </details>

            <!-- Tip -->
            <div class="csp-tip">
                💡 <strong>Tip:</strong> Velikosti se mohou lišit podle značky. Tento převodník je orientační. U džínů platí W = pas (inches), L = délka (inches).
            </div>
        </div>
    `;

    // ========== VELIKOSTNÍ TABULKY ==========
    const sizeTables = {
        mens: {
            shirt: { eu: [44,46,48,50,52,54,56], us: ['XS','S','M','L','XL','XXL','3XL'], uk: ['XS','S','M','L','XL','XXL','3XL'], int: ['XS','S','M','L','XL','XXL','3XL'], fr: [44,46,48,50,52,54,56], it: [44,46,48,50,52,54,56] },
            pants: { eu: [44,46,48,50,52,54,56], us: ['28','30','32','34','36','38','40'], uk: ['28','30','32','34','36','38','40'], int: ['XS','S','M','L','XL','XXL','3XL'], fr: [44,46,48,50,52,54,56], it: [44,46,48,50,52,54,56] },
            jacket: { eu: [44,46,48,50,52,54,56], us: ['XS','S','M','L','XL','XXL','3XL'], uk: ['XS','S','M','L','XL','XXL','3XL'], int: ['XS','S','M','L','XL','XXL','3XL'], fr: [44,46,48,50,52,54,56], it: [44,46,48,50,52,54,56] }
        },
        womens: {
            shirt: { eu: [32,34,36,38,40,42,44], us: ['XS','S','M','L','XL','XXL','3XL'], uk: [6,8,10,12,14,16,18], int: ['XS','S','M','L','XL','XXL','3XL'], fr: [34,36,38,40,42,44,46], it: [38,40,42,44,46,48,50] },
            pants: { eu: [32,34,36,38,40,42,44], us: [2,4,6,8,10,12,14], uk: [6,8,10,12,14,16,18], int: ['XS','S','M','L','XL','XXL','3XL'], fr: [34,36,38,40,42,44,46], it: [38,40,42,44,46,48,50] },
            jacket: { eu: [32,34,36,38,40,42,44], us: ['XS','S','M','L','XL','XXL','3XL'], uk: [6,8,10,12,14,16,18], int: ['XS','S','M','L','XL','XXL','3XL'], fr: [34,36,38,40,42,44,46], it: [38,40,42,44,46,48,50] }
        },
        kids: {
            clothes: { eu: [98,104,110,116,122,128,134,140], us: ['4T','5T','6','7','8','10','12','14'], uk: [3,4,5,6,7,8,9,10], int: ['XS','S','M','L','XL','XXL','3XL','4XL'], fr: [98,104,110,116,122,128,134,140], it: [98,104,110,116,122,128,134,140] }
        },
        shoes: {
            mens: { eu: [39,40,41,42,43,44,45,46,47,48], us: [6,7,8,9,10,11,12,13,14,15], uk: [5,6,7,8,9,10,11,12,13,14], int: [39,40,41,42,43,44,45,46,47,48], fr: [39,40,41,42,43,44,45,46,47,48], it: [39,40,41,42,43,44,45,46,47,48] },
            womens: { eu: [35,36,37,38,39,40,41,42,43,44], us: [5,6,7,8,9,10,11,12,13,14], uk: [3,4,5,6,7,8,9,10,11,12], int: [35,36,37,38,39,40,41,42,43,44], fr: [35,36,37,38,39,40,41,42,43,44], it: [35,36,37,38,39,40,41,42,43,44] },
            kids: { eu: [20,21,22,23,24,25,26,27,28,29], us: [4,5,6,7,8,9,10,11,12,13], uk: [3,4,5,6,7,8,9,10,11,12], int: [20,21,22,23,24,25,26,27,28,29], fr: [20,21,22,23,24,25,26,27,28,29], it: [20,21,22,23,24,25,26,27,28,29] }
        },
        jeans: {
            mens: { waist: [28,29,30,31,32,33,34,35,36,38,40], length: [30,32,34,36] },
            womens: { waist: [24,25,26,27,28,29,30,31,32,33,34], length: [30,32,34] }
        }
    };

    // ========== DOM elementy ==========
    const catBtns = document.querySelectorAll('.csp-cat-btn');
    const typeContainer = document.getElementById('csp-type-container');
    const fromSystem = document.getElementById('csp-from-system');
    const fromSize = document.getElementById('csp-from-size');
    const toSystem = document.getElementById('csp-to-system');
    const resultInput = document.getElementById('csp-result');
    const convertBtn = document.getElementById('csp-convert');
    const swapBtn = document.getElementById('csp-swap');
    const clearBtn = document.getElementById('csp-clear');
    const sizeChartDiv = document.getElementById('csp-size-chart');

    let currentCategory = 'mens';
    let currentType = 'shirt';
    let currentSubcategory = 'mens';

    function getCurrentTable() {
        if (currentCategory === 'mens') return sizeTables.mens[currentType];
        if (currentCategory === 'womens') return sizeTables.womens[currentType];
        if (currentCategory === 'kids') return sizeTables.kids.clothes;
        if (currentCategory === 'shoes') return sizeTables.shoes[currentSubcategory];
        if (currentCategory === 'jeans') return null; // Džíny mají speciální zobrazení
        return null;
    }

    function updateTypes() {
        if (currentCategory === 'mens') {
            typeContainer.innerHTML = `
                <button data-type="shirt" class="csp-type-btn ${currentType === 'shirt' ? 'active' : ''}">👕 Tričko / Košile</button>
                <button data-type="pants" class="csp-type-btn ${currentType === 'pants' ? 'active' : ''}">👖 Kalhoty</button>
                <button data-type="jacket" class="csp-type-btn ${currentType === 'jacket' ? 'active' : ''}">🧥 Bunda</button>
            `;
        } else if (currentCategory === 'womens') {
            typeContainer.innerHTML = `
                <button data-type="shirt" class="csp-type-btn ${currentType === 'shirt' ? 'active' : ''}">👕 Tričko / Košile</button>
                <button data-type="pants" class="csp-type-btn ${currentType === 'pants' ? 'active' : ''}">👖 Kalhoty</button>
                <button data-type="jacket" class="csp-type-btn ${currentType === 'jacket' ? 'active' : ''}">🧥 Bunda</button>
            `;
        } else if (currentCategory === 'kids') {
            typeContainer.innerHTML = `
                <button data-type="clothes" class="csp-type-btn active">👕 Oblečení</button>
            `;
            currentType = 'clothes';
        } else if (currentCategory === 'shoes') {
            typeContainer.innerHTML = `
                <button data-type="mens" class="csp-type-btn ${currentSubcategory === 'mens' ? 'active' : ''}">👨 Pánské boty</button>
                <button data-type="womens" class="csp-type-btn ${currentSubcategory === 'womens' ? 'active' : ''}">👩 Dámské boty</button>
                <button data-type="kids" class="csp-type-btn ${currentSubcategory === 'kids' ? 'active' : ''}">🧒 Dětské boty</button>
            `;
        } else if (currentCategory === 'jeans') {
            typeContainer.innerHTML = `
                <button data-type="mens" class="csp-type-btn ${currentSubcategory === 'mens' ? 'active' : ''}">👨 Pánské džíny</button>
                <button data-type="womens" class="csp-type-btn ${currentSubcategory === 'womens' ? 'active' : ''}">👩 Dámské džíny</button>
            `;
        }
        
        document.querySelectorAll('.csp-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.csp-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const type = btn.dataset.type;
                if (currentCategory === 'shoes' || currentCategory === 'jeans') {
                    currentSubcategory = type;
                } else {
                    currentType = type;
                }
                updateSizeSelect();
                updateSizeChart();
                saveSettings();
            });
        });
        
        updateSizeSelect();
        updateSizeChart();
    }

    function updateSizeSelect() {
        const table = getCurrentTable();
        
        if (currentCategory === 'jeans') {
            fromSize.innerHTML = '<option value="">Vyber velikost</option>';
            return;
        }
        
        if (!table) {
            fromSize.innerHTML = '<option value="">-</option>';
            return;
        }
        
        const sizes = table[fromSystem.value];
        if (sizes && Array.isArray(sizes)) {
            fromSize.innerHTML = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
            const middleIndex = Math.floor(sizes.length / 2);
            fromSize.value = sizes[middleIndex] || sizes[0];
        } else {
            fromSize.innerHTML = '<option value="">-</option>';
        }
        
        convert();
    }

    function convert() {
        if (currentCategory === 'jeans') {
            resultInput.value = 'Pro džíny použij tabulku níže';
            return;
        }
        
        const table = getCurrentTable();
        if (!table) {
            resultInput.value = '?';
            return;
        }
        
        const fromVal = fromSize.value;
        const fromSys = fromSystem.value;
        const toSys = toSystem.value;
        
        const fromArray = table[fromSys];
        const toArray = table[toSys];
        
        if (!fromArray || !toArray || !Array.isArray(fromArray) || !Array.isArray(toArray) || fromVal === '') {
            resultInput.value = '?';
            return;
        }
        
        const index = fromArray.indexOf(fromVal);
        if (index === -1 || index >= toArray.length) {
            resultInput.value = '?';
            return;
        }
        
        resultInput.value = toArray[index];
    }

    function swapSystems() {
        const fromSys = fromSystem.value;
        const toSys = toSystem.value;
        fromSystem.value = toSys;
        toSystem.value = fromSys;
        updateSizeSelect();
        showNotification('Systémy prohozeny');
        saveSettings();
    }

    function clearAll() {
        fromSystem.value = 'eu';
        toSystem.value = 'us';
        updateSizeSelect();
        resultInput.value = '';
        showNotification('Vyčištěno');
        saveSettings();
    }

    function updateSizeChart() {
        if (currentCategory === 'jeans') {
            const data = sizeTables.jeans[currentSubcategory];
            if (!data) {
                sizeChartDiv.innerHTML = '<div class="csp-chart-empty">Tabulka není k dispozici</div>';
                return;
            }
            
            sizeChartDiv.innerHTML = `
                <div class="csp-chart-table">
                    <table>
                        <thead>
                            <tr><th>W (pas v inches)</th><th>L (délka v inches)</th></tr>
                        </thead>
                        <tbody>
                            ${data.waist.map(w => `<tr><td>${w}</td><td>${data.length.join(', ')}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            return;
        }
        
        const table = getCurrentTable();
        if (!table) {
            sizeChartDiv.innerHTML = '<div class="csp-chart-empty">Tabulka není k dispozici</div>';
            return;
        }
        
        const systems = ['eu', 'us', 'uk', 'int', 'fr', 'it'];
        const systemNames = { eu: 'EU', us: 'US', uk: 'UK', int: 'INT', fr: 'FR', it: 'IT' };
        
        let html = '<div class="csp-chart-table"><table><thead><tr>';
        systems.forEach(sys => {
            html += `<th>${systemNames[sys]}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        const maxRows = Math.max(...systems.map(sys => table[sys]?.length || 0));
        for (let i = 0; i < maxRows; i++) {
            html += '<tr>';
            systems.forEach(sys => {
                const val = table[sys]?.[i] || '-';
                html += `<td>${val}</td>`;
            });
            html += '</tr>';
        }
        html += '</tbody></table></div>';
        
        sizeChartDiv.innerHTML = html;
    }

    // Eventy
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            
            // Reset typů podle kategorie
            if (currentCategory === 'mens') currentType = 'shirt';
            if (currentCategory === 'womens') currentType = 'shirt';
            if (currentCategory === 'kids') currentType = 'clothes';
            if (currentCategory === 'shoes') currentSubcategory = 'mens';
            if (currentCategory === 'jeans') currentSubcategory = 'mens';
            
            updateTypes();
            saveSettings();
        });
    });
    
    fromSystem.addEventListener('change', () => {
        updateSizeSelect();
        saveSettings();
    });
    toSystem.addEventListener('change', () => {
        convert();
        saveSettings();
    });
    fromSize.addEventListener('change', convert);
    
    convertBtn.addEventListener('click', convert);
    swapBtn.addEventListener('click', swapSystems);
    clearBtn.addEventListener('click', clearAll);
    
    function saveSettings() {
        storage.set('category', currentCategory);
        storage.set('type', currentType);
        storage.set('subcategory', currentSubcategory);
        storage.set('fromSystem', fromSystem.value);
        storage.set('toSystem', toSystem.value);
    }
    
    function loadSettings() {
        currentCategory = storage.get('category', 'mens');
        currentType = storage.get('type', 'shirt');
        currentSubcategory = storage.get('subcategory', 'mens');
        fromSystem.value = storage.get('fromSystem', 'eu');
        toSystem.value = storage.get('toSystem', 'us');
        
        catBtns.forEach(btn => {
            if (btn.dataset.cat === currentCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        updateTypes();
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Clothing Size Pro se zavírá');
}