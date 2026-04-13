import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('text-compare');

export default function render(container) {
    container.innerHTML = `
        <div class="text-compare">
            <div class="tc-header">
                <span class="tc-icon">🔍</span>
                <div>
                    <h3>Porovnávač textu</h3>
                    <p>Najdi rozdíly mezi dvěma texty</p>
                </div>
            </div>

            <!-- Dva panely vedle sebe -->
            <div class="tc-panels">
                <!-- Levý panel -->
                <div class="tc-panel">
                    <div class="tc-panel-header">
                        <span>📄 Původní text</span>
                        <div class="tc-panel-actions">
                            <button id="tc-clear-left" class="tc-small-btn">🗑️ Vyčistit</button>
                        </div>
                    </div>
                    <div class="tc-editor-wrapper">
                        <div class="tc-line-numbers" id="tc-left-numbers"></div>
                        <textarea id="tc-left" class="tc-textarea" placeholder="Sem vlož původní text..."></textarea>
                    </div>
                </div>

                <!-- Pravý panel -->
                <div class="tc-panel">
                    <div class="tc-panel-header">
                        <span>📄 Nový text</span>
                        <div class="tc-panel-actions">
                            <button id="tc-clear-right" class="tc-small-btn">🗑️ Vyčistit</button>
                            <button id="tc-swap" class="tc-small-btn">🔄 Prohodit</button>
                        </div>
                    </div>
                    <div class="tc-editor-wrapper">
                        <div class="tc-line-numbers" id="tc-right-numbers"></div>
                        <textarea id="tc-right" class="tc-textarea" placeholder="Sem vlož nový text..."></textarea>
                    </div>
                </div>
            </div>

            <!-- Možnosti -->
            <div class="tc-section">
                <div class="tc-options">
                    <label class="tc-radio">
                        <input type="radio" name="compare-mode" value="lines" checked>
                        <span>📝 Porovnávat řádky</span>
                    </label>
                    <label class="tc-radio">
                        <input type="radio" name="compare-mode" value="words">
                        <span>🔤 Porovnávat slova</span>
                    </label>
                    <label class="tc-checkbox">
                        <input type="checkbox" id="tc-ignore-case">
                        <span>🔤 Ignorovat velikost písmen</span>
                    </label>
                    <label class="tc-checkbox">
                        <input type="checkbox" id="tc-ignore-spaces">
                        <span>✂️ Ignorovat přebytečné mezery</span>
                    </label>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="tc-actions">
                <button id="tc-compare" class="tc-btn tc-btn-primary">🔍 Porovnat</button>
                <button id="tc-clear-all" class="tc-btn tc-btn-secondary">🗑️ Vyčistit vše</button>
            </div>

            <!-- Výsledek -->
            <div class="tc-result-section">
                <div class="tc-result-header">
                    <span>📊 Rozdíly</span>
                    <button id="tc-copy-result" class="tc-small-btn">📋 Kopírovat výsledek</button>
                </div>
                <div id="tc-result" class="tc-result">
                    <div class="tc-empty">Klikni na "Porovnat" pro zobrazení rozdílů</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="tc-tip">
                💡 <strong>Tip:</strong> Červeně jsou zvýrazněny smazané/změněné části, zeleně přidané části.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const leftText = document.getElementById('tc-left');
    const rightText = document.getElementById('tc-right');
    const leftNumbers = document.getElementById('tc-left-numbers');
    const rightNumbers = document.getElementById('tc-right-numbers');
    const compareBtn = document.getElementById('tc-compare');
    const clearLeftBtn = document.getElementById('tc-clear-left');
    const clearRightBtn = document.getElementById('tc-clear-right');
    const clearAllBtn = document.getElementById('tc-clear-all');
    const swapBtn = document.getElementById('tc-swap');
    const copyResultBtn = document.getElementById('tc-copy-result');
    const resultDiv = document.getElementById('tc-result');
    const ignoreCase = document.getElementById('tc-ignore-case');
    const ignoreSpaces = document.getElementById('tc-ignore-spaces');
    const compareModeRadios = document.querySelectorAll('input[name="compare-mode"]');

    // ========== FUNKCE PRO ČÍSLA ŘÁDKŮ ==========
    function updateLineNumbers(textarea, numbersDiv) {
        const text = textarea.value;
        const lines = text.split(/\r?\n/);
        const lineCount = lines.length;
        
        let numbersHtml = '';
        for (let i = 1; i <= lineCount; i++) {
            numbersHtml += `<div class="tc-line-number">${i}</div>`;
        }
        if (lineCount === 0) {
            numbersHtml = '<div class="tc-line-number">1</div>';
        }
        numbersDiv.innerHTML = numbersHtml;
        
        // Synchronizace scrollování
        numbersDiv.scrollTop = textarea.scrollTop;
    }
    
    function syncScroll(textarea, numbersDiv) {
        numbersDiv.scrollTop = textarea.scrollTop;
    }
    
    // Eventy pro čísla řádků
    leftText.addEventListener('input', () => updateLineNumbers(leftText, leftNumbers));
    leftText.addEventListener('scroll', () => syncScroll(leftText, leftNumbers));
    rightText.addEventListener('input', () => updateLineNumbers(rightText, rightNumbers));
    rightText.addEventListener('scroll', () => syncScroll(rightText, rightNumbers));
    
    function normalizeText(text) {
        let result = text;
        if (ignoreSpaces.checked) {
            result = result.replace(/\s+/g, ' ').trim();
        }
        if (ignoreCase.checked) {
            result = result.toLowerCase();
        }
        return result;
    }
    
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    // Diff pro slova v řádku
    function diffWords(left, right) {
        if (!left && !right) return '';
        if (!left) return `<span class="tc-added-text">${escapeHtml(right)}</span>`;
        if (!right) return `<span class="tc-removed-text">${escapeHtml(left)}</span>`;
        
        const leftWords = left.split(/(\s+)/);
        const rightWords = right.split(/(\s+)/);
        
        const leftNorm = leftWords.map(w => normalizeText(w));
        const rightNorm = rightWords.map(w => normalizeText(w));
        
        let result = '';
        let i = 0, j = 0;
        
        while (i < leftWords.length || j < rightWords.length) {
            if (i >= leftWords.length) {
                result += `<span class="tc-added-text">${escapeHtml(rightWords[j])}</span>`;
                j++;
            } else if (j >= rightWords.length) {
                result += `<span class="tc-removed-text">${escapeHtml(leftWords[i])}</span>`;
                i++;
            } else if (leftNorm[i] === rightNorm[j]) {
                result += escapeHtml(leftWords[i]);
                i++;
                j++;
            } else {
                let found = false;
                for (let k = j + 1; k < Math.min(j + 5, rightWords.length); k++) {
                    if (leftNorm[i] === rightNorm[k]) {
                        for (let m = j; m < k; m++) {
                            result += `<span class="tc-added-text">${escapeHtml(rightWords[m])}</span>`;
                        }
                        j = k;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    result += `<span class="tc-removed-text">${escapeHtml(leftWords[i])}</span>`;
                    i++;
                }
            }
        }
        
        return result;
    }
    
    // Diff pro řádky
    function diffLines(left, right) {
        const leftLines = left.split(/\r?\n/);
        const rightLines = right.split(/\r?\n/);
        
        const leftNorm = leftLines.map(l => normalizeText(l));
        const rightNorm = rightLines.map(l => normalizeText(l));
        
        const result = [];
        const maxLen = Math.max(leftLines.length, rightLines.length);
        
        for (let i = 0; i < maxLen; i++) {
            const leftLine = leftLines[i] || '';
            const rightLine = rightLines[i] || '';
            const leftNormLine = leftNorm[i] || '';
            const rightNormLine = rightNorm[i] || '';
            
            if (leftNormLine === rightNormLine) {
                result.push(`<div class="tc-line tc-same"><span class="tc-line-num">${i + 1}</span> ${escapeHtml(leftLine)}</div>`);
            } else if (leftLine && !rightLine) {
                result.push(`<div class="tc-line tc-removed"><span class="tc-line-num">${i + 1}</span> <span class="tc-removed-text">${escapeHtml(leftLine)}</span></div>`);
            } else if (!leftLine && rightLine) {
                result.push(`<div class="tc-line tc-added"><span class="tc-line-num">${i + 1}</span> <span class="tc-added-text">${escapeHtml(rightLine)}</span></div>`);
            } else {
                const wordDiff = diffWords(leftLine, rightLine);
                result.push(`<div class="tc-line tc-changed"><span class="tc-line-num">${i + 1}</span> ${wordDiff}</div>`);
            }
        }
        
        return result.join('');
    }
    
    // Diff pro slova jako celek
    function diffFullWords(left, right) {
        const leftWords = left.split(/(\s+)/);
        const rightWords = right.split(/(\s+)/);
        
        const leftNorm = leftWords.map(w => normalizeText(w));
        const rightNorm = rightWords.map(w => normalizeText(w));
        
        let result = '<div class="tc-line">';
        let i = 0, j = 0;
        
        while (i < leftWords.length || j < rightWords.length) {
            if (i >= leftWords.length) {
                result += `<span class="tc-added-text">${escapeHtml(rightWords[j])}</span>`;
                j++;
            } else if (j >= rightWords.length) {
                result += `<span class="tc-removed-text">${escapeHtml(leftWords[i])}</span>`;
                i++;
            } else if (leftNorm[i] === rightNorm[j]) {
                result += escapeHtml(leftWords[i]);
                i++;
                j++;
            } else {
                let found = false;
                for (let k = j + 1; k < Math.min(j + 10, rightWords.length); k++) {
                    if (leftNorm[i] === rightNorm[k]) {
                        for (let m = j; m < k; m++) {
                            result += `<span class="tc-added-text">${escapeHtml(rightWords[m])}</span>`;
                        }
                        j = k;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    result += `<span class="tc-removed-text">${escapeHtml(leftWords[i])}</span>`;
                    i++;
                }
            }
        }
        
        result += '</div>';
        return result;
    }
    
    function compare() {
        const left = leftText.value;
        const right = rightText.value;
        const mode = document.querySelector('input[name="compare-mode"]:checked').value;
        
        if (!left && !right) {
            resultDiv.innerHTML = '<div class="tc-empty">Oba texty jsou prázdné</div>';
            return;
        }
        
        if (mode === 'lines') {
            resultDiv.innerHTML = diffLines(left, right);
        } else {
            if (!left || !right) {
                resultDiv.innerHTML = '<div class="tc-empty">Pro porovnání slov potřebuješ oba texty</div>';
                return;
            }
            resultDiv.innerHTML = diffFullWords(left, right);
        }
        
        if (resultDiv.innerHTML === '') {
            resultDiv.innerHTML = '<div class="tc-empty tc-same-msg">✅ Texty jsou stejné, žádné rozdíly</div>';
        }
    }
    
    function clearLeft() {
        leftText.value = '';
        updateLineNumbers(leftText, leftNumbers);
        showNotification('Levý text vyčištěn');
    }
    
    function clearRight() {
        rightText.value = '';
        updateLineNumbers(rightText, rightNumbers);
        showNotification('Pravý text vyčištěn');
    }
    
    function clearAll() {
        leftText.value = '';
        rightText.value = '';
        updateLineNumbers(leftText, leftNumbers);
        updateLineNumbers(rightText, rightNumbers);
        resultDiv.innerHTML = '<div class="tc-empty">Klikni na "Porovnat" pro zobrazení rozdílů</div>';
        showNotification('Vše vyčištěno');
    }
    
    function swapTexts() {
        const left = leftText.value;
        const right = rightText.value;
        leftText.value = right;
        rightText.value = left;
        updateLineNumbers(leftText, leftNumbers);
        updateLineNumbers(rightText, rightNumbers);
        showNotification('Texty prohozeny');
        compare();
    }
    
    async function copyResult() {
        const resultText = resultDiv.innerText;
        if (resultText && !resultText.includes('Klikni na "Porovnat"')) {
            await copyToClipboard(resultText);
        } else {
            showNotification('Nejprve porovnej texty', 'warning');
        }
    }
    
    // Eventy
    compareBtn.addEventListener('click', compare);
    clearLeftBtn.addEventListener('click', clearLeft);
    clearRightBtn.addEventListener('click', clearRight);
    clearAllBtn.addEventListener('click', clearAll);
    swapBtn.addEventListener('click', swapTexts);
    copyResultBtn.addEventListener('click', copyResult);
    
    compareModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (leftText.value || rightText.value) compare();
            saveSettings();
        });
    });
    ignoreCase.addEventListener('change', () => {
        if (leftText.value || rightText.value) compare();
        saveSettings();
    });
    ignoreSpaces.addEventListener('change', () => {
        if (leftText.value || rightText.value) compare();
        saveSettings();
    });
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('leftText', leftText.value);
        storage.set('rightText', rightText.value);
        storage.set('mode', document.querySelector('input[name="compare-mode"]:checked').value);
        storage.set('ignoreCase', ignoreCase.checked);
        storage.set('ignoreSpaces', ignoreSpaces.checked);
    }
    
    function loadSettings() {
        const savedLeft = storage.get('leftText', '');
        const savedRight = storage.get('rightText', '');
        const savedMode = storage.get('mode', 'lines');
        const savedIgnoreCase = storage.get('ignoreCase', false);
        const savedIgnoreSpaces = storage.get('ignoreSpaces', false);
        
        leftText.value = savedLeft;
        rightText.value = savedRight;
        ignoreCase.checked = savedIgnoreCase;
        ignoreSpaces.checked = savedIgnoreSpaces;
        
        updateLineNumbers(leftText, leftNumbers);
        updateLineNumbers(rightText, rightNumbers);
        
        const modeRadio = document.querySelector(`input[name="compare-mode"][value="${savedMode}"]`);
        if (modeRadio) modeRadio.checked = true;
        
        if (savedLeft || savedRight) {
            setTimeout(() => compare(), 100);
        }
    }
    
    leftText.addEventListener('input', saveSettings);
    rightText.addEventListener('input', saveSettings);
    ignoreCase.addEventListener('change', saveSettings);
    ignoreSpaces.addEventListener('change', saveSettings);
    compareModeRadios.forEach(radio => radio.addEventListener('change', saveSettings));
    
    loadSettings();
}

export function cleanup() {
    console.log('Text Compare se zavírá');
}