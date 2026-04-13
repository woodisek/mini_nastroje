import { showNotification } from '../utils/notify.js';
import { getStorage } from '../utils/storage.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { createElement, clearElement } from '../utils/dom.js';

// Storage pro tuto aplikaci
const storage = getStorage('template');

// Hlavní render funkce
export default function render(container) {
    clearElement(container);
    
    // Vytvoření UI
    const wrapper = createElement('div', { className: 'app-template' });
    
    const title = createElement('h3', { 
        text: 'Moje Aplikace',
        className: 'app-title'
    });
    
    const description = createElement('p', {
        text: 'Sem přijde obsah tvé aplikace',
        className: 'app-description'
    });
    
    const button = createElement('button', {
        text: 'Ukázkové tlačítko',
        className: 'btn btn-primary',
        events: {
            click: () => {
                showNotification('Ahoj z template aplikace!');
                copyToClipboard('Nějaký text');
            }
        }
    });
    
    wrapper.appendChild(title);
    wrapper.appendChild(description);
    wrapper.appendChild(button);
    container.appendChild(wrapper);
    
    // Načtení uložených dat
    const savedData = storage.get('data');
    if (savedData) {
        console.log('Načtena data:', savedData);
    }
}

// Cleanup funkce (volitelná)
export function cleanup() {
    console.log('Template aplikace se zavírá');
    // Zde odstraň event listenery, timery atd.
}

// Metadata (volitelné)
export const metadata = {
    version: '1.0.0',
    author: 'Tvé jméno',
    requires: [] // závislosti
};