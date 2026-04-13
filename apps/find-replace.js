import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('find-replace');

export default function render(container) {
    container.innerHTML = `
        <div class="find-replace">
            <div class="fr-header">
                <span class="fr-icon">🔍</span>
                <div>
                    <h3>Find & Replace Tool</h3>
                    <p>Rychlé hledání a nahrazování v textu</p>
                </div>
            </div>

            <!-- Vstupní text -->
            <div class="fr-section">
                <label class="fr-label">📝 Vstupní text</label>
                <textarea id="fr-input" class="fr-textarea" rows="6" placeholder="Sem vlož text..."></textarea>
            </div>

            <!-- Hledat a nahradit -->
            <div class="fr-section">
                <div class="fr-row">
                    <div class="fr-input-group">
                        <label class="fr-label-small">🔍 Hledat</label>
                        <input type="text" id="fr-find" class="fr-input" placeholder="Hledaný text...">
                    </div>
                    <div class="fr-input-group">
                        <label class="fr-label-small">✏️ Nahradit za</label>
                        <input type="text" id="fr-replace" class="fr-input" placeholder="Nový text...">
                    </div>
                </div>
            </div>

            <!-- Možnosti -->
            <div class="fr-section">
                <label class="fr-label">⚙️ Možnosti</label>
                <div class="fr-options">
                    <label class="fr-checkbox">
                        <input type="checkbox" id="fr-case-sensitive">
                        <span>🔠 Rozlišovat velikost písmen</span>
                    </label>
                    <label class="fr-checkbox">
                        <input type="checkbox" id="fr-whole-word">
                        <span>📝 Celá slova pouze</span>
                    </label>
                    <label class="fr-checkbox">
                        <input type="checkbox" id="fr-use-regex">
                        <span>⚡ Použít regulární výraz</span>
                    </label>
                    <label class="fr-checkbox">
                        <input type="checkbox" id="fr-multiline">
                        <span>📄 Víceřádkový režim</span>
                    </label>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="fr-buttons">
                <button id="fr-replace-all" class="fr-btn fr-btn-primary">🔄 Nahradit vše</button>
                <button id="fr-replace-one" class="fr-btn fr-btn-secondary">➡️ Nahradit jedno</button>
                <button id="fr-clear" class="fr-btn fr-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Statistiky -->
            <div class="fr-stats">
                <div class="fr-stat-card">
                    <div class="fr-stat-value" id="fr-original-length">0</div>
                    <div class="fr-stat-label">původní délka</div>
                </div>
                <div class="fr-stat-card">
                    <div class="fr-stat-value" id="fr-new-length">0</div>
                    <div class="fr-stat-label">nová délka</div>
                </div>
                <div class="fr-stat-card">
                    <div class="fr-stat-value" id="fr-occurrences">0</div>
                    <div class="fr-stat-label">nalezeno</div>
                </div>
            </div>

            <!-- Výstupní text -->
            <div class="fr-section">
                <div class="fr-output-header">
                    <label class="fr-label">📋 Výstupní text</label>
                    <button id="fr-copy" class="fr-small-btn">📋 Kopírovat</button>
                </div>
                <textarea id="fr-output" class="fr-textarea fr-output" rows="6" readonly placeholder="Výsledek se zobrazí po nahrazení..."></textarea>
            </div>

            <!-- Náhled výskytů -->
            <details class="fr-details">
                <summary>🔍 Náhled výskytů</summary>
                <div id="fr-preview" class="fr-preview">
                    <div class="fr-empty-preview">Zadej hledaný text</div>
                </div>
            </details>

            <!-- Tip -->
            <div class="fr-tip">
                💡 <strong>Tip:</strong> Můžeš použít regulární výrazy. Např. "\\d+" najde všechna čísla. "\\s" najde mezery.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const inputEl = document.getElementById('fr-input');
    const findInput = document.getElementById('fr-find');
    const replaceInput = document.getElementById('fr-replace');
    const caseSensitiveCheck = document.getElementById('fr-case-sensitive');
    const wholeWordCheck = document.getElementById('fr-whole-word');
    const useRegexCheck = document.getElementById('fr-use-regex');
    const multilineCheck = document.getElementById('fr-multiline');
    const replaceAllBtn = document.getElementById('fr-replace-all');
    const replaceOneBtn = document.getElementById('fr-replace-one');
    const clearBtn = document.getElementById('fr-clear');
    const copyBtn = document.getElementById('fr-copy');
    const outputEl = document.getElementById('fr-output');
    const originalLengthSpan = document.getElementById('fr-original-length');
    const newLengthSpan = document.getElementById('fr-new-length');
    const occurrencesSpan = document.getElementById('fr-occurrences');
    const previewDiv = document.getElementById('fr-preview');

    let currentText = '';
    let currentFind = '';
    let currentReplace = '';

    // Aktualizace statistik
    function updateStats(text, find, replace, count) {
        originalLengthSpan.textContent = text.length;
        newLengthSpan.textContent = outputEl.value.length;
        occurrencesSpan.textContent = count;
    }

    // Vytvoření regexu
    function createRegex(find) {
        let flags = 'g';
        if (!caseSensitiveCheck.checked) flags += 'i';
        if (multilineCheck.checked) flags += 'm';
        
        let pattern = find;
        if (!useRegexCheck.checked) {
            pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        
        if (wholeWordCheck.checked) {
            pattern = '\\b' + pattern + '\\b';
        }
        
        try {
            return new RegExp(pattern, flags);
        } catch (e) {
            return null;
        }
    }

    // Počet výskytů
    function countOccurrences(text, find) {
        if (!find) return 0;
        
        const regex = createRegex(find);
        if (!regex) return 0;
        
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    }

    // Nahradit vše
    function replaceAll() {
        const text = inputEl.value;
        const find = findInput.value;
        const replace = replaceInput.value;
        
        if (!text) {
            showNotification('Žádný text k úpravě', 'warning');
            return;
        }
        
        if (!find) {
            showNotification('Zadej text k hledání', 'warning');
            return;
        }
        
        const regex = createRegex(find);
        if (!regex) {
            showNotification('Neplatný regulární výraz', 'error');
            return;
        }
        
        const newText = text.replace(regex, replace);
        const count = countOccurrences(text, find);
        
        outputEl.value = newText;
        updateStats(text, find, replace, count);
        showNotification(`Nahrazeno ${count} výskytů`, 'success');
        
        currentText = newText;
        currentFind = find;
        currentReplace = replace;
        
        updatePreview(text, find, replace);
        saveSettings();
    }

    // Nahradit jedno (první)
    function replaceOne() {
        const text = inputEl.value;
        const find = findInput.value;
        const replace = replaceInput.value;
        
        if (!text) {
            showNotification('Žádný text k úpravě', 'warning');
            return;
        }
        
        if (!find) {
            showNotification('Zadej text k hledání', 'warning');
            return;
        }
        
        const regex = createRegex(find);
        if (!regex) {
            showNotification('Neplatný regulární výraz', 'error');
            return;
        }
        
        const newText = text.replace(regex, replace);
        const count = countOccurrences(text, find);
        
        outputEl.value = newText;
        updateStats(text, find, replace, 1);
        showNotification(`Nahrazen první výskyt`, 'success');
        
        currentText = newText;
        currentFind = find;
        currentReplace = replace;
        
        updatePreview(text, find, replace);
        saveSettings();
    }

    // Náhled výskytů
    function updatePreview(text, find, replace) {
        if (!find || !text) {
            previewDiv.innerHTML = '<div class="fr-empty-preview">Zadej hledaný text</div>';
            return;
        }
        
        const regex = createRegex(find);
        if (!regex) {
            previewDiv.innerHTML = '<div class="fr-error-preview">❌ Neplatný regulární výraz</div>';
            return;
        }
        
        const matches = text.match(regex);
        if (!matches || matches.length === 0) {
            previewDiv.innerHTML = '<div class="fr-empty-preview">Žádné výskyty nenalezeny</div>';
            return;
        }
        
        // Zobrazení prvních 10 výskytů
        const uniqueMatches = [...new Set(matches)];
        const displayMatches = uniqueMatches.slice(0, 10);
        
        previewDiv.innerHTML = `
            <div class="fr-preview-header">
                Nalezeno ${matches.length} výskytů (${uniqueMatches.length} unikátních)
            </div>
            <div class="fr-preview-list">
                ${displayMatches.map(m => `
                    <div class="fr-preview-item">
                        <span class="fr-preview-find">${escapeHtml(m)}</span>
                        <span class="fr-preview-arrow">→</span>
                        <span class="fr-preview-replace">${escapeHtml(replace)}</span>
                    </div>
                `).join('')}
                ${uniqueMatches.length > 10 ? `<div class="fr-preview-more">... a ${uniqueMatches.length - 10} dalších</div>` : ''}
            </div>
        `;
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function copyOutput() {
        const text = outputEl.value;
        if (text) {
            await copyToClipboard(text);
            showNotification('Text zkopírován');
        } else {
            showNotification('Žádný text ke kopírování', 'warning');
        }
    }

    function clearAll() {
        inputEl.value = '';
        findInput.value = '';
        replaceInput.value = '';
        outputEl.value = '';
        originalLengthSpan.textContent = '0';
        newLengthSpan.textContent = '0';
        occurrencesSpan.textContent = '0';
        previewDiv.innerHTML = '<div class="fr-empty-preview">Zadej hledaný text</div>';
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Živý náhled při psaní
    let debounceTimer;
    function livePreview() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const text = inputEl.value;
            const find = findInput.value;
            const replace = replaceInput.value;
            
            if (text && find) {
                const count = countOccurrences(text, find);
                occurrencesSpan.textContent = count;
                updatePreview(text, find, replace);
            } else {
                occurrencesSpan.textContent = '0';
                previewDiv.innerHTML = '<div class="fr-empty-preview">Zadej hledaný text</div>';
            }
            saveSettings();
        }, 300);
    }

    // Eventy
    replaceAllBtn.addEventListener('click', replaceAll);
    replaceOneBtn.addEventListener('click', replaceOne);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyOutput);
    
    inputEl.addEventListener('input', () => {
        originalLengthSpan.textContent = inputEl.value.length;
        livePreview();
    });
    findInput.addEventListener('input', livePreview);
    replaceInput.addEventListener('input', livePreview);
    caseSensitiveCheck.addEventListener('change', livePreview);
    wholeWordCheck.addEventListener('change', livePreview);
    useRegexCheck.addEventListener('change', livePreview);
    multilineCheck.addEventListener('change', livePreview);
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('input', inputEl.value);
        storage.set('find', findInput.value);
        storage.set('replace', replaceInput.value);
        storage.set('caseSensitive', caseSensitiveCheck.checked);
        storage.set('wholeWord', wholeWordCheck.checked);
        storage.set('useRegex', useRegexCheck.checked);
        storage.set('multiline', multilineCheck.checked);
    }
    
    function loadSettings() {
        inputEl.value = storage.get('input', '');
        findInput.value = storage.get('find', '');
        replaceInput.value = storage.get('replace', '');
        caseSensitiveCheck.checked = storage.get('caseSensitive', false);
        wholeWordCheck.checked = storage.get('wholeWord', false);
        useRegexCheck.checked = storage.get('useRegex', false);
        multilineCheck.checked = storage.get('multiline', false);
        
        originalLengthSpan.textContent = inputEl.value.length;
        
        if (inputEl.value && findInput.value) {
            setTimeout(() => livePreview(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Find & Replace se zavírá');
}