// Side panel-specific functionality
// Tracks when side panel opens and closes

document.addEventListener('DOMContentLoaded', () => {
    let port = chrome.runtime.connect({ name: 'sidepanel' });
    chrome.runtime.sendMessage({ action: 'sidePanelOpened' });
    window.addEventListener('beforeunload', () => {
        if (port) {
            port.disconnect();
            port = null;
        }
        chrome.runtime.sendMessage({ action: 'sidePanelClosed' });
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            setTimeout(() => {
                if (document.hidden) {
                    if (port) {
                        port.disconnect();
                        port = null;
                    }
                    chrome.runtime.sendMessage({ action: 'sidePanelClosed' });
                }
            }, 100);
        }
    });
});
