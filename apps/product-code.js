import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('product-code');

export default function render(container) {
    container.innerHTML = `
        <div class="product-code-new">
            <div class="pc-header">
                <span class="pc-icon">🏷️</span>
                <div>
                    <h3>Product Code Generator</h3>
                    <p>Generuj produktové kódy, SKU, EAN a další</p>
                </div>
            </div>

            <!-- Šablony -->
            <div class="pc-section">
                <label class="pc-label">📋 Šablony</label>
                <div class="pc-templates">
                    <button data-template="custom" class="pc-template-btn active">⚙️ Vlastní</button>
                    <button data-template="sku" class="pc-template-btn">📦 SKU</button>
                    <button data-template="ean13" class="pc-template-btn">📊 EAN-13</button>
                    <button data-template="isbn13" class="pc-template-btn">📚 ISBN-13</button>
                    <button data-template="imei" class="pc-template-btn">📱 IMEI</button>
                </div>
            </div>

            <!-- Prefix a Suffix -->
            <div class="pc-section">
                <label class="pc-label">✏️ Vlastní základ</label>
                <div class="pc-row">
                    <div class="pc-input-group">
                        <span class="pc-input-label">Prefix</span>
                        <input type="text" id="pc-prefix" class="pc-input" placeholder="PROD-" value="PROD-">
                    </div>
                    <div class="pc-input-group">
                        <span class="pc-input-label">Suffix</span>
                        <input type="text" id="pc-suffix" class="pc-input" placeholder="-CZ" value="-CZ">
                    </div>
                </div>
            </div>

            <!-- Délka a typ znaků -->
            <div class="pc-section">
                <label class="pc-label">⚙️ Nastavení kódu</label>
                <div class="pc-row">
                    <div class="pc-input-group">
                        <span class="pc-input-label">Délka</span>
                        <div class="pc-length-control">
                            <button id="pc-length-minus" class="pc-length-btn">−</button>
                            <input type="number" id="pc-length" class="pc-length-input" value="5" min="1" max="20">
                            <button id="pc-length-plus" class="pc-length-btn">+</button>
                        </div>
                    </div>
                    <div class="pc-input-group">
                        <span class="pc-input-label">Typ znaků</span>
                        <select id="pc-type" class="pc-select">
                            <option value="digits">🔢 Jen číslice (0-9)</option>
                            <option value="letters">🔤 Jen písmena (A-Z)</option>
                            <option value="mixed">🔀 Mix (0-9 A-Z)</option>
                            <option value="safe">🛡️ Bez podobných (0,O,I)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Formát a kontrolní součet -->
            <div class="pc-section">
                <div class="pc-row">
                    <div class="pc-input-group">
                        <span class="pc-input-label">Formát</span>
                        <select id="pc-format" class="pc-select">
                            <option value="plain">🔢 Jen číslo (12345)</option>
                            <option value="prefix">🏷️ Prefix (PROD-12345)</option>
                            <option value="suffix">🔖 Suffix (12345-CZ)</option>
                            <option value="full">🎯 Plný (PROD-12345-CZ)</option>
                        </select>
                    </div>
                    <div class="pc-input-group">
                        <span class="pc-input-label">Kontrolní součet</span>
                        <select id="pc-checksum" class="pc-select">
                            <option value="none">❌ Bez kontroly</option>
                            <option value="luhn">🔐 Luhn (karty, IMEI)</option>
                            <option value="ean">📦 EAN (čárové kódy)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Počet kódů -->
            <div class="pc-section">
                <label class="pc-label">🔢 Počet kódů</label>
                <div class="pc-count-control">
                    <button id="pc-count-minus" class="pc-count-btn">−</button>
                    <input type="number" id="pc-count" class="pc-count-input" value="1" min="1" max="100">
                    <button id="pc-count-plus" class="pc-count-btn">+</button>
                </div>
                <div class="pc-hint">Až 100 kódů najednou</div>
            </div>

            <!-- Možnosti -->
            <div class="pc-section">
                <div class="pc-options">
                    <label class="pc-checkbox">
                        <input type="checkbox" id="pc-unique">
                        <span>🔄 Unikátní kódy (bez opakování)</span>
                    </label>
                    <label class="pc-checkbox">
                        <input type="checkbox" id="pc-sort">
                        <span>📊 Seřadit výsledky</span>
                    </label>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="pc-buttons">
                <button id="pc-generate" class="pc-btn pc-btn-primary">✨ Generovat kódy</button>
                <button id="pc-clear" class="pc-btn pc-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="pc-result-section">
                <div class="pc-result-header">
                    <span>📊 Vygenerované kódy</span>
                    <button id="pc-copy-all" class="pc-small-btn">📋 Kopírovat vše</button>
                    <button id="pc-clear-result" class="pc-small-btn">🗑️ Smazat výsledky</button>
                </div>
                <div id="pc-result" class="pc-result">
                    <div class="pc-empty">Vyber nastavení a klikni na "Generovat kódy"</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="pc-tip">
                💡 <strong>Tip:</strong> Můžeš generovat až 100 unikátních kódů najednou. Každý kód lze zkopírovat jednotlivě kliknutím na 📋.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const templateBtns = document.querySelectorAll('.pc-template-btn');
    const prefixInput = document.getElementById('pc-prefix');
    const suffixInput = document.getElementById('pc-suffix');
    const lengthInput = document.getElementById('pc-length');
    const lengthMinus = document.getElementById('pc-length-minus');
    const lengthPlus = document.getElementById('pc-length-plus');
    const typeSelect = document.getElementById('pc-type');
    const formatSelect = document.getElementById('pc-format');
    const checksumSelect = document.getElementById('pc-checksum');
    const countInput = document.getElementById('pc-count');
    const countMinus = document.getElementById('pc-count-minus');
    const countPlus = document.getElementById('pc-count-plus');
    const uniqueCheck = document.getElementById('pc-unique');
    const sortCheck = document.getElementById('pc-sort');
    const generateBtn = document.getElementById('pc-generate');
    const clearBtn = document.getElementById('pc-clear');
    const copyAllBtn = document.getElementById('pc-copy-all');
    const clearResultBtn = document.getElementById('pc-clear-result');
    const resultDiv = document.getElementById('pc-result');

    // Šablony
    const templates = {
        custom: { prefix: 'PROD-', suffix: '-CZ', length: 5, type: 'digits', format: 'full', checksum: 'none' },
        sku: { prefix: 'SKU-', suffix: '', length: 8, type: 'mixed', format: 'prefix', checksum: 'none' },
        ean13: { prefix: '', suffix: '', length: 12, type: 'digits', format: 'plain', checksum: 'ean' },
        isbn13: { prefix: '978-', suffix: '', length: 9, type: 'digits', format: 'prefix', checksum: 'isbn13' },
        imei: { prefix: '', suffix: '', length: 14, type: 'digits', format: 'plain', checksum: 'luhn' }
    };

    const charSets = {
        digits: '0123456789',
        letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        mixed: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        safe: '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    };

    let currentCodes = [];

    // Aplikování šablony
    function applyTemplate(templateId) {
        const tmpl = templates[templateId];
        if (!tmpl) return;
        
        prefixInput.value = tmpl.prefix;
        suffixInput.value = tmpl.suffix;
        lengthInput.value = tmpl.length;
        typeSelect.value = tmpl.type;
        formatSelect.value = tmpl.format;
        checksumSelect.value = tmpl.checksum;
        
        showNotification(`Šablona ${templateId.toUpperCase()} načtena`, 'info');
        saveSettings();
    }

    // Generování náhodného kódu
    function generateRandomPart(length, type) {
        const chars = charSets[type] || charSets.digits;
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    // Luhn checksum
    function luhnChecksum(code) {
        let sum = 0;
        let alternate = false;
        for (let i = code.length - 1; i >= 0; i--) {
            let n = parseInt(code[i], 10);
            if (alternate) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum * 9) % 10;
    }

    // EAN checksum
    function eanChecksum(code) {
        let sum = 0;
        for (let i = 0; i < code.length; i++) {
            const digit = parseInt(code[i], 10);
            sum += (i % 2 === 0) ? digit * 1 : digit * 3;
        }
        return (10 - (sum % 10)) % 10;
    }

    // ISBN-13 checksum
    function isbn13Checksum(code) {
        let sum = 0;
        for (let i = 0; i < code.length; i++) {
            const digit = parseInt(code[i], 10);
            sum += (i % 2 === 0) ? digit * 1 : digit * 3;
        }
        return (10 - (sum % 10)) % 10;
    }

    // Formátování kódu
    function formatCode(code, prefix, suffix, format) {
        if (format === 'plain') return code;
        if (format === 'prefix') return prefix + code;
        if (format === 'suffix') return code + suffix;
        if (format === 'full') return prefix + code + suffix;
        return code;
    }

    // Generování jednoho kódu
    function generateSingleCode() {
        let length = parseInt(lengthInput.value) || 5;
        const type = typeSelect.value;
        const prefix = prefixInput.value || '';
        const suffix = suffixInput.value || '';
        const format = formatSelect.value;
        const checksum = checksumSelect.value;
        
        let randomPart = generateRandomPart(length, type);
        
        if (checksum === 'luhn') {
            const check = luhnChecksum(randomPart);
            randomPart = randomPart + check;
        } else if (checksum === 'ean') {
            const check = eanChecksum(randomPart);
            randomPart = randomPart + check;
        } else if (checksum === 'isbn13') {
            const check = isbn13Checksum(randomPart);
            randomPart = randomPart + check;
        }
        
        return formatCode(randomPart, prefix, suffix, format);
    }

    // Generování více kódů
    function generateCodes() {
        let count = parseInt(countInput.value) || 1;
        const unique = uniqueCheck.checked;
        const sort = sortCheck.checked;
        
        if (count > 100) count = 100;
        
        const codes = [];
        const used = new Set();
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let code;
            do {
                code = generateSingleCode();
                attempts++;
                if (attempts > 100) break;
            } while (unique && used.has(code));
            
            used.add(code);
            codes.push(code);
        }
        
        if (sort) {
            codes.sort();
        }
        
        currentCodes = codes;
        displayResults(codes);
        
        showNotification(`Vygenerováno ${codes.length} kódů`, 'success');
        saveSettings();
    }

    // Zobrazení výsledků
    function displayResults(codes) {
        if (codes.length === 0) {
            resultDiv.innerHTML = '<div class="pc-empty">Vyber nastavení a klikni na "Generovat kódy"</div>';
            return;
        }
        
        resultDiv.innerHTML = codes.map((code, index) => `
            <div class="pc-result-item">
                <span class="pc-result-number">${index + 1}.</span>
                <span class="pc-result-code">${escapeHtml(code)}</span>
                <button class="pc-result-copy" data-code="${escapeHtml(code)}">📋</button>
            </div>
        `).join('');
        
        // Eventy pro jednotlivé kopírovací tlačítka
        document.querySelectorAll('.pc-result-copy').forEach(btn => {
            btn.addEventListener('click', async () => {
                const code = btn.dataset.code;
                await copyToClipboard(code);
                showNotification(`Zkopírováno: ${code}`);
            });
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

    async function copyAllCodes() {
        if (currentCodes.length === 0) {
            showNotification('Žádné kódy ke kopírování', 'warning');
            return;
        }
        
        const text = currentCodes.join('\n');
        await copyToClipboard(text);
        showNotification(`Zkopírováno ${currentCodes.length} kódů`);
    }

    function clearResult() {
        currentCodes = [];
        resultDiv.innerHTML = '<div class="pc-empty">Vyber nastavení a klikni na "Generovat kódy"</div>';
        showNotification('Výsledky smazány');
    }

    function clearAll() {
        prefixInput.value = 'PROD-';
        suffixInput.value = '-CZ';
        lengthInput.value = '5';
        typeSelect.value = 'digits';
        formatSelect.value = 'full';
        checksumSelect.value = 'none';
        countInput.value = '1';
        uniqueCheck.checked = false;
        sortCheck.checked = false;
        currentCodes = [];
        resultDiv.innerHTML = '<div class="pc-empty">Vyber nastavení a klikni na "Generovat kódy"</div>';
        
        // Aktivace vlastní šablony
        templateBtns.forEach(btn => {
            if (btn.dataset.template === 'custom') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Eventy
    templateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            templateBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyTemplate(btn.dataset.template);
        });
    });
    
    lengthMinus.addEventListener('click', () => {
        let val = parseInt(lengthInput.value);
        if (val > 1) lengthInput.value = val - 1;
        saveSettings();
    });
    
    lengthPlus.addEventListener('click', () => {
        let val = parseInt(lengthInput.value);
        if (val < 20) lengthInput.value = val + 1;
        saveSettings();
    });
    
    countMinus.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val > 1) countInput.value = val - 1;
        saveSettings();
    });
    
    countPlus.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val < 100) countInput.value = val + 1;
        saveSettings();
    });
    
    generateBtn.addEventListener('click', generateCodes);
    clearBtn.addEventListener('click', clearAll);
    copyAllBtn.addEventListener('click', copyAllCodes);
    clearResultBtn.addEventListener('click', clearResult);
    
    prefixInput.addEventListener('input', saveSettings);
    suffixInput.addEventListener('input', saveSettings);
    lengthInput.addEventListener('input', saveSettings);
    typeSelect.addEventListener('change', saveSettings);
    formatSelect.addEventListener('change', saveSettings);
    checksumSelect.addEventListener('change', saveSettings);
    countInput.addEventListener('input', saveSettings);
    uniqueCheck.addEventListener('change', saveSettings);
    sortCheck.addEventListener('change', saveSettings);

    // Ukládání/načítání
    function saveSettings() {
        storage.set('prefix', prefixInput.value);
        storage.set('suffix', suffixInput.value);
        storage.set('length', lengthInput.value);
        storage.set('type', typeSelect.value);
        storage.set('format', formatSelect.value);
        storage.set('checksum', checksumSelect.value);
        storage.set('count', countInput.value);
        storage.set('unique', uniqueCheck.checked);
        storage.set('sort', sortCheck.checked);
    }
    
    function loadSettings() {
        prefixInput.value = storage.get('prefix', 'PROD-');
        suffixInput.value = storage.get('suffix', '-CZ');
        lengthInput.value = storage.get('length', '5');
        typeSelect.value = storage.get('type', 'digits');
        formatSelect.value = storage.get('format', 'full');
        checksumSelect.value = storage.get('checksum', 'none');
        countInput.value = storage.get('count', '1');
        uniqueCheck.checked = storage.get('unique', false);
        sortCheck.checked = storage.get('sort', false);
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Product Code Generator se zavírá');
}