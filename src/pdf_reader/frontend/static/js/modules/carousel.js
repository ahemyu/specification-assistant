// Carousel Module
// Handles the extraction results carousel viewer

import {
    resultsCarouselModal,
    closeCarousel,
    carouselCard,
    prevCardBtn,
    nextCardBtn,
    currentCardNumber,
    totalCards,
    carouselResults,
    carouselKeyNames,
    currentCardIndex,
    currentRenderTask,
    pdfCache,
    setCarouselResults,
    setCarouselKeyNames,
    setCurrentCardIndex,
    setCurrentRenderTask,
    setPdfCache
} from './state.js';

import { loadPdfForResult, showNoPdfReference } from './pdfviewer.js';

// Format a single key result for display
function formatSingleKeyResult(keyName, result) {
    const value = (result && result.key_value) ?? 'Not found';
    const description = (result && result.description) ?? 'No description available';
    const locations = (result && result.source_locations) || [];

    let locationsHTML = '';
    if (locations.length > 0) {
        locationsHTML = '<div class="source-locations"><strong>References:</strong><div class="reference-buttons">';
        for (let i = 0; i < locations.length; i++) {
            const loc = locations[i];
            const pages = (loc.page_numbers || []).join(', ');
            const refData = JSON.stringify({
                filename: loc.pdf_filename,
                pages: loc.page_numbers || []
            }).replace(/"/g, '&quot;');
            locationsHTML += `<button class="reference-btn" data-reference="${refData}" data-ref-index="${i}">
                ${loc.pdf_filename} - p.${pages}
            </button>`;
        }
        locationsHTML += '</div></div>';
    }

    return `
        <div class="extraction-result-item">
            <h3 class="key-name">${keyName}</h3>
            <div class="key-value">
                <strong>Value:</strong> <span class="${value === 'Not found' ? 'not-found' : 'found'}">${value}</span>
            </div>
            <div class="key-description">
                <strong>Description:</strong> ${description}
            </div>
            ${locationsHTML}
        </div>
    `;
}

// Open results carousel
export function openResultsCarousel(data, keyNames) {
    setCarouselResults(data);
    setCarouselKeyNames(keyNames);
    setCurrentCardIndex(0);

    totalCards.textContent = keyNames.length;
    showCarouselCard(0);
    updateCarouselNavButtons();

    resultsCarouselModal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Auto-load PDF viewer for first card
    const firstKeyName = keyNames[0];
    const firstResult = data[firstKeyName];
    loadPdfForResult(firstResult);
}

// Show specific carousel card
function showCarouselCard(index) {
    if (index < 0 || index >= carouselKeyNames.length) return;

    setCurrentCardIndex(index);
    const keyName = carouselKeyNames[index];
    const result = carouselResults[keyName];

    carouselCard.innerHTML = formatSingleKeyResult(keyName, result);
    currentCardNumber.textContent = index + 1;
    updateCarouselNavButtons();

    // Auto-load PDF for the new card
    loadPdfForResult(result);
}

// Update navigation buttons state
function updateCarouselNavButtons() {
    prevCardBtn.disabled = currentCardIndex === 0;
    nextCardBtn.disabled = currentCardIndex === carouselKeyNames.length - 1;
}

// Navigate to next card
function nextCard() {
    if (currentCardIndex < carouselKeyNames.length - 1) {
        showCarouselCard(currentCardIndex + 1);
    }
}

// Navigate to previous card
function prevCard() {
    if (currentCardIndex > 0) {
        showCarouselCard(currentCardIndex - 1);
    }
}

// Close results carousel
function closeResultsCarousel() {
    resultsCarouselModal.classList.remove('show');
    document.body.style.overflow = '';

    // Cancel any ongoing render task
    if (currentRenderTask) {
        currentRenderTask.cancel();
        setCurrentRenderTask(null);
    }

    // Clear PDF viewer state
    showNoPdfReference();

    // Clear PDF cache to free memory
    setPdfCache({});
}

// Initialize carousel event listeners
export function initCarousel() {
    closeCarousel.addEventListener('click', closeResultsCarousel);
    prevCardBtn.addEventListener('click', prevCard);
    nextCardBtn.addEventListener('click', nextCard);

    // Close on background click
    resultsCarouselModal.addEventListener('click', function(e) {
        if (e.target === resultsCarouselModal) {
            closeResultsCarousel();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (resultsCarouselModal.classList.contains('show')) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevCard();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextCard();
            } else if (e.key === 'Escape') {
                closeResultsCarousel();
            }
        }
    });
}
