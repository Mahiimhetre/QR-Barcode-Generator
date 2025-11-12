// Popup-specific functionality
// Handles switching to side panel view and checks if side panel is already open

document.addEventListener('DOMContentLoaded', () => {
    // Check if side panel is already open when popup loads
    chrome.runtime.sendMessage({ action: 'checkSidePanel' }, (response) => {
        if (response && response.isOpen) {
            // Side panel is open, close popup and show message
            showMessage('Side panel is already open. Close it first to use popup.');
            setTimeout(() => {
                window.close();
            }, 2000);
            return;
        }
    });
    
    const viewSwitcher = document.getElementById('view-switcher');
    
    if (viewSwitcher) {
        viewSwitcher.addEventListener('click', async () => {
            try {
                // Get current window
                const currentWindow = await chrome.windows.getCurrent();
                
                // Open side panel first
                await chrome.sidePanel.open({ windowId: currentWindow.id });
                
                // Notify background that side panel is opening
                chrome.runtime.sendMessage({ action: 'openSidePanel' });
                
                // Close popup immediately after opening side panel
                // This ensures only one view is visible at a time
                window.close();
            } catch (error) {
                console.error('Error opening side panel:', error);
                // Fallback: send message to background script
                chrome.runtime.sendMessage({ action: 'openSidePanel' }, () => {
                    // Close popup after sending message
                    window.close();
                });
            }
        });
    }
});

// Show a message in the popup while hinding other content
function showMessage(message) {
    document.body.innerHTML = '';
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        padding: 16px 24px;
        background: var(--bg-secondary, #fff);
        color: var(--text-primary, #333);
        font-size: 14px;
        text-align: center;
        border: 1px solid var(--border-color, #e9ecef);
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
}

