import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('email-extractor');

export default function render(container) {
    container.innerHTML = `
        <div class="email-extractor">
            <div class="ee-header">
                <span class="ee-icon">📧</span>
                <div>
                    <h3>Email Extractor</h3>
                    <p>Extrahuj emailové adresy z textu</p>
                </div>
            </div>

            <!-- Vstupní text -->
            <div class="ee-section">
                <label class="ee-label">📝 Vstupní text</label>
                <textarea id="ee-input" class="ee-textarea" rows="8" placeholder="Sem vlož text s emailovými adresami...&#10;&#10;Např.:&#10;Kontaktujte nás na info@firma.cz nebo podpora@seznam.cz&#10;John Doe &lt;john.doe@gmail.com&gt;&#10;https://example.com/contact?email=user@domain.com"></textarea>
                <div class="ee-hint">💡 Automaticky rozpozná všechny emailové adresy v textu</div>
            </div>

            <!-- Možnosti -->
            <div class="ee-section">
                <label class="ee-label">⚙️ Možnosti</label>
                <div class="ee-options">
                    <label class="ee-checkbox">
                        <input type="checkbox" id="ee-unique">
                        <span>🔄 Odstranit duplicitní emaily</span>
                    </label>
                    <label class="ee-checkbox">
                        <input type="checkbox" id="ee-sort">
                        <span>📊 Seřadit A-Z</span>
                    </label>
                    <label class="ee-checkbox">
                        <input type="checkbox" id="ee-lowercase">
                        <span>🔡 Převést na malá písmena</span>
                    </label>
                    <label class="ee-checkbox">
                        <input type="checkbox" id="ee-valid-only">
                        <span>✅ Pouze validní domény (.com, .cz, atd.)</span>
                    </label>
                </div>
            </div>

            <!-- Výstupní formát -->
            <div class="ee-section">
                <label class="ee-label">📋 Výstupní formát</label>
                <div class="ee-formats">
                    <button data-format="lines" class="ee-format-btn active">📄 Řádky (jeden email na řádek)</button>
                    <button data-format="csv" class="ee-format-btn">📊 CSV (čárkou oddělené)</button>
                    <button data-format="inline" class="ee-format-btn">📝 Inline text (mezera)</button>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="ee-buttons">
                <button id="ee-extract" class="ee-btn ee-btn-primary">📧 Extrahovat emaily</button>
                <button id="ee-clear" class="ee-btn ee-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="ee-result-section">
                <div class="ee-result-header">
                    <span>📊 Extrahované emaily</span>
                    <button id="ee-copy" class="ee-small-btn">📋 Kopírovat</button>
                    <button id="ee-clear-result" class="ee-small-btn">🗑️ Smazat výsledky</button>
                </div>
                <div id="ee-result" class="ee-result">
                    <div class="ee-empty">Vlož text a klikni na "Extrahovat emaily"</div>
                </div>
            </div>

            <!-- Statistiky -->
            <div class="ee-stats">
                <div class="ee-stat-card">
                    <div class="ee-stat-value" id="ee-found-count">0</div>
                    <div class="ee-stat-label">nalezených emailů</div>
                </div>
                <div class="ee-stat-card">
                    <div class="ee-stat-value" id="ee-unique-count">0</div>
                    <div class="ee-stat-label">unikátních emailů</div>
                </div>
                <div class="ee-stat-card">
                    <div class="ee-stat-value" id="ee-domains-count">0</div>
                    <div class="ee-stat-label">unikátních domén</div>
                </div>
            </div>

            <!-- Domény -->
            <details class="ee-details">
                <summary>🌐 Seznam domén</summary>
                <div id="ee-domains" class="ee-domains">
                    <div class="ee-empty-domains">Zatím žádné domény</div>
                </div>
            </details>

            <!-- Tip -->
            <div class="ee-tip">
                💡 <strong>Tip:</strong> Extrahuje všechny platné emailové adresy ve formátu jméno@domena.cz. Podporuje tečky, pomlčky a podtržítka v lokální části.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const inputEl = document.getElementById('ee-input');
    const uniqueCheck = document.getElementById('ee-unique');
    const sortCheck = document.getElementById('ee-sort');
    const lowercaseCheck = document.getElementById('ee-lowercase');
    const validOnlyCheck = document.getElementById('ee-valid-only');
    const formatBtns = document.querySelectorAll('.ee-format-btn');
    const extractBtn = document.getElementById('ee-extract');
    const clearBtn = document.getElementById('ee-clear');
    const copyBtn = document.getElementById('ee-copy');
    const clearResultBtn = document.getElementById('ee-clear-result');
    const resultDiv = document.getElementById('ee-result');
    const foundCountSpan = document.getElementById('ee-found-count');
    const uniqueCountSpan = document.getElementById('ee-unique-count');
    const domainsCountSpan = document.getElementById('ee-domains-count');
    const domainsDiv = document.getElementById('ee-domains');

    let currentFormat = 'lines';
    let currentEmails = [];

    // Regulární výraz pro email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Seznam běžných TLD pro validaci
    const validTlds = ['com', 'cz', 'sk', 'eu', 'net', 'org', 'info', 'biz', 'io', 'co', 'uk', 'de', 'fr', 'it', 'es', 'pl', 'hu', 'at', 'ch', 'be', 'nl', 'se', 'no', 'dk', 'fi', 'ru', 'ua', 'br', 'au', 'nz', 'jp', 'cn', 'in', 'kr', 'za'];

    function isValidDomain(email) {
        if (!validOnlyCheck.checked) return true;
        const domain = email.split('@')[1];
        if (!domain) return false;
        const tld = domain.split('.').pop().toLowerCase();
        return validTlds.includes(tld);
    }

    function extractEmails() {
        const text = inputEl.value;
        if (!text.trim()) {
            resultDiv.innerHTML = '<div class="ee-empty">Vlož text s emailovými adresami</div>';
            currentEmails = [];
            foundCountSpan.textContent = '0';
            uniqueCountSpan.textContent = '0';
            domainsCountSpan.textContent = '0';
            domainsDiv.innerHTML = '<div class="ee-empty-domains">Zatím žádné domény</div>';
            return;
        }
        
        // Extrakce emailů
        let matches = text.match(emailRegex) || [];
        const totalFound = matches.length;
        
        // Konverze na malá písmena
        if (lowercaseCheck.checked) {
            matches = matches.map(email => email.toLowerCase());
        }
        
        // Validace domén
        if (validOnlyCheck.checked) {
            matches = matches.filter(email => isValidDomain(email));
        }
        
        // Odstranění duplicit
        let uniqueEmails = [...new Set(matches)];
        
        // Řazení
        if (sortCheck.checked) {
            uniqueEmails.sort();
        }
        
        currentEmails = uniqueEmails;
        
        // Statistiky
        foundCountSpan.textContent = totalFound;
        uniqueCountSpan.textContent = uniqueEmails.length;
        
        // Domény
        const domains = [...new Set(uniqueEmails.map(email => email.split('@')[1]))];
        domainsCountSpan.textContent = domains.length;
        
        if (domains.length > 0) {
            domainsDiv.innerHTML = domains.map(domain => `
                <div class="ee-domain-item">
                    <span class="ee-domain-name">${escapeHtml(domain)}</span>
                    <span class="ee-domain-count">${uniqueEmails.filter(e => e.endsWith(domain)).length}x</span>
                </div>
            `).join('');
        } else {
            domainsDiv.innerHTML = '<div class="ee-empty-domains">Zatím žádné domény</div>';
        }
        
        // Zobrazení výsledků
        displayResults(uniqueEmails);
        
        if (uniqueEmails.length === 0) {
            showNotification('Nenalezeny žádné emailové adresy', 'warning');
        } else {
            showNotification(`Nalezeno ${uniqueEmails.length} emailových adres`, 'success');
        }
        
        saveSettings();
    }

    function displayResults(emails) {
        if (emails.length === 0) {
            resultDiv.innerHTML = '<div class="ee-empty">Žádné emailové adresy nebyly nalezeny</div>';
            return;
        }
        
        if (currentFormat === 'lines') {
            resultDiv.innerHTML = emails.map(email => `
                <div class="ee-result-item">
                    <span class="ee-result-email">${escapeHtml(email)}</span>
                    <button class="ee-result-copy" data-email="${escapeHtml(email)}">📋</button>
                </div>
            `).join('');
        } else if (currentFormat === 'csv') {
            const csvLine = emails.join(', ');
            resultDiv.innerHTML = `
                <div class="ee-result-csv">
                    <div class="ee-result-email-large">${escapeHtml(csvLine)}</div>
                    <button class="ee-result-copy-all" data-emails="${escapeHtml(csvLine)}">📋 Kopírovat vše</button>
                </div>
            `;
        } else if (currentFormat === 'inline') {
            const inlineText = emails.join(' ');
            resultDiv.innerHTML = `
                <div class="ee-result-inline">
                    <div class="ee-result-email-large">${escapeHtml(inlineText)}</div>
                    <button class="ee-result-copy-all" data-emails="${escapeHtml(inlineText)}">📋 Kopírovat vše</button>
                </div>
            `;
        }
        
        // Eventy pro kopírování
        if (currentFormat === 'lines') {
            document.querySelectorAll('.ee-result-copy').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const email = btn.dataset.email;
                    await copyToClipboard(email);
                    showNotification(`Zkopírováno: ${email}`);
                });
            });
        } else {
            document.querySelectorAll('.ee-result-copy-all').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const emailsText = btn.dataset.emails;
                    await copyToClipboard(emailsText);
                    showNotification('Všechny emaily zkopírovány');
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
        if (currentEmails.length === 0) {
            showNotification('Žádné emaily ke kopírování', 'warning');
            return;
        }
        
        let text;
        if (currentFormat === 'lines') {
            text = currentEmails.join('\n');
        } else if (currentFormat === 'csv') {
            text = currentEmails.join(', ');
        } else {
            text = currentEmails.join(' ');
        }
        
        await copyToClipboard(text);
        showNotification(`Zkopírováno ${currentEmails.length} emailů`);
    }

    function clearResult() {
        currentEmails = [];
        resultDiv.innerHTML = '<div class="ee-empty">Vlož text a klikni na "Extrahovat emaily"</div>';
        foundCountSpan.textContent = '0';
        uniqueCountSpan.textContent = '0';
        domainsCountSpan.textContent = '0';
        domainsDiv.innerHTML = '<div class="ee-empty-domains">Zatím žádné domény</div>';
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
            if (currentEmails.length > 0) displayResults(currentEmails);
            saveSettings();
        });
    });
    
    extractBtn.addEventListener('click', extractEmails);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyAllResults);
    clearResultBtn.addEventListener('click', clearResult);
    
    uniqueCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) extractEmails();
        saveSettings();
    });
    sortCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) extractEmails();
        saveSettings();
    });
    lowercaseCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) extractEmails();
        saveSettings();
    });
    validOnlyCheck.addEventListener('change', () => {
        if (inputEl.value.trim()) extractEmails();
        saveSettings();
    });
    inputEl.addEventListener('input', saveSettings);
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('input', inputEl.value);
        storage.set('unique', uniqueCheck.checked);
        storage.set('sort', sortCheck.checked);
        storage.set('lowercase', lowercaseCheck.checked);
        storage.set('validOnly', validOnlyCheck.checked);
        storage.set('format', currentFormat);
    }
    
    function loadSettings() {
        const savedInput = storage.get('input', '');
        inputEl.value = savedInput;
        uniqueCheck.checked = storage.get('unique', false);
        sortCheck.checked = storage.get('sort', false);
        lowercaseCheck.checked = storage.get('lowercase', false);
        validOnlyCheck.checked = storage.get('validOnly', false);
        currentFormat = storage.get('format', 'lines');
        
        formatBtns.forEach(btn => {
            if (btn.dataset.format === currentFormat) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        if (savedInput && savedInput.trim()) {
            setTimeout(() => extractEmails(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Email Extractor se zavírá');
}