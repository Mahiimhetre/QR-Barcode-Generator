// Extension-adapted JavaScript - Uses chrome.storage instead of localStorage
// All original functionality preserved with Chrome extension APIs

// State
const state = {
    currentTab: 'qr',
    generatedCanvas: null,
    sharedText: '',
    pendingBarcodeText: '',
    isDark: false,
    settingsOpen: false,
    enforceUppercase: false,
    currentPage: 1,
    itemsPerPage: 8,
    currentFilter: 'all',
    savedCodes: []
};

const shortcuts = [
    { key: 'Alt + C', description: 'Toggle Caps', preventDefault: true, handler: () => toggleCaps() },
    { key: 'Shift + Tab', description: 'Switch QR/Barcode', preventDefault: true, handler: () => {
        const next = state.currentTab === 'qr' ? 'barcode' : 'qr';
        switchTab(next);
    }},
    { key: 'Ctrl + S', description: 'Save Code', preventDefault: true, handler: () => renderPin()},
    { key: 'Esc', description: 'Close Modal', preventDefault: false, handler: () => closePreviewModal() }
];

function renderPin(){
    if (!state.generatedCanvas) return;
        const downloadSection = $('#download-section');
        if (downloadSection) {
            const tooltip = document.createElement('div');
            tooltip.className = 'save-tooltip';
            tooltip.textContent = 'Code pinned! 📌';
            tooltip.style.position = 'absolute';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.top = '-25px';
            tooltip.style.background = 'var(--accent-primary)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '4px 8px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '10px';
            tooltip.style.opacity = '0';
            tooltip.style.transition = 'opacity 0.3s ease';
            downloadSection.style.position = 'relative';
            downloadSection.appendChild(tooltip);
            setTimeout(() => tooltip.style.opacity = '1', 50);
            setTimeout(() => { tooltip.style.opacity = '0'; setTimeout(() => tooltip.remove(), 300); }, 2000);
        }
        saveToPage();
}

function renderShortcuts() {
    const container = $('#shortcuts-container');
    if (!container) return;

    const shortcutsHTML = `
        <h3 style="margin-top:8px; display:flex; align-items:center; gap:6px;"><i class="bi bi-keyboard"></i> Shortcuts</h3>
        <ul>
            ${shortcuts.map(shortcut => `<li><strong>${shortcut.key}:</strong> ${shortcut.description}</li>`).join('')}
        </ul>
    `;

    container.innerHTML = shortcutsHTML;
}

function normalizeShortcutString(str) {
    const parts = str.replace(/\s+/g, '').split('+').map(p => p.toLowerCase());
    const mods = { ctrl: false, alt: false, shift: false };
    let key = '';
    for (const p of parts) {
        if (p === 'ctrl' || p === 'control') mods.ctrl = true;
        else if (p === 'alt') mods.alt = true;
        else if (p === 'shift') mods.shift = true;
        else key = p;
    }
    const map = { esc: 'escape', tab: 'tab', enter: 'enter', space: ' ' };
    key = map[key] || key;
    return { ...mods, key };
}

function matchesShortcut(e, shortcutStr) {
    const s = normalizeShortcutString(shortcutStr);
    const pressedKey = e.key.toLowerCase();
    const ctrlOrMeta = e.ctrlKey || e.metaKey; // support Cmd on Mac
    const ctrlMatch = s.ctrl ? ctrlOrMeta : !ctrlOrMeta;
    const altMatch = e.altKey === s.alt;
    const shiftMatch = e.shiftKey === s.shift;
    return ctrlMatch && altMatch && shiftMatch && pressedKey === s.key;
}

// Utility functions
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);
const applyCasing = value => state.enforceUppercase ? value.toUpperCase() : value;
const setDisplay = (element, show) => element?.classList.toggle('hidden', !show);

// Extension-specific: Use chrome.storage instead of localStorage
async function updateStorage() {
    try {
        await chrome.storage.local.set({ savedCodes: state.savedCodes });
    } catch (error) {
        console.error('Error saving to chrome.storage:', error);
        // Fallback to localStorage if chrome.storage fails
        localStorage.setItem('savedCodes', JSON.stringify(state.savedCodes));
    }
}

// Legacy globals removed — code now uses `state.*` directly.

function clearOutput() {
    $('#output').innerHTML = '<div class="placeholder">Enter content to generate code</div>';
    setDisplay($('#download-section'), false);
    state.generatedCanvas = null;
}

function updateOutput(canvas, error = false) {
    if (error) {
        $('#output').innerHTML = '<div class="placeholder">Error generating code</div>';
        return;
    }
    state.generatedCanvas = canvas;
    $('#output').innerHTML = '';
    $('#output').appendChild(canvas);
    
    // Make canvas clickable to auto-save
    canvas.style.cursor = 'pointer';
    canvas.onclick = () => saveToPage();
    
    setDisplay($('#download-section'), true);
}

function generateQR() {
    const text = applyCasing(state.sharedText.trim());
    if (!text) return clearOutput();

    try {
        const canvas = document.createElement('canvas');
        new QRious({
            element: canvas,
            value: text,
            size: parseInt($('#qr-size').value),
            foreground: $('#qr-color').value,
            background: $('#qr-bg-color').value
        });
        updateOutput(canvas);
    } catch (error) {
        updateOutput(null, true);
    }
}

function generateBarcode() {
    const text = applyCasing(state.sharedText.trim());
    if (!text) return clearOutput();
    // Instead of a simple length check, create a temporary barcode canvas and
    // compare its rendered width to the preview area's width. Only show the
    // "text too long" warning when the generated barcode width is greater
    // than or equal to the preview area width.
    const barcodeOptions = {
        format: $('#barcode-format').value,
        width: parseFloat($('#barcode-width').value) || 2,
        height: parseInt($('#barcode-height').value) || 100,
        lineColor: $('#barcode-color').value,
        background: $('#barcode-bg-color').value,
        displayValue: true
    };

    try {
        const previewEl = $('#output');
        const previewWidth = previewEl ? previewEl.clientWidth || previewEl.getBoundingClientRect().width : 300;

        // Use a temporary canvas to let JsBarcode compute the required width
        const tempCanvas = document.createElement('canvas');
        JsBarcode(tempCanvas, text, barcodeOptions);

        const generatedWidth = tempCanvas.width || Math.round(tempCanvas.getBoundingClientRect().width);

        if (generatedWidth >= previewWidth) {
            // Keep pending text so switchToQR can reuse it
            state.pendingBarcodeText = text;
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = 'text-align: center; color: var(--danger); font-size: 12px; font-weight: 600; padding: 12px; background: rgba(220, 53, 69, 0.12); border-radius: 10px;';
            warningDiv.innerHTML = '⚠️ Generated barcode is too wide for the preview area<br>';
            
            const switchBtn = document.createElement('button');
            switchBtn.textContent = 'Use QR Code Instead';
            switchBtn.style.cssText = 'margin-top: 10px; padding: 6px 16px; background: var(--accent-primary); color: #fff; border: none; border-radius: 999px; font-size: 11px;';
            switchBtn.addEventListener('click', switchToQR);
            warningDiv.appendChild(switchBtn);
            
            $('#output').innerHTML = '';
            $('#output').appendChild(warningDiv);
            setDisplay($('#download-section'), false);
            return;
        }
    } catch (err) {
        // If sizing measurement fails for some reason, fall back to attempting generation
        console.warn('Barcode pre-measure failed, attempting generation anyway', err);
    }

    try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, text, barcodeOptions);
        updateOutput(canvas);
    } catch (error) {
        updateOutput(null, true);
    }
}

function switchTab(tab) {
    state.currentTab = tab;

    // Update UI
    $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
    $(`.tab-btn[data-tab="${tab}"]`)?.classList.add('active');

    // Toggle visibility
    ['qr', 'barcode'].forEach(type => {
        setDisplay($(`#${type}-input`), type === tab);
        setDisplay($(`#${type}-settings`), type === tab);
    });

    // Sync inputs
    $('#qr-text').value = state.sharedText;
    $('#barcode-text').value = state.sharedText;

    // Generate output
    state.sharedText.trim() ? (tab === 'qr' ? generateQR() : generateBarcode()) : clearOutput();
}

function switchToQR() {
    const barcodeText = (state.pendingBarcodeText || state.sharedText).trim();
    state.pendingBarcodeText = '';
    state.currentTab = 'qr';
    $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
    $(`.tab-btn[data-tab="qr"]`)?.classList.add('active');
    setDisplay($('#qr-input'), true); setDisplay($('#barcode-input'), false);
    setDisplay($('#qr-settings'), true); setDisplay($('#barcode-settings'), false);
    state.sharedText = barcodeText;
    $('#qr-text').value = barcodeText;
    generateQR();
}

function saveItem(index = -1) {
    updateStorage();
    updateGallery();
    hideModal();
}

function showModal(title, message, confirmText, cancelText, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="modal-actions">
                <button class="modal-btn confirm">${confirmText}</button>
                <button class="modal-btn cancel">${cancelText}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.confirm').addEventListener('click', onConfirm);
    modal.querySelector('.cancel').addEventListener('click', onCancel);

    requestAnimationFrame(() => modal.classList.add('show'));
}

function hideModal() {
    const modal = $('.modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function saveToPage() {
    if (!state.generatedCanvas) return;
    
    const newItem = {
        dataURL: state.generatedCanvas.toDataURL(),
        type: state.currentTab,
        content: applyCasing($(`#${state.currentTab}-text`).value.trim()),
        timestamp: new Date().toLocaleString()
    };

    const exactDuplicate = state.savedCodes.findIndex(item => 
        item.content === newItem.content && item.type === newItem.type
    );

    const sameContentDiffType = state.savedCodes.findIndex(item => 
        item.content === newItem.content && item.type !== newItem.type
    );

    if (exactDuplicate !== -1) {
        showModal(
            'Duplicate Entry',
            'This code already exists in your saved items.',
            'Replace',
            'Keep Both',
            () => {
                state.savedCodes[exactDuplicate] = newItem;
                saveItem();
            },
            () => {
                state.savedCodes.push(newItem);
                saveItem();
            }
        );
    } else if (sameContentDiffType !== -1) {
        showModal(
            'Similar Entry Found',
            `This content exists as ${state.savedCodes[sameContentDiffType].type.toUpperCase()} code. Replace with ${state.currentTab.toUpperCase()}?`,
            'Replace',
            'Keep Both',
            () => {
                state.savedCodes[sameContentDiffType] = newItem;
                saveItem();
            },
            () => {
                state.savedCodes.push(newItem);
                saveItem();
            }
        );
    } else {
        state.savedCodes.push(newItem);
        saveItem();
    }
}

function showPreviewModal(item, index) {
    const container = document.querySelector('.container');
    const modal = document.createElement('div');
    modal.className = 'preview-modal';
    
    // Create modal content structure (CSP-compliant, no inline handlers)
    const modalContent = document.createElement('div');
    modalContent.className = 'preview-modal-content';
    modalContent.addEventListener('click', (e) => e.stopPropagation());
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'preview-modal-header';
    
    const modalTitle = document.createElement('div');
    modalTitle.className = 'preview-modal-title';
    modalTitle.textContent = `${item.type.toUpperCase()} Code`;
    
    const modalActions = document.createElement('div');
    modalActions.className = 'preview-modal-actions';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'preview-modal-btn delete';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.addEventListener('click', () => deleteFromPreview(index));
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'preview-modal-btn close';
    closeBtn.title = 'Close';
    closeBtn.innerHTML = '<i class="bi bi-x"></i>';
    closeBtn.addEventListener('click', closePreviewModal);
    
    modalActions.appendChild(deleteBtn);
    modalActions.appendChild(closeBtn);
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalActions);
    
    const modalImage = document.createElement('div');
    modalImage.className = 'preview-modal-image';
    const img = document.createElement('img');
    img.src = item.dataURL;
    img.alt = `${item.type} code`;
    modalImage.appendChild(img);
    
    const modalInfo = document.createElement('div');
    modalInfo.className = 'preview-modal-info';
    const contentDiv = document.createElement('div');
    contentDiv.textContent = item.content;
    const timestampDiv = document.createElement('div');
    timestampDiv.textContent = item.timestamp;
    modalInfo.appendChild(contentDiv);
    modalInfo.appendChild(timestampDiv);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalImage);
    modalContent.appendChild(modalInfo);
    modal.appendChild(modalContent);

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePreviewModal();
        }
    });

    container.appendChild(modal);
    container.classList.add('blur');
    setTimeout(() => modal.classList.add('show'), 10);

    // Close on Escape key
    const escListener = (e) => {
        if (e.key === 'Escape') {
            closePreviewModal();
            document.removeEventListener('keydown', escListener);
        }
    };
    document.addEventListener('keydown', escListener);
}

function deleteFromPreview(index) {
    deleteItem(index);
    closePreviewModal();
}

function closePreviewModal() {
    const container = document.querySelector('.container');
    const modal = document.querySelector('.preview-modal');
    if (modal) {
        modal.classList.remove('show');
        container.classList.remove('blur');
        setTimeout(() => modal.remove(), 300);
    }
}

function getFilteredCodes() {
    return state.savedCodes.filter(item => state.currentFilter === 'all' || item.type === state.currentFilter);
}

function updatePagination() {
    const filteredCodes = getFilteredCodes();
    const totalPages = Math.ceil(filteredCodes.length / state.itemsPerPage) || 1;
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const makeBtn = (cls, cb, html) => {
        const b = document.createElement('button');
        b.className = cls;
        b.innerHTML = html || '';
        b.addEventListener('click', cb);
        return b;
    };

    paginationContainer.appendChild(makeBtn(`pagination-btn ${state.currentPage === 1 ? 'disabled' : ''}`, () => state.currentPage > 1 && changePage(state.currentPage - 1), '<i class="bi bi-chevron-left"></i>'));

    for (let i = 1; i <= totalPages; i++) {
        const cls = `pagination-btn ${i === state.currentPage ? 'active' : ''}`;
        paginationContainer.appendChild(makeBtn(cls, () => changePage(i), String(i)));
    }

    paginationContainer.appendChild(makeBtn(`pagination-btn ${state.currentPage === totalPages ? 'disabled' : ''}`, () => state.currentPage < totalPages && changePage(state.currentPage + 1), '<i class="bi bi-chevron-right"></i>'));
}

function changePage(page) {
    state.currentPage = page;
    updateGallery();
}

function updateGallery() {
    const gallery = $('#saved-gallery');
    const galleryItems = $('#gallery-items');
    const clearBtn = document.querySelector('.gallery-clear-btn');

    const filteredCodes = getFilteredCodes();

    if (!state.savedCodes.length) return gallery?.classList.add('hidden');

    gallery?.classList.remove('hidden');
    galleryItems.innerHTML = '';

    // Show/hide clear button based on filtered results
    if (clearBtn) clearBtn.classList.toggle('hidden', filteredCodes.length === 0);

    // Update saved count badge (filtered / total)
    const badge = document.querySelector('.saved-count');
    if (badge) {
        const total = state.savedCodes.length;
        badge.textContent = filteredCodes.length === total ? String(total) : `${filteredCodes.length}/${total}`;
        badge.classList.toggle('hidden', total === 0);
    }

    const start = (state.currentPage - 1) * state.itemsPerPage;
    const pageItems = filteredCodes.slice(start, start + state.itemsPerPage);

    pageItems.forEach(item => {
        const actualIndex = state.savedCodes.indexOf(item);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'gallery-card';
        itemDiv.setAttribute('data-type', item.type);
        itemDiv.style.cursor = 'pointer';
        
        // Create delete button (CSP-compliant)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteItem(actualIndex);
        });
        
        // Create content elements
        const contentInfo = document.createElement('div');
        contentInfo.className = 'item-info';
        contentInfo.textContent = item.content.length > 20 ? item.content.substring(0, 20) + '...' : item.content;
        
        const img = document.createElement('img');
        img.src = item.dataURL;
        img.style.cssText = 'max-width: 100%; height: auto;';
        
        const timestampInfo = document.createElement('div');
        timestampInfo.className = 'item-info';
        timestampInfo.textContent = item.timestamp;
        
        itemDiv.appendChild(deleteBtn);
        itemDiv.appendChild(contentInfo);
        itemDiv.appendChild(img);
        itemDiv.appendChild(timestampInfo);
        
        itemDiv.addEventListener('click', e => {
            if (!e.target.closest('.delete-btn')) showPreviewModal(item, actualIndex);
        });
        galleryItems.appendChild(itemDiv);
    });

    updatePagination();
}

function deleteItem(index) {
    state.savedCodes.splice(index, 1);
    updateStorage();

    const filteredCodes = getFilteredCodes();
    const totalPages = Math.max(1, Math.ceil(filteredCodes.length / state.itemsPerPage));
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    updateGallery();
}

function clearGallery() {
    const filteredCodes = getFilteredCodes();
    if (!filteredCodes.length) return;

    showModal(
        'Clear Codes',
        state.currentFilter === 'all'
            ? 'Are you sure you want to clear all saved codes?'
            : `Are you sure you want to clear all ${state.currentFilter.toUpperCase()} codes?`,
        'Clear',
        'Cancel',
        () => {
            if (state.currentFilter === 'all') state.savedCodes = [];
            else state.savedCodes = state.savedCodes.filter(item => item.type !== state.currentFilter);
            updateStorage();
            state.currentPage = 1;
            updateGallery();
            hideModal();
        },
        hideModal
    );
}

function filterGallery(type) {
    state.currentFilter = type;
    state.currentPage = 1;
    $$('.filter-button').forEach(btn => btn.classList.remove('active'));
    $(`.filter-button[data-filter="${type}"]`)?.classList.add('active');
    updateGallery();
}

function toggleSavedVisibility() {
    const checked = $('#toggle-saved')?.checked;
    const show = !!checked;
    // Use the hidden class for consistent behavior
    $('#gallery-items')?.classList.toggle('hidden', !show);
    document.querySelector('.gallery-filters')?.classList.toggle('hidden', !show);
    document.querySelector('.gallery-clear-btn')?.classList.toggle('hidden', !show);
    document.querySelector('.pagination-container')?.classList.toggle('hidden', !show);
}

// Extension-specific: Load saved codes from chrome.storage
async function loadSavedCodes() {
    try {
        const result = await chrome.storage.local.get(['savedCodes']);
        if (result.savedCodes) {
            state.savedCodes = result.savedCodes;
            updateGallery();
        }
    } catch (error) {
        console.error('Error loading from chrome.storage:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('savedCodes');
        if (saved) {
            try {
                state.savedCodes = JSON.parse(saved);
                updateGallery();
            } catch (e) {
                console.error('Error parsing localStorage:', e);
            }
        }
    }
}

function downloadCode(format) {
    if (!state.generatedCanvas) return;
    const link = document.createElement('a');
    link.download = `${state.currentTab}_code.${format}`;
    link.href = state.generatedCanvas.toDataURL();
    link.click();
}

function toggleSettings() {
    state.settingsOpen = !state.settingsOpen;
    $('#settings-dropdown').classList.toggle('hidden', !state.settingsOpen);
    document.querySelector('.settings-icon').classList.toggle('spin', state.settingsOpen);
}

function toggleInfo() {
    const infoDropdown = $('#info-dropdown');
    const isHidden = infoDropdown.classList.contains('hidden');
    infoDropdown.classList.toggle('hidden', !isHidden);
}

function clearInput(type) {
    state.sharedText = '';
    $('#qr-text').value = '';
    $('#barcode-text').value = '';
    clearOutput();
    toggleClearIcon('qr'); toggleClearIcon('barcode');
}

function toggleClearIcon(type) {
    const input = $(`#${type}-text`);
    // Guard against missing elements
    if (!input || !input.parentElement) return;
    const icon = input.parentElement.querySelector('.clear-btn');
    if (!icon) return;
    // Only toggle 'hidden' class based on state.sharedText
    icon.classList.toggle('hidden', !state.sharedText.trim());
}

function toggleTheme() {
    state.isDark = !state.isDark;
    document.body.classList.toggle('dark', state.isDark);
    document.querySelector('.theme-icon').classList.toggle('rotated', state.isDark);
}

function toggleCaps() {
    state.enforceUppercase = !state.enforceUppercase;
    $('#caps-toggle').classList.toggle('active', state.enforceUppercase);
    state.currentTab === 'qr' ? generateQR() : generateBarcode();
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    for (const sc of shortcuts) {
        if (matchesShortcut(e, sc.key)) {
            if (sc.preventDefault) e.preventDefault();
            sc.handler(e);
            break;
        }
    }
});

// Debug helpers (available from console)
window.dumpSavedCodes = () => console.log('savedCodes:', state.savedCodes.slice());
window.getSavedCodes = () => state.savedCodes.slice();

// Auto-generation
document.addEventListener('DOMContentLoaded', async () => {
    renderShortcuts();
    // Load saved codes first
    await loadSavedCodes();
    
    // Input bindings
    $('#qr-text').addEventListener('input', e => {
        state.sharedText = e.target.value;
        if (state.currentTab === 'qr') generateQR();
        toggleClearIcon('qr'); toggleClearIcon('barcode');
    });
    $('#barcode-text').addEventListener('input', e => {
        state.sharedText = e.target.value;
        if (state.currentTab === 'barcode') generateBarcode();
        toggleClearIcon('barcode'); toggleClearIcon('qr');
    });

    // Settings bindings (grouped)
    const qrSizeInput = $('#qr-size');
    const qrSizeValue = $('#qr-size-value');
    if (qrSizeInput && qrSizeValue) {
        qrSizeInput.addEventListener('input', (e) => {
            qrSizeValue.textContent = e.target.value;
            generateQR();
        });
    }
    
    const barcodeWidthInput = $('#barcode-width');
    const barcodeWidthValue = $('#barcode-width-value');
    if (barcodeWidthInput && barcodeWidthValue) {
        barcodeWidthInput.addEventListener('input', (e) => {
            barcodeWidthValue.textContent = e.target.value;
            generateBarcode();
        });
    }
    
    const barcodeHeightInput = $('#barcode-height');
    const barcodeHeightValue = $('#barcode-height-value');
    if (barcodeHeightInput && barcodeHeightValue) {
        barcodeHeightInput.addEventListener('input', (e) => {
            barcodeHeightValue.textContent = e.target.value;
            generateBarcode();
        });
    }
    
    ['qr-color','qr-bg-color'].forEach(id => $(`#${id}`).addEventListener('input', generateQR));
    ['barcode-format'].forEach(id => $(`#${id}`).addEventListener('change', generateBarcode));
    ['barcode-color','barcode-bg-color'].forEach(id => $(`#${id}`).addEventListener('input', generateBarcode));

    // Initialize UI
    toggleClearIcon('qr'); toggleClearIcon('barcode');
    $('#qr-text').value = state.sharedText; $('#barcode-text').value = state.sharedText;
    if (state.sharedText.trim()) (state.currentTab === 'qr' ? generateQR() : generateBarcode());

    // Event listeners for controls (replacing inline handlers for CSP compliance)
    const capsToggle = $('#caps-toggle');
    if (capsToggle) capsToggle.addEventListener('click', toggleCaps);

    const themeToggle = $('#theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    const infoIcon = $('.info-icon');
    if (infoIcon) infoIcon.addEventListener('click', toggleInfo);

    const settingsToggle = $('#settings-toggle');
    if (settingsToggle) settingsToggle.addEventListener('click', toggleSettings);

    // Tab buttons
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    // Clear buttons
    $$('.clear-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-clear');
            if (type) clearInput(type);
        });
    });

    // Download buttons
    const downloadPngBtn = $('#download-png-btn');
    if (downloadPngBtn) downloadPngBtn.addEventListener('click', () => downloadCode('png'));

    const downloadSvgBtn = $('#download-svg-btn');
    if (downloadSvgBtn) downloadSvgBtn.addEventListener('click', () => downloadCode('svg'));

    // Gallery controls
    const toggleSaved = $('#toggle-saved');
    if (toggleSaved) toggleSaved.addEventListener('change', toggleSavedVisibility);

    $$('.filter-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            if (filter) filterGallery(filter);
        });
    });

    const clearGalleryBtn = $('#clear-gallery-btn');
    if (clearGalleryBtn) clearGalleryBtn.addEventListener('click', clearGallery);

    // Close settings when clicking outside
    document.addEventListener('click', e => {
        if (!e.target.closest('.settings-dropdown') && !e.target.closest('.settings-icon') && !e.target.closest('#settings-toggle')) {
            if (state.settingsOpen) toggleSettings();
        }
    });

    // Close info dropdown when clicking outside
    document.addEventListener('click', e => {
        const infoDropdown = document.querySelector('#info-dropdown');
        if (!infoDropdown) return;
        const clickedInsideInfo = e.target.closest('#info-dropdown') || e.target.closest('.info-icon');
        if (!clickedInsideInfo) {
            infoDropdown.classList.add('hidden');
        }
    });
});

