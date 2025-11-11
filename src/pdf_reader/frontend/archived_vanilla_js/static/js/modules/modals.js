// Modals Module
// Handles modal dialogs (text preview, etc.)

import {
    previewModal,
    closeModal,
    modalTitle,
    previewFilename,
    previewSize,
    previewContent
} from './state.js';

// Open text preview modal
export async function openPreview(fileId, originalFilename) {
    previewModal.classList.add('show');
    modalTitle.textContent = `Preview: ${originalFilename}`;
    previewFilename.textContent = originalFilename;
    previewContent.innerHTML = '<div class="preview-loading">Loading text content...</div>';
    previewSize.textContent = '';

    try {
        const response = await fetch(`/preview/${fileId}`);
        if (!response.ok) {
            throw new Error(`Failed to load preview: ${response.status}`);
        }

        const data = await response.json();
        const sizeKB = (data.size / 1024).toFixed(2);
        previewSize.textContent = `${sizeKB} KB`;
        previewContent.textContent = data.content;
    } catch (error) {
        previewContent.innerHTML = `<div class="preview-error">Error loading preview: ${error.message}</div>`;
    }
}

// Close preview modal
function closePreviewModal() {
    previewModal.classList.remove('show');
}

// Initialize modal event listeners
export function initModals() {
    closeModal.addEventListener('click', closePreviewModal);

    previewModal.addEventListener('click', function(e) {
        if (e.target === previewModal) {
            closePreviewModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && previewModal.classList.contains('show')) {
            closePreviewModal();
        }
    });
}

// Make openPreview globally available for onclick handlers
window.openPreview = openPreview;
