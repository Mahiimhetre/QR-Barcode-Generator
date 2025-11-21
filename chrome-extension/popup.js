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

// Show a message in the popup
function showMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bg-secondary, #fff);
        color: var(--text-primary, #333);
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 14px;
        text-align: center;
        max-width: 90%;
        border: 1px solid var(--border-color, #e9ecef);
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Remove after 2 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 2000);
}

