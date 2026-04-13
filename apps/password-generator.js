import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('password-generator');

export default function render(container) {
    container.innerHTML = `
        <div class="password-generator-v2">
            <div class="pgv2-header">
                <span class="pgv2-icon">🔐</span>
                <div>
                    <h3>Generátor hesel</h3>
                    <p>Vytvoř si heslo přesně podle svých představ</p>
                </div>
            </div>

            <!-- HESLO -->
            <div class="pgv2-password-area">
                <div class="pgv2-password" id="pgv2-password">········</div>
                <button class="pgv2-copy-btn" id="pgv2-copy">📋 Kopírovat</button>
            </div>

            <!-- TLAČÍTKO GENEROVAT (HNED POD HESLEM) -->
            <button class="pgv2-btn pgv2-btn-primary pgv2-generate-top" id="pgv2-generate">✨ Generovat heslo</button>

            <!-- VLASTNÍ ZÁKLAD -->
            <div class="pgv2-section">
                <label class="pgv2-label">
                    <span>✏️ Vlastní základ (nepovinné)</span>
                    <small>Přidá tvůj text na začátek nebo konec hesla</small>
                </label>
                <div class="pgv2-custom-row">
                    <input type="text" id="pgv2-custom-prefix" placeholder="Předpona (např. MojeHeslo)" class="pgv2-input">
                    <span class="pgv2-custom-sep">+</span>
                    <input type="text" id="pgv2-custom-suffix" placeholder="Přípona (např. 2024)" class="pgv2-input">
                </div>
            </div>

            <!-- DÉLKA -->
            <div class="pgv2-section">
                <label class="pgv2-label">
                    <span>📏 Délka náhodné části</span>
                    <small>Čím delší, tím bezpečnější</small>
                </label>
                <div class="pgv2-length-control">
                    <button class="pgv2-length-btn" id="pgv2-length-minus">−</button>
                    <input type="number" id="pgv2-length" class="pgv2-length-input" value="12" min="4" max="32" step="1">
                    <button class="pgv2-length-btn" id="pgv2-length-plus">+</button>
                </div>
                <div class="pgv2-length-hint">
                    <span>Krátké (4-8)</span>
                    <span>Doporučeno (12-16)</span>
                    <span>Silné (20+)</span>
                </div>
            </div>

            <!-- ZNAKY -->
            <div class="pgv2-section">
                <label class="pgv2-label">🔤 Povolené znaky</label>
                <div class="pgv2-chips">
                    <button data-type="uppercase" class="pgv2-chip active">A-Z Velká</button>
                    <button data-type="lowercase" class="pgv2-chip active">a-z Malá</button>
                    <button data-type="numbers" class="pgv2-chip active">0-9 Čísla</button>
                    <button data-type="symbols" class="pgv2-chip">!@#$% Symboly</button>
                </div>
            </div>

            <!-- DOPLŇUJÍCÍ MOŽNOSTI -->
            <div class="pgv2-section">
                <div class="pgv2-extra">
                    <label class="pgv2-extra-label">
                        <input type="checkbox" id="pgv2-avoid-ambiguous">
                        <span>🚫 Vyhýbat se podobným znakům (0O, 1lI)</span>
                    </label>
                    <label class="pgv2-extra-label">
                        <input type="checkbox" id="pgv2-ensure-all">
                        <span>✅ Zajistit alespoň jeden znak z každé vybrané kategorie</span>
                    </label>
                </div>
            </div>

            <!-- TIP -->
            <div class="pgv2-tip">
                💡 <strong>Tip:</strong> Používej dlouhá hesla (12+ znaků) a kombinuj různé typy znaků.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const passwordEl = document.getElementById('pgv2-password');
    const generateBtn = document.getElementById('pgv2-generate');
    const copyBtn = document.getElementById('pgv2-copy');
    const lengthInput = document.getElementById('pgv2-length');
    const lengthMinus = document.getElementById('pgv2-length-minus');
    const lengthPlus = document.getElementById('pgv2-length-plus');
    const customPrefix = document.getElementById('pgv2-custom-prefix');
    const customSuffix = document.getElementById('pgv2-custom-suffix');
    const avoidAmbiguous = document.getElementById('pgv2-avoid-ambiguous');
    const ensureAll = document.getElementById('pgv2-ensure-all');
    
    // Znakové sady
    const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };
    
    const ambiguousChars = '0OIl1|';
    
    function removeAmbiguous(str) {
        return str.split('').filter(c => !ambiguousChars.includes(c)).join('');
    }
    
    function getActiveCharSets() {
        const active = [];
        document.querySelectorAll('.pgv2-chip.active').forEach(chip => {
            const type = chip.dataset.type;
            if (type && charSets[type]) active.push(type);
        });
        return active;
    }
    
    function getAllowedChars() {
        const activeTypes = getActiveCharSets();
        let chars = '';
        for (const type of activeTypes) {
            chars += charSets[type];
        }
        if (avoidAmbiguous.checked) {
            chars = removeAmbiguous(chars);
        }
        return chars;
    }
    
    function generateRandomPart(length) {
        const chars = getAllowedChars();
        if (!chars.length) return '';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }
    
    function ensureAllCategories(password, length) {
        const activeTypes = getActiveCharSets();
        let result = password;
        
        for (const type of activeTypes) {
            const chars = charSets[type];
            let hasChar = false;
            for (const c of result) {
                if (chars.includes(c)) {
                    hasChar = true;
                    break;
                }
            }
            if (!hasChar && chars.length) {
                const pos = Math.floor(Math.random() * result.length);
                const safeChars = avoidAmbiguous.checked ? removeAmbiguous(chars) : chars;
                const newChar = safeChars[Math.floor(Math.random() * safeChars.length)];
                result = result.substring(0, pos) + newChar + result.substring(pos + 1);
            }
        }
        return result;
    }
    
    function generatePassword() {
        const length = parseInt(lengthInput.value) || 12;
        const prefix = customPrefix.value || '';
        const suffix = customSuffix.value || '';
        
        let randomLength = length - prefix.length - suffix.length;
        if (randomLength < 4) randomLength = 4;
        
        let randomPart = generateRandomPart(randomLength);
        
        if (ensureAll.checked && getActiveCharSets().length > 1) {
            randomPart = ensureAllCategories(randomPart, randomLength);
        }
        
        let password = prefix + randomPart + suffix;
        
        if (password.length > length) {
            password = password.substring(0, length);
        }
        
        return password;
    }
    
    function updatePassword() {
        const newPassword = generatePassword();
        passwordEl.textContent = newPassword;
    }
    
    async function copyPassword() {
        const password = passwordEl.textContent;
        if (password && password !== '········') {
            await copyToClipboard(password);
        } else {
            showNotification('Nejprve vygeneruj heslo', 'warning');
        }
    }
    
    // Chipy
    function initChips() {
        document.querySelectorAll('.pgv2-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                updatePassword();
                saveSettings();
            });
        });
    }
    
    // Délka +/-
    lengthMinus.addEventListener('click', () => {
        let val = parseInt(lengthInput.value);
        if (val > 4) lengthInput.value = val - 1;
        updatePassword();
        saveSettings();
    });
    
    lengthPlus.addEventListener('click', () => {
        let val = parseInt(lengthInput.value);
        if (val < 32) lengthInput.value = val + 1;
        updatePassword();
        saveSettings();
    });
    
    lengthInput.addEventListener('change', () => {
        let val = parseInt(lengthInput.value);
        if (isNaN(val)) val = 12;
        if (val < 4) val = 4;
        if (val > 32) val = 32;
        lengthInput.value = val;
        updatePassword();
        saveSettings();
    });
    
    // Eventy
    generateBtn.addEventListener('click', updatePassword);
    copyBtn.addEventListener('click', copyPassword);
    customPrefix.addEventListener('input', () => { updatePassword(); saveSettings(); });
    customSuffix.addEventListener('input', () => { updatePassword(); saveSettings(); });
    avoidAmbiguous.addEventListener('change', () => { updatePassword(); saveSettings(); });
    ensureAll.addEventListener('change', () => { updatePassword(); saveSettings(); });
    
    // Ukládání/načítání
    function saveSettings() {
        const activeTypes = [];
        document.querySelectorAll('.pgv2-chip.active').forEach(chip => {
            activeTypes.push(chip.dataset.type);
        });
        storage.set('activeTypes', activeTypes);
        storage.set('length', lengthInput.value);
        storage.set('customPrefix', customPrefix.value);
        storage.set('customSuffix', customSuffix.value);
        storage.set('avoidAmbiguous', avoidAmbiguous.checked);
        storage.set('ensureAll', ensureAll.checked);
    }
    
    function loadSettings() {
        const savedLength = storage.get('length', 12);
        lengthInput.value = savedLength;
        
        customPrefix.value = storage.get('customPrefix', '');
        customSuffix.value = storage.get('customSuffix', '');
        avoidAmbiguous.checked = storage.get('avoidAmbiguous', false);
        ensureAll.checked = storage.get('ensureAll', true);
        
        const savedTypes = storage.get('activeTypes', ['uppercase', 'lowercase', 'numbers']);
        if (savedTypes && savedTypes.length) {
            document.querySelectorAll('.pgv2-chip').forEach(chip => {
                if (savedTypes.includes(chip.dataset.type)) {
                    chip.classList.add('active');
                } else {
                    chip.classList.remove('active');
                }
            });
        }
    }
    
    initChips();
    loadSettings();
    updatePassword();
}