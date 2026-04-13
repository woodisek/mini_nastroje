import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('line-counter');

export default function render(container) {
    container.innerHTML = `
        <div class="line-counter">
            <div class="lc-header">
                <span class="lc-icon">📊</span>
                <div>
                    <h3>Počítadlo řádků</h3>
                    <p>Spočítej řádky, prázdné řádky, znaky a slova v textu</p>
                </div>
            </div>

            <!-- Vstupní text -->
            <div class="lc-section">
                <label class="lc-label">📝 Vlož text</label>
                <textarea id="lc-input" class="lc-textarea" rows="10" placeholder="Sem vlož text...&#10;&#10;Každý řádek se počítá zvlášť."></textarea>
                <div class="lc-hint">💡 Automatické počítání při psaní</div>
            </div>

            <!-- Statistiky -->
            <div class="lc-stats-grid">
                <div class="lc-stat-card">
                    <div class="lc-stat-value" id="lc-total-lines">0</div>
                    <div class="lc-stat-label">celkem řádků</div>
                </div>
                <div class="lc-stat-card">
                    <div class="lc-stat-value" id="lc-non-empty">0</div>
                    <div class="lc-stat-label">ne prázdných</div>
                </div>
                <div class="lc-stat-card">
                    <div class="lc-stat-value" id="lc-empty-lines">0</div>
                    <div class="lc-stat-label">prázdných</div>
                </div>
                <div class="lc-stat-card">
                    <div class="lc-stat-value" id="lc-characters">0</div>
                    <div class="lc-stat-label">znaků</div>
                </div>
                <div class="lc-stat-card">
                    <div class="lc-stat-value" id="lc-words">0</div>
                    <div class="lc-stat-label">slov</div>
                </div>
                <div class="lc-stat-card">
                    <div class="lc-stat-value" id="lc-avg-length">0</div>
                    <div class="lc-stat-label">ø délka řádku</div>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="lc-buttons">
                <button id="lc-copy" class="lc-btn lc-btn-primary">📋 Kopírovat text</button>
                <button id="lc-clear" class="lc-btn lc-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Zobrazení řádků s čísly -->
            <details class="lc-details">
                <summary>📋 Zobrazit text s čísly řádků</summary>
                <div id="lc-numbered" class="lc-numbered">
                    <div class="lc-empty-numbered">Zadej text pro zobrazení</div>
                </div>
            </details>

            <div class="lc-tip">
                💡 <strong>Tip:</strong> Užitečné pro kontrolu délky kódu, dokumentů, básní nebo logů.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const inputEl = document.getElementById('lc-input');
    const copyBtn = document.getElementById('lc-copy');
    const clearBtn = document.getElementById('lc-clear');
    const totalLinesSpan = document.getElementById('lc-total-lines');
    const nonEmptySpan = document.getElementById('lc-non-empty');
    const emptyLinesSpan = document.getElementById('lc-empty-lines');
    const charactersSpan = document.getElementById('lc-characters');
    const wordsSpan = document.getElementById('lc-words');
    const avgLengthSpan = document.getElementById('lc-avg-length');
    const numberedDiv = document.getElementById('lc-numbered');

    function updateCounts() {
        const text = inputEl.value;
        const lines = text.split(/\r?\n/);
        const totalLines = lines.length;
        const nonEmpty = lines.filter(line => line.trim().length > 0).length;
        const emptyLines = totalLines - nonEmpty;
        const characters = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const avgLength = nonEmpty > 0 ? Math.round(characters / nonEmpty) : 0;
        
        totalLinesSpan.textContent = totalLines;
        nonEmptySpan.textContent = nonEmpty;
        emptyLinesSpan.textContent = emptyLines;
        charactersSpan.textContent = characters;
        wordsSpan.textContent = words;
        avgLengthSpan.textContent = avgLength;
        
        updateNumberedDisplay(lines);
        saveSettings();
    }
    
    function updateNumberedDisplay(lines) {
        if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
            numberedDiv.innerHTML = '<div class="lc-empty-numbered">Zadej text pro zobrazení</div>';
            return;
        }
        
        numberedDiv.innerHTML = lines.map((line, index) => `
            <div class="lc-numbered-line">
                <span class="lc-line-number">${(index + 1).toString().padStart(3, ' ')}</span>
                <span class="lc-line-content ${line.trim() === '' ? 'lc-empty-line' : ''}">${escapeHtml(line) || '␣'}</span>
            </div>
        `).join('');
        
        // Scroll na začátek
        numberedDiv.scrollTop = 0;
    }
    
    async function copyText() {
        const text = inputEl.value;
        if (text) {
            await copyToClipboard(text);
            showNotification('Text zkopírován');
        } else {
            showNotification('Žádný text ke kopírování', 'warning');
        }
    }
    
    function clearText() {
        inputEl.value = '';
        updateCounts();
        showNotification('Vyčištěno');
    }
    
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    function saveSettings() {
        storage.set('text', inputEl.value);
    }
    
    function loadSettings() {
        const savedText = storage.get('text', '');
        if (savedText) {
            inputEl.value = savedText;
            updateCounts();
        }
    }
    
    // Eventy
    inputEl.addEventListener('input', updateCounts);
    copyBtn.addEventListener('click', copyText);
    clearBtn.addEventListener('click', clearText);
    
    loadSettings();
}

export function cleanup() {
    console.log('Line Counter se zavírá');
}