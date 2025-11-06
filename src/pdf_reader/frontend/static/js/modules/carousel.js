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
    reviewedKeys,
    isEditMode,
    setCarouselResults,
    setCarouselKeyNames,
    setCurrentCardIndex,
    setCurrentRenderTask,
    setPdfCache,
    setReviewedKeys,
    setIsEditMode
} from './state.js';

import { loadPdfForResult, showNoPdfReference } from './pdfviewer.js';

// Format a single key result for display
function formatSingleKeyResult(keyName, result) {
    const originalValue = (result && result.key_value) ?? 'Not found';
    const description = (result && result.description) ?? 'No description available';
    const locations = (result && result.source_locations) || [];

    // Get review state for this key
    const reviewState = reviewedKeys[keyName] || { status: 'pending', value: originalValue, originalValue };
    const displayValue = reviewState.value;
    const status = reviewState.status;

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

    // Status badge HTML
    let statusBadgeHTML = '';
    if (status === 'accepted') {
        statusBadgeHTML = '<span class="review-status-badge status-accepted">Accepted</span>';
    } else if (status === 'edited') {
        statusBadgeHTML = '<span class="review-status-badge status-edited">Edited</span>';
    } else {
        statusBadgeHTML = '<span class="review-status-badge status-pending">Pending Review</span>';
    }

    // Edit mode UI
    const editModeHTML = `
        <div class="edit-mode-container" style="display: none;">
            <div class="edit-value-input-container">
                <label for="editValueInput"><strong>Edit Value:</strong> <span style="color: #718096; font-weight: normal; font-size: 0.9em;">(Shift+Enter for new line)</span></label>
                <textarea id="editValueInput" class="edit-value-input" rows="3">${displayValue}</textarea>
            </div>
            <div class="edit-actions">
                <button class="save-edit-btn" data-key-name="${keyName}">Save (Enter)</button>
                <button class="cancel-edit-btn" data-key-name="${keyName}">Cancel (Esc)</button>
            </div>
        </div>
    `;

    // View mode UI with accept/edit buttons
    const viewModeHTML = `
        <div class="view-mode-container">
            <div class="key-value">
                <strong>Value:</strong> <span class="${displayValue === 'Not found' ? 'not-found' : 'found'}">${displayValue}</span>
            </div>
            <div class="review-actions">
                <button class="accept-btn" data-key-name="${keyName}" ${status !== 'pending' ? 'disabled' : ''}>
                    Accept (Enter)
                </button>
                <button class="edit-value-btn" data-key-name="${keyName}">
                    Edit (E)
                </button>
            </div>
        </div>
    `;

    return `
        <div class="extraction-result-item">
            <div class="key-header">
                <h3 class="key-name">${keyName}</h3>
                ${statusBadgeHTML}
            </div>
            ${viewModeHTML}
            ${editModeHTML}
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

    // Initialize review state for all keys
    const initialReviewedKeys = {};
    keyNames.forEach(keyName => {
        const result = data[keyName];
        const originalValue = (result && result.key_value) ?? 'Not found';
        initialReviewedKeys[keyName] = {
            status: 'pending',
            value: originalValue,
            originalValue: originalValue
        };
    });
    setReviewedKeys(initialReviewedKeys);
    setIsEditMode(false);

    totalCards.textContent = keyNames.length;
    showCarouselCard(0);
    updateCarouselNavButtons();
    updateCompletionBanner();

    resultsCarouselModal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Auto-load PDF viewer for first card
    const firstKeyName = keyNames[0];
    const firstResult = data[firstKeyName];
    loadPdfForResult(firstResult);
}

// Check if all keys have been reviewed
function checkAllKeysReviewed() {
    return carouselKeyNames.every(keyName => {
        const reviewState = reviewedKeys[keyName];
        return reviewState && reviewState.status !== 'pending';
    });
}

// Update completion banner visibility
function updateCompletionBanner() {
    const allReviewed = checkAllKeysReviewed();
    const banner = document.getElementById('completionBanner');
    const counter = document.querySelector('.carousel-counter');
    const keyboardHint = document.querySelector('.carousel-keyboard-hint');

    if (banner) {
        if (allReviewed) {
            banner.style.display = 'flex';
            if (counter) {
                counter.innerHTML = '<span>Review Complete</span><span style="margin-left: 4px;">✓</span>';
                counter.style.background = 'linear-gradient(135deg, #87BD25 0%, #6a971d 100%)';
            }
            if (keyboardHint) {
                keyboardHint.textContent = 'Press D to download, ESC to close';
            }
        } else {
            banner.style.display = 'none';
            if (counter) {
                counter.innerHTML = `<span id="currentCardNumber">${currentCardIndex + 1}</span> / <span id="totalCards">${carouselKeyNames.length}</span>`;
                counter.style.background = 'linear-gradient(135deg, #1C2C8C 0%, #59BDB9 100%)';
            }
            if (keyboardHint) {
                keyboardHint.textContent = 'Use arrow keys to navigate or press ESC to close';
            }
        }
    }
}

// Accept the current value
function acceptValue(keyName) {
    const updatedKeys = { ...reviewedKeys };
    updatedKeys[keyName] = {
        ...updatedKeys[keyName],
        status: 'accepted'
    };
    setReviewedKeys(updatedKeys);

    // Check if all keys are reviewed
    updateCompletionBanner();

    // Automatically move to next card if not at the end
    if (currentCardIndex < carouselKeyNames.length - 1) {
        nextCard();
    } else {
        // If at the end, just refresh the current card
        const currentKeyName = carouselKeyNames[currentCardIndex];
        const result = carouselResults[currentKeyName];
        carouselCard.innerHTML = formatSingleKeyResult(currentKeyName, result);
        attachCardEventListeners();
    }
}

// Enter edit mode
function enterEditMode(keyName) {
    setIsEditMode(true);
    const viewModeContainer = carouselCard.querySelector('.view-mode-container');
    const editModeContainer = carouselCard.querySelector('.edit-mode-container');

    if (viewModeContainer && editModeContainer) {
        viewModeContainer.style.display = 'none';
        editModeContainer.style.display = 'block';

        // Focus on the textarea
        const textarea = editModeContainer.querySelector('.edit-value-input');
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);

            // Add Enter key handler: Enter saves, Shift+Enter creates new line
            textarea.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent event from bubbling to global handler
                    saveEditedValue(keyName);
                }
            });
        }
    }
}

// Save edited value
function saveEditedValue(keyName) {
    const textarea = carouselCard.querySelector('.edit-value-input');
    if (!textarea) return;

    const newValue = textarea.value.trim();
    const updatedKeys = { ...reviewedKeys };
    updatedKeys[keyName] = {
        ...updatedKeys[keyName],
        value: newValue,
        status: 'edited'
    };
    setReviewedKeys(updatedKeys);
    setIsEditMode(false);

    // Check if all keys are reviewed
    updateCompletionBanner();

    // Automatically move to next card if not at the end
    if (currentCardIndex < carouselKeyNames.length - 1) {
        nextCard();
    } else {
        // If at the end, just refresh the current card
        const currentKeyName = carouselKeyNames[currentCardIndex];
        const result = carouselResults[currentKeyName];
        carouselCard.innerHTML = formatSingleKeyResult(currentKeyName, result);
        attachCardEventListeners();
    }
}

// Cancel edit mode
function cancelEdit(keyName) {
    setIsEditMode(false);
    const viewModeContainer = carouselCard.querySelector('.view-mode-container');
    const editModeContainer = carouselCard.querySelector('.edit-mode-container');

    if (viewModeContainer && editModeContainer) {
        viewModeContainer.style.display = 'block';
        editModeContainer.style.display = 'none';
    }
}

// Attach event listeners to card buttons
function attachCardEventListeners() {
    // Accept button
    const acceptBtn = carouselCard.querySelector('.accept-btn');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            const keyName = this.dataset.keyName;
            acceptValue(keyName);
        });
    }

    // Edit button
    const editBtn = carouselCard.querySelector('.edit-value-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            const keyName = this.dataset.keyName;
            enterEditMode(keyName);
        });
    }

    // Save button
    const saveBtn = carouselCard.querySelector('.save-edit-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const keyName = this.dataset.keyName;
            saveEditedValue(keyName);
        });
    }

    // Cancel button
    const cancelBtn = carouselCard.querySelector('.cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            const keyName = this.dataset.keyName;
            cancelEdit(keyName);
        });
    }
}

// Show specific carousel card
function showCarouselCard(index) {
    if (index < 0 || index >= carouselKeyNames.length) return;

    setCurrentCardIndex(index);
    setIsEditMode(false);
    const keyName = carouselKeyNames[index];
    const result = carouselResults[keyName];

    carouselCard.innerHTML = formatSingleKeyResult(keyName, result);
    updateCarouselNavButtons();

    // Update counter and completion banner
    updateCompletionBanner();

    // Attach event listeners to the new card
    attachCardEventListeners();

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

// Get reviewed extraction results with edited/accepted values
export function getReviewedResults() {
    const reviewedData = {};
    carouselKeyNames.forEach(keyName => {
        const originalResult = carouselResults[keyName];
        const reviewState = reviewedKeys[keyName];

        if (originalResult && reviewState) {
            // Create a copy of the original result with the reviewed value
            reviewedData[keyName] = {
                ...originalResult,
                key_value: reviewState.value
            };
        }
    });
    return reviewedData;
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

// Handle download from completion banner
function handleCompletionDownload() {
    const reviewedResults = getReviewedResults();

    // Trigger download based on current mode (excel or manual)
    if (Object.keys(reviewedResults).length > 0) {
        downloadReviewedResults(reviewedResults);
    }
}

// Download reviewed results
async function downloadReviewedResults(reviewedResults) {
    try {
        const response = await fetch('/download-extraction-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ extraction_results: reviewedResults })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to download Excel file');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reviewed_extraction_results.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        alert(`Error downloading results: ${error.message}`);
    }
}

// Initialize carousel event listeners
export function initCarousel() {
    closeCarousel.addEventListener('click', closeResultsCarousel);
    prevCardBtn.addEventListener('click', prevCard);
    nextCardBtn.addEventListener('click', nextCard);

    // Completion banner buttons
    const completionDownloadBtn = document.getElementById('completionDownloadBtn');
    const completionCloseBtn = document.getElementById('completionCloseBtn');

    if (completionDownloadBtn) {
        completionDownloadBtn.addEventListener('click', handleCompletionDownload);
    }

    if (completionCloseBtn) {
        completionCloseBtn.addEventListener('click', closeResultsCarousel);
    }

    // Close on background click
    resultsCarouselModal.addEventListener('click', function(e) {
        if (e.target === resultsCarouselModal) {
            closeResultsCarousel();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (resultsCarouselModal.classList.contains('show')) {
            // If we're in edit mode and typing in textarea, only handle Escape (Enter is handled in the textarea itself)
            if (isEditMode && e.target.classList.contains('edit-value-input')) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    const keyName = carouselKeyNames[currentCardIndex];
                    cancelEdit(keyName);
                }
                return; // Don't handle any other keys when in edit mode
            }

            // Global keyboard shortcuts (only when not in edit mode)
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevCard();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextCard();
            } else if (e.key === 'Escape') {
                if (isEditMode) {
                    e.preventDefault();
                    const keyName = carouselKeyNames[currentCardIndex];
                    cancelEdit(keyName);
                } else {
                    closeResultsCarousel();
                }
            } else if (e.key === 'Enter' && !isEditMode) {
                e.preventDefault();
                const keyName = carouselKeyNames[currentCardIndex];
                const reviewState = reviewedKeys[keyName];
                if (reviewState && reviewState.status === 'pending') {
                    acceptValue(keyName);
                }
            } else if ((e.key === 'e' || e.key === 'E') && !isEditMode) {
                e.preventDefault();
                const keyName = carouselKeyNames[currentCardIndex];
                enterEditMode(keyName);
            } else if ((e.key === 'd' || e.key === 'D') && !isEditMode) {
                // Only allow download if all keys are reviewed
                if (checkAllKeysReviewed()) {
                    e.preventDefault();
                    handleCompletionDownload();
                }
            }
        }
    });
}
