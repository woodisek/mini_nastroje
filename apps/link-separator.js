import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('link-separator');

export default function render(container) {
    container.innerHTML = `
        <div class="link-separator">
            <div class="ls-header">
                <span class="ls-icon">🔗</span>
                <div>
                    <h3>Link Separator</h3>
                    <p>Extrahuj všechny URL adresy z textu</p>
                </div>
            </div>

            <!-- Vstup -->
            <div class="ls-section">
                <label class="ls-label">📝 Vstupní text</label>
                <textarea id="ls-input" class="ls-textarea" rows="6" placeholder="Sem vlož text s URL adresami...&#10;&#10;Např.:&#10;https://google.com, https://seznam.cz; www.example.org&#10;ftp://ftp.example.com&#10;bezprotokolu.cz"></textarea>
                <div class="ls-hint">💡 Automaticky rozpozná všechny URL adresy (http, https, ftp, www, bez protokolu)</div>
            </div>

            <!-- Výstupní formát -->
            <div class="ls-section">
                <label class="ls-label">📋 Výstupní formát</label>
                <div class="ls-formats">
                    <button data-format="lines" class="ls-format-btn active">📄 Řádky (jeden link na řádek)</button>
                    <button data-format="csv" class="ls-format-btn">📊 CSV (čárkou oddělené)</button>
                    <button data-format="inline" class="ls-format-btn">📝 Inline text (mezera)</button>
                </div>
            </div>

            <!-- Možnosti -->
            <div class="ls-section">
                <label class="ls-label">⚙️ Možnosti</label>
                <div class="ls-options">
                    <label class="ls-checkbox">
                        <input type="checkbox" id="ls-unique">
                        <span>🔄 Odstranit duplicitní URL</span>
                    </label>
                    <label class="ls-checkbox">
                        <input type="checkbox" id="ls-sort">
                        <span>📊 Seřadit A-Z</span>
                    </label>
                    <label class="ls-checkbox">
                        <input type="checkbox" id="ls-add-protocol">
                        <span>🔒 Přidat https:// k URL bez protokolu</span>
                    </label>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="ls-buttons">
                <button id="ls-process" class="ls-btn ls-btn-primary">🔗 Extrahovat linky</button>
                <button id="ls-clear" class="ls-btn ls-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="ls-result-section">
                <div class="ls-result-header">
                    <span>📊 Extrahované URL</span>
                    <button id="ls-copy" class="ls-small-btn">📋 Kopírovat</button>
                    <button id="ls-clear-result" class="ls-small-btn">🗑️ Smazat výsledky</button>
                </div>
                <div id="ls-result" class="ls-result">
                    <div class="ls-empty">Vlož text a klikni na "Extrahovat linky"</div>
                </div>
            </div>

            <!-- Statistiky -->
            <div class="ls-stats">
                <div class="ls-stat-card">
                    <div class="ls-stat-value" id="ls-found-count">0</div>
                    <div class="ls-stat-label">nalezených URL</div>
                </div>
                <div class="ls-stat-card">
                    <div class="ls-stat-value" id="ls-unique-count">0</div>
                    <div class="ls-stat-label">unikátních URL</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="ls-tip">
                💡 <strong>Tip:</strong> Nástroj automaticky rozpozná URL ve formátech http://, https://, ftp://, www. nebo prostá doména (example.com). Stačí vložit text a vše se najde samo.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const inputEl = document.getElementById('ls-input');
    const formatBtns = document.querySelectorAll('.ls-format-btn');
    const uniqueCheck = document.getElementById('ls-unique');
    const sortCheck = document.getElementById('ls-sort');
    const addProtocolCheck = document.getElementById('ls-add-protocol');
    const processBtn = document.getElementById('ls-process');
    const clearBtn = document.getElementById('ls-clear');
    const copyBtn = document.getElementById('ls-copy');
    const clearResultBtn = document.getElementById('ls-clear-result');
    const resultDiv = document.getElementById('ls-result');
    const foundCountSpan = document.getElementById('ls-found-count');
    const uniqueCountSpan = document.getElementById('ls-unique-count');

    let currentFormat = 'lines';
    let currentLinks = [];

    // Detekce URL v textu (regulární výraz)
    function extractUrls(text) {
        const urlRegex = /(?:https?:\/\/|ftp:\/\/|www\.)[^\s,;|()<>{}[\]\\]+|(?:[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})(?:\/[^\s,;|()<>{}[\]\\]*)?/gi;
        const matches = text.match(urlRegex) || [];
        return matches.map(url => url.trim());
    }

    // Přidání protokolu
    function addProtocol(url) {
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ftp://')) {
            return url;
        }
        if (url.startsWith('www.')) {
            return 'https://' + url;
        }
        return 'https://' + url;
    }

    function processLinks() {
        const inputText = inputEl.value;
        if (!inputText.trim()) {
            resultDiv.innerHTML = '<div class="ls-empty">Vlož text s URL adresami</div>';
            currentLinks = [];
            foundCountSpan.textContent = '0';
            uniqueCountSpan.textContent = '0';
            return;
        }
        
        // Extrakce URL
        let links = extractUrls(inputText);
        const totalFound = links.length;
        
        // Odstranění duplicit
        if (uniqueCheck.checked) {
            links = [...new Map(links.map(link => [link.toLowerCase(), link])).values()];
        }
        
        // Přidání protokolu
        if (addProtocolCheck.checked) {
            links = links.map(link => addProtocol(link));
        }
        
        // Řazení
        if (sortCheck.checked) {
            links.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        }
        
        currentLinks = links;
        
        // Statistiky
        foundCountSpan.textContent = totalFound;
        uniqueCountSpan.textContent = links.length;
        
        // Zobrazení podle formátu
        displayResults(links);
        
        if (links.length === 0) {
            showNotification('Nenalezeny žádné URL adresy', 'warning');
        } else {
            showNotification(`Nalezeno ${links.length} URL adres`, 'success');
        }
        
        saveSettings();
    }

    function displayResults(links) {
        if (links.length === 0) {
            resultDiv.innerHTML = '<div class="ls-empty">Žádné URL adresy nebyly nalezeny</div>';
            return;
        }
        
        if (currentFormat === 'lines') {
            resultDiv.innerHTML = links.map(link => `
                <div class="ls-result-item">
                    <span class="ls-result-url">${escapeHtml(link)}</span>
                    <button class="ls-result-copy" data-url="${escapeHtml(link)}">📋</button>
                </div>
            `).join('');
        } else if (currentFormat === 'csv') {
            const csvLine = links.join(', ');
            resultDiv.innerHTML = `
                <div class="ls-result-csv">
                    <div class="ls-result-url-large">${escapeHtml(csvLine)}</div>
                    <button class="ls-result-copy-all" data-url="${escapeHtml(csvLine)}">📋 Kopírovat vše</button>
                </div>
            `;
        } else if (currentFormat === 'inline') {
            const inlineText = links.join(' ');
            resultDiv.innerHTML = `
                <div class="ls-result-inline">
                    <div class="ls-result-url-large">${escapeHtml(inlineText)}</div>
                    <button class="ls-result-copy-all" data-url="${escapeHtml(inlineText)}">📋 Kopírovat vše</button>
                </div>
            `;
        }
        
        // Eventy pro kopírování
        if (currentFormat === 'lines') {
            document.querySelectorAll('.ls-result-copy').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const url = btn.dataset.url;
                    await copyToClipboard(url);
                    showNotification(`Zkopírováno: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`);
                });
            });
        } else {
            document.querySelectorAll('.ls-result-copy-all').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const text = btn.dataset.url;
                    await copyToClipboard(text);
                    showNotification('Všechny URL zkopírovány');
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
        if (currentLinks.length === 0) {
            showNotification('Žádné URL ke kopírování', 'warning');
            return;
        }
        
        let text;
        if (currentFormat === 'lines') {
            text = currentLinks.join('\n');
        } else if (currentFormat === 'csv') {
            text = currentLinks.join(', ');
        } else {
            text = currentLinks.join(' ');
        }
        
        await copyToClipboard(text);
        showNotification(`Zkopírováno ${currentLinks.length} URL`);
    }

    function clearResult() {
        currentLinks = [];
        resultDiv.innerHTML = '<div class="ls-empty">Vlož text a klikni na "Extrahovat linky"</div>';
        foundCountSpan.textContent = '0';
        uniqueCountSpan.textContent = '0';
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
            if (currentLinks.length > 0) displayResults(currentLinks);
            saveSettings();
        });
    });
    
    processBtn.addEventListener('click', processLinks);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyAllResults);
    clearResultBtn.addEventListener('click', clearResult);
    
    uniqueCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) processLinks();
        saveSettings();
    });
    sortCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) processLinks();
        saveSettings();
    });
    addProtocolCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) processLinks();
        saveSettings();
    });
    inputEl.addEventListener('input', saveSettings);
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('format', currentFormat);
        storage.set('unique', uniqueCheck.checked);
        storage.set('sort', sortCheck.checked);
        storage.set('addProtocol', addProtocolCheck.checked);
        storage.set('input', inputEl.value);
    }
    
    function loadSettings() {
        currentFormat = storage.get('format', 'lines');
        uniqueCheck.checked = storage.get('unique', false);
        sortCheck.checked = storage.get('sort', false);
        addProtocolCheck.checked = storage.get('addProtocol', false);
        
        const savedInput = storage.get('input', '');
        if (savedInput) inputEl.value = savedInput;
        
        // Nastavení aktivního formátu
        formatBtns.forEach(btn => {
            if (btn.dataset.format === currentFormat) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        if (savedInput && savedInput.trim()) {
            setTimeout(() => processLinks(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Link Separator se zavírá');
}