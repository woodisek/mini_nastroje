import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('hashtag-generator');

export default function render(container) {
    container.innerHTML = `
        <div class="hashtag-generator">
            <div class="hg-header">
                <span class="hg-icon">#️⃣</span>
                <div>
                    <h3>Hashtag Generátor</h3>
                    <p>Vytvoř hashtagy z textu pro sociální sítě</p>
                </div>
            </div>

            <!-- Vstupní text -->
            <div class="hg-section">
                <label class="hg-label">📝 Vstupní text</label>
                <textarea id="hg-input" class="hg-textarea" rows="4" placeholder="Sem napiš text pro generování hashtagů...&#10;&#10;Např.: Nejlepší káva v Praze je v nové kavárně"></textarea>
                <div class="hg-hint">💡 Zadej popis, článek nebo klíčová slova</div>
            </div>

            <!-- Možnosti -->
            <div class="hg-section">
                <label class="hg-label">⚙️ Možnosti</label>
                <div class="hg-options">
                    <label class="hg-checkbox">
                        <input type="checkbox" id="hg-remove-duplicates" checked>
                        <span>🔄 Odstranit duplicitní slova</span>
                    </label>
                    <label class="hg-checkbox">
                        <input type="checkbox" id="hg-remove-common" checked>
                        <span>🗑️ Odstranit běžná slova (a, na, v, atd.)</span>
                    </label>
                    <label class="hg-checkbox">
                        <input type="checkbox" id="hg-capitalize" checked>
                        <span>📝 Velké první písmeno (#Hashtag)</span>
                    </label>
                    <label class="hg-checkbox">
                        <input type="checkbox" id="hg-remove-spaces">
                        <span>🔗 Spojit víceslovné fráze (#jedenslovo)</span>
                    </label>
                    <label class="hg-checkbox">
                        <input type="checkbox" id="hg-add-hash" checked>
                        <span>#️⃣ Přidat # před každý hashtag</span>
                    </label>
                </div>
            </div>

            <!-- Počet hashtagů -->
            <div class="hg-section">
                <label class="hg-label">🔢 Počet hashtagů</label>
                <div class="hg-count-control">
                    <button id="hg-count-minus" class="hg-count-btn">−</button>
                    <input type="number" id="hg-count" class="hg-count-input" value="10" min="1" max="30">
                    <button id="hg-count-plus" class="hg-count-btn">+</button>
                </div>
                <div class="hg-hint">Maximálně 30 hashtagů</div>
            </div>

            <!-- Výstupní formát -->
            <div class="hg-section">
                <label class="hg-label">📋 Výstupní formát</label>
                <div class="hg-formats">
                    <button data-format="lines" class="hg-format-btn active">📄 Řádky (jeden hashtag na řádek)</button>
                    <button data-format="inline" class="hg-format-btn">📝 Inline text (mezera)</button>
                    <button data-format="comma" class="hg-format-btn">📊 Čárkou oddělené</button>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="hg-buttons">
                <button id="hg-generate" class="hg-btn hg-btn-primary">#️⃣ Generovat hashtagy</button>
                <button id="hg-clear" class="hg-btn hg-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="hg-result-section">
                <div class="hg-result-header">
                    <span>📊 Vygenerované hashtagy</span>
                    <button id="hg-copy" class="hg-small-btn">📋 Kopírovat</button>
                    <button id="hg-clear-result" class="hg-small-btn">🗑️ Smazat výsledky</button>
                </div>
                <div id="hg-result" class="hg-result">
                    <div class="hg-empty">Zadej text a klikni na "Generovat hashtagy"</div>
                </div>
            </div>

            <!-- Statistiky -->
            <div class="hg-stats">
                <div class="hg-stat-card">
                    <div class="hg-stat-value" id="hg-words-count">0</div>
                    <div class="hg-stat-label">unikátních slov</div>
                </div>
                <div class="hg-stat-card">
                    <div class="hg-stat-value" id="hg-hashtags-count">0</div>
                    <div class="hg-stat-label">vygenerovaných</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="hg-tip">
                💡 <strong>Tip:</strong> Hashtagy jsou ideální pro Instagram, Twitter, LinkedIn a další sociální sítě. Používej relevantní klíčová slova.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const inputEl = document.getElementById('hg-input');
    const removeDuplicatesCheck = document.getElementById('hg-remove-duplicates');
    const removeCommonCheck = document.getElementById('hg-remove-common');
    const capitalizeCheck = document.getElementById('hg-capitalize');
    const removeSpacesCheck = document.getElementById('hg-remove-spaces');
    const addHashCheck = document.getElementById('hg-add-hash');
    const countInput = document.getElementById('hg-count');
    const countMinus = document.getElementById('hg-count-minus');
    const countPlus = document.getElementById('hg-count-plus');
    const formatBtns = document.querySelectorAll('.hg-format-btn');
    const generateBtn = document.getElementById('hg-generate');
    const clearBtn = document.getElementById('hg-clear');
    const copyBtn = document.getElementById('hg-copy');
    const clearResultBtn = document.getElementById('hg-clear-result');
    const resultDiv = document.getElementById('hg-result');
    const wordsCountSpan = document.getElementById('hg-words-count');
    const hashtagsCountSpan = document.getElementById('hg-hashtags-count');

    let currentFormat = 'lines';
    let currentHashtags = [];

    // Běžná slova k odstranění (česká + anglická)
    const commonWords = [
        'a', 'abych', 'aby', 'ahoj', 'ale', 'anebo', 'ani', 'ano', 'asi', 'až', 'bez', 'bude', 'byl', 'byla', 'byli', 'bylo', 'byly', 'bys', 'být',
        'co', 'což', 'cz', 'dál', 'dále', 'další', 'de', 'deset', 'dnes', 'do', 'dobrý', 'docela', 'dva', 'dvě', 'dnes', 'ho', 'hodně', 'i', 'já',
        'jak', 'jaké', 'jaký', 'jako', 'je', 'jeho', 'jej', 'její', 'jemu', 'jen', 'jenom', 'jenž', 'jeste', 'jestli', 'ještě', 'jež', 'ji', 'jí',
        'jich', 'jím', 'jimi', 'jinak', 'jine', 'jiné', 'jiný', 'jít', 'jsem', 'jseš', 'jsme', 'jsou', 'jste', 'k', 'kam', 'kde', 'ke', 'kdo',
        'kdy', 'když', 'ke', 'kolik', 'kromě', 'která', 'které', 'kteří', 'který', 'kvůli', 'má', 'mají', 'mám', 'máme', 'máš', 'mé', 'mě', 'mezi',
        'mi', 'mít', 'mně', 'mnou', 'moc', 'může', 'můj', 'musí', 'my', 'na', 'nad', 'nám', 'námi', 'například', 'naše', 'naši', 'ne', 'nebo', 'nech',
        'než', 'nic', 'nám', 'nás', 'náš', 'ní', 'nimi', 'nové', 'nový', 'o', 'od', 'ode', 'on', 'ona', 'oni', 'ono', 'po', 'pod', 'podle', 'pokud',
        'pouze', 'pro', 'proč', 'proto', 'první', 'před', 'přes', 'při', 's', 'se', 'si', 'sice', 'skoro', 'sobě', 'strana', 'své', 'svůj', 'ta',
        'tady', 'tak', 'takhle', 'taky', 'také', 'takže', 'tam', 'tato', 'tě', 'těch', 'ten', 'tento', 'této', 'tím', 'třeba', 'tři', 'tvoje', 'tvůj',
        'ty', 'u', 'v', 'vám', 'vámi', 'vás', 'váš', 'vaše', 've', 'víc', 'více', 'vlastně', 'všechno', 'všude', 'vůbec', 'vy', 'z', 'za', 'zda', 'zde',
        'ze', 'zpět', 'zpětně', 'že',
        'the', 'and', 'for', 'with', 'from', 'you', 'have', 'are', 'was', 'were', 'your', 'his', 'her', 'its', 'our', 'their', 'will', 'would', 'could',
        'should', 'this', 'that', 'these', 'those', 'some', 'any', 'each', 'every', 'all', 'both', 'either', 'neither', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'under', 'over', 'again', 'further', 'then', 'once', 'here', 'there', 'down', 'off', 'up', 'out'
    ];

    function removeDiacritics(str) {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ř/g, 'r')
            .replace(/č/g, 'c')
            .replace(/š/g, 's')
            .replace(/ž/g, 'z')
            .replace(/ý/g, 'y')
            .replace(/á/g, 'a')
            .replace(/é/g, 'e')
            .replace(/í/g, 'i')
            .replace(/ó/g, 'o')
            .replace(/ú/g, 'u')
            .replace(/ů/g, 'u')
            .replace(/ď/g, 'd')
            .replace(/ť/g, 't')
            .replace(/ň/g, 'n');
    }

    function generateHashtags() {
        const text = inputEl.value.trim();
        if (!text) {
            resultDiv.innerHTML = '<div class="hg-empty">Zadej text pro generování hashtagů</div>';
            currentHashtags = [];
            wordsCountSpan.textContent = '0';
            hashtagsCountSpan.textContent = '0';
            return;
        }
        
        // Odstranění interpunkce a rozdělení na slova
        let words = text.toLowerCase()
            .replace(/[.,!?;:()"']/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2);
        
        // Odstranění duplicit
        if (removeDuplicatesCheck.checked) {
            words = [...new Set(words)];
        }
        
        // Odstranění běžných slov
        if (removeCommonCheck.checked) {
            words = words.filter(word => !commonWords.includes(word));
        }
        
        // Získání počtu unikátních slov
        wordsCountSpan.textContent = words.length;
        
        // Limit počtu hashtagů
        let maxCount = parseInt(countInput.value) || 10;
        if (maxCount > words.length) maxCount = words.length;
        
        // Výběr nejrelevantnějších (náhodně pro jednoduchost, nebo podle frekvence)
        let selectedWords = [...words];
        if (selectedWords.length > maxCount) {
            // Náhodný výběr
            for (let i = selectedWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [selectedWords[i], selectedWords[j]] = [selectedWords[j], selectedWords[i]];
            }
            selectedWords = selectedWords.slice(0, maxCount);
        }
        
        // Formátování hashtagů
        let hashtags = selectedWords.map(word => {
            let processed = word;
            
            // Odstranění diakritiky
            processed = removeDiacritics(processed);
            
            // Odstranění mezer (spojení)
            if (removeSpacesCheck.checked) {
                processed = processed.replace(/\s+/g, '');
            }
            
            // Velké první písmeno
            if (capitalizeCheck.checked) {
                processed = processed.charAt(0).toUpperCase() + processed.slice(1);
            }
            
            // Přidání #
            if (addHashCheck.checked) {
                processed = '#' + processed;
            }
            
            return processed;
        });
        
        currentHashtags = hashtags;
        hashtagsCountSpan.textContent = hashtags.length;
        
        // Zobrazení výsledků
        displayResults(hashtags);
        
        if (hashtags.length === 0) {
            showNotification('Nebyly vygenerovány žádné hashtagy', 'warning');
        } else {
            showNotification(`Vygenerováno ${hashtags.length} hashtagů`, 'success');
        }
        
        saveSettings();
    }

    function displayResults(hashtags) {
        if (hashtags.length === 0) {
            resultDiv.innerHTML = '<div class="hg-empty">Žádné hashtagy nebyly vygenerovány</div>';
            return;
        }
        
        if (currentFormat === 'lines') {
            resultDiv.innerHTML = hashtags.map(tag => `
                <div class="hg-result-item">
                    <span class="hg-result-tag">${escapeHtml(tag)}</span>
                    <button class="hg-result-copy" data-tag="${escapeHtml(tag)}">📋</button>
                </div>
            `).join('');
        } else if (currentFormat === 'inline') {
            const inlineText = hashtags.join(' ');
            resultDiv.innerHTML = `
                <div class="hg-result-inline">
                    <div class="hg-result-tags-large">${escapeHtml(inlineText)}</div>
                    <button class="hg-result-copy-all" data-tags="${escapeHtml(inlineText)}">📋 Kopírovat vše</button>
                </div>
            `;
        } else if (currentFormat === 'comma') {
            const commaText = hashtags.join(', ');
            resultDiv.innerHTML = `
                <div class="hg-result-comma">
                    <div class="hg-result-tags-large">${escapeHtml(commaText)}</div>
                    <button class="hg-result-copy-all" data-tags="${escapeHtml(commaText)}">📋 Kopírovat vše</button>
                </div>
            `;
        }
        
        // Eventy pro kopírování
        if (currentFormat === 'lines') {
            document.querySelectorAll('.hg-result-copy').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const tag = btn.dataset.tag;
                    await copyToClipboard(tag);
                    showNotification(`Zkopírováno: ${tag}`);
                });
            });
        } else {
            document.querySelectorAll('.hg-result-copy-all').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const tags = btn.dataset.tags;
                    await copyToClipboard(tags);
                    showNotification('Všechny hashtagy zkopírovány');
                });
            });
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

    async function copyAllResults() {
        if (currentHashtags.length === 0) {
            showNotification('Žádné hashtagy ke kopírování', 'warning');
            return;
        }
        
        let text;
        if (currentFormat === 'lines') {
            text = currentHashtags.join('\n');
        } else if (currentFormat === 'inline') {
            text = currentHashtags.join(' ');
        } else {
            text = currentHashtags.join(', ');
        }
        
        await copyToClipboard(text);
        showNotification(`Zkopírováno ${currentHashtags.length} hashtagů`);
    }

    function clearResult() {
        currentHashtags = [];
        resultDiv.innerHTML = '<div class="hg-empty">Zadej text a klikni na "Generovat hashtagy"</div>';
        wordsCountSpan.textContent = '0';
        hashtagsCountSpan.textContent = '0';
        showNotification('Výsledky smazány');
    }

    function clearAll() {
        inputEl.value = '';
        clearResult();
        saveSettings();
    }

    // Eventy pro formáty
    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            formatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFormat = btn.dataset.format;
            if (currentHashtags.length > 0) displayResults(currentHashtags);
            saveSettings();
        });
    });
    
    // Počítadlo
    countMinus.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val > 1) countInput.value = val - 1;
        saveSettings();
    });
    
    countPlus.addEventListener('click', () => {
        let val = parseInt(countInput.value);
        if (val < 30) countInput.value = val + 1;
        saveSettings();
    });
    
    generateBtn.addEventListener('click', generateHashtags);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyAllResults);
    clearResultBtn.addEventListener('click', clearResult);
    
    const optionChecks = [removeDuplicatesCheck, removeCommonCheck, capitalizeCheck, removeSpacesCheck, addHashCheck];
    optionChecks.forEach(check => {
        check.addEventListener('change', () => {
            if (inputEl.value.trim()) generateHashtags();
            saveSettings();
        });
    });
    
    countInput.addEventListener('change', () => {
        if (inputEl.value.trim()) generateHashtags();
        saveSettings();
    });
    
    inputEl.addEventListener('input', saveSettings);
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('input', inputEl.value);
        storage.set('removeDuplicates', removeDuplicatesCheck.checked);
        storage.set('removeCommon', removeCommonCheck.checked);
        storage.set('capitalize', capitalizeCheck.checked);
        storage.set('removeSpaces', removeSpacesCheck.checked);
        storage.set('addHash', addHashCheck.checked);
        storage.set('count', countInput.value);
        storage.set('format', currentFormat);
    }
    
    function loadSettings() {
        const savedInput = storage.get('input', '');
        inputEl.value = savedInput;
        removeDuplicatesCheck.checked = storage.get('removeDuplicates', true);
        removeCommonCheck.checked = storage.get('removeCommon', true);
        capitalizeCheck.checked = storage.get('capitalize', true);
        removeSpacesCheck.checked = storage.get('removeSpaces', false);
        addHashCheck.checked = storage.get('addHash', true);
        countInput.value = storage.get('count', '10');
        currentFormat = storage.get('format', 'lines');
        
        formatBtns.forEach(btn => {
            if (btn.dataset.format === currentFormat) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        if (savedInput && savedInput.trim()) {
            setTimeout(() => generateHashtags(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Hashtag Generator se zavírá');
}