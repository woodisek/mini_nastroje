import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('addition-pyramid');

export default function render(container) {
    container.innerHTML = `
        <div class="addition-pyramid">
            <div class="ap-header">
                <span class="ap-icon">🔺</span>
                <div>
                    <h3>Sčítací pyramidy</h3>
                    <p>Doplň chybějící čísla v pyramidě (součet dvou spodních = horní)</p>
                </div>
            </div>

            <!-- Velikost pyramidy -->
            <div class="ap-section">
                <label class="ap-label">📐 Velikost pyramidy (počet řad)</label>
                <div class="ap-size-control">
                    <button id="ap-size-minus" class="ap-size-btn">−</button>
                    <input type="number" id="ap-size" class="ap-size-input" value="4" min="3" max="6" step="1">
                    <button id="ap-size-plus" class="ap-size-btn">+</button>
                </div>
                <div class="ap-hint">3-6 řad (čím více řad, tím složitější)</div>
            </div>

            <!-- Rozsah čísel -->
            <div class="ap-section">
                <label class="ap-label">🔢 Rozsah čísel</label>
                <div class="ap-range">
                    <div class="ap-range-input">
                        <span>Min:</span>
                        <input type="number" id="ap-min" class="ap-input-small" value="1" min="0" max="50">
                    </div>
                    <div class="ap-range-input">
                        <span>Max:</span>
                        <input type="number" id="ap-max" class="ap-input-small" value="20" min="1" max="100">
                    </div>
                </div>
                <div class="ap-hint">Čísla budou v tomto rozsahu (kromě vrcholu)</div>
            </div>

            <!-- Počet mezer -->
            <div class="ap-section">
                <label class="ap-label">🔲 Počet prázdných polí k doplnění</label>
                <div class="ap-gaps-control">
                    <button id="ap-gaps-minus" class="ap-gaps-btn">−</button>
                    <input type="number" id="ap-gaps" class="ap-gaps-input" value="3" min="1" max="10" step="1">
                    <button id="ap-gaps-plus" class="ap-gaps-btn">+</button>
                </div>
                <div class="ap-hint">Čím více mezer, tím těžší</div>
            </div>

            <!-- Tlačítka -->
            <div class="ap-buttons">
                <button id="ap-generate" class="ap-btn ap-btn-primary">🔺 Generovat pyramidu</button>
                <button id="ap-key" class="ap-btn ap-btn-secondary">🔑 Zobrazit řešení</button>
                <button id="ap-clear" class="ap-btn ap-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Pyramida -->
            <div class="ap-pyramid-section">
                <div class="ap-pyramid-header">
                    <span>🔺 Sčítací pyramida</span>
                    <button id="ap-copy" class="ap-small-btn">📋 Kopírovat pyramidu</button>
                </div>
                <div id="ap-pyramid" class="ap-pyramid">
                    <div class="ap-empty">Klikni na "Generovat pyramidu"</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="ap-tip">
                💡 <strong>Tip:</strong> Každé horní číslo je součtem dvou čísel pod ním. Doplň chybějící čísla. Pyramida čte zdola nahoru.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const sizeInput = document.getElementById('ap-size');
    const sizeMinus = document.getElementById('ap-size-minus');
    const sizePlus = document.getElementById('ap-size-plus');
    const minInput = document.getElementById('ap-min');
    const maxInput = document.getElementById('ap-max');
    const gapsInput = document.getElementById('ap-gaps');
    const gapsMinus = document.getElementById('ap-gaps-minus');
    const gapsPlus = document.getElementById('ap-gaps-plus');
    const generateBtn = document.getElementById('ap-generate');
    const keyBtn = document.getElementById('ap-key');
    const clearBtn = document.getElementById('ap-clear');
    const copyBtn = document.getElementById('ap-copy');
    const pyramidDiv = document.getElementById('ap-pyramid');

    let currentPyramid = [];
    let currentSolution = [];
    let currentGaps = [];

    // Generování kompletní pyramidy
    function generateFullPyramid(size, minVal, maxVal) {
        // Vytvoření prázdné pyramidy
        const pyramid = [];
        for (let row = 0; row < size; row++) {
            pyramid[row] = new Array(row + 1).fill(0);
        }
        
        // Naplnění spodní řady náhodnými čísly
        for (let i = 0; i < size; i++) {
            pyramid[size - 1][i] = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        }
        
        // Výpočet vyšších řad (součet dvou spodních)
        for (let row = size - 2; row >= 0; row--) {
            for (let col = 0; col <= row; col++) {
                pyramid[row][col] = pyramid[row + 1][col] + pyramid[row + 1][col + 1];
            }
        }
        
        return pyramid;
    }

    // Vytvoření mezer v pyramidě
    function createGaps(pyramid, gapCount) {
        const size = pyramid.length;
        const totalCells = (size * (size + 1)) / 2;
        const maxGaps = Math.min(gapCount, totalCells - 1); // Alespoň jedno číslo musí být vidět
        
        // Sbírání všech pozic
        const positions = [];
        for (let row = 0; row < size; row++) {
            for (let col = 0; col <= row; col++) {
                positions.push({ row, col });
            }
        }
        
        // Náhodný výběr pozic pro mezery
        const shuffled = [...positions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        const gapPositions = shuffled.slice(0, maxGaps);
        
        // Vytvoření pyramidy s mezerami a řešení
        const pyramidWithGaps = JSON.parse(JSON.stringify(pyramid));
        const solution = JSON.parse(JSON.stringify(pyramid));
        
        for (const pos of gapPositions) {
            pyramidWithGaps[pos.row][pos.col] = '?';
        }
        
        return { pyramid: pyramidWithGaps, solution, gaps: gapPositions };
    }

    // Vygenerování pyramidy s mezerami
    function generatePyramid() {
        let size = parseInt(sizeInput.value) || 4;
        let minVal = parseInt(minInput.value) || 1;
        let maxVal = parseInt(maxInput.value) || 20;
        let gapCount = parseInt(gapsInput.value) || 3;
        
        if (size < 3) size = 3;
        if (size > 6) size = 6;
        if (minVal >= maxVal) {
            showNotification('"Min" musí být menší než "Max"', 'warning');
            return;
        }
        
        const fullPyramid = generateFullPyramid(size, minVal, maxVal);
        const { pyramid, solution, gaps } = createGaps(fullPyramid, gapCount);
        
        currentPyramid = pyramid;
        currentSolution = solution;
        currentGaps = gaps;
        
        displayPyramid(pyramid, false);
        showNotification('Pyramida vygenerována', 'success');
        saveSettings();
    }

    function displayPyramid(pyramid, showSolution) {
        const size = pyramid.length;
        let html = '<div class="ap-pyramid-container">';
        
        for (let row = 0; row < size; row++) {
            html += `<div class="ap-pyramid-row" style="margin-left: ${(size - row - 1) * 60}px;">`;
            
            for (let col = 0; col <= row; col++) {
                const value = pyramid[row][col];
                const isGap = value === '?';
                const isTop = row === 0;
                
                let displayValue = '';
                let cellClass = 'ap-cell';
                
                if (showSolution && isGap && currentSolution[row] && currentSolution[row][col] !== undefined) {
                    displayValue = currentSolution[row][col];
                    cellClass += ' ap-cell-solution';
                } else if (value === '?') {
                    displayValue = '?';
                    cellClass += ' ap-cell-gap';
                } else {
                    displayValue = value;
                    if (isTop) cellClass += ' ap-cell-top';
                }
                
                html += `<div class="${cellClass}">${displayValue}</div>`;
            }
            html += '</div>';
        }
        
        html += '</div>';
        pyramidDiv.innerHTML = html;
    }

    function showSolution() {
        if (currentPyramid.length === 0) {
            showNotification('Nejprve vygeneruj pyramidu', 'warning');
            return;
        }
        
        displayPyramid(currentPyramid, true);
        showNotification('Řešení zobrazeno (zelená čísla)', 'success');
    }

    function clearPyramid() {
        currentPyramid = [];
        currentSolution = [];
        currentGaps = [];
        pyramidDiv.innerHTML = '<div class="ap-empty">Klikni na "Generovat pyramidu"</div>';
        showNotification('Vyčištěno');
    }

    async function copyPyramid() {
        if (currentPyramid.length === 0) {
            showNotification('Žádná pyramida ke kopírování', 'warning');
            return;
        }
        
        let text = 'SČÍTACÍ PYRAMIDA\n';
        text += '='.repeat(30) + '\n\n';
        text += 'Pravidlo: Každé horní číslo je součtem dvou čísel pod ním.\n\n';
        
        const size = currentPyramid.length;
        for (let row = 0; row < size; row++) {
            text += ' '.repeat((size - row - 1) * 3);
            for (let col = 0; col <= row; col++) {
                let val = currentPyramid[row][col];
                if (val === '?') val = '___';
                text += String(val).padStart(4, ' ');
            }
            text += '\n';
        }
        
        await copyToClipboard(text);
        showNotification('Pyramida zkopírována');
    }

    // Eventy
    sizeMinus.addEventListener('click', () => {
        let val = parseInt(sizeInput.value);
        if (val > 3) sizeInput.value = val - 1;
        saveSettings();
    });
    
    sizePlus.addEventListener('click', () => {
        let val = parseInt(sizeInput.value);
        if (val < 6) sizeInput.value = val + 1;
        saveSettings();
    });
    
    gapsMinus.addEventListener('click', () => {
        let val = parseInt(gapsInput.value);
        if (val > 1) gapsInput.value = val - 1;
        saveSettings();
    });
    
    gapsPlus.addEventListener('click', () => {
        let val = parseInt(gapsInput.value);
        if (val < 10) gapsInput.value = val + 1;
        saveSettings();
    });
    
    generateBtn.addEventListener('click', generatePyramid);
    keyBtn.addEventListener('click', showSolution);
    clearBtn.addEventListener('click', clearPyramid);
    copyBtn.addEventListener('click', copyPyramid);
    
    const saveElements = [sizeInput, minInput, maxInput, gapsInput];
    saveElements.forEach(el => {
        if (el) el.addEventListener('change', saveSettings);
        if (el) el.addEventListener('input', saveSettings);
    });
    
    function saveSettings() {
        storage.set('size', sizeInput.value);
        storage.set('min', minInput.value);
        storage.set('max', maxInput.value);
        storage.set('gaps', gapsInput.value);
    }
    
    function loadSettings() {
        sizeInput.value = storage.get('size', '4');
        minInput.value = storage.get('min', '1');
        maxInput.value = storage.get('max', '20');
        gapsInput.value = storage.get('gaps', '3');
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Addition Pyramid se zavírá');
}