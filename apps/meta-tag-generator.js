import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('meta-tag-generator');

export default function render(container) {
    container.innerHTML = `
        <div class="meta-tag-generator">
            <div class="mtg-header">
                <span class="mtg-icon">🏷️</span>
                <div>
                    <h3>Meta Tag Generator</h3>
                    <p>Generuj meta tagy pro SEO a sociální sítě</p>
                </div>
            </div>

            <!-- Základní info -->
            <div class="mtg-section">
                <label class="mtg-label">📝 Název stránky (Title)</label>
                <input type="text" id="mtg-title" class="mtg-input" placeholder="Název stránky" value="Moje úžasná stránka">
                <div class="mtg-hint">Doporučená délka: 50-60 znaků</div>
            </div>

            <div class="mtg-section">
                <label class="mtg-label">📄 Popis stránky (Description)</label>
                <textarea id="mtg-description" class="mtg-textarea" rows="3" placeholder="Popis stránky...">Toto je popis mé úžasné webové stránky, která nabízí skvělé služby a produkty.</textarea>
                <div class="mtg-hint">Doporučená délka: 150-160 znaků</div>
            </div>

            <div class="mtg-section">
                <label class="mtg-label">🔑 Klíčová slova (Keywords)</label>
                <input type="text" id="mtg-keywords" class="mtg-input" placeholder="klíčová, slova, oddělená, čárkou" value="web, design, vývoj, SEO">
                <div class="mtg-hint">Klíčová slova oddělená čárkou</div>
            </div>

            <div class="mtg-section">
                <label class="mtg-label">🌐 URL stránky</label>
                <input type="url" id="mtg-url" class="mtg-input" placeholder="https://example.com/stranka" value="https://example.com/stranka">
            </div>

            <!-- Sociální sítě -->
            <details class="mtg-details">
                <summary>📱 Sociální sítě (Open Graph & Twitter Cards)</summary>
                
                <div class="mtg-subsection">
                    <label class="mtg-label">📘 Facebook / Open Graph</label>
                    <div class="mtg-checkbox">
                        <input type="checkbox" id="mtg-og-enabled" checked>
                        <span>Povolit Open Graph tagy</span>
                    </div>
                    <div class="mtg-og-fields">
                        <div class="mtg-field-group">
                            <label>OG Title (jinak se použije Title)</label>
                            <input type="text" id="mtg-og-title" class="mtg-input" placeholder="Název pro sociální sítě">
                        </div>
                        <div class="mtg-field-group">
                            <label>OG Description (jinak se použije Description)</label>
                            <textarea id="mtg-og-description" class="mtg-textarea-small" rows="2" placeholder="Popis pro sociální sítě"></textarea>
                        </div>
                        <div class="mtg-field-group">
                            <label>OG Image (URL obrázku)</label>
                            <input type="url" id="mtg-og-image" class="mtg-input" placeholder="https://example.com/obrazek.jpg">
                        </div>
                        <div class="mtg-field-group">
                            <label>OG Type</label>
                            <select id="mtg-og-type" class="mtg-select">
                                <option value="website">website</option>
                                <option value="article">article</option>
                                <option value="product">product</option>
                                <option value="video">video</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="mtg-subsection">
                    <label class="mtg-label">🐦 Twitter Card</label>
                    <div class="mtg-checkbox">
                        <input type="checkbox" id="mtg-twitter-enabled" checked>
                        <span>Povolit Twitter Card tagy</span>
                    </div>
                    <div class="mtg-twitter-fields">
                        <div class="mtg-field-group">
                            <label>Twitter Card Type</label>
                            <select id="mtg-twitter-card" class="mtg-select">
                                <option value="summary">summary</option>
                                <option value="summary_large_image" selected>summary_large_image</option>
                                <option value="app">app</option>
                            </select>
                        </div>
                        <div class="mtg-field-group">
                            <label>Twitter @username</label>
                            <input type="text" id="mtg-twitter-site" class="mtg-input" placeholder="@username">
                        </div>
                    </div>
                </div>
            </details>

            <!-- Další meta tagy -->
            <details class="mtg-details">
                <summary>⚙️ Další meta tagy</summary>
                <div class="mtg-checkbox">
                    <input type="checkbox" id="mtg-robots">
                    <span>🤖 Robots (index, follow)</span>
                </div>
                <div class="mtg-checkbox">
                    <input type="checkbox" id="mtg-author">
                    <span>✍️ Author</span>
                </div>
                <div class="mtg-checkbox">
                    <input type="checkbox" id="mtg-viewport">
                    <span>📱 Viewport (responzivní design)</span>
                </div>
                <div class="mtg-checkbox">
                    <input type="checkbox" id="mtg-copyright">
                    <span>© Copyright</span>
                </div>
            </details>

            <!-- Tlačítka -->
            <div class="mtg-buttons">
                <button id="mtg-generate" class="mtg-btn mtg-btn-primary">🔧 Generovat meta tagy</button>
                <button id="mtg-copy" class="mtg-btn mtg-btn-secondary">📋 Kopírovat HTML</button>
                <button id="mtg-clear" class="mtg-btn mtg-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="mtg-result-section">
                <div class="mtg-result-header">
                    <span>📋 Vygenerované meta tagy</span>
                    <button id="mtg-copy-result" class="mtg-small-btn">📋 Kopírovat</button>
                </div>
                <pre id="mtg-result" class="mtg-result"><div class="mtg-empty">Klikni na "Generovat meta tagy"</div></pre>
            </div>

            <!-- SEO náhled -->
            <details class="mtg-details" open>
                <summary>🔍 SEO náhled (jak to bude vypadat ve vyhledávači)</summary>
                <div id="mtg-seo-preview" class="mtg-seo-preview">
                    <div class="mtg-empty-preview">Vyplň název a popis</div>
                </div>
            </details>

            <!-- Tip -->
            <div class="mtg-tip">
                💡 <strong>Tip:</strong> Kvalitní meta tagy zlepšují SEO a sdílení na sociálních sítích. Title a Description jsou nejdůležitější.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const titleInput = document.getElementById('mtg-title');
    const descriptionInput = document.getElementById('mtg-description');
    const keywordsInput = document.getElementById('mtg-keywords');
    const urlInput = document.getElementById('mtg-url');
    const ogEnabled = document.getElementById('mtg-og-enabled');
    const ogTitle = document.getElementById('mtg-og-title');
    const ogDescription = document.getElementById('mtg-og-description');
    const ogImage = document.getElementById('mtg-og-image');
    const ogType = document.getElementById('mtg-og-type');
    const twitterEnabled = document.getElementById('mtg-twitter-enabled');
    const twitterCard = document.getElementById('mtg-twitter-card');
    const twitterSite = document.getElementById('mtg-twitter-site');
    const robotsCheck = document.getElementById('mtg-robots');
    const authorCheck = document.getElementById('mtg-author');
    const viewportCheck = document.getElementById('mtg-viewport');
    const copyrightCheck = document.getElementById('mtg-copyright');
    const generateBtn = document.getElementById('mtg-generate');
    const copyBtn = document.getElementById('mtg-copy');
    const copyResultBtn = document.getElementById('mtg-copy-result');
    const clearBtn = document.getElementById('mtg-clear');
    const resultPre = document.getElementById('mtg-result');
    const seoPreviewDiv = document.getElementById('mtg-seo-preview');

    let currentHtml = '';

    function generateMetaTags() {
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const keywords = keywordsInput.value.trim();
        const url = urlInput.value.trim();
        
        let html = '<!-- Základní meta tagy -->\n';
        html += `<title>${escapeHtml(title)}</title>\n`;
        html += `<meta name="description" content="${escapeHtml(description)}">\n`;
        if (keywords) html += `<meta name="keywords" content="${escapeHtml(keywords)}">\n`;
        
        // Robots
        if (robotsCheck.checked) {
            html += `<meta name="robots" content="index, follow">\n`;
        }
        
        // Author
        if (authorCheck.checked) {
            html += `<meta name="author" content="Autor">\n`;
        }
        
        // Viewport
        if (viewportCheck.checked) {
            html += `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
        }
        
        // Copyright
        if (copyrightCheck.checked) {
            const year = new Date().getFullYear();
            html += `<meta name="copyright" content="© ${year} ${escapeHtml(title)}">\n`;
        }
        
        // Canonical
        if (url) {
            html += `<link rel="canonical" href="${escapeHtml(url)}">\n`;
        }
        
        // Open Graph
        if (ogEnabled.checked) {
            html += `\n<!-- Open Graph / Facebook -->\n`;
            html += `<meta property="og:title" content="${escapeHtml(ogTitle.value || title)}">\n`;
            html += `<meta property="og:description" content="${escapeHtml(ogDescription.value || description)}">\n`;
            html += `<meta property="og:type" content="${ogType.value}">\n`;
            if (url) html += `<meta property="og:url" content="${escapeHtml(url)}">\n`;
            if (ogImage.value) html += `<meta property="og:image" content="${escapeHtml(ogImage.value)}">\n`;
        }
        
        // Twitter Card
        if (twitterEnabled.checked) {
            html += `\n<!-- Twitter Card -->\n`;
            html += `<meta name="twitter:card" content="${twitterCard.value}">\n`;
            html += `<meta name="twitter:title" content="${escapeHtml(ogTitle.value || title)}">\n`;
            html += `<meta name="twitter:description" content="${escapeHtml(ogDescription.value || description)}">\n`;
            if (twitterSite.value) html += `<meta name="twitter:site" content="${escapeHtml(twitterSite.value)}">\n`;
            if (ogImage.value) html += `<meta name="twitter:image" content="${escapeHtml(ogImage.value)}">\n`;
        }
        
        currentHtml = html;
        
        // Zobrazení do pre elementu jako text
        resultPre.innerHTML = '';
        const textNode = document.createTextNode(html);
        resultPre.appendChild(textNode);
        
        // SEO náhled
        updateSeoPreview(title, description, url);
        
        showNotification('Meta tagy vygenerovány', 'success');
        saveSettings();
    }

    function updateSeoPreview(title, description, url) {
        const displayUrl = url || 'example.com/stranka';
        const displayTitle = title || 'Bez názvu';
        const displayDescription = description || 'Bez popisu';
        
        seoPreviewDiv.innerHTML = `
            <div class="seo-preview-card">
                <div class="seo-preview-url">${escapeHtml(displayUrl)}</div>
                <div class="seo-preview-title">${escapeHtml(displayTitle)}</div>
                <div class="seo-preview-description">${escapeHtml(displayDescription)}</div>
            </div>
        `;
    }

    async function copyToClipboardHtml() {
        if (!currentHtml) {
            showNotification('Nejprve vygeneruj meta tagy', 'warning');
            return;
        }
        await copyToClipboard(currentHtml);
        showNotification('HTML zkopírováno do schránky');
    }

    async function copyResult() {
        if (!currentHtml) {
            showNotification('Nejprve vygeneruj meta tagy', 'warning');
            return;
        }
        await copyToClipboard(currentHtml);
        showNotification('HTML zkopírováno do schránky');
    }

    function clearAll() {
        titleInput.value = 'Moje úžasná stránka';
        descriptionInput.value = 'Toto je popis mé úžasné webové stránky, která nabízí skvělé služby a produkty.';
        keywordsInput.value = 'web, design, vývoj, SEO';
        urlInput.value = 'https://example.com/stranka';
        ogTitle.value = '';
        ogDescription.value = '';
        ogImage.value = '';
        twitterSite.value = '';
        robotsCheck.checked = false;
        authorCheck.checked = false;
        viewportCheck.checked = false;
        copyrightCheck.checked = false;
        ogEnabled.checked = true;
        twitterEnabled.checked = true;
        ogType.value = 'website';
        twitterCard.value = 'summary_large_image';
        resultPre.innerHTML = '<div class="mtg-empty">Klikni na "Generovat meta tagy"</div>';
        seoPreviewDiv.innerHTML = '<div class="mtg-empty-preview">Vyplň název a popis</div>';
        currentHtml = '';
        showNotification('Vyčištěno');
        saveSettings();
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Eventy
    generateBtn.addEventListener('click', generateMetaTags);
    copyBtn.addEventListener('click', copyToClipboardHtml);
    copyResultBtn.addEventListener('click', copyResult);
    clearBtn.addEventListener('click', clearAll);
    
    const inputs = [titleInput, descriptionInput, keywordsInput, urlInput, ogTitle, ogDescription, ogImage, twitterSite];
    inputs.forEach(input => {
        if (input) input.addEventListener('input', saveSettings);
    });
    
    const checks = [ogEnabled, twitterEnabled, robotsCheck, authorCheck, viewportCheck, copyrightCheck];
    checks.forEach(check => {
        if (check) check.addEventListener('change', saveSettings);
    });
    
    const selects = [ogType, twitterCard];
    selects.forEach(select => {
        if (select) select.addEventListener('change', saveSettings);
    });
    
    function saveSettings() {
        storage.set('title', titleInput.value);
        storage.set('description', descriptionInput.value);
        storage.set('keywords', keywordsInput.value);
        storage.set('url', urlInput.value);
        storage.set('ogTitle', ogTitle.value);
        storage.set('ogDescription', ogDescription.value);
        storage.set('ogImage', ogImage.value);
        storage.set('ogType', ogType.value);
        storage.set('twitterCard', twitterCard.value);
        storage.set('twitterSite', twitterSite.value);
        storage.set('ogEnabled', ogEnabled.checked);
        storage.set('twitterEnabled', twitterEnabled.checked);
        storage.set('robots', robotsCheck.checked);
        storage.set('author', authorCheck.checked);
        storage.set('viewport', viewportCheck.checked);
        storage.set('copyright', copyrightCheck.checked);
    }
    
    function loadSettings() {
        titleInput.value = storage.get('title', 'Moje úžasná stránka');
        descriptionInput.value = storage.get('description', 'Toto je popis mé úžasné webové stránky, která nabízí skvělé služby a produkty.');
        keywordsInput.value = storage.get('keywords', 'web, design, vývoj, SEO');
        urlInput.value = storage.get('url', 'https://example.com/stranka');
        ogTitle.value = storage.get('ogTitle', '');
        ogDescription.value = storage.get('ogDescription', '');
        ogImage.value = storage.get('ogImage', '');
        ogType.value = storage.get('ogType', 'website');
        twitterCard.value = storage.get('twitterCard', 'summary_large_image');
        twitterSite.value = storage.get('twitterSite', '');
        ogEnabled.checked = storage.get('ogEnabled', true);
        twitterEnabled.checked = storage.get('twitterEnabled', true);
        robotsCheck.checked = storage.get('robots', false);
        authorCheck.checked = storage.get('author', false);
        viewportCheck.checked = storage.get('viewport', false);
        copyrightCheck.checked = storage.get('copyright', false);
        
        // Pokud je nějaký text, automaticky vygenerujeme meta tagy
        if (titleInput.value) {
            setTimeout(() => generateMetaTags(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Meta Tag Generator se zavírá');
}