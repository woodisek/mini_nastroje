import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('simple-calculator');

export default function render(container) {
    container.innerHTML = `
        <div class="simple-calculator">
            <div class="sc-header">
                <span class="sc-icon">🧮</span>
                <div>
                    <h3>Jednoduchá kalkulačka</h3>
                    <p>Základní početní operace</p>
                </div>
            </div>

            <!-- Displej -->
            <div class="sc-display">
                <div class="sc-expression" id="sc-expression"></div>
                <div class="sc-result" id="sc-result">0</div>
            </div>

            <!-- Tlačítka -->
            <div class="sc-buttons">
                <button class="sc-btn sc-btn-clear" data-action="clear">AC</button>
                <button class="sc-btn sc-btn-clear" data-action="delete">⌫</button>
                <button class="sc-btn sc-btn-operator" data-op="%">%</button>
                <button class="sc-btn sc-btn-operator" data-op="/">÷</button>
                
                <button class="sc-btn sc-btn-number" data-num="7">7</button>
                <button class="sc-btn sc-btn-number" data-num="8">8</button>
                <button class="sc-btn sc-btn-number" data-num="9">9</button>
                <button class="sc-btn sc-btn-operator" data-op="*">×</button>
                
                <button class="sc-btn sc-btn-number" data-num="4">4</button>
                <button class="sc-btn sc-btn-number" data-num="5">5</button>
                <button class="sc-btn sc-btn-number" data-num="6">6</button>
                <button class="sc-btn sc-btn-operator" data-op="-">-</button>
                
                <button class="sc-btn sc-btn-number" data-num="1">1</button>
                <button class="sc-btn sc-btn-number" data-num="2">2</button>
                <button class="sc-btn sc-btn-number" data-num="3">3</button>
                <button class="sc-btn sc-btn-operator" data-op="+">+</button>
                
                <button class="sc-btn sc-btn-number" data-num="0">0</button>
                <button class="sc-btn sc-btn-number" data-num="00">00</button>
                <button class="sc-btn sc-btn-number" data-num=".">.</button>
                <button class="sc-btn sc-btn-equals" data-action="equals">=</button>
            </div>

            <!-- Historie -->
            <details class="sc-details">
                <summary>📜 Historie výpočtů</summary>
                <div id="sc-history" class="sc-history">
                    <div class="sc-empty-history">Zatím žádná historie</div>
                </div>
                <button id="sc-clear-history" class="sc-small-btn sc-clear-history">🗑️ Smazat historii</button>
            </details>

            <!-- Tip -->
            <div class="sc-tip">
                💡 <strong>Tip:</strong> Můžeš použít klávesnici pro zadávání čísel a operátorů (+, -, *, /, %, Enter).
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const expressionEl = document.getElementById('sc-expression');
    const resultEl = document.getElementById('sc-result');
    const historyDiv = document.getElementById('sc-history');
    const clearHistoryBtn = document.getElementById('sc-clear-history');

    let currentExpression = '';
    let currentResult = '';
    let history = [];
    let waitingForOperand = false;

    // Načtení historie
    function loadHistory() {
        const saved = storage.get('calcHistory', []);
        history = saved;
        displayHistory();
    }

    function saveHistory() {
        storage.set('calcHistory', history.slice(0, 20));
    }

    function addToHistory(expression, result) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        history.unshift({ expression, result, time: timeStr });
        if (history.length > 20) history = history.slice(0, 20);
        displayHistory();
        saveHistory();
    }

    function displayHistory() {
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="sc-empty-history">Zatím žádná historie</div>';
            return;
        }
        historyDiv.innerHTML = history.map(item => `
            <div class="sc-history-item">
                <span class="sc-history-expr">${escapeHtml(item.expression)} = ${escapeHtml(item.result)}</span>
                <span class="sc-history-time">${item.time}</span>
            </div>
        `).join('');
    }

    function clearHistory() {
        if (history.length > 0) {
            history = [];
            displayHistory();
            saveHistory();
            showNotification('Historie smazána');
        }
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Výpočet
    function calculate(expression) {
        // Nahrazení × za * a ÷ za /
        let expr = expression.replace(/×/g, '*').replace(/÷/g, '/');
        
        // Kontrola dělení nulou
        if (expr.includes('/0')) {
            return 'Chyba';
        }
        
        try {
            // Bezpečné vyhodnocení (pouze základní matematika)
            const result = Function('"use strict";return (' + expr + ')')();
            if (isNaN(result) || !isFinite(result)) {
                return 'Chyba';
            }
            // Zaokrouhlení na 10 desetinných míst
            return Math.round(result * 10000000000) / 10000000000;
        } catch (e) {
            return 'Chyba';
        }
    }

    function updateDisplay() {
        if (currentExpression) {
            expressionEl.textContent = currentExpression;
        } else {
            expressionEl.textContent = '';
        }
        
        if (currentResult) {
            resultEl.textContent = currentResult;
        } else {
            resultEl.textContent = '0';
        }
    }

    function appendNumber(num) {
        if (waitingForOperand) {
            currentExpression = '';
            waitingForOperand = false;
        }
        
        if (num === '.' && currentExpression.includes('.')) {
            return;
        }
        
        if (num === '00') {
            currentExpression += '00';
        } else {
            currentExpression += num;
        }
        
        // Průběžný výpočet
        const result = calculate(currentExpression);
        if (result !== 'Chyba') {
            currentResult = result.toString();
        } else {
            currentResult = '';
        }
        
        updateDisplay();
        saveState();
    }

    function appendOperator(op) {
        if (currentExpression === '' && op === '-') {
            currentExpression = '-';
            updateDisplay();
            saveState();
            return;
        }
        
        if (currentExpression === '') return;
        
        const lastChar = currentExpression.slice(-1);
        if (['+', '-', '*', '/', '%'].includes(lastChar)) {
            currentExpression = currentExpression.slice(0, -1) + op;
        } else {
            currentExpression += op;
        }
        
        waitingForOperand = false;
        
        const result = calculate(currentExpression);
        if (result !== 'Chyba') {
            currentResult = result.toString();
        } else {
            currentResult = '';
        }
        
        updateDisplay();
        saveState();
    }

    function calculatePercent() {
        if (currentExpression === '') return;
        
        try {
            const value = eval(currentExpression);
            const percent = value / 100;
            currentExpression = percent.toString();
            currentResult = percent.toString();
            updateDisplay();
            saveState();
        } catch (e) {
            // Chyba
        }
    }

    function calculateEquals() {
        if (currentExpression === '') return;
        
        const result = calculate(currentExpression);
        
        if (result !== 'Chyba') {
            addToHistory(currentExpression, result.toString());
            currentResult = result.toString();
            currentExpression = result.toString();
            waitingForOperand = true;
        } else {
            currentResult = 'Chyba';
            currentExpression = '';
        }
        
        updateDisplay();
        saveState();
    }

    function clearAll() {
        currentExpression = '';
        currentResult = '';
        waitingForOperand = false;
        updateDisplay();
        saveState();
    }

    function deleteLast() {
        if (waitingForOperand) return;
        currentExpression = currentExpression.slice(0, -1);
        
        if (currentExpression === '') {
            currentResult = '';
        } else {
            const result = calculate(currentExpression);
            if (result !== 'Chyba') {
                currentResult = result.toString();
            } else {
                currentResult = '';
            }
        }
        
        updateDisplay();
        saveState();
    }

    // Ukládání stavu
    function saveState() {
        storage.set('expression', currentExpression);
        storage.set('result', currentResult);
    }

    function loadState() {
        const savedExpression = storage.get('expression', '');
        const savedResult = storage.get('result', '');
        
        if (savedExpression) {
            currentExpression = savedExpression;
            currentResult = savedResult;
            updateDisplay();
        }
    }

    // Klávesnice
    function handleKeyboard(e) {
        const key = e.key;
        
        if (/[0-9]/.test(key)) {
            e.preventDefault();
            appendNumber(key);
        } else if (key === '.') {
            e.preventDefault();
            appendNumber('.');
        } else if (key === '+' || key === '-' || key === '*' || key === '/') {
            e.preventDefault();
            let op = key;
            if (op === '*') op = '×';
            if (op === '/') op = '÷';
            appendOperator(op);
        } else if (key === '%') {
            e.preventDefault();
            calculatePercent();
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            calculateEquals();
        } else if (key === 'Escape') {
            e.preventDefault();
            clearAll();
        } else if (key === 'Backspace') {
            e.preventDefault();
            deleteLast();
        }
    }

    // Eventy pro tlačítka
    document.querySelectorAll('.sc-btn-number').forEach(btn => {
        btn.addEventListener('click', () => {
            appendNumber(btn.dataset.num);
        });
    });
    
    document.querySelectorAll('.sc-btn-operator').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.op === '%') {
                calculatePercent();
            } else {
                appendOperator(btn.dataset.op);
            }
        });
    });
    
    document.querySelector('.sc-btn-equals').addEventListener('click', () => {
        calculateEquals();
    });
    
    document.querySelectorAll('.sc-btn-clear').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.action === 'clear') {
                clearAll();
            } else if (btn.dataset.action === 'delete') {
                deleteLast();
            }
        });
    });
    
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    window.addEventListener('keydown', handleKeyboard);
    
    loadHistory();
    loadState();
}

export function cleanup() {
    window.removeEventListener('keydown', handleKeyboard);
    console.log('Simple Calculator se zavírá');
}