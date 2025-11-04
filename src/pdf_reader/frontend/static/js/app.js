// Main Application Entry Point
// This file imports and initializes all modules

import { initNavigation } from './modules/navigation.js';
import { initUpload } from './modules/upload.js';
import { initChat } from './modules/chat.js';
import { initExtraction } from './modules/extraction.js';
import { initCarousel } from './modules/carousel.js';
import { initPdfViewer } from './modules/pdfviewer.js';
import { initModals } from './modules/modals.js';
import { loadChatHistory, loadPdfState } from './modules/storage.js';

// Initialize application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    // Load persisted state
    loadChatHistory();
    loadPdfState();

    // Initialize all modules
    initNavigation();
    initUpload();
    initChat();
    initExtraction();
    initCarousel();
    initPdfViewer();
    initModals();
});
