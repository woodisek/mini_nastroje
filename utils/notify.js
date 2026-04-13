// Zobrazení toast notifikace
let toastTimeout = null;

export function showNotification(message, type = 'success') {
    // Odstranění předchozí notifikace
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    
    // Vytvoření nové notifikace
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Různé ikony podle typu
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.textContent = `${icons[type] || '🔔'} ${message}`;
    document.body.appendChild(toast);
    
    // Automatické zmizení po 2 sekundách
    toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 2000);
}

// Rychlé notifikace
export const notify = {
    success: (msg) => showNotification(msg, 'success'),
    error: (msg) => showNotification(msg, 'error'),
    warning: (msg) => showNotification(msg, 'warning'),
    info: (msg) => showNotification(msg, 'info')
};