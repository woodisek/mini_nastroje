import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('wheel-of-fortune');

export default function render(container) {
    container.innerHTML = `
        <div class="wheel-of-fortune">
            <div class="wf-header">
                <span class="wf-icon">🎡</span>
                <div>
                    <h3>Kolo štěstí</h3>
                    <p>Náhodné losování jmen nebo položek</p>
                </div>
            </div>

            <div class="wf-section">
                <label class="wf-label">📝 Seznam položek (jedna na řádek)</label>
                <textarea id="wf-items" class="wf-textarea" rows="5" placeholder="Zadej položky, každou na nový řádek..."></textarea>
                <div class="wf-hint">💡 Každá položka na samostatném řádku</div>
            </div>

            <div class="wf-section">
                <label class="wf-label">⚙️ Nastavení točení</label>
                <div class="wf-settings">
                    <div class="wf-setting">
                        <span>Doba točení:</span>
                        <div class="wf-setting-control">
                            <button id="wf-duration-minus" class="wf-setting-btn">−</button>
                            <input type="number" id="wf-duration" class="wf-setting-input" value="2" min="1" max="5" step="0.5">
                            <button id="wf-duration-plus" class="wf-setting-btn">+</button>
                            <span>sekund</span>
                        </div>
                    </div>
                    <div class="wf-setting">
                        <span>Počet otočení:</span>
                        <div class="wf-setting-control">
                            <button id="wf-rotations-minus" class="wf-setting-btn">−</button>
                            <input type="number" id="wf-rotations" class="wf-setting-input" value="5" min="3" max="15" step="1">
                            <button id="wf-rotations-plus" class="wf-setting-btn">+</button>
                            <span>×</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="wf-controls">
                <button id="wf-spin" class="wf-btn wf-btn-primary">🎡 Roztočit kolo</button>
                <button id="wf-add" class="wf-btn wf-btn-secondary">➕ Přidat položku</button>
                <button id="wf-clear" class="wf-btn wf-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <div class="wf-wheel-container">
                <canvas id="wf-wheel" class="wf-wheel" width="500" height="500"></canvas>
                <div class="wf-pointer">▼</div>
            </div>

            <div class="wf-result-section">
                <div class="wf-result-header">
                    <span>🎉 Výsledek losování</span>
                    <button id="wf-copy" class="wf-small-btn">📋 Kopírovat</button>
                </div>
                <div id="wf-result" class="wf-result">
                    <div class="wf-empty">Roztoč kolo!</div>
                </div>
            </div>

            <details class="wf-details">
                <summary>📜 Historie losování</summary>
                <div id="wf-history" class="wf-history">
                    <div class="wf-empty-history">Zatím žádná historie</div>
                </div>
                <button id="wf-clear-history" class="wf-small-btn wf-clear-history">🗑️ Smazat historii</button>
            </details>

            <div class="wf-tip">
                💡 <strong>Tip:</strong> Kolo se vždy otočí minimálně 3×. Čím více otočení, tím delší animace.
            </div>
        </div>
    `;

    const itemsTextarea = document.getElementById('wf-items');
    const spinBtn = document.getElementById('wf-spin');
    const addBtn = document.getElementById('wf-add');
    const clearBtn = document.getElementById('wf-clear');
    const copyBtn = document.getElementById('wf-copy');
    const clearHistoryBtn = document.getElementById('wf-clear-history');
    const resultDiv = document.getElementById('wf-result');
    const historyDiv = document.getElementById('wf-history');
    const canvas = document.getElementById('wf-wheel');
    const ctx = canvas.getContext('2d');
    
    const durationInput = document.getElementById('wf-duration');
    const durationMinus = document.getElementById('wf-duration-minus');
    const durationPlus = document.getElementById('wf-duration-plus');
    const rotationsInput = document.getElementById('wf-rotations');
    const rotationsMinus = document.getElementById('wf-rotations-minus');
    const rotationsPlus = document.getElementById('wf-rotations-plus');

    let items = [];
    let currentRotation = 0;
    let spinning = false;
    let animationId = null;
    let spinStartTime = 0;
    let spinDuration = 2000;
    let spinStartRotation = 0;
    let spinTargetRotation = 0;
    let history = [];
    let selectedItem = '';

    const colors = [
        '#f44336', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#00bcd4',
        '#e91e63', '#8bc34a', '#3f51b5', '#ff5722', '#795548', '#607d8b',
        '#ffc107', '#009688', '#673ab7', '#ff6b6b', '#4ecdc4', '#45b7d1'
    ];

    function loadItems() {
        const text = itemsTextarea.value;
        items = text.split(/\r?\n/).filter(item => item.trim().length > 0);
        drawWheel();
        saveSettings();
    }

    function saveItems() {
        const text = items.join('\n');
        itemsTextarea.value = text;
        drawWheel();
        saveSettings();
    }

    function drawWheel() {
        if (!ctx) return;
        
        const count = items.length;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = width / 2 - 10;
        
        ctx.clearRect(0, 0, width, height);
        
        if (count === 0) {
            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('Přidej položky', centerX, centerY);
            return;
        }
        
        const angleStep = (Math.PI * 2) / count;
        
        for (let i = 0; i < count; i++) {
            const startAngle = currentRotation + i * angleStep;
            const endAngle = startAngle + angleStep;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + angleStep / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = 'white';
            
            const text = items[i];
            const textRadius = radius - 30;
            ctx.fillText(text.length > 12 ? text.slice(0, 10) + '..' : text, textRadius, 0);
            ctx.restore();
        }
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1e2e';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    function spinWheel() {
        if (spinning) return;
        if (items.length === 0) {
            showNotification('Přidej nejprve nějaké položky', 'warning');
            return;
        }
        
        spinning = true;
        spinStartTime = performance.now();
        spinStartRotation = currentRotation;
        
        const duration = parseFloat(durationInput.value) || 2;
        const rotations = parseInt(rotationsInput.value) || 5;
        spinDuration = duration * 1000;
        
        const targetIndex = Math.floor(Math.random() * items.length);
        const angleStep = (Math.PI * 2) / items.length;
        const targetSegmentCenter = targetIndex * angleStep + angleStep / 2;
        const pointerAngle = (Math.PI * 3) / 2; // 270° - šipka nahoře
        
        // Výpočet cílové rotace: chceme, aby střed cílového segmentu byl přesně pod šipkou
        // currentRotation + delta = pointerAngle - targetSegmentCenter + (rotations * 2PI)
        let delta = pointerAngle - targetSegmentCenter - currentRotation;
        
        // Přidáme plné otočky
        delta += Math.PI * 2 * rotations;
        
        // Zajistíme, že delta je kladné a dostatečně velké
        while (delta < Math.PI * 2) {
            delta += Math.PI * 2;
        }
        
        spinTargetRotation = currentRotation + delta;
        
        animateSpin(targetIndex);
    }
    
    function animateSpin(targetIndex) {
        const now = performance.now();
        const elapsed = now - spinStartTime;
        const progress = Math.min(1, elapsed / spinDuration);
        
        // easeOutCubic - plynulé zpomalení na konci
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = spinStartRotation + (spinTargetRotation - spinStartRotation) * easeOut;
        drawWheel();
        
        if (progress < 1) {
            animationId = requestAnimationFrame(() => animateSpin(targetIndex));
        } else {
            // Přesné nastavení na cílovou hodnotu
            currentRotation = spinTargetRotation;
            drawWheel();
            
            spinning = false;
            cancelAnimationFrame(animationId);
            animationId = null;
            
            selectedItem = items[targetIndex];
            
            resultDiv.innerHTML = `
                <div class="wf-result-card">
                    <div class="wf-result-icon">🎉</div>
                    <div class="wf-result-name">${escapeHtml(selectedItem)}</div>
                    <div class="wf-result-label">vyhrává!</div>
                </div>
            `;
            
            addToHistory(selectedItem);
            showNotification(`Vybráno: ${selectedItem}`, 'success');
            saveSettings();
        }
    }
    
    function addToHistory(item) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        history.unshift({ item, time: timeStr });
        if (history.length > 20) history = history.slice(0, 20);
        displayHistory();
        saveHistory();
    }
    
    function displayHistory() {
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="wf-empty-history">Zatím žádná historie</div>';
            return;
        }
        historyDiv.innerHTML = history.map(item => `
            <div class="wf-history-item">
                <span class="wf-history-item-name">${escapeHtml(item.item)}</span>
                <span class="wf-history-time">${item.time}</span>
            </div>
        `).join('');
    }
    
    function saveHistory() {
        storage.set('wheelHistory', history);
    }
    
    function loadHistory() {
        const saved = storage.get('wheelHistory', []);
        history = saved;
        displayHistory();
    }
    
    function clearHistory() {
        if (history.length > 0) {
            history = [];
            displayHistory();
            saveHistory();
            showNotification('Historie smazána');
        }
    }
    
    function addItem() {
        const newItem = prompt('Zadej novou položku:');
        if (newItem && newItem.trim()) {
            items.push(newItem.trim());
            saveItems();
            drawWheel();
            showNotification(`Přidáno: ${newItem.trim()}`);
        }
    }
    
    function clearAll() {
        items = [];
        itemsTextarea.value = '';
        currentRotation = 0;
        drawWheel();
        resultDiv.innerHTML = '<div class="wf-empty">Roztoč kolo!</div>';
        showNotification('Vyčištěno');
        saveSettings();
    }
    
    async function copyResult() {
        if (!selectedItem) {
            showNotification('Nejprve roztoč kolo', 'warning');
            return;
        }
        await copyToClipboard(selectedItem);
        showNotification(`Zkopírováno: ${selectedItem}`);
    }
    
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    durationMinus.addEventListener('click', () => {
        let val = parseFloat(durationInput.value);
        if (val > 1) durationInput.value = (val - 0.5).toFixed(1);
        saveSettings();
    });
    durationPlus.addEventListener('click', () => {
        let val = parseFloat(durationInput.value);
        if (val < 5) durationInput.value = (val + 0.5).toFixed(1);
        saveSettings();
    });
    rotationsMinus.addEventListener('click', () => {
        let val = parseInt(rotationsInput.value);
        if (val > 3) rotationsInput.value = val - 1;
        saveSettings();
    });
    rotationsPlus.addEventListener('click', () => {
        let val = parseInt(rotationsInput.value);
        if (val < 15) rotationsInput.value = val + 1;
        saveSettings();
    });
    
    spinBtn.addEventListener('click', spinWheel);
    addBtn.addEventListener('click', addItem);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    itemsTextarea.addEventListener('input', loadItems);
    
    function resizeCanvas() {
        const containerWidth = document.querySelector('.wf-wheel-container')?.clientWidth || 400;
        const size = Math.min(containerWidth - 32, 500);
        canvas.width = size;
        canvas.height = size;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        drawWheel();
    }
    
    window.addEventListener('resize', resizeCanvas);
    
    function saveSettings() {
        storage.set('wheelItems', items);
        storage.set('wheelRotation', currentRotation);
        storage.set('duration', durationInput.value);
        storage.set('rotations', rotationsInput.value);
    }
    
    function loadSettings() {
        const savedItems = storage.get('wheelItems', []);
        const savedRotation = storage.get('wheelRotation', 0);
        const savedDuration = storage.get('duration', '2');
        const savedRotations = storage.get('rotations', '5');
        
        if (savedItems.length > 0) {
            items = savedItems;
            itemsTextarea.value = items.join('\n');
        }
        
        currentRotation = savedRotation;
        durationInput.value = savedDuration;
        rotationsInput.value = savedRotations;
        drawWheel();
    }
    
    loadHistory();
    loadSettings();
    setTimeout(resizeCanvas, 100);
    
    window.addEventListener('beforeunload', () => {
        if (animationId) cancelAnimationFrame(animationId);
    });
}

export function cleanup() {
    if (animationId) cancelAnimationFrame(animationId);
    console.log('Wheel of Fortune se zavírá');
}