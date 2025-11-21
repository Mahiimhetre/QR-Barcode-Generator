// Background service worker for Chrome extension
// Handles side panel opening and storage management

// Track side panel state
let sidePanelOpen = false;

// Note: chrome.action.onClicked doesn't fire when default_popup is set in manifest
// So we handle popup blocking in popup.js itself

// Listen for messages from popup or sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    // Get the window ID from sender or use current window
    chrome.windows.getCurrent().then(window => {
      chrome.sidePanel.open({ windowId: window.id });
      sidePanelOpen = true; // Track that side panel is now open
      // Disable popup when side panel opens
      chrome.action.setPopup({ popup: '' });
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error opening side panel:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (request.action === 'sidePanelOpened') {
    // Track that side panel is now open
    sidePanelOpen = true;
    // Disable popup
    chrome.action.setPopup({ popup: '' });
    sendResponse({ success: true });
  } else if (request.action === 'sidePanelClosed') {
    // Track that side panel is closed
    sidePanelOpen = false;
    // Re-enable popup
    chrome.action.setPopup({ popup: 'popup.html' });
    sendResponse({ success: true });
  } else if (request.action === 'checkSidePanel') {
    // Check if side panel is open
    sendResponse({ isOpen: sidePanelOpen });
  }
  return true; // Keep message channel open for async response
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('CodeCraft extension installed');
  // Ensure popup is enabled by default
  chrome.action.setPopup({ popup: 'popup.html' });
});

