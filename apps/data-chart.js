import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('data-chart');

export default function render(container) {
    container.innerHTML = `
        <div class="data-chart">
            <div class="dc-header">
                <span class="dc-icon">📈</span>
                <div>
                    <h3>Graf vývoje</h3>
                    <p>Vizualizace dat v jednoduchém sloupcovém grafu</p>
                </div>
            </div>

            <!-- Vstup dat -->
            <div class="dc-section">
                <label class="dc-label">📝 Zadej hodnoty (oddělené čárkou)</label>
                <textarea id="dc-data" class="dc-textarea" rows="3" placeholder="Např.: 10, 25, 15, 30, 45, 60, 55"></textarea>
                <div class="dc-hint">💡 Hodnoty odděluj čárkou. Můžeš zadat i popisky: leden=10, únor=25, březen=15</div>
            </div>

            <!-- Popisky (volitelné) -->
            <div class="dc-section">
                <label class="dc-label">🏷️ Popisky (volitelné, oddělené čárkou)</label>
                <input type="text" id="dc-labels" class="dc-input" placeholder="Např.: Leden, Únor, Březen, Duben, Květen, Červen, Červenec">
                <div class="dc-hint">Pokud nevyplníš, použijí se čísla 1, 2, 3...</div>
            </div>

            <!-- Název grafu -->
            <div class="dc-section">
                <label class="dc-label">📊 Název grafu (volitelné)</label>
                <input type="text" id="dc-title" class="dc-input" placeholder="Např.: Měsíční tržby 2024">
            </div>

            <!-- Barva -->
            <div class="dc-section">
                <label class="dc-label">🎨 Barva sloupců</label>
                <div class="dc-colors">
                    <button data-color="#667eea" class="dc-color-btn active" style="background: #667eea"></button>
                    <button data-color="#4caf50" class="dc-color-btn" style="background: #4caf50"></button>
                    <button data-color="#f44336" class="dc-color-btn" style="background: #f44336"></button>
                    <button data-color="#ff9800" class="dc-color-btn" style="background: #ff9800"></button>
                    <button data-color="#9c27b0" class="dc-color-btn" style="background: #9c27b0"></button>
                    <button data-color="#00bcd4" class="dc-color-btn" style="background: #00bcd4"></button>
                    <button data-color="#795548" class="dc-color-btn" style="background: #795548"></button>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="dc-buttons">
                <button id="dc-generate" class="dc-btn dc-btn-primary">📊 Vytvořit graf</button>
                <button id="dc-clear" class="dc-btn dc-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Graf -->
            <div class="dc-chart-section">
                <div class="dc-chart-header">
                    <span>📈 Graf vývoje</span>
                    <button id="dc-copy-chart" class="dc-small-btn">📋 Kopírovat data</button>
                </div>
                <div id="dc-chart" class="dc-chart">
                    <div class="dc-empty">Zadej hodnoty a klikni na "Vytvořit graf"</div>
                </div>
            </div>

            <!-- Statistiky -->
            <div class="dc-stats">
                <div class="dc-stat-card">
                    <div class="dc-stat-value" id="dc-min">-</div>
                    <div class="dc-stat-label">Minimum</div>
                </div>
                <div class="dc-stat-card">
                    <div class="dc-stat-value" id="dc-max">-</div>
                    <div class="dc-stat-label">Maximum</div>
                </div>
                <div class="dc-stat-card">
                    <div class="dc-stat-value" id="dc-average">-</div>
                    <div class="dc-stat-label">Průměr</div>
                </div>
                <div class="dc-stat-card">
                    <div class="dc-stat-value" id="dc-sum">-</div>
                    <div class="dc-stat-label">Součet</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="dc-tip">
                💡 <strong>Tip:</strong> Můžeš zadat hodnoty s popisky (např. leden=10) nebo jen čísla oddělená čárkou. Graf se automaticky přizpůsobí.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const dataInput = document.getElementById('dc-data');
    const labelsInput = document.getElementById('dc-labels');
    const titleInput = document.getElementById('dc-title');
    const colorBtns = document.querySelectorAll('.dc-color-btn');
    const generateBtn = document.getElementById('dc-generate');
    const clearBtn = document.getElementById('dc-clear');
    const copyChartBtn = document.getElementById('dc-copy-chart');
    const chartDiv = document.getElementById('dc-chart');
    const minSpan = document.getElementById('dc-min');
    const maxSpan = document.getElementById('dc-max');
    const averageSpan = document.getElementById('dc-average');
    const sumSpan = document.getElementById('dc-sum');

    let currentColor = '#667eea';
    let currentData = [];
    let currentLabels = [];

    // Parsování vstupu
    function parseData(input) {
        const parts = input.split(',');
        const values = [];
        
        for (let part of parts) {
            part = part.trim();
            if (part.includes('=')) {
                const [label, value] = part.split('=');
                values.push({
                    label: label.trim(),
                    value: parseFloat(value.trim())
                });
            } else {
                values.push({
                    label: null,
                    value: parseFloat(part)
                });
            }
        }
        
        return values.filter(v => !isNaN(v.value));
    }

    function getLabels(values, customLabels) {
        if (customLabels && customLabels.trim()) {
            const labels = customLabels.split(',').map(l => l.trim());
            if (labels.length >= values.length) {
                return labels.slice(0, values.length);
            }
        }
        
        // Použij popisky z hodnot nebo čísla
        const hasLabels = values.some(v => v.label);
        if (hasLabels) {
            return values.map(v => v.label || `#${values.indexOf(v) + 1}`);
        }
        
        return values.map((_, i) => `${i + 1}`);
    }

    function calculateStats(values) {
        const nums = values.map(v => v.value);
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        const sum = nums.reduce((a, b) => a + b, 0);
        const avg = sum / nums.length;
        return { min, max, sum, avg };
    }

    function renderChart() {
        const input = dataInput.value.trim();
        if (!input) {
            chartDiv.innerHTML = '<div class="dc-empty">Zadej hodnoty a klikni na "Vytvořit graf"</div>';
            minSpan.textContent = '-';
            maxSpan.textContent = '-';
            averageSpan.textContent = '-';
            sumSpan.textContent = '-';
            return;
        }
        
        const values = parseData(input);
        if (values.length === 0) {
            chartDiv.innerHTML = '<div class="dc-error">❌ Neplatný formát dat. Zadej čísla oddělená čárkou.</div>';
            return;
        }
        
        currentData = values;
        const labels = getLabels(values, labelsInput.value);
        currentLabels = labels;
        const stats = calculateStats(values);
        const title = titleInput.value.trim() || 'Graf vývoje';
        const maxValue = stats.max;
        
        // Statistiky
        minSpan.textContent = stats.min;
        maxSpan.textContent = stats.max;
        averageSpan.textContent = stats.avg.toFixed(1);
        sumSpan.textContent = stats.sum;
        
        // Vytvoření grafu
        const barMaxHeight = 200;
        
        let chartHtml = `
            <div class="dc-chart-title">${escapeHtml(title)}</div>
            <div class="dc-bars-container">
        `;
        
        for (let i = 0; i < values.length; i++) {
            const value = values[i].value;
            const percent = (value / maxValue) * 100;
            const height = (value / maxValue) * barMaxHeight;
            const barHeight = Math.max(height, 4);
            
            chartHtml += `
                <div class="dc-bar-wrapper">
                    <div class="dc-bar-label">${escapeHtml(labels[i])}</div>
                    <div class="dc-bar" style="height: ${barHeight}px; background: ${currentColor}" title="${value}"></div>
                    <div class="dc-bar-value">${value}</div>
                </div>
            `;
        }
        
        chartHtml += `</div><div class="dc-chart-footer">Hodnoty (max: ${maxValue})</div>`;
        chartDiv.innerHTML = chartHtml;
        
        showNotification(`Graf vytvořen - ${values.length} hodnot`, 'success');
        saveSettings();
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function copyData() {
        if (currentData.length === 0) {
            showNotification('Žádná data ke kopírování', 'warning');
            return;
        }
        
        let text = 'Hodnoty';
        for (let i = 0; i < currentData.length; i++) {
            text += `\n${currentLabels[i]}: ${currentData[i].value}`;
        }
        
        const stats = calculateStats(currentData);
        text += `\n\n--- Statistiky ---\nMinimum: ${stats.min}\nMaximum: ${stats.max}\nPrůměr: ${stats.avg.toFixed(1)}\nSoučet: ${stats.sum}`;
        
        await copyToClipboard(text);
        showNotification('Data zkopírována');
    }

    function clearAll() {
        dataInput.value = '';
        labelsInput.value = '';
        titleInput.value = '';
        chartDiv.innerHTML = '<div class="dc-empty">Zadej hodnoty a klikni na "Vytvořit graf"</div>';
        minSpan.textContent = '-';
        maxSpan.textContent = '-';
        averageSpan.textContent = '-';
        sumSpan.textContent = '-';
        currentData = [];
        currentLabels = [];
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Eventy
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentColor = btn.dataset.color;
            if (currentData.length > 0) renderChart();
            saveSettings();
        });
    });
    
    generateBtn.addEventListener('click', renderChart);
    clearBtn.addEventListener('click', clearAll);
    copyChartBtn.addEventListener('click', copyData);
    
    dataInput.addEventListener('input', saveSettings);
    labelsInput.addEventListener('input', saveSettings);
    titleInput.addEventListener('input', saveSettings);
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('data', dataInput.value);
        storage.set('labels', labelsInput.value);
        storage.set('title', titleInput.value);
        storage.set('color', currentColor);
    }
    
    function loadSettings() {
        dataInput.value = storage.get('data', '');
        labelsInput.value = storage.get('labels', '');
        titleInput.value = storage.get('title', '');
        currentColor = storage.get('color', '#667eea');
        
        colorBtns.forEach(btn => {
            if (btn.dataset.color === currentColor) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        if (dataInput.value) {
            setTimeout(() => renderChart(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Data Chart se zavírá');
}