import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('word-counter-pro');

export default function render(container) {
    container.innerHTML = `
        <div class="word-counter-pro">
            <div class="wcp-header">
                <span class="wcp-icon">📝</span>
                <div>
                    <h3>Počítadlo znaků a slov</h3>
                    <p>Analýza textu – znaky, slova, čitelnost, SEO</p>
                </div>
            </div>

            <!-- Textová plocha -->
            <div class="wcp-section">
                <label class="wcp-label">📝 Text k analýze</label>
                <textarea id="wcp-input" class="wcp-textarea" rows="8" placeholder="Sem napiš nebo vlož svůj text..."></textarea>
                <div class="wcp-hint">💡 Text se analyzuje automaticky při psaní</div>
            </div>

            <!-- Hlavní statistiky -->
            <div class="wcp-stats">
                <div class="wcp-stat-card">
                    <div class="wcp-stat-value" id="wcp-chars">0</div>
                    <div class="wcp-stat-label">Znaky (s mezerami)</div>
                </div>
                <div class="wcp-stat-card">
                    <div class="wcp-stat-value" id="wcp-chars-no">0</div>
                    <div class="wcp-stat-label">Znaky (bez mezer)</div>
                </div>
                <div class="wcp-stat-card">
                    <div class="wcp-stat-value" id="wcp-words">0</div>
                    <div class="wcp-stat-label">Slova</div>
                </div>
                <div class="wcp-stat-card">
                    <div class="wcp-stat-value" id="wcp-sentences">0</div>
                    <div class="wcp-stat-label">Věty</div>
                </div>
                <div class="wcp-stat-card">
                    <div class="wcp-stat-value" id="wcp-lines">0</div>
                    <div class="wcp-stat-label">Řádky</div>
                </div>
                <div class="wcp-stat-card">
                    <div class="wcp-stat-value" id="wcp-paragraphs">0</div>
                    <div class="wcp-stat-label">Odstavce</div>
                </div>
            </div>

            <!-- Čas čtení a mluvení -->
            <div class="wcp-time-section">
                <div class="wcp-time-card">
                    <span class="wcp-time-icon">⏱️</span>
                    <div>
                        <div class="wcp-time-value" id="wcp-read-time">0</div>
                        <div class="wcp-time-label">minut čtení</div>
                    </div>
                </div>
                <div class="wcp-time-card">
                    <span class="wcp-time-icon">🎤</span>
                    <div>
                        <div class="wcp-time-value" id="wcp-speak-time">0</div>
                        <div class="wcp-time-label">minut mluvení</div>
                    </div>
                </div>
            </div>

            <!-- Pokročilá analýza -->
            <details class="wcp-details">
                <summary>📊 Pokročilá analýza</summary>
                <div class="wcp-advanced">
                    <div class="wcp-advanced-row">
                        <span>📏 Průměrná délka slova:</span>
                        <strong id="wcp-avg-word-length">0</strong>
                        <span>znaků</span>
                    </div>
                    <div class="wcp-advanced-row">
                        <span>📏 Průměrná délka věty:</span>
                        <strong id="wcp-avg-sentence-length">0</strong>
                        <span>slov</span>
                    </div>
                    <div class="wcp-advanced-row">
                        <span>🔤 Nejdelší slovo:</span>
                        <strong id="wcp-longest-word">-</strong>
                    </div>
                    <div class="wcp-advanced-row">
                        <span>📊 Čitelnost (Flesch index):</span>
                        <strong id="wcp-readability">-</strong>
                        <span id="wcp-readability-label"></span>
                    </div>
                    <div class="wcp-advanced-row">
                        <span>🌍 Detekce jazyka:</span>
                        <strong id="wcp-language">-</strong>
                    </div>
                </div>
            </details>

            <!-- Top 10 nejčastějších slov -->
            <details class="wcp-details">
                <summary>📊 Nejčastější slova</summary>
                <div id="wcp-top-words" class="wcp-top-words">
                    <div class="wcp-empty">Zatím žádný text</div>
                </div>
            </details>

            <!-- SEO analýza -->
            <details class="wcp-details">
                <summary>🔍 SEO analýza</summary>
                <div id="wcp-seo" class="wcp-seo">
                    <div class="wcp-empty">Zatím žádný text</div>
                </div>
            </details>

            <!-- Limity sociálních sítí -->
            <div class="wcp-social-section">
                <div class="wcp-social-item">
                    <span>🐦 Twitter (X)</span>
                    <div class="wcp-social-bar">
                        <div class="wcp-social-fill" id="wcp-twitter-fill" style="width: 0%"></div>
                    </div>
                    <span id="wcp-twitter-count">0/280</span>
                </div>
                <div class="wcp-social-item">
                    <span>📘 Facebook</span>
                    <div class="wcp-social-bar">
                        <div class="wcp-social-fill" id="wcp-facebook-fill" style="width: 0%"></div>
                    </div>
                    <span id="wcp-facebook-count">0/63206</span>
                </div>
                <div class="wcp-social-item">
                    <span>📸 Instagram popis</span>
                    <div class="wcp-social-bar">
                        <div class="wcp-social-fill" id="wcp-instagram-fill" style="width: 0%"></div>
                    </div>
                    <span id="wcp-instagram-count">0/2200</span>
                </div>
                <div class="wcp-social-item">
                    <span>🔗 LinkedIn</span>
                    <div class="wcp-social-bar">
                        <div class="wcp-social-fill" id="wcp-linkedin-fill" style="width: 0%"></div>
                    </div>
                    <span id="wcp-linkedin-count">0/3000</span>
                </div>
            </div>

            <!-- Tlačítka -->
            <div class="wcp-buttons">
                <button id="wcp-copy" class="wcp-btn wcp-btn-primary">📋 Kopírovat text</button>
                <button id="wcp-clear" class="wcp-btn wcp-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Tip -->
            <div class="wcp-tip">
                💡 <strong>Tip:</strong> Flesch index čitelnosti – čím vyšší číslo, tím snadněji je text čitelný (60+ = dobré, 30-60 = střední, pod 30 = těžké).
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const inputEl = document.getElementById('wcp-input');
    const copyBtn = document.getElementById('wcp-copy');
    const clearBtn = document.getElementById('wcp-clear');
    
    const charsSpan = document.getElementById('wcp-chars');
    const charsNoSpan = document.getElementById('wcp-chars-no');
    const wordsSpan = document.getElementById('wcp-words');
    const sentencesSpan = document.getElementById('wcp-sentences');
    const linesSpan = document.getElementById('wcp-lines');
    const paragraphsSpan = document.getElementById('wcp-paragraphs');
    const readTimeSpan = document.getElementById('wcp-read-time');
    const speakTimeSpan = document.getElementById('wcp-speak-time');
    const avgWordLengthSpan = document.getElementById('wcp-avg-word-length');
    const avgSentenceLengthSpan = document.getElementById('wcp-avg-sentence-length');
    const longestWordSpan = document.getElementById('wcp-longest-word');
    const readabilitySpan = document.getElementById('wcp-readability');
    const readabilityLabelSpan = document.getElementById('wcp-readability-label');
    const languageSpan = document.getElementById('wcp-language');
    const topWordsDiv = document.getElementById('wcp-top-words');
    const seoDiv = document.getElementById('wcp-seo');
    
    const twitterCount = document.getElementById('wcp-twitter-count');
    const twitterFill = document.getElementById('wcp-twitter-fill');
    const facebookCount = document.getElementById('wcp-facebook-count');
    const facebookFill = document.getElementById('wcp-facebook-fill');
    const instagramCount = document.getElementById('wcp-instagram-count');
    const instagramFill = document.getElementById('wcp-instagram-fill');
    const linkedinCount = document.getElementById('wcp-linkedin-count');
    const linkedinFill = document.getElementById('wcp-linkedin-fill');

    const limits = {
        twitter: 280,
        facebook: 63206,
        instagram: 2200,
        linkedin: 3000
    };

    // Jednoduchá detekce jazyka
    function detectLanguage(text) {
        const czechChars = /[áčďéěíňóřšťúůýž]/i;
        const czechWords = ['a', 'na', 'v', 'do', 'se', 'že', 'který', 'proto', 'tedy', 'také', 'když', 'jsem', 'jsme', 'byl', 'byla'];
        
        if (czechChars.test(text)) return '🇨🇿 Čeština';
        
        const words = text.toLowerCase().split(/\s+/);
        let czechCount = 0;
        for (const word of words) {
            if (czechWords.includes(word)) czechCount++;
        }
        if (czechCount > 2) return '🇨🇿 Čeština';
        
        return '🇬🇧 Angličtina (detekováno)';
    }

    // Výpočet Flesch indexu (pro angličtinu) a zjednodušený pro češtinu
    function calculateReadability(words, sentences, syllables) {
        if (sentences === 0 || words === 0) return { score: 0, label: 'N/A' };
        
        // Zjednodušený výpočet
        const avgWordsPerSentence = words / sentences;
        let score;
        
        if (avgWordsPerSentence < 10) score = 80;
        else if (avgWordsPerSentence < 15) score = 60;
        else if (avgWordsPerSentence < 20) score = 40;
        else if (avgWordsPerSentence < 25) score = 20;
        else score = 10;
        
        let label = '';
        if (score >= 70) label = 'Velmi snadné';
        else if (score >= 60) label = 'Snadné';
        else if (score >= 50) label = 'Středně těžké';
        else if (score >= 30) label = 'Těžké';
        else label = 'Velmi těžké';
        
        return { score: Math.round(score), label };
    }

    // SEO analýza
    function analyzeSEO(text, words, chars) {
        const issues = [];
        const good = [];
        
        if (words < 300) issues.push('⚠️ Text je krátký (doporučeno 300+ slov pro lepší SEO)');
        else good.push('✅ Délka textu je dobrá');
        
        if (chars > 160) good.push('✅ Meta description by mohla být do 160 znaků');
        else issues.push('⚠️ Meta description je krátká (doporučeno 120-160 znaků)');
        
        return { issues, good };
    }

    function updateCounts() {
        const text = inputEl.value;
        const chars = text.length;
        const charsNo = text.replace(/\s/g, '').length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const sentences = text.split(/[.!?;:]+/).filter(s => s.trim().length > 0).length;
        const lines = text.split(/\r?\n/).filter(l => l.length > 0).length;
        const paragraphs = text.split(/\r?\n\s*\r?\n/).filter(p => p.trim().length > 0).length || (text.trim() ? 1 : 0);
        
        const readTime = Math.ceil(words / 200);
        const speakTime = Math.ceil(words / 130);
        
        // Průměrná délka slova
        const avgWordLength = words > 0 ? (charsNo / words).toFixed(1) : 0;
        
        // Průměrná délka věty
        const avgSentenceLength = sentences > 0 ? (words / sentences).toFixed(1) : 0;
        
        // Nejdelší slovo
        const wordsArray = text.match(/[a-zA-Záčďéěíňóřšťúůýž]+/gi) || [];
        const longestWord = wordsArray.reduce((longest, current) => current.length > longest.length ? current : longest, '');
        
        // Jazyk
        const language = detectLanguage(text);
        
        // Čitelnost
        const readability = calculateReadability(words, sentences, 0);
        
        // Aktualizace
        charsSpan.textContent = chars;
        charsNoSpan.textContent = charsNo;
        wordsSpan.textContent = words;
        sentencesSpan.textContent = sentences;
        linesSpan.textContent = lines;
        paragraphsSpan.textContent = paragraphs;
        readTimeSpan.textContent = readTime;
        speakTimeSpan.textContent = speakTime;
        avgWordLengthSpan.textContent = avgWordLength;
        avgSentenceLengthSpan.textContent = avgSentenceLength;
        longestWordSpan.textContent = longestWord || '-';
        readabilitySpan.textContent = readability.score;
        readabilityLabelSpan.textContent = readability.label;
        languageSpan.textContent = language;
        
        // Sociální limity
        updateSocialLimit(twitterCount, twitterFill, chars, limits.twitter);
        updateSocialLimit(facebookCount, facebookFill, chars, limits.facebook);
        updateSocialLimit(instagramCount, instagramFill, chars, limits.instagram);
        updateSocialLimit(linkedinCount, linkedinFill, chars, limits.linkedin);
        
        // Top slova
        updateTopWords(text);
        
        // SEO analýza
        updateSEO(text, words, chars);
    }
    
    function updateSocialLimit(element, fillElement, current, limit) {
        const percentage = Math.min((current / limit) * 100, 100);
        fillElement.style.width = `${percentage}%`;
        
        if (current > limit) {
            fillElement.style.backgroundColor = '#f44336';
            element.innerHTML = `${current}/${limit} <span style="color:#f44336">(překročeno!)</span>`;
        } else if (current > limit * 0.8) {
            fillElement.style.backgroundColor = '#ff9800';
            element.textContent = `${current}/${limit}`;
        } else {
            fillElement.style.backgroundColor = '#4caf50';
            element.textContent = `${current}/${limit}`;
        }
    }
    
    function updateTopWords(text) {
        if (!text.trim()) {
            topWordsDiv.innerHTML = '<div class="wcp-empty">Zatím žádný text</div>';
            return;
        }
        
        const words = text.toLowerCase()
            .replace(/[.,!?;:()"']/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2);
        
        const freq = {};
        for (const word of words) {
            freq[word] = (freq[word] || 0) + 1;
        }
        
        const sorted = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        if (sorted.length === 0) {
            topWordsDiv.innerHTML = '<div class="wcp-empty">Žádná slova k zobrazení</div>';
            return;
        }
        
        const maxCount = sorted[0][1];
        topWordsDiv.innerHTML = sorted.map(([word, count]) => `
            <div class="wcp-word-item">
                <span class="wcp-word-text">${escapeHtml(word)}</span>
                <span class="wcp-word-count">${count}x</span>
                <div class="wcp-word-bar">
                    <div class="wcp-word-fill" style="width: ${(count / maxCount) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }
    
    function updateSEO(text, words, chars) {
        if (!text.trim()) {
            seoDiv.innerHTML = '<div class="wcp-empty">Zatím žádný text</div>';
            return;
        }
        
        const seo = analyzeSEO(text, words, chars);
        
        let html = '';
        if (seo.good.length > 0) {
            html += '<div class="wcp-seo-good">✅ Dobré:</div>';
            seo.good.forEach(item => {
                html += `<div class="wcp-seo-item wcp-seo-good-item">${escapeHtml(item)}</div>`;
            });
        }
        if (seo.issues.length > 0) {
            html += '<div class="wcp-seo-issues">⚠️ Ke zlepšení:</div>';
            seo.issues.forEach(item => {
                html += `<div class="wcp-seo-item wcp-seo-issue-item">${escapeHtml(item)}</div>`;
            });
        }
        
        seoDiv.innerHTML = html;
    }
    
    async function copyText() {
        const text = inputEl.value;
        if (text) {
            await copyToClipboard(text);
        } else {
            showNotification('Žádný text ke kopírování', 'warning');
        }
    }
    
    function clearText() {
        inputEl.value = '';
        updateCounts();
        showNotification('Text vyčištěn');
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
    inputEl.addEventListener('input', updateCounts);
    copyBtn.addEventListener('click', copyText);
    clearBtn.addEventListener('click', clearText);
    
    // Načtení uloženého textu
    const savedText = storage.get('text', '');
    if (savedText) {
        inputEl.value = savedText;
        updateCounts();
    }
    
    inputEl.addEventListener('input', () => {
        storage.set('text', inputEl.value);
    });
}

export function cleanup() {
    console.log('Word Counter Pro se zavírá');
}