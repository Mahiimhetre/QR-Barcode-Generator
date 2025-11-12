# Installation Guide

## Quick Start

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - The extension will appear in your extensions list

4. **Access the Extension**
   - Click the extension icon in the Chrome toolbar
   - The popup will open by default
   - Click "Side Panel" button to switch to side panel view

## Adding Icons (Optional)

The extension will work without custom icons, but for a complete setup:

1. Create or download icon images:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)
   - add this in manifest.json: 
      - "icons": {
      -   "16": "icons/icon16.png",
      -   "48": "icons/icon48.png",
      -   "128": "icons/icon128.png"
      - },
2. Place them in the `chrome-extension/icons/` folder

3. Reload the extension

## Troubleshooting

### Extension won't load
- Ensure all files are in the `chrome-extension` folder
- Check that `manifest.json` is valid JSON
- Look for errors in the extensions page

### Icons not showing
- Extension works without icons (Chrome uses default)
- Ensure icon files are PNG format
- Check file paths in `manifest.json`

### Side panel won't open
- Ensure Chrome version is 88 or later
- Check browser console for errors
- Verify `sidePanel` permission in manifest

### Storage not working
- Extension uses `chrome.storage.local` (no special setup needed)
- Data persists across browser sessions
- Check browser console for storage errors

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup opens when clicking extension icon
- [ ] Side panel opens from popup
- [ ] QR code generation works
- [ ] Barcode generation works
- [ ] Save/pin functionality works
- [ ] Saved codes persist after reload
- [ ] Dark mode toggle works
- [ ] Download (PNG/SVG) works
- [ ] Keyboard shortcuts work

## Next Steps

After installation, you can:
- Generate QR codes and barcodes
- Customize colors and sizes
- Save your favorite codes
- Switch between popup and side panel views
- Use keyboard shortcuts for quick actions

Enjoy using CodeCraft!

