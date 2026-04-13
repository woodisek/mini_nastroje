import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('salary-calculator-pro');

export default function render(container) {
    container.innerHTML = `
        <div class="salary-calculator-pro">
            <div class="scp-header">
                <span class="scp-icon">💰</span>
                <div>
                    <h3>Převod hrubá ↔ čistá mzda</h3>
                    <p>Výpočet mezd pro ČR a zjednodušeně pro DE</p>
                </div>
            </div>

            <!-- Výběr země -->
            <div class="scp-section">
                <label class="scp-label">🌍 Země</label>
                <div class="scp-countries">
                    <button data-country="cz" class="scp-country-btn active">🇨🇿 Česká republika</button>
                    <button data-country="de" class="scp-country-btn">🇩🇪 Německo (zjednodušeně)</button>
                </div>
            </div>

            <!-- Hrubá mzda -->
            <div class="scp-section">
                <label class="scp-label">💰 Hrubá mzda</label>
                <div class="scp-input-group">
                    <input type="number" id="scp-gross" class="scp-input" value="40000" step="1000">
                    <span class="scp-currency">Kč</span>
                </div>
            </div>

            <!-- Úvazek -->
            <div class="scp-section">
                <label class="scp-label">⏱️ Úvazek</label>
                <div class="scp-working-time">
                    <select id="scp-hours-per-week" class="scp-select-small">
                        <option value="40">Plný úvazek (40h/týden)</option>
                        <option value="30">30 hodin/týden</option>
                        <option value="20">20 hodin/týden</option>
                        <option value="custom">Vlastní</option>
                    </select>
                    <div id="scp-custom-hours" style="display: none;">
                        <input type="number" id="scp-custom-hours-value" class="scp-input-small" value="20" min="1" max="40" step="1">
                        <span>hodin/týden</span>
                    </div>
                </div>
                <div class="scp-hint">Pro výpočet hodinové mzdy</div>
            </div>

            <!-- Děti (sleva na dani) -->
            <div class="scp-section">
                <label class="scp-label">👶 Počet dětí (sleva na dani)</label>
                <div class="scp-count-control">
                    <button id="scp-children-minus" class="scp-count-btn">−</button>
                    <input type="number" id="scp-children" class="scp-count-input" value="0" min="0" max="10" step="1">
                    <button id="scp-children-plus" class="scp-count-btn">+</button>
                </div>
                <div class="scp-hint">Sleva na děti v ČR: 1. dítě 1.267 Kč, 2. dítě 1.860 Kč, 3.+ 2.320 Kč</div>
            </div>

            <!-- Tlačítka -->
            <div class="scp-buttons">
                <button id="scp-to-net" class="scp-btn scp-btn-primary">⬇️ Hrubá → Čistá</button>
                <button id="scp-to-gross" class="scp-btn scp-btn-secondary">⬆️ Čistá → Hrubá</button>
                <button id="scp-clear" class="scp-btn scp-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="scp-result-section">
                <div class="scp-result-header">
                    <span>📊 Výsledek</span>
                    <button id="scp-copy" class="scp-small-btn">📋 Kopírovat</button>
                </div>
                <div id="scp-result" class="scp-result">
                    <div class="scp-empty">Zadej hrubou mzdu a klikni na "Hrubá → Čistá"</div>
                </div>
            </div>

            <!-- Detailní rozpis -->
            <details class="scp-details">
                <summary>📋 Detailní rozpis</summary>
                <div id="scp-detail" class="scp-detail">
                    <div class="scp-empty-detail">Nejprve proveď výpočet</div>
                </div>
            </details>

            <!-- Informace o daních -->
            <details class="scp-details">
                <summary>📋 Informace o výpočtu</summary>
                <div class="scp-info">
                    <div class="scp-info-item">💡 Výpočet je zjednodušený a orientační</div>
                    <div class="scp-info-item">📅 Platný pro rok 2024</div>
                    <div class="scp-info-item">🇨🇿 ČR: Sociální (6.5%), Zdravotní (4.5%), Daň 15% + sleva na poplatníka 2.570 Kč</div>
                    <div class="scp-info-item">👶 Sleva na dítě: 1.267 Kč, 2. dítě 1.860 Kč, 3.+ 2.320 Kč</div>
                    <div class="scp-info-item">🇩🇪 DE: Zjednodušený výpočet (sociální ~18.6%, daň ~14%, solidární přirážka)</div>
                </div>
            </details>

            <!-- Tip -->
            <div class="scp-tip">
                💡 <strong>Tip:</strong> Výpočet je orientační. Pro přesné údaje kontaktuj svou mzdovou účetní.
            </div>
        </div>
    `;

    // ========== SAZBY ==========
    const czTaxRates = {
        social: 0.065,      // Sociální pojištění (zaměstnanec 6.5%)
        health: 0.045,      // Zdravotní pojištění (zaměstnanec 4.5%)
        incomeTax: 0.15,    // Daň z příjmu 15%
        taxDiscount: 2570   // Sleva na poplatníka (měsíčně)
    };
    
    const czChildDiscount = [0, 1267, 1860, 2320]; // pro 1., 2., 3.+ dítě

    const deTaxRates = {
        social: 0.186,      // Sociální pojištění (průměr ~18.6%)
        incomeTax: 0.14,    // Daň z příjmu (zjednodušená)
        solidar: 0.0055     // Solidární přirážka 5.5% z daně
    };

    // ========== DOM elementy ==========
    const countryBtns = document.querySelectorAll('.scp-country-btn');
    const grossInput = document.getElementById('scp-gross');
    const hoursPerWeekSelect = document.getElementById('scp-hours-per-week');
    const customHoursDiv = document.getElementById('scp-custom-hours');
    const customHoursInput = document.getElementById('scp-custom-hours-value');
    const childrenInput = document.getElementById('scp-children');
    const childrenMinus = document.getElementById('scp-children-minus');
    const childrenPlus = document.getElementById('scp-children-plus');
    const toNetBtn = document.getElementById('scp-to-net');
    const toGrossBtn = document.getElementById('scp-to-gross');
    const clearBtn = document.getElementById('scp-clear');
    const copyBtn = document.getElementById('scp-copy');
    const resultDiv = document.getElementById('scp-result');
    const detailDiv = document.getElementById('scp-detail');

    let currentCountry = 'cz';
    let currentResult = null;
    let currentType = 'net';

    // Pomocné funkce
    function getWorkingHoursPerWeek() {
        if (hoursPerWeekSelect.value === 'custom') {
            return parseInt(customHoursInput.value) || 20;
        }
        return parseInt(hoursPerWeekSelect.value);
    }

    function getChildDiscount(childrenCount) {
        if (childrenCount === 0) return 0;
        if (childrenCount === 1) return czChildDiscount[1];
        if (childrenCount === 2) return czChildDiscount[1] + czChildDiscount[2];
        return czChildDiscount[1] + czChildDiscount[2] + czChildDiscount[3] * (childrenCount - 2);
    }

    // Výpočet čisté mzdy z hrubé (ČR)
    function calculateNetFromGrossCZ(gross, children) {
        const social = gross * czTaxRates.social;
        const health = gross * czTaxRates.health;
        const taxBase = gross - social - health;
        let tax = taxBase * czTaxRates.incomeTax;
        const childDiscount = getChildDiscount(children);
        tax = Math.max(0, tax - czTaxRates.taxDiscount - childDiscount);
        
        const net = gross - social - health - tax;
        
        return {
            gross: gross,
            social: social,
            health: health,
            tax: tax,
            net: net,
            childDiscount: childDiscount,
            taxDiscount: czTaxRates.taxDiscount
        };
    }

    // Výpočet hrubé mzdy z čisté (ČR) - iterativní aproximace
    function calculateGrossFromNetCZ(net, children) {
        let guess = net;
        let iteration = 0;
        const maxIterations = 50;
        
        while (iteration < maxIterations) {
            const result = calculateNetFromGrossCZ(guess, children);
            const diff = result.net - net;
            
            if (Math.abs(diff) < 0.01) {
                return result;
            }
            
            guess = guess - diff * 1.5;
            if (guess < 0) guess = net;
            iteration++;
        }
        
        return calculateNetFromGrossCZ(guess, children);
    }

    // Výpočet čisté mzdy z hrubé (DE - zjednodušené)
    function calculateNetFromGrossDE(gross) {
        const social = gross * deTaxRates.social;
        const taxBase = gross - social;
        let tax = taxBase * deTaxRates.incomeTax;
        const solidar = tax * deTaxRates.solidar;
        const net = gross - social - tax - solidar;
        
        return {
            gross: gross,
            social: social,
            tax: tax,
            solidar: solidar,
            net: net
        };
    }

    // Výpočet hrubé mzdy z čisté (DE) - iterativní aproximace
    function calculateGrossFromNetDE(net) {
        let guess = net;
        let iteration = 0;
        const maxIterations = 50;
        
        while (iteration < maxIterations) {
            const result = calculateNetFromGrossDE(guess);
            const diff = result.net - net;
            
            if (Math.abs(diff) < 0.01) {
                return result;
            }
            
            guess = guess - diff * 1.5;
            if (guess < 0) guess = net;
            iteration++;
        }
        
        return calculateNetFromGrossDE(guess);
    }

    function formatMoney(value, country) {
        const currency = country === 'cz' ? 'Kč' : '€';
        return `${Math.round(value).toLocaleString('cs-CZ')} ${currency}`;
    }

    function formatNumber(value) {
        return Math.round(value).toLocaleString('cs-CZ');
    }

    function calculateHourlyRate(monthlyGross, hoursPerWeek) {
        const hoursPerMonth = hoursPerWeek * 4.348; // Průměrný počet týdnů v měsíci
        return monthlyGross / hoursPerMonth;
    }

    function formatTimeDetail(hoursPerWeek, monthlyGross, monthlyNet) {
        const hoursPerMonth = hoursPerWeek * 4.348;
        const grossPerHour = monthlyGross / hoursPerMonth;
        const netPerHour = monthlyNet / hoursPerMonth;
        const yearGross = monthlyGross * 12;
        const yearNet = monthlyNet * 12;
        
        return {
            grossPerHour: grossPerHour,
            netPerHour: netPerHour,
            grossPerMonth: monthlyGross,
            netPerMonth: monthlyNet,
            grossPerYear: yearGross,
            netPerYear: yearNet,
            hoursPerMonth: hoursPerMonth
        };
    }

    function calculateGrossToNet() {
        const gross = parseFloat(grossInput.value) || 0;
        const hoursPerWeek = getWorkingHoursPerWeek();
        const children = parseInt(childrenInput.value) || 0;
        
        if (gross <= 0) {
            resultDiv.innerHTML = '<div class="scp-error">❌ Zadej platnou hrubou mzdu</div>';
            detailDiv.innerHTML = '<div class="scp-empty-detail">Nejprve proveď výpočet</div>';
            return;
        }
        
        let result;
        if (currentCountry === 'cz') {
            result = calculateNetFromGrossCZ(gross, children);
            currentResult = result;
            
            const timeDetail = formatTimeDetail(hoursPerWeek, result.gross, result.net);
            const grossPerHour = timeDetail.grossPerHour;
            const netPerHour = timeDetail.netPerHour;
            
            resultDiv.innerHTML = `
                <div class="scp-result-card">
                    <div class="scp-result-row scp-result-main">
                        <span class="scp-result-label">💵 Čistá mzda:</span>
                        <span class="scp-result-value">${formatMoney(result.net, currentCountry)}</span>
                    </div>
                </div>
            `;
            
            detailDiv.innerHTML = `
                <div class="scp-detail-card">
                    <div class="scp-detail-title">📊 Měsíční rozpis</div>
                    <div class="scp-detail-row">
                        <span>💰 Hrubá mzda:</span>
                        <strong>${formatMoney(result.gross, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-deduction">
                        <span>📉 Sociální pojištění (6.5%):</span>
                        <strong>- ${formatMoney(result.social, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-deduction">
                        <span>🏥 Zdravotní pojištění (4.5%):</span>
                        <strong>- ${formatMoney(result.health, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-deduction">
                        <span>📊 Daň z příjmu (15%):</span>
                        <strong>- ${formatMoney(result.tax, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-deduction">
                        <span>👶 Sleva na děti:</span>
                        <strong>+ ${formatMoney(result.childDiscount, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-total">
                        <span>💵 Čistá mzda:</span>
                        <strong>${formatMoney(result.net, currentCountry)}</strong>
                    </div>
                </div>
                
                <div class="scp-detail-card">
                    <div class="scp-detail-title">⏱️ Přepočet na hodinu / rok</div>
                    <div class="scp-detail-row">
                        <span>⏱️ Hrubá hodinová mzda:</span>
                        <strong>${Math.round(grossPerHour)} ${currentCountry === 'cz' ? 'Kč' : '€'}/hod</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>⏱️ Čistá hodinová mzda:</span>
                        <strong>${Math.round(netPerHour)} ${currentCountry === 'cz' ? 'Kč' : '€'}/hod</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>📅 Hrubá roční mzda:</span>
                        <strong>${formatMoney(timeDetail.grossPerYear, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>📅 Čistá roční mzda:</span>
                        <strong>${formatMoney(timeDetail.netPerYear, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>📊 Úvazek:</span>
                        <strong>${hoursPerWeek} hodin/týden (${Math.round(timeDetail.hoursPerMonth)} hodin/měsíc)</strong>
                    </div>
                </div>
            `;
        } else {
            result = calculateNetFromGrossDE(gross);
            currentResult = result;
            
            const timeDetail = formatTimeDetail(hoursPerWeek, result.gross, result.net);
            const grossPerHour = timeDetail.grossPerHour;
            const netPerHour = timeDetail.netPerHour;
            
            resultDiv.innerHTML = `
                <div class="scp-result-card">
                    <div class="scp-result-row scp-result-main">
                        <span class="scp-result-label">💵 Čistá mzda:</span>
                        <span class="scp-result-value">${formatMoney(result.net, currentCountry)}</span>
                    </div>
                </div>
            `;
            
            detailDiv.innerHTML = `
                <div class="scp-detail-card">
                    <div class="scp-detail-title">📊 Měsíční rozpis</div>
                    <div class="scp-detail-row">
                        <span>💰 Hrubá mzda:</span>
                        <strong>${formatMoney(result.gross, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-deduction">
                        <span>📉 Sociální pojištění (~18.6%):</span>
                        <strong>- ${formatMoney(result.social, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-deduction">
                        <span>📊 Daň z příjmu (~14%):</span>
                        <strong>- ${formatMoney(result.tax, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-deduction">
                        <span>➕ Solidární přirážka (5.5% z daně):</span>
                        <strong>- ${formatMoney(result.solidar, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-total">
                        <span>💵 Čistá mzda:</span>
                        <strong>${formatMoney(result.net, currentCountry)}</strong>
                    </div>
                </div>
                
                <div class="scp-detail-card">
                    <div class="scp-detail-title">⏱️ Přepočet na hodinu / rok</div>
                    <div class="scp-detail-row">
                        <span>⏱️ Hrubá hodinová mzda:</span>
                        <strong>${Math.round(grossPerHour)} ${currentCountry === 'cz' ? 'Kč' : '€'}/hod</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>⏱️ Čistá hodinová mzda:</span>
                        <strong>${Math.round(netPerHour)} ${currentCountry === 'cz' ? 'Kč' : '€'}/hod</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>📅 Hrubá roční mzda:</span>
                        <strong>${formatMoney(timeDetail.grossPerYear, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>📅 Čistá roční mzda:</span>
                        <strong>${formatMoney(timeDetail.netPerYear, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>📊 Úvazek:</span>
                        <strong>${hoursPerWeek} hodin/týden (${Math.round(timeDetail.hoursPerMonth)} hodin/měsíc)</strong>
                    </div>
                </div>
            `;
        }
        
        currentType = 'net';
        showNotification('Výpočet dokončen', 'success');
        saveSettings();
    }

    function calculateNetToGross() {
        const net = parseFloat(grossInput.value) || 0;
        const hoursPerWeek = getWorkingHoursPerWeek();
        const children = parseInt(childrenInput.value) || 0;
        
        if (net <= 0) {
            resultDiv.innerHTML = '<div class="scp-error">❌ Zadej platnou čistou mzdu</div>';
            detailDiv.innerHTML = '<div class="scp-empty-detail">Nejprve proveď výpočet</div>';
            return;
        }
        
        let result;
        if (currentCountry === 'cz') {
            result = calculateGrossFromNetCZ(net, children);
            currentResult = result;
            
            const timeDetail = formatTimeDetail(hoursPerWeek, result.gross, result.net);
            const grossPerHour = timeDetail.grossPerHour;
            const netPerHour = timeDetail.netPerHour;
            
            resultDiv.innerHTML = `
                <div class="scp-result-card">
                    <div class="scp-result-row scp-result-main">
                        <span class="scp-result-label">💰 Hrubá mzda:</span>
                        <span class="scp-result-value">${formatMoney(result.gross, currentCountry)}</span>
                    </div>
                </div>
            `;
            
            detailDiv.innerHTML = `
                <div class="scp-detail-card">
                    <div class="scp-detail-title">📊 Měsíční rozpis</div>
                    <div class="scp-detail-row scp-total">
                        <span>💵 Čistá mzda:</span>
                        <strong>${formatMoney(result.net, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>➕ Sociální pojištění (6.5%):</span>
                        <strong>+ ${formatMoney(result.social, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>➕ Zdravotní pojištění (4.5%):</span>
                        <strong>+ ${formatMoney(result.health, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>➕ Daň z příjmu (15%):</span>
                        <strong>+ ${formatMoney(result.tax, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>👶 Sleva na děti:</span>
                        <strong>+ ${formatMoney(result.childDiscount, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-total">
                        <span>💰 Hrubá mzda:</span>
                        <strong>${formatMoney(result.gross, currentCountry)}</strong>
                    </div>
                </div>
                
                <div class="scp-detail-card">
                    <div class="scp-detail-title">⏱️ Přepočet na hodinu / rok</div>
                    <div class="scp-detail-row">
                        <span>⏱️ Hrubá hodinová mzda:</span>
                        <strong>${Math.round(grossPerHour)} ${currentCountry === 'cz' ? 'Kč' : '€'}/hod</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>⏱️ Čistá hodinová mzda:</span>
                        <strong>${Math.round(netPerHour)} ${currentCountry === 'cz' ? 'Kč' : '€'}/hod</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>📅 Hrubá roční mzda:</span>
                        <strong>${formatMoney(timeDetail.grossPerYear, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>📅 Čistá roční mzda:</span>
                        <strong>${formatMoney(timeDetail.netPerYear, currentCountry)}</strong>
                    </div>
                </div>
            `;
        } else {
            result = calculateGrossFromNetDE(net);
            currentResult = result;
            
            const timeDetail = formatTimeDetail(hoursPerWeek, result.gross, result.net);
            const grossPerHour = timeDetail.grossPerHour;
            const netPerHour = timeDetail.netPerHour;
            
            resultDiv.innerHTML = `
                <div class="scp-result-card">
                    <div class="scp-result-row scp-result-main">
                        <span class="scp-result-label">💰 Hrubá mzda:</span>
                        <span class="scp-result-value">${formatMoney(result.gross, currentCountry)}</span>
                    </div>
                </div>
            `;
            
            detailDiv.innerHTML = `
                <div class="scp-detail-card">
                    <div class="scp-detail-title">📊 Měsíční rozpis</div>
                    <div class="scp-detail-row scp-total">
                        <span>💵 Čistá mzda:</span>
                        <strong>${formatMoney(result.net, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>➕ Sociální pojištění (~18.6%):</span>
                        <strong>+ ${formatMoney(result.social, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>➕ Daň z příjmu (~14%):</span>
                        <strong>+ ${formatMoney(result.tax, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>➕ Solidární přirážka (5.5% z daně):</span>
                        <strong>+ ${formatMoney(result.solidar, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row scp-total">
                        <span>💰 Hrubá mzda:</span>
                        <strong>${formatMoney(result.gross, currentCountry)}</strong>
                    </div>
                </div>
                
                <div class="scp-detail-card">
                    <div class="scp-detail-title">⏱️ Přepočet na hodinu / rok</div>
                    <div class="scp-detail-row">
                        <span>⏱️ Hrubá hodinová mzda:</span>
                        <strong>${Math.round(grossPerHour)} ${currentCountry === 'cz' ? 'Kč' : '€'}/hod</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>⏱️ Čistá hodinová mzda:</span>
                        <strong>${Math.round(netPerHour)} ${currentCountry === 'cz' ? 'Kč' : '€'}/hod</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>📅 Hrubá roční mzda:</span>
                        <strong>${formatMoney(timeDetail.grossPerYear, currentCountry)}</strong>
                    </div>
                    <div class="scp-detail-row">
                        <span>📅 Čistá roční mzda:</span>
                        <strong>${formatMoney(timeDetail.netPerYear, currentCountry)}</strong>
                    </div>
                </div>
            `;
        }
        
        currentType = 'gross';
        showNotification('Výpočet dokončen', 'success');
        saveSettings();
    }

    async function copyResult() {
        if (!currentResult) {
            showNotification('Nejprve spočítej mzdu', 'warning');
            return;
        }
        
        const resultText = resultDiv.innerText + '\n\n' + detailDiv.innerText;
        if (resultText) {
            await copyToClipboard(resultText);
        }
    }

    function clearAll() {
        grossInput.value = '40000';
        childrenInput.value = '0';
        hoursPerWeekSelect.value = '40';
        customHoursDiv.style.display = 'none';
        resultDiv.innerHTML = '<div class="scp-empty">Zadej hrubou mzdu a klikni na "Hrubá → Čistá"</div>';
        detailDiv.innerHTML = '<div class="scp-empty-detail">Nejprve proveď výpočet</div>';
        currentResult = null;
        showNotification('Vyčištěno');
        saveSettings();
    }

    function switchCountry(country) {
        currentCountry = country;
        
        countryBtns.forEach(btn => {
            if (btn.dataset.country === country) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        const currency = country === 'cz' ? 'Kč' : '€';
        document.querySelector('.scp-currency').textContent = currency;
        
        if (grossInput.value && grossInput.value !== '0') {
            if (currentType === 'net') {
                calculateGrossToNet();
            } else {
                calculateNetToGross();
            }
        }
        
        saveSettings();
    }

    // Eventy
    hoursPerWeekSelect.addEventListener('change', () => {
        customHoursDiv.style.display = hoursPerWeekSelect.value === 'custom' ? 'flex' : 'none';
        if (grossInput.value && grossInput.value !== '0') {
            calculateGrossToNet();
        }
        saveSettings();
    });
    
    customHoursInput.addEventListener('input', () => {
        if (grossInput.value && grossInput.value !== '0') {
            calculateGrossToNet();
        }
        saveSettings();
    });
    
    childrenMinus.addEventListener('click', () => {
        let val = parseInt(childrenInput.value);
        if (val > 0) childrenInput.value = val - 1;
        if (grossInput.value && grossInput.value !== '0') calculateGrossToNet();
        saveSettings();
    });
    
    childrenPlus.addEventListener('click', () => {
        let val = parseInt(childrenInput.value);
        if (val < 10) childrenInput.value = val + 1;
        if (grossInput.value && grossInput.value !== '0') calculateGrossToNet();
        saveSettings();
    });
    
    childrenInput.addEventListener('change', () => {
        if (grossInput.value && grossInput.value !== '0') calculateGrossToNet();
        saveSettings();
    });
    
    toNetBtn.addEventListener('click', calculateGrossToNet);
    toGrossBtn.addEventListener('click', calculateNetToGross);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    
    countryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchCountry(btn.dataset.country);
        });
    });
    
    grossInput.addEventListener('input', saveSettings);
    
    function saveSettings() {
        storage.set('country', currentCountry);
        storage.set('gross', grossInput.value);
        storage.set('children', childrenInput.value);
        storage.set('hoursPerWeek', hoursPerWeekSelect.value);
        storage.set('customHours', customHoursInput.value);
    }
    
    function loadSettings() {
        const savedCountry = storage.get('country', 'cz');
        const savedGross = storage.get('gross', '40000');
        const savedChildren = storage.get('children', '0');
        const savedHoursPerWeek = storage.get('hoursPerWeek', '40');
        const savedCustomHours = storage.get('customHours', '20');
        
        grossInput.value = savedGross;
        childrenInput.value = savedChildren;
        hoursPerWeekSelect.value = savedHoursPerWeek;
        customHoursInput.value = savedCustomHours;
        customHoursDiv.style.display = savedHoursPerWeek === 'custom' ? 'flex' : 'none';
        
        switchCountry(savedCountry);
        
        if (savedGross && savedGross !== '0') {
            setTimeout(() => calculateGrossToNet(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Salary Calculator Pro se zavírá');
}