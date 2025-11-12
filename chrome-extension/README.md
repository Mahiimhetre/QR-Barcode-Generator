# CodeCraft Chrome Extension

This is the Chrome extension version of the CodeCraft QR & Barcode Generator website.

## Features

- **QR Code Generation**: Generate QR codes with customizable size, colors, and background
- **Barcode Generation**: Support for CODE128, CODE39, and EAN13 formats
- **Dual View Modes**: 
  - **Popup**: Quick access via extension icon
  - **Side Panel**: Persistent view alongside web pages
- **Save & Manage**: Pin your favorite codes for later use
- **Dark Mode**: Toggle between light and dark themes
- **Keyboard Shortcuts**: Quick actions via keyboard
- **Export Options**: Download codes as PNG or SVG

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. The extension icon will appear in your toolbar

## Usage

### Opening the Extension

- **Popup**: Click the extension icon in the toolbar
- **Side Panel**: Click the extension icon, then click "Side Panel" button, or click the extension icon directly (configured to open side panel)

### Switching Views

- From **Popup**: Click the "Side Panel" button in the top right
- From **Side Panel**: Click the "Popup" button in the top right

### Keyboard Shortcuts

- `Alt + C`: Toggle uppercase enforcement
- `Shift + Tab`: Switch between QR and Barcode tabs
- `Ctrl + S`: Pin/save the current code
- `Esc`: Close modals

## File Structure

```
chrome-extension/
├── manifest.json          # Extension manifest (v3)
├── background.js         # Service worker for background tasks
├── popup.html           # Popup view HTML
├── sidepanel.html       # Side panel view HTML
├── script.js            # Main application logic (adapted for extension)
├── popup.js             # Popup-specific functionality
├── sidepanel.js         # Side panel-specific functionality
├── style.css            # Styles (adapted for extension)
├── assets/
│   ├── bootstrap-icons.css  # Bootstrap Icons CSS (local)
│   └── bootstrap-icons.woff2 # Bootstrap Icons font (local)
├── vendor/
│   ├── jsbarcode.min.js     # Barcode generation library
│   └── qrious.min.js        # QR code generation library
└── icons/               # Extension icons (placeholder - add your icons here)
```

## Changes from Original Website

### Storage
- **Original**: Uses `localStorage`
- **Extension**: Uses `chrome.storage.local` API with `localStorage` fallback
- **Reason**: Better integration with Chrome extension APIs and cross-tab synchronization

### Resource Loading
- **Original**: Bootstrap Icons loaded from CDN
- **Extension**: Bootstrap Icons loaded locally from `assets/` folder
- **Reason**: Chrome extensions cannot load external resources without proper permissions

### View Switching
- **Original**: Single page view
- **Extension**: Added view switcher buttons to toggle between popup and side panel
- **Reason**: Chrome extensions support multiple view contexts

### Background Scripts
- **Original**: No background scripts needed
- **Extension**: Added `background.js` service worker
- **Reason**: Required for handling side panel opening and message passing

## Development Notes

### Icons
The extension requires icon files in the `icons/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can create these icons or use placeholder images. The extension will work without them, but Chrome will show a default icon.

### Testing
1. Load the extension in developer mode
2. Test both popup and side panel views
3. Verify storage persistence (saved codes should persist)
4. Test all functionality (QR generation, barcode generation, saving, etc.)

## Browser Compatibility

- Chrome 88+ (for side panel support)
- Manifest V3 compatible

## License

Same as the original CodeCraft project.

