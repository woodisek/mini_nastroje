import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('diacritic-remover');

export default function render(container) {
    container.innerHTML = `
        <div class="diacritic-remover">
            <div class="dr-header">
                <span class="dr-icon">🔤</span>
                <div>
                    <h3>Odstraňovač diakritiky</h3>
                    <p>Převeď text s diakritikou na prostý text</p>
                </div>
            </div>

            <!-- Vstupní text -->
            <div class="dr-section">
                <label class="dr-label">📝 Text s diakritikou</label>
                <textarea id="dr-input" class="dr-textarea" rows="6" placeholder="Sem vlož text s diakritikou...&#10;&#10;Např.:&#10;Příliš žluťoučký kůň úpěl ďábelské ódy.&#10;Škoda, že se nemůžeme potkat v Praze."></textarea>
            </div>

            <!-- Možnosti -->
            <div class="dr-section">
                <label class="dr-label">⚙️ Možnosti převodu</label>
                <div class="dr-options">
                    <label class="dr-checkbox">
                        <input type="checkbox" id="dr-preserve-case">
                        <span>🔠 Zachovat velikost písmen</span>
                    </label>
                    <label class="dr-checkbox">
                        <input type="checkbox" id="dr-to-lowercase">
                        <span>🔡 Převést na malá písmena</span>
                    </label>
                    <label class="dr-checkbox">
                        <input type="checkbox" id="dr-to-uppercase">
                        <span>🔠 Převést na VELKÁ písmena</span>
                    </label>
                    <label class="dr-checkbox">
                        <input type="checkbox" id="dr-trim-spaces">
                        <span>✂️ Odstranit přebytečné mezery</span>
                    </label>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="dr-buttons">
                <button id="dr-convert" class="dr-btn dr-btn-primary">🔄 Převést</button>
                <button id="dr-clear" class="dr-btn dr-btn-secondary">🗑️ Vyčistit vše</button>
            </div>

            <!-- Výstupní text -->
            <div class="dr-section">
                <div class="dr-output-header">
                    <label class="dr-label">📋 Text bez diakritiky</label>
                    <button id="dr-copy" class="dr-small-btn">📋 Kopírovat</button>
                </div>
                <textarea id="dr-output" class="dr-textarea dr-output" rows="6" readonly placeholder="Zde se zobrazí text bez diakritiky..."></textarea>
            </div>

            <!-- Statistiky -->
            <div class="dr-stats">
                <div class="dr-stat-card">
                    <div class="dr-stat-value" id="dr-original-length">0</div>
                    <div class="dr-stat-label">původní délka</div>
                </div>
                <div class="dr-stat-card">
                    <div class="dr-stat-value" id="dr-converted-length">0</div>
                    <div class="dr-stat-label">nová délka</div>
                </div>
                <div class="dr-stat-card">
                    <div class="dr-stat-value" id="dr-changed-count">0</div>
                    <div class="dr-stat-label">změněných znaků</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="dr-tip">
                💡 <strong>Tip:</strong> Užitečné pro vytváření URL adres, uživatelských jmen, nebo přípravu textu pro starší systémy, které nepodporují diakritiku.
            </div>
        </div>
    `;

    // ========== MAPPING DIAKRITIKY ==========
    const diacriticMap = {
        // Malá písmena
        'á': 'a', 'ä': 'a', 'â': 'a', 'ă': 'a', 'ā': 'a', 'à': 'a', 'å': 'a', 'ã': 'a', 'ą': 'a',
        'č': 'c', 'ć': 'c', 'ç': 'c', 'ĉ': 'c', 'ċ': 'c', 'č': 'c',
        'ď': 'd', 'đ': 'd', 'ð': 'd',
        'é': 'e', 'ě': 'e', 'ë': 'e', 'ê': 'e', 'ē': 'e', 'è': 'e', 'ę': 'e', 'ė': 'e',
        'ř': 'r', 'ŕ': 'r', 'ŗ': 'r',
        'š': 's', 'ś': 's', 'ş': 's', 'ŝ': 's', 'ș': 's',
        'ť': 't', 'ţ': 't', 'ț': 't', 'ŧ': 't',
        'ú': 'u', 'ů': 'u', 'ü': 'u', 'û': 'u', 'ū': 'u', 'ù': 'u', 'ų': 'u', 'ű': 'u',
        'ý': 'y', 'ÿ': 'y', 'ŷ': 'y',
        'ž': 'z', 'ź': 'z', 'ż': 'z', 'ž': 'z',
        'í': 'i', 'î': 'i', 'ï': 'i', 'ī': 'i', 'ì': 'i', 'į': 'i', 'ı': 'i',
        'ó': 'o', 'ö': 'o', 'ô': 'o', 'ō': 'o', 'ò': 'o', 'ő': 'o', 'ø': 'o', 'õ': 'o',
        'ň': 'n', 'ñ': 'n', 'ń': 'n', 'ņ': 'n', 'ň': 'n',
        'ľ': 'l', 'ĺ': 'l', 'ļ': 'l', 'ł': 'l',
        'ģ': 'g', 'ğ': 'g',
        'ķ': 'k',
        'ļ': 'l',
        'ķ': 'k',
        'ļ': 'l',
        'ģ': 'g',
        // Velká písmena
        'Á': 'A', 'Ä': 'A', 'Â': 'A', 'Ă': 'A', 'Ā': 'A', 'À': 'A', 'Å': 'A', 'Ã': 'A', 'Ą': 'A',
        'Č': 'C', 'Ć': 'C', 'Ç': 'C', 'Ĉ': 'C', 'Ċ': 'C',
        'Ď': 'D', 'Đ': 'D', 'Ð': 'D',
        'É': 'E', 'Ě': 'E', 'Ë': 'E', 'Ê': 'E', 'Ē': 'E', 'È': 'E', 'Ę': 'E', 'Ė': 'E',
        'Ř': 'R', 'Ŕ': 'R', 'Ŗ': 'R',
        'Š': 'S', 'Ś': 'S', 'Ş': 'S', 'Ŝ': 'S', 'Ș': 'S',
        'Ť': 'T', 'Ţ': 'T', 'Ț': 'T', 'Ŧ': 'T',
        'Ú': 'U', 'Ů': 'U', 'Ü': 'U', 'Û': 'U', 'Ū': 'U', 'Ù': 'U', 'Ų': 'U', 'Ű': 'U',
        'Ý': 'Y', 'Ÿ': 'Y', 'Ŷ': 'Y',
        'Ž': 'Z', 'Ź': 'Z', 'Ż': 'Z',
        'Í': 'I', 'Î': 'I', 'Ï': 'I', 'Ī': 'I', 'Ì': 'I', 'Į': 'I', 'I': 'I',
        'Ó': 'O', 'Ö': 'O', 'Ô': 'O', 'Ō': 'O', 'Ò': 'O', 'Ő': 'O', 'Ø': 'O', 'Õ': 'O',
        'Ň': 'N', 'Ñ': 'N', 'Ń': 'N', 'Ņ': 'N',
        'Ľ': 'L', 'Ĺ': 'L', 'Ļ': 'L', 'Ł': 'L',
        'Ģ': 'G', 'Ğ': 'G',
        'Ķ': 'K',
        // Speciální znaky
        'ß': 'ss', 'œ': 'oe', 'æ': 'ae', 'Œ': 'OE', 'Æ': 'AE'
    };

    function removeDiacritics(text) {
        let changedCount = 0;
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const converted = diacriticMap[char];
            
            if (converted && converted !== char) {
                result += converted;
                changedCount++;
            } else {
                result += char;
            }
        }
        
        return { result, changedCount };
    }

    function processText() {
        let text = document.getElementById('dr-input').value;
        
        if (!text.trim()) {
            showNotification('Zadej nějaký text', 'warning');
            return;
        }
        
        const originalLength = text.length;
        
        // Odstranění diakritiky
        let { result: convertedText, changedCount } = removeDiacritics(text);
        
        // Možnosti
        if (document.getElementById('dr-preserve-case').checked) {
            // Zachovat velikost - nic neměníme
        } else if (document.getElementById('dr-to-lowercase').checked) {
            convertedText = convertedText.toLowerCase();
        } else if (document.getElementById('dr-to-uppercase').checked) {
            convertedText = convertedText.toUpperCase();
        }
        
        if (document.getElementById('dr-trim-spaces').checked) {
            convertedText = convertedText.replace(/\s+/g, ' ').trim();
        }
        
        const convertedLength = convertedText.length;
        
        // Aktualizace výstupu
        const outputEl = document.getElementById('dr-output');
        outputEl.value = convertedText;
        
        // Aktualizace statistik
        document.getElementById('dr-original-length').textContent = originalLength;
        document.getElementById('dr-converted-length').textContent = convertedLength;
        document.getElementById('dr-changed-count').textContent = changedCount;
        
        showNotification(`Převod dokončen, změněno ${changedCount} znaků`, 'success');
        
        // Uložení
        storage.set('input', text);
        storage.set('preserveCase', document.getElementById('dr-preserve-case').checked);
        storage.set('toLowercase', document.getElementById('dr-to-lowercase').checked);
        storage.set('toUppercase', document.getElementById('dr-to-uppercase').checked);
        storage.set('trimSpaces', document.getElementById('dr-trim-spaces').checked);
    }

    async function copyOutput() {
        const output = document.getElementById('dr-output').value;
        if (output) {
            await copyToClipboard(output);
        } else {
            showNotification('Žádný text ke kopírování', 'warning');
        }
    }

    function clearAll() {
        document.getElementById('dr-input').value = '';
        document.getElementById('dr-output').value = '';
        document.getElementById('dr-original-length').textContent = '0';
        document.getElementById('dr-converted-length').textContent = '0';
        document.getElementById('dr-changed-count').textContent = '0';
        showNotification('Vše vyčištěno');
        storage.set('input', '');
    }

    // Eventy
    document.getElementById('dr-convert').addEventListener('click', processText);
    document.getElementById('dr-copy').addEventListener('click', copyOutput);
    document.getElementById('dr-clear').addEventListener('click', clearAll);
    
    // Radio chování mezi lowercase/uppercase/preserve
    const preserveCase = document.getElementById('dr-preserve-case');
    const toLowercase = document.getElementById('dr-to-lowercase');
    const toUppercase = document.getElementById('dr-to-uppercase');
    
    function handleCaseChange(changed) {
        if (changed === 'lowercase') {
            preserveCase.checked = false;
            toUppercase.checked = false;
        } else if (changed === 'uppercase') {
            preserveCase.checked = false;
            toLowercase.checked = false;
        } else if (changed === 'preserve') {
            toLowercase.checked = false;
            toUppercase.checked = false;
        }
        saveSettings();
    }
    
    preserveCase.addEventListener('change', () => {
        if (preserveCase.checked) handleCaseChange('preserve');
        saveSettings();
    });
    toLowercase.addEventListener('change', () => {
        if (toLowercase.checked) handleCaseChange('lowercase');
        saveSettings();
    });
    toUppercase.addEventListener('change', () => {
        if (toUppercase.checked) handleCaseChange('uppercase');
        saveSettings();
    });
    
    document.getElementById('dr-trim-spaces').addEventListener('change', () => saveSettings());
    
    // Auto-převod při psaní (debounce)
    let debounceTimer;
    document.getElementById('dr-input').addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (document.getElementById('dr-input').value.trim()) {
                processText();
            }
        }, 500);
        saveSettings();
    });
    
    // Ukládání
    function saveSettings() {
        storage.set('preserveCase', preserveCase.checked);
        storage.set('toLowercase', toLowercase.checked);
        storage.set('toUppercase', toUppercase.checked);
        storage.set('trimSpaces', document.getElementById('dr-trim-spaces').checked);
    }
    
    function loadSettings() {
        const savedInput = storage.get('input', '');
        if (savedInput) {
            document.getElementById('dr-input').value = savedInput;
        }
        preserveCase.checked = storage.get('preserveCase', true);
        toLowercase.checked = storage.get('toLowercase', false);
        toUppercase.checked = storage.get('toUppercase', false);
        document.getElementById('dr-trim-spaces').checked = storage.get('trimSpaces', false);
        
        if (savedInput) {
            setTimeout(() => processText(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Diacritic Remover se zavírá');
}