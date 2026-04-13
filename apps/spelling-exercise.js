import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('spelling-exercise');

export default function render(container) {
    container.innerHTML = `
        <div class="spelling-exercise">
            <div class="se-header">
                <span class="se-icon">✏️</span>
                <div>
                    <h3>Doplňovačka vyjmenovaných slov</h3>
                    <p>Vlož text, JS náhodně vymaže I/Y a vytvoří cvičení</p>
                </div>
            </div>

            <!-- Vstupní text -->
            <div class="se-section">
                <label class="se-label">📝 Vlož text s vyjmenovanými slovy</label>
                <textarea id="se-input" class="se-textarea" rows="8" placeholder="Sem vlož text obsahující vyjmenovaná slova...&#10;&#10;Např.:&#10;Byl jednou jeden mlýn.&#10;Slyšel jsem krásnou píseň.&#10;Na pile pracoval dělník.&#10;Byla to pěkná návštěva."></textarea>
                <div class="se-hint">💡 Text by měl obsahovat slova s I/Y (vyjmenovaná slova, koncovky atd.)</div>
            </div>

            <!-- Nastavení -->
            <div class="se-section">
                <label class="se-label">⚙️ Nastavení</label>
                <div class="se-options">
                    <label class="se-checkbox">
                        <input type="checkbox" id="se-randomize" checked>
                        <span>🎲 Náhodný výběr mezer</span>
                    </label>
                    <label class="se-checkbox">
                        <input type="checkbox" id="se-keep-capitals">
                        <span>🔠 Zachovat velká písmena na začátku věty</span>
                    </label>
                    <label class="se-checkbox">
                        <input type="checkbox" id="se-show-hint">
                        <span>💡 Zobrazit nápovědu (vyjmenovaná slova)</span>
                    </label>
                </div>
            </div>

            <!-- Počet mezer -->
            <div class="se-section">
                <label class="se-label">🔢 Počet mezer k doplnění (0 = všechny)</label>
                <div class="se-count-control">
                    <button id="se-count-minus" class="se-count-btn">−</button>
                    <input type="number" id="se-count" class="se-count-input" value="5" min="0" max="50" step="1">
                    <button id="se-count-plus" class="se-count-btn">+</button>
                </div>
                <div class="se-hint">Pokud je 0, vygenerují se mezery na všech I/Y</div>
            </div>

            <!-- Tlačítka -->
            <div class="se-buttons">
                <button id="se-generate" class="se-btn se-btn-primary">📝 Vytvořit cvičení</button>
                <button id="se-key" class="se-btn se-btn-secondary">🔑 Zobrazit řešení</button>
                <button id="se-clear" class="se-btn se-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="se-result-section">
                <div class="se-result-header">
                    <span>📋 Cvičení</span>
                    <button id="se-copy-exercise" class="se-small-btn">📋 Kopírovat cvičení</button>
                    <button id="se-copy-key" class="se-small-btn">📋 Kopírovat řešení</button>
                </div>
                <div id="se-exercise" class="se-exercise">
                    <div class="se-empty">Vlož text a klikni na "Vytvořit cvičení"</div>
                </div>
            </div>

            <!-- Nápověda -->
            <details class="se-details">
                <summary>📖 Vyjmenovaná slova</summary>
                <div class="se-word-list">
                    <div><strong>B:</strong> být, bydlit, obyvatel, byt, příbytek, nábytek, dobytek, zbytek, bystřina, Bylany, bystrý, bystře, zabydlet se</div>
                    <div><strong>L:</strong> lysý, lýko, lýtko, blýskat se, lýže, polykat, vylývat, lýčit</div>
                    <div><strong>M:</strong> my, mýt, myslet, mýlit se, hmyz, myš, mýto, mýtit, smýkat, zamykat, přemýšlet, mýval</div>
                    <div><strong>P:</strong> pýcha, pytel, pysk, netopýr, slepýš, pyl, kopyto, klopýtat, pýřit se, pýr, pýří</div>
                    <div><strong>S:</strong> syn, sytý, sýr, syrový, sychravý, usychat, sýkora, sýček, sysel, sýpka</div>
                    <div><strong>V:</strong> vy, vysoký, výt, zvykat, žvýkat, výskat, vykat, výheň, vyžle, povyk, výr, výra</div>
                    <div><strong>Z:</strong> brzy, jazyk, nazývat se, kazy, kozy, sýček</div>
                </div>
            </details>

            <!-- Tip -->
            <div class="se-tip">
                💡 <strong>Tip:</strong> Nástroj automaticky najde slova obsahující I/Y a nahradí je podtržítkem. Student doplňuje správné I/Y.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const inputEl = document.getElementById('se-input');
    const randomizeCheck = document.getElementById('se-randomize');
    const keepCapitalsCheck = document.getElementById('se-keep-capitals');
    const showHintCheck = document.getElementById('se-show-hint');
    const countInput = document.getElementById('se-count');
    const countMinus = document.getElementById('se-count-minus');
    const countPlus = document.getElementById('se-count-plus');
    const generateBtn = document.getElementById('se-generate');
    const keyBtn = document.getElementById('se-key');
    const clearBtn = document.getElementById('se-clear');
    const copyExerciseBtn = document.getElementById('se-copy-exercise');
    const copyKeyBtn = document.getElementById('se-copy-key');
    const exerciseDiv = document.getElementById('se-exercise');

    let currentExercise = '';
    let currentKey = '';
    let currentGaps = [];

    // Regulární výraz pro nalezení I/Y v českých slovech
    function findIYPositions(text) {
        const positions = [];
        const regex = /[iyíý]/gi;
        let match;
        while ((match = regex.exec(text)) !== null) {
            positions.push({
                index: match.index,
                char: text[match.index],
                fullMatch: match[0]
            });
        }
        return positions;
    }

    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function generateExercise() {
        const text = inputEl.value;
        if (!text.trim()) {
            showNotification('Nejprve vlož text', 'warning');
            return;
        }
        
        const allPositions = findIYPositions(text);
        if (allPositions.length === 0) {
            showNotification('V textu nebyla nalezena žádná písmena I/Y/Í/Ý', 'warning');
            return;
        }
        
        let count = parseInt(countInput.value) || 0;
        if (count === 0) count = allPositions.length;
        if (count > allPositions.length) count = allPositions.length;
        
        // Výběr pozic pro mezery
        let selectedPositions;
        if (randomizeCheck.checked) {
            // Náhodný výběr
            const shuffled = [...allPositions];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            selectedPositions = shuffled.slice(0, count);
        } else {
            selectedPositions = allPositions.slice(0, count);
        }
        
        // Seřazení podle indexu pro postupné nahrazování
        selectedPositions.sort((a, b) => b.index - a.index); // Od konce, aby se indexy neposouvaly
        
        // Vytvoření cvičení a řešení
        let exercise = text;
        let solution = text;
        
        for (const pos of selectedPositions) {
            const before = exercise.substring(0, pos.index);
            const after = exercise.substring(pos.index + 1);
            exercise = before + '___' + after;
        }
        
        // Úprava velkých písmen na začátku věty (volitelné)
        if (keepCapitalsCheck.checked) {
            const sentences = exercise.split(/([.!?]\s+)/);
            for (let i = 0; i < sentences.length; i++) {
                if (sentences[i].length > 0 && /[a-z]/.test(sentences[i][0])) {
                    sentences[i] = capitalizeFirstLetter(sentences[i]);
                }
            }
            exercise = sentences.join('');
        }
        
        currentExercise = exercise;
        currentKey = solution;
        currentGaps = selectedPositions;
        
        // Zobrazení
        displayExercise(exercise, false);
        
        showNotification(`Vytvořeno cvičení s ${selectedPositions.length} mezerami`, 'success');
        saveSettings();
    }

    function displayExercise(text, showKey) {
        let html = '<div class="se-exercise-text">';
        
        // Zvýraznění mezer
        const parts = text.split(/(___)/g);
        for (const part of parts) {
            if (part === '___') {
                html += '<span class="se-gap">______</span>';
            } else {
                html += escapeHtml(part);
            }
        }
        
        html += '</div>';
        
        if (showKey && currentKey) {
            html += '<div class="se-key-text">';
            html += '<div class="se-key-header">🔑 Řešení:</div>';
            html += '<div class="se-key-content">' + escapeHtml(currentKey) + '</div>';
            html += '</div>';
        }
        
        if (showHintCheck.checked && !showKey) {
            html += `
                <details class="se-hint-details">
                    <summary>💡 Nápověda: Vyjmenovaná slova</summary>
                    <div class="se-hint-content">
                        <strong>Vyjmenovaná slova:</strong> byt, být, mýt, myslet, pýcha, pytel, syn, sytý, vy, vysoký, brzy, jazyk...
                    </div>
                </details>
            `;
        }
        
        exerciseDiv.innerHTML = html;
    }

    function showSolution() {
        if (!currentExercise) {
            showNotification('Nejprve vytvoř cvičení', 'warning');
            return;
        }
        
        displayExercise(currentExercise, true);
        showNotification('Řešení zobrazeno');
    }

    function clearAll() {
        inputEl.value = '';
        currentExercise = '';
        currentKey = '';
        currentGaps = [];
        exerciseDiv.innerHTML = '<div class="se-empty">Vlož text a klikni na "Vytvořit cvičení"</div>';
        showNotification('Vyčištěno');
        saveSettings();
    }

    async function copyExercise() {
        if (!currentExercise) {
            showNotification('Žádné cvičení ke kopírování', 'warning');
            return;
        }
        
        let text = 'DOPLŇOVAČKA VYJMENOVANÝCH SLOV\n';
        text += '='.repeat(40) + '\n\n';
        text += currentExercise;
        
        await copyToClipboard(text);
        showNotification('Cvičení zkopírováno');
    }

    async function copyKey() {
        if (!currentKey) {
            showNotification('Žádné řešení ke kopírování', 'warning');
            return;
        }
        
        let text = 'ŘEŠENÍ DOPLŇOVAČKY\n';
        text += '='.repeat(40) + '\n\n';
        text += currentKey;
        
        await copyToClipboard(text);
        showNotification('Řešení zkopírováno');
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br>');
    }

    // Eventy
    countMinus.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val > 0) countInput.value = val - 1;
        saveSettings();
    });
    
    countPlus.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val < 50) countInput.value = val + 1;
        saveSettings();
    });
    
    generateBtn.addEventListener('click', generateExercise);
    keyBtn.addEventListener('click', showSolution);
    clearBtn.addEventListener('click', clearAll);
    copyExerciseBtn.addEventListener('click', copyExercise);
    copyKeyBtn.addEventListener('click', copyKey);
    
    const saveElements = [randomizeCheck, keepCapitalsCheck, showHintCheck, countInput];
    saveElements.forEach(el => {
        if (el) el.addEventListener('change', saveSettings);
        if (el) el.addEventListener('input', saveSettings);
    });
    inputEl.addEventListener('input', saveSettings);
    
    function saveSettings() {
        storage.set('input', inputEl.value);
        storage.set('randomize', randomizeCheck.checked);
        storage.set('keepCapitals', keepCapitalsCheck.checked);
        storage.set('showHint', showHintCheck.checked);
        storage.set('count', countInput.value);
    }
    
    function loadSettings() {
        inputEl.value = storage.get('input', '');
        randomizeCheck.checked = storage.get('randomize', true);
        keepCapitalsCheck.checked = storage.get('keepCapitals', true);
        showHintCheck.checked = storage.get('showHint', false);
        countInput.value = storage.get('count', '5');
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Spelling Exercise se zavírá');
}