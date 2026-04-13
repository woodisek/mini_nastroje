import { copyToClipboard } from '../utils/clipboard.js';
import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';

const storage = getStorage('team-splitter');

export default function render(container) {
    container.innerHTML = `
        <div class="team-splitter">
            <div class="ts-header">
                <span class="ts-icon">👥</span>
                <div>
                    <h3>Rozřazovač do týmů</h3>
                    <p>Spravedlivě rozděl lidi do skupin</p>
                </div>
            </div>

            <!-- Seznam jmen -->
            <div class="ts-section">
                <label class="ts-label">📝 Seznam jmen (jedno na řádek)</label>
                <textarea id="ts-names" class="ts-textarea" rows="6" placeholder="Zadej jména, každé na nový řádek...&#10;&#10;Např.:&#10;Jan Novák&#10;Petra Svobodová&#10;Martin Dvořák&#10;Eva Černá&#10;Tomáš Procházka&#10;Lucie Veselá"></textarea>
                <div class="ts-hint">💡 Každé jméno na samostatném řádku</div>
            </div>

            <!-- Počet týmů -->
            <div class="ts-section">
                <label class="ts-label">🔢 Počet týmů</label>
                <div class="ts-count-control">
                    <button id="ts-count-minus" class="ts-count-btn">−</button>
                    <input type="number" id="ts-teams" class="ts-count-input" value="2" min="2" max="10" step="1">
                    <button id="ts-count-plus" class="ts-count-btn">+</button>
                </div>
                <div class="ts-hint">2-10 týmů</div>
            </div>

            <!-- Možnosti -->
            <div class="ts-section">
                <label class="ts-label">⚙️ Možnosti</label>
                <div class="ts-options">
                    <label class="ts-checkbox">
                        <input type="checkbox" id="ts-randomize" checked>
                        <span>🎲 Náhodné pořadí</span>
                    </label>
                    <label class="ts-checkbox">
                        <input type="checkbox" id="ts-balance">
                        <span>⚖️ Vyvážit počty (stejně lidí v týmu)</span>
                    </label>
                    <label class="ts-checkbox">
                        <input type="checkbox" id="ts-names-first">
                        <span>🔤 Seřadit jména v týmech A-Z</span>
                    </label>
                </div>
            </div>

            <!-- Názvy týmů -->
            <details class="ts-details">
                <summary>✏️ Vlastní názvy týmů (volitelné)</summary>
                <div id="ts-team-names" class="ts-team-names">
                    <div class="ts-hint">Zde se objeví pole pro názvy týmů po zadání počtu</div>
                </div>
            </details>

            <!-- Tlačítka -->
            <div class="ts-buttons">
                <button id="ts-generate" class="ts-btn ts-btn-primary">🔄 Rozřadit do týmů</button>
                <button id="ts-clear" class="ts-btn ts-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="ts-result-section">
                <div class="ts-result-header">
                    <span>📊 Rozdělení do týmů</span>
                    <button id="ts-copy" class="ts-small-btn">📋 Kopírovat</button>
                    <button id="ts-clear-result" class="ts-small-btn">🗑️ Smazat výsledky</button>
                </div>
                <div id="ts-result" class="ts-result">
                    <div class="ts-empty">Zadej jména a klikni na "Rozřadit do týmů"</div>
                </div>
            </div>

            <!-- Tip -->
            <div class="ts-tip">
                💡 <strong>Tip:</strong> Můžeš si pojmenovat týmy (např. Červený tým, Modrý tým). Rozřazení je spravedlivé a náhodné.
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const namesInput = document.getElementById('ts-names');
    const teamsInput = document.getElementById('ts-teams');
    const teamsMinus = document.getElementById('ts-count-minus');
    const teamsPlus = document.getElementById('ts-count-plus');
    const randomizeCheck = document.getElementById('ts-randomize');
    const balanceCheck = document.getElementById('ts-balance');
    const namesFirstCheck = document.getElementById('ts-names-first');
    const generateBtn = document.getElementById('ts-generate');
    const clearBtn = document.getElementById('ts-clear');
    const copyBtn = document.getElementById('ts-copy');
    const clearResultBtn = document.getElementById('ts-clear-result');
    const teamNamesContainer = document.getElementById('ts-team-names');
    const resultDiv = document.getElementById('ts-result');

    let currentTeams = [];
    let currentNames = [];
    let teamNameInputs = [];

    // Aktualizace polí pro názvy týmů
    function updateTeamNameInputs() {
        const teamCount = parseInt(teamsInput.value) || 2;
        const savedNames = storage.get('teamNames', {});
        
        teamNamesContainer.innerHTML = '<div class="ts-team-names-grid">';
        for (let i = 0; i < teamCount; i++) {
            const defaultValue = savedNames[i] || getDefaultTeamName(i);
            teamNamesContainer.innerHTML += `
                <div class="ts-team-name-item">
                    <label>Tým ${i + 1}:</label>
                    <input type="text" class="ts-team-name-input" data-team="${i}" value="${escapeHtml(defaultValue)}" placeholder="Tým ${i + 1}">
                </div>
            `;
        }
        teamNamesContainer.innerHTML += '</div>';
        
        // Eventy pro ukládání názvů
        document.querySelectorAll('.ts-team-name-input').forEach(input => {
            input.addEventListener('change', () => {
                saveTeamNames();
            });
        });
    }

    function getDefaultTeamName(index) {
        const defaultNames = ['Červený tým', 'Modrý tým', 'Zelený tým', 'Žlutý tým', 'Fialový tým', 'Oranžový tým', 'Růžový tým', 'Hnědý tým', 'Šedý tým', 'Černý tým'];
        return defaultNames[index] || `Tým ${index + 1}`;
    }

    function saveTeamNames() {
        const teamCount = parseInt(teamsInput.value) || 2;
        const teamNames = {};
        for (let i = 0; i < teamCount; i++) {
            const input = document.querySelector(`.ts-team-name-input[data-team="${i}"]`);
            if (input) {
                teamNames[i] = input.value;
            }
        }
        storage.set('teamNames', teamNames);
    }

    function loadTeamNames() {
        const teamCount = parseInt(teamsInput.value) || 2;
        const savedNames = storage.get('teamNames', {});
        for (let i = 0; i < teamCount; i++) {
            const input = document.querySelector(`.ts-team-name-input[data-team="${i}"]`);
            if (input && savedNames[i]) {
                input.value = savedNames[i];
            }
        }
    }

    // Rozřazení do týmů
    function splitIntoTemas() {
        const namesText = namesInput.value.trim();
        if (!namesText) {
            showNotification('Zadej seznam jmen', 'warning');
            return;
        }
        
        let names = namesText.split(/\r?\n/).filter(name => name.trim().length > 0);
        const teamCount = parseInt(teamsInput.value) || 2;
        const randomize = randomizeCheck.checked;
        const balance = balanceCheck.checked;
        const namesFirst = namesFirstCheck.checked;
        
        if (names.length === 0) {
            showNotification('Zadej alespoň jedno jméno', 'warning');
            return;
        }
        
        if (teamCount > names.length && balance) {
            showNotification(`Počet týmů (${teamCount}) je větší než počet lidí (${names.length}). Vyvážení není možné.`, 'warning');
        }
        
        // Získání názvů týmů
        const teamNames = [];
        for (let i = 0; i < teamCount; i++) {
            const input = document.querySelector(`.ts-team-name-input[data-team="${i}"]`);
            teamNames.push(input ? input.value : getDefaultTeamName(i));
        }
        
        // Náhodné zamíchání jmen
        if (randomize) {
            for (let i = names.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [names[i], names[j]] = [names[j], names[i]];
            }
        }
        
        // Seřazení jmen
        if (namesFirst) {
            names.sort((a, b) => a.localeCompare(b, 'cs'));
        }
        
        // Rozdělení do týmů
        const teams = Array(teamCount).fill().map(() => []);
        
        if (balance) {
            // Vyvážené rozdělení (každý tým stejný počet, případně o jednoho více)
            let teamIndex = 0;
            for (let i = 0; i < names.length; i++) {
                teams[teamIndex % teamCount].push(names[i]);
                teamIndex++;
            }
        } else {
            // Náhodné rozdělení (prvních X do prvního týmu atd.)
            const avgSize = Math.ceil(names.length / teamCount);
            for (let i = 0; i < teamCount; i++) {
                const start = i * avgSize;
                const end = Math.min(start + avgSize, names.length);
                teams[i] = names.slice(start, end);
            }
        }
        
        // Seřazení jmen v týmech
        if (namesFirst) {
            for (let i = 0; i < teams.length; i++) {
                teams[i].sort((a, b) => a.localeCompare(b, 'cs'));
            }
        }
        
        currentTeams = teams;
        currentNames = names;
        
        displayResults(teams, teamNames);
        
        showNotification(`Rozřazeno ${names.length} lidí do ${teamCount} týmů`, 'success');
        saveSettings();
    }

    function displayResults(teams, teamNames) {
        let html = '<div class="ts-teams-grid">';
        
        for (let i = 0; i < teams.length; i++) {
            const teamColor = getTeamColor(i);
            html += `
                <div class="ts-team-card" style="border-top: 4px solid ${teamColor}">
                    <div class="ts-team-header">
                        <span class="ts-team-icon">${getTeamIcon(i)}</span>
                        <span class="ts-team-name">${escapeHtml(teamNames[i])}</span>
                        <span class="ts-team-count">${teams[i].length} členů</span>
                    </div>
                    <div class="ts-team-members">
                        ${teams[i].map((member, idx) => `
                            <div class="ts-team-member">
                                <span class="ts-member-num">${idx + 1}.</span>
                                <span class="ts-member-name">${escapeHtml(member)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // Statistiky
        const teamSizes = teams.map(t => t.length);
        const minSize = Math.min(...teamSizes);
        const maxSize = Math.max(...teamSizes);
        
        html += `
            <div class="ts-stats">
                <div class="ts-stat-card">
                    <div class="ts-stat-value">${teams.length}</div>
                    <div class="ts-stat-label">týmů</div>
                </div>
                <div class="ts-stat-card">
                    <div class="ts-stat-value">${teams.reduce((a, b) => a + b.length, 0)}</div>
                    <div class="ts-stat-label">celkem lidí</div>
                </div>
                <div class="ts-stat-card">
                    <div class="ts-stat-value">${minSize} - ${maxSize}</div>
                    <div class="ts-stat-label">rozsah týmů</div>
                </div>
            </div>
        `;
        
        resultDiv.innerHTML = html;
    }

    function getTeamColor(index) {
        const colors = ['#f44336', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#3f51b5', '#ff5722'];
        return colors[index % colors.length];
    }

    function getTeamIcon(index) {
        const icons = ['🏆', '⭐', '🌟', '💎', '🎯', '🔥', '💪', '🎨', '🚀', '🏅'];
        return icons[index % icons.length];
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function copyResult() {
        if (currentTeams.length === 0) {
            showNotification('Nejprve rozřaď do týmů', 'warning');
            return;
        }
        
        const teamNames = [];
        for (let i = 0; i < currentTeams.length; i++) {
            const input = document.querySelector(`.ts-team-name-input[data-team="${i}"]`);
            teamNames.push(input ? input.value : getDefaultTeamName(i));
        }
        
        let text = 'ROZDĚLENÍ DO TÝMŮ\n';
        text += '='.repeat(40) + '\n\n';
        
        for (let i = 0; i < currentTeams.length; i++) {
            text += `${teamNames[i]} (${currentTeams[i].length} členů):\n`;
            currentTeams[i].forEach((member, idx) => {
                text += `  ${idx + 1}. ${member}\n`;
            });
            text += '\n';
        }
        
        await copyToClipboard(text);
        showNotification('Rozdělení zkopírováno');
    }

    function clearResult() {
        currentTeams = [];
        currentNames = [];
        resultDiv.innerHTML = '<div class="ts-empty">Zadej jména a klikni na "Rozřadit do týmů"</div>';
        showNotification('Výsledky smazány');
    }

    function clearAll() {
        namesInput.value = '';
        teamsInput.value = '2';
        randomizeCheck.checked = true;
        balanceCheck.checked = false;
        namesFirstCheck.checked = false;
        updateTeamNameInputs();
        clearResult();
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Eventy
    teamsMinus.addEventListener('click', () => {
        let val = parseInt(teamsInput.value);
        if (val > 2) teamsInput.value = val - 1;
        updateTeamNameInputs();
        saveSettings();
    });
    
    teamsPlus.addEventListener('click', () => {
        let val = parseInt(teamsInput.value);
        if (val < 10) teamsInput.value = val + 1;
        updateTeamNameInputs();
        saveSettings();
    });
    
    generateBtn.addEventListener('click', splitIntoTemas);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    clearResultBtn.addEventListener('click', clearResult);
    
    teamsInput.addEventListener('change', () => {
        updateTeamNameInputs();
        saveSettings();
    });
    
    const inputs = [namesInput, randomizeCheck, balanceCheck, namesFirstCheck];
    inputs.forEach(input => {
        if (input) input.addEventListener('change', saveSettings);
        if (input) input.addEventListener('input', saveSettings);
    });
    
    function saveSettings() {
        storage.set('names', namesInput.value);
        storage.set('teams', teamsInput.value);
        storage.set('randomize', randomizeCheck.checked);
        storage.set('balance', balanceCheck.checked);
        storage.set('namesFirst', namesFirstCheck.checked);
        saveTeamNames();
    }
    
    function loadSettings() {
        namesInput.value = storage.get('names', '');
        teamsInput.value = storage.get('teams', '2');
        randomizeCheck.checked = storage.get('randomize', true);
        balanceCheck.checked = storage.get('balance', false);
        namesFirstCheck.checked = storage.get('namesFirst', false);
        updateTeamNameInputs();
        loadTeamNames();
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Team Splitter se zavírá');
}