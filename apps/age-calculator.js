import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('age-calculator');

export default function render(container) {
    container.innerHTML = `
        <div class="age-calculator">
            <div class="ac-header">
                <span class="ac-icon">🎂</span>
                <div>
                    <h3>Kalkulačka věku</h3>
                    <p>Zjisti přesný věk z data narození</p>
                </div>
            </div>

            <!-- Datum narození -->
            <div class="ac-section">
                <label class="ac-label">📅 Datum narození</label>
                <input type="date" id="ac-birthdate" class="ac-input">
                <div class="ac-hint">Vyber datum narození</div>
            </div>

            <!-- Druhé datum (nepovinné) -->
            <div class="ac-section">
                <label class="ac-label">📅 K datu (nepovinné)</label>
                <input type="date" id="ac-target-date" class="ac-input">
                <div class="ac-hint">Pokud nevyplníš, použije se dnešní datum</div>
            </div>

            <!-- Tlačítka -->
            <div class="ac-buttons">
                <button id="ac-calculate" class="ac-btn ac-btn-primary">🎂 Spočítat věk</button>
                <button id="ac-clear" class="ac-btn ac-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledky -->
            <div class="ac-results-section">
                <div class="ac-results-header">
                    <span>📊 Výsledky</span>
                    <button id="ac-copy" class="ac-small-btn">📋 Kopírovat</button>
                </div>
                <div id="ac-results" class="ac-results">
                    <div class="ac-empty">Vyber datum narození a klikni na "Spočítat věk"</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="ac-tip">
                💡 <strong>Tip:</strong> Můžeš vypočítat věk k libovolnému datu, nejen k dnešku. Užitečné pro výpočet věku k určité události.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const birthdateInput = document.getElementById('ac-birthdate');
    const targetDateInput = document.getElementById('ac-target-date');
    const calculateBtn = document.getElementById('ac-calculate');
    const clearBtn = document.getElementById('ac-clear');
    const copyBtn = document.getElementById('ac-copy');
    const resultsDiv = document.getElementById('ac-results');

    // Nastavení maximálního data (dnes)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    birthdateInput.max = todayStr;
    targetDateInput.max = todayStr + 50000; // nějaká budoucnost

    // Výpočet věku
    function calculateAge() {
        const birthdateStr = birthdateInput.value;
        if (!birthdateStr) {
            resultsDiv.innerHTML = '<div class="ac-error">❌ Zadej datum narození</div>';
            return;
        }

        const birthDate = new Date(birthdateStr);
        const targetDateStr = targetDateInput.value;
        const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();

        if (birthDate > targetDate) {
            resultsDiv.innerHTML = '<div class="ac-error">❌ Datum narození nemůže být pozdější než cílové datum</div>';
            return;
        }

        // Výpočet věku v letech
        let years = targetDate.getFullYear() - birthDate.getFullYear();
        let months = targetDate.getMonth() - birthDate.getMonth();
        let days = targetDate.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            const lastMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
            days += lastMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        // Celkový počet dní
        const totalDays = Math.floor((targetDate - birthDate) / (1000 * 60 * 60 * 24));
        
        // Celkový počet týdnů
        const totalWeeks = Math.floor(totalDays / 7);
        
        // Celkový počet měsíců
        const totalMonths = years * 12 + months;
        
        // Další narozeniny
        const nextBirthday = new Date(targetDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (nextBirthday < targetDate) {
            nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }
        const daysToBirthday = Math.ceil((nextBirthday - targetDate) / (1000 * 60 * 60 * 24));
        
        // Znamení zvěrokruhu
        const zodiac = getZodiac(birthDate.getMonth() + 1, birthDate.getDate());
        
        // Den v týdnu narození
        const weekdays = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
        const birthWeekday = weekdays[birthDate.getDay()];
        
        // Formátování dat
        const formatDate = (date) => {
            return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };
        
        const targetDisplay = targetDateStr ? formatDate(targetDate) : 'dnešku';
        
        // Zobrazení výsledků
        resultsDiv.innerHTML = `
            <div class="ac-result-card ac-result-main">
                <div class="ac-result-icon">🎂</div>
                <div class="ac-result-content">
                    <div class="ac-result-value">${years} let, ${months} měsíců, ${days} dní</div>
                    <div class="ac-result-label">Přesný věk k ${targetDisplay}</div>
                </div>
            </div>
            
            <div class="ac-result-grid">
                <div class="ac-result-card">
                    <div class="ac-result-icon">📅</div>
                    <div class="ac-result-content">
                        <div class="ac-result-value">${totalDays}</div>
                        <div class="ac-result-label">Celkem dní</div>
                    </div>
                </div>
                
                <div class="ac-result-card">
                    <div class="ac-result-icon">📆</div>
                    <div class="ac-result-content">
                        <div class="ac-result-value">${totalWeeks}</div>
                        <div class="ac-result-label">Celkem týdnů</div>
                    </div>
                </div>
                
                <div class="ac-result-card">
                    <div class="ac-result-icon">📊</div>
                    <div class="ac-result-content">
                        <div class="ac-result-value">${totalMonths}</div>
                        <div class="ac-result-label">Celkem měsíců</div>
                    </div>
                </div>
                
                <div class="ac-result-card">
                    <div class="ac-result-icon">🎈</div>
                    <div class="ac-result-content">
                        <div class="ac-result-value">${daysToBirthday}</div>
                        <div class="ac-result-label">Dní do dalších narozenin</div>
                    </div>
                </div>
            </div>
            
            <div class="ac-result-card">
                <div class="ac-result-icon">⭐</div>
                <div class="ac-result-content">
                    <div class="ac-result-value">${zodiac}</div>
                    <div class="ac-result-label">Znamení zvěrokruhu</div>
                </div>
            </div>
            
            <div class="ac-result-card">
                <div class="ac-result-icon">📅</div>
                <div class="ac-result-content">
                    <div class="ac-result-value">${birthWeekday}</div>
                    <div class="ac-result-label">Den v týdnu narození</div>
                </div>
            </div>
        `;
        
        // Uložení nastavení
        saveSettings();
        showNotification('Věk spočítán', 'success');
    }
    
    function getZodiac(month, day) {
        if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '♈ Beran';
        if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '♉ Býk';
        if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return '♊ Blíženci';
        if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return '♋ Rak';
        if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '♌ Lev';
        if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '♍ Panna';
        if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return '♎ Váhy';
        if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return '♏ Štír';
        if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return '♐ Střelec';
        if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '♑ Kozoroh';
        if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '♒ Vodnář';
        return '♓ Ryby';
    }
    
    async function copyResults() {
        const results = resultsDiv.innerText;
        if (results && !results.includes('Vyber datum narození')) {
            await copyToClipboard(results);
        } else {
            showNotification('Nejprve spočítej věk', 'warning');
        }
    }
    
    function clearAll() {
        birthdateInput.value = '';
        targetDateInput.value = '';
        resultsDiv.innerHTML = '<div class="ac-empty">Vyber datum narození a klikni na "Spočítat věk"</div>';
        showNotification('Vyčištěno');
        saveSettings();
    }
    
    // Eventy
    calculateBtn.addEventListener('click', calculateAge);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResults);
    
    // Enter klávesa
    birthdateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateAge();
    });
    targetDateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateAge();
    });
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('birthdate', birthdateInput.value);
        storage.set('targetDate', targetDateInput.value);
    }
    
    function loadSettings() {
        const savedBirthdate = storage.get('birthdate', '');
        const savedTargetDate = storage.get('targetDate', '');
        
        if (savedBirthdate) {
            birthdateInput.value = savedBirthdate;
        }
        if (savedTargetDate) {
            targetDateInput.value = savedTargetDate;
        }
        
        if (savedBirthdate) {
            setTimeout(() => calculateAge(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Age Calculator se zavírá');
}