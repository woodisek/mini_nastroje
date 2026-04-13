// Kopírování textu do schránky s fallbackem
export async function copyToClipboard(text, showNotification = true) {
    try {
        // Moderní Clipboard API
        await navigator.clipboard.writeText(text);
        if (showNotification) {
            const { showNotification: notify } = await import('./notify.js');
            notify(`Zkopírováno: ${text.length > 50 ? text.substring(0, 50) + '...' : text}`);
        }
        return true;
    } catch (err) {
        console.error('Kopírování selhalo:', err);
        
        // Fallback pro starší prohlížeče
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (success && showNotification) {
                const { showNotification: notify } = await import('./notify.js');
                notify(`Zkopírováno (fallback): ${text.length > 50 ? text.substring(0, 50) + '...' : text}`);
            }
            return success;
        } catch (fallbackErr) {
            console.error('Fallback kopírování selhal:', fallbackErr);
            if (showNotification) {
                const { showNotification: notify } = await import('./notify.js');
                notify('Nepodařilo se zkopírovat', 'error');
            }
            return false;
        }
    }
}

// Zkopírování obsahu elementu
export async function copyElementContent(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element nenalezen:', elementId);
        return false;
    }
    
    const text = element.textContent || element.innerText || element.value;
    return copyToClipboard(text);
}