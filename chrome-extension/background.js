// Background service worker for Chrome extension
// Handles side panel opening and storage management

// Track side panel state
let sidePanelOpen = false;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    sidePanelOpen = true;
    port.onDisconnect.addListener(() => {
      sidePanelOpen = false;
      chrome.action.setPopup({ popup: 'popup.html' });
    });
  }
});

// Note: chrome.action.onClicked doesn't fire when default_popup is set in manifest
// So we handle popup blocking in popup.js itself

// Listen for messages from popup or sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    sidePanelOpen = true;
    sendResponse({ success: true });
  } else if (request.action === 'sidePanelOpened') {
    // Track that side panel is now open
    sidePanelOpen = true;
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

