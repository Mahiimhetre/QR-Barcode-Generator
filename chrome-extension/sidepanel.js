// Side panel-specific functionality
// Tracks when side panel opens and closes

document.addEventListener('DOMContentLoaded', () => {
    // Notify background that side panel is open
    chrome.runtime.sendMessage({ action: 'sidePanelOpened' });
    
    // Detect when side panel is about to close
    window.addEventListener('beforeunload', () => {
        chrome.runtime.sendMessage({ action: 'sidePanelClosed' });
    });
    
    // Also detect visibility changes (when user switches tabs or closes)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Side panel might be closing or hidden
            setTimeout(() => {
                // Check if still hidden after a moment
                if (document.hidden) {
                    chrome.runtime.sendMessage({ action: 'sidePanelClosed' });
                }
            }, 100);
        }
    });
});
