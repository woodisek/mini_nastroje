import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('alphabet-sorter');

// Předpřipravená slova podle kategorií
const wordCategories = {
    zvirata: ['pes', 'kočka', 'králík', 'myš', 'lev', 'tygr', 'slon', 'žirafa', 'delfín', 'orel', 'včela', 'motýl', 'žába', 'had', 'velryba'],
    ovoce: ['jablko', 'hruška', 'banán', 'pomeranč', 'jahoda', 'malina', 'borůvka', 'třešeň', 'kiwi', 'meloun', 'ananas', 'mango', 'broskev'],
    barvy: ['červená', 'modrá', 'zelená', 'žlutá', 'fialová', 'růžová', 'oranžová', 'bílá', 'černá', 'hnědá', 'šedá'],
    skola: ['tužka', 'sešit', 'pravítko', 'guma', 'pastelka', 'batoh', 'učebnice', 'tabule', 'lavice', 'křída', 'nůžky', 'lepidlo'],
    povolani: ['učitel', 'lékař', 'hasič', 'policista', 'zedník', 'pekař', 'řidič', 'prodavač', 'kuchař', 'zahradník', 'malíř']
};

export default function render(container) {
    container.innerHTML = `
        <div class="alphabet-sorter">
            <div class="as-header">
                <span class="as-icon">🔤</span>
                <div>
                    <h3>Abecední seřazovač</h3>
                    <p>Seřaď slova podle abecedy a zkontroluj si výsledek</p>
                </div>
            </div>

            <!-- Kategorie slov -->
            <div class="as-section">
                <label class="as-label">📂 Kategorie slov</label>
                <div class="as-categories">
                    <button data-cat="zvirata" class="as-cat-btn active">🐾 Zvířata</button>
                    <button data-cat="ovoce" class="as-cat-btn">🍎 Ovoce</button>
                    <button data-cat="barvy" class="as-cat-btn">🎨 Barvy</button>
                    <button data-cat="skola" class="as-cat-btn">📚 Škola</button>
                    <button data-cat="povolani" class="as-cat-btn">👔 Povolání</button>
                    <button data-cat="custom" class="as-cat-btn">✏️ Vlastní</button>
                </div>
            </div>

            <!-- Vlastní slova -->
            <div id="as-custom-section" class="as-section" style="display: none;">
                <label class="as-label">✏️ Zadej vlastní slova (oddělená čárkou)</label>
                <textarea id="as-custom-words" class="as-textarea" rows="3" placeholder="Např.: pes, kočka, králík, myš, lev"></textarea>
                <div class="as-hint">Slova se automaticky rozdělí podle čárek</div>
            </div>

            <!-- Počet slov -->
            <div class="as-section">
                <label class="as-label">🔢 Počet slov k seřazení</label>
                <div class="as-count-control">
                    <button id="as-count-minus" class="as-count-btn">−</button>
                    <input type="number" id="as-count" class="as-count-input" value="6" min="3" max="12" step="1">
                    <button id="as-count-plus" class="as-count-btn">+</button>
                </div>
                <div class="as-hint">3-12 slov</div>
            </div>

            <!-- Tlačítka -->
            <div class="as-buttons">
                <button id="as-generate" class="as-btn as-btn-primary">🎲 Generovat slova</button>
                <button id="as-check" class="as-btn as-btn-secondary">✅ Zkontrolovat</button>
                <button id="as-clear" class="as-btn as-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Seřazená slova (student) -->
            <div class="as-student-section">
                <div class="as-student-header">
                    <span>📝 Seřaď slova podle abecedy (přetahuj nebo piš čísla)</span>
                    <button id="as-copy-student" class="as-small-btn">📋 Kopírovat</button>
                </div>
                <div id="as-student-list" class="as-student-list">
                    <div class="as-empty">Klikni na "Generovat slova"</div>
                </div>
            </div>

            <!-- Správné řešení -->
            <details class="as-details">
                <summary>🔑 Správné řešení (pro učitele)</summary>
                <div id="as-correct-list" class="as-correct-list">
                    <div class="as-empty">Zatím žádná slova</div>
                </div>
            </details>

            <!-- Výsledek kontroly -->
            <div id="as-result" class="as-result"></div>

            <!-- Tip -->
            <div class="as-tip">
                💡 <strong>Tip:</strong> Můžeš přetahovat slova myší (drag & drop) nebo ke každému slovu přiřadit číslo podle pořadí. Po kliknutí na "Zkontrolovat" uvidíš, co máš správně.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const catBtns = document.querySelectorAll('.as-cat-btn');
    const customSection = document.getElementById('as-custom-section');
    const customWordsInput = document.getElementById('as-custom-words');
    const countInput = document.getElementById('as-count');
    const countMinus = document.getElementById('as-count-minus');
    const countPlus = document.getElementById('as-count-plus');
    const generateBtn = document.getElementById('as-generate');
    const checkBtn = document.getElementById('as-check');
    const clearBtn = document.getElementById('as-clear');
    const copyStudentBtn = document.getElementById('as-copy-student');
    const studentListDiv = document.getElementById('as-student-list');
    const correctListDiv = document.getElementById('as-correct-list');
    const resultDiv = document.getElementById('as-result');

    let currentCategory = 'zvirata';
    let currentWords = [];
    let currentCorrectOrder = [];
    let currentStudentOrder = [];
    let dragSourceIndex = null;

    // Načtení slov podle kategorie
    function getWordsFromCategory(category, count) {
        if (category === 'custom') {
            const customText = customWordsInput.value;
            if (!customText.trim()) return [];
            const words = customText.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
            return words.slice(0, count);
        }
        const words = wordCategories[category] || [];
        // Náhodný výběr
        const shuffled = [...words];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }

    function generateWords() {
        let count = parseInt(countInput.value) || 6;
        if (count < 3) count = 3;
        if (count > 12) count = 12;
        
        let words = getWordsFromCategory(currentCategory, count);
        
        if (words.length === 0) {
            showNotification('Žádná slova k dispozici', 'warning');
            return;
        }
        
        if (words.length < count) {
            showNotification(`Pouze ${words.length} slov k dispozici`, 'warning');
        }
        
        currentWords = words;
        // Správné pořadí = abecední řazení
        currentCorrectOrder = [...currentWords].sort((a, b) => a.localeCompare(b, 'cs'));
        // Počáteční pořadí pro studenta = náhodné zamíchání
        currentStudentOrder = [...currentWords];
        for (let i = currentStudentOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentStudentOrder[i], currentStudentOrder[j]] = [currentStudentOrder[j], currentStudentOrder[i]];
        }
        
        displayStudentList();
        displayCorrectList();
        resultDiv.innerHTML = '';
        showNotification(`Vygenerováno ${currentWords.length} slov`, 'success');
        saveSettings();
    }

    function displayStudentList() {
        if (currentStudentOrder.length === 0) {
            studentListDiv.innerHTML = '<div class="as-empty">Klikni na "Generovat slova"</div>';
            return;
        }
        
        studentListDiv.innerHTML = currentStudentOrder.map((word, idx) => `
            <div class="as-student-item" draggable="true" data-index="${idx}">
                <span class="as-student-number">${idx + 1}.</span>
                <span class="as-student-word">${escapeHtml(word)}</span>
                <button class="as-student-up" data-index="${idx}">▲</button>
                <button class="as-student-down" data-index="${idx}">▼</button>
            </div>
        `).join('');
        
        // Eventy pro tlačítka
        document.querySelectorAll('.as-student-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.index);
                if (idx > 0) {
                    [currentStudentOrder[idx - 1], currentStudentOrder[idx]] = 
                    [currentStudentOrder[idx], currentStudentOrder[idx - 1]];
                    displayStudentList();
                    saveSettings();
                }
            });
        });
        
        document.querySelectorAll('.as-student-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.index);
                if (idx < currentStudentOrder.length - 1) {
                    [currentStudentOrder[idx], currentStudentOrder[idx + 1]] = 
                    [currentStudentOrder[idx + 1], currentStudentOrder[idx]];
                    displayStudentList();
                    saveSettings();
                }
            });
        });
        
        // Drag & drop
        const items = document.querySelectorAll('.as-student-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                dragSourceIndex = parseInt(item.dataset.index);
                e.dataTransfer.effectAllowed = 'move';
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetIndex = parseInt(item.dataset.index);
                if (dragSourceIndex !== null && dragSourceIndex !== targetIndex) {
                    const draggedItem = currentStudentOrder[dragSourceIndex];
                    currentStudentOrder.splice(dragSourceIndex, 1);
                    currentStudentOrder.splice(targetIndex, 0, draggedItem);
                    displayStudentList();
                    saveSettings();
                }
                dragSourceIndex = null;
            });
        });
    }

    function displayCorrectList() {
        if (currentCorrectOrder.length === 0) {
            correctListDiv.innerHTML = '<div class="as-empty">Zatím žádná slova</div>';
            return;
        }
        
        correctListDiv.innerHTML = currentCorrectOrder.map((word, idx) => `
            <div class="as-correct-item">
                <span class="as-correct-number">${idx + 1}.</span>
                <span class="as-correct-word">${escapeHtml(word)}</span>
            </div>
        `).join('');
    }

    function checkOrder() {
        if (currentStudentOrder.length === 0) {
            showNotification('Nejprve vygeneruj slova', 'warning');
            return;
        }
        
        let correctCount = 0;
        const results = [];
        
        for (let i = 0; i < currentStudentOrder.length; i++) {
            const isCorrect = currentStudentOrder[i] === currentCorrectOrder[i];
            if (isCorrect) correctCount++;
            results.push({
                word: currentStudentOrder[i],
                position: i + 1,
                correct: isCorrect,
                correctWord: currentCorrectOrder[i]
            });
        }
        
        const percentage = Math.round((correctCount / currentStudentOrder.length) * 100);
        
        let resultHtml = `
            <div class="as-result-card ${percentage === 100 ? 'as-perfect' : percentage >= 70 ? 'as-good' : 'as-bad'}">
                <div class="as-result-stats">
                    <span class="as-result-correct">✅ Správně: ${correctCount}/${currentStudentOrder.length}</span>
                    <span class="as-result-percentage">${percentage}%</span>
                </div>
                <div class="as-result-details">
        `;
        
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            resultHtml += `
                <div class="as-result-detail ${r.correct ? 'as-detail-correct' : 'as-detail-wrong'}">
                    <span class="as-detail-position">${r.position}.</span>
                    <span class="as-detail-word">${escapeHtml(r.word)}</span>
                    ${!r.correct ? `<span class="as-detail-correct-word">→ mělo být: ${escapeHtml(r.correctWord)}</span>` : '<span class="as-detail-check">✓</span>'}
                </div>
            `;
        }
        
        resultHtml += `
                </div>
            </div>
        `;
        
        resultDiv.innerHTML = resultHtml;
        
        if (percentage === 100) {
            showNotification('🎉 Výborně! Všechna slova jsou správně seřazená!', 'success');
        } else {
            showNotification(`Správně máš ${correctCount} z ${currentStudentOrder.length} slov`, 'info');
        }
        
        saveSettings();
    }

    async function copyStudentList() {
        if (currentStudentOrder.length === 0) {
            showNotification('Žádná slova ke kopírování', 'warning');
            return;
        }
        
        let text = 'ABECEDNÍ SEŘAZOVAČ\n';
        text += '='.repeat(30) + '\n\n';
        text += 'Seřaď slova podle abecedy:\n\n';
        currentStudentOrder.forEach((word, idx) => {
            text += `${idx + 1}. ${word}\n`;
        });
        
        await copyToClipboard(text);
        showNotification('Seznam zkopírován');
    }

    function clearAll() {
        currentWords = [];
        currentCorrectOrder = [];
        currentStudentOrder = [];
        studentListDiv.innerHTML = '<div class="as-empty">Klikni na "Generovat slova"</div>';
        correctListDiv.innerHTML = '<div class="as-empty">Zatím žádná slova</div>';
        resultDiv.innerHTML = '';
        showNotification('Vyčištěno');
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

    // Eventy
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            customSection.style.display = currentCategory === 'custom' ? 'block' : 'none';
            saveSettings();
        });
    });
    
    countMinus.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val > 3) countInput.value = val - 1;
        saveSettings();
    });
    
    countPlus.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val < 12) countInput.value = val + 1;
        saveSettings();
    });
    
    generateBtn.addEventListener('click', generateWords);
    checkBtn.addEventListener('click', checkOrder);
    clearBtn.addEventListener('click', clearAll);
    copyStudentBtn.addEventListener('click', copyStudentList);
    
    customWordsInput.addEventListener('input', saveSettings);
    countInput.addEventListener('change', saveSettings);
    
    function saveSettings() {
        storage.set('category', currentCategory);
        storage.set('customWords', customWordsInput.value);
        storage.set('count', countInput.value);
        storage.set('studentOrder', currentStudentOrder);
        storage.set('words', currentWords);
    }
    
    function loadSettings() {
        const savedCategory = storage.get('category', 'zvirata');
        const savedCustomWords = storage.get('customWords', '');
        const savedCount = storage.get('count', '6');
        const savedStudentOrder = storage.get('studentOrder', []);
        const savedWords = storage.get('words', []);
        
        currentCategory = savedCategory;
        customWordsInput.value = savedCustomWords;
        countInput.value = savedCount;
        
        if (savedStudentOrder.length > 0 && savedWords.length > 0) {
            currentStudentOrder = savedStudentOrder;
            currentWords = savedWords;
            // Znovu vypočítat správné pořadí
            currentCorrectOrder = [...currentWords].sort((a, b) => a.localeCompare(b, 'cs'));
            displayStudentList();
            displayCorrectList();
        }
        
        catBtns.forEach(btn => {
            if (btn.dataset.cat === currentCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        customSection.style.display = currentCategory === 'custom' ? 'block' : 'none';
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Alphabet Sorter se zavírá');
}