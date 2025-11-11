// Summary Module
// Handles the summary view that displays completed extraction results

import {
    extractionSetupView,
    extractionSummaryView,
    summaryTableBody,
    summaryKeyCount,
    extractMoreKeysBtn,
    downloadSummaryBtn,
    reviewedKeys,
    extractionResultsData,
    carouselKeyNames,
    setCurrentExtractionState,
    setReviewedKeys
} from './state.js';

import { openResultsCarousel, getReviewedResults, downloadReviewedResults } from './carousel.js';
import { resetExtractionView } from './extraction.js';

// Show the summary view (hide setup view)
export function showSummaryView() {
    extractionSetupView.style.display = 'none';
    extractionSummaryView.style.display = 'block';
    setCurrentExtractionState('summary');

    // Populate the summary table
    populateSummaryTable();
}

// Show the setup view (hide summary view)
export function showSetupView() {
    extractionSummaryView.style.display = 'none';
    extractionSetupView.style.display = 'block';
    setCurrentExtractionState('setup');
}

// Populate the summary table with reviewed extraction results
function populateSummaryTable() {
    if (!summaryTableBody || !extractionResultsData) return;

    // Get the reviewed results
    const results = getReviewedResults();
    const keyCount = Object.keys(results).length;

    // Update key count
    if (summaryKeyCount) {
        summaryKeyCount.textContent = keyCount;
    }

    // Clear existing rows
    summaryTableBody.innerHTML = '';

    // Sort keys by name for consistent display
    const sortedKeys = Object.keys(results).sort();

    // Create table rows
    sortedKeys.forEach((keyName) => {
        const keyData = results[keyName];
        const originalData = extractionResultsData[keyName];

        const row = document.createElement('tr');
        row.className = 'summary-row';

        // Key Name column
        const keyNameCell = document.createElement('td');
        keyNameCell.className = 'key-name-cell';
        keyNameCell.textContent = keyName;
        row.appendChild(keyNameCell);

        // Value column
        const valueCell = document.createElement('td');
        valueCell.className = 'value-cell';
        const value = keyData.key_value || 'Not found';
        valueCell.textContent = value;
        if (!keyData.key_value) {
            valueCell.classList.add('value-not-found');
        }
        row.appendChild(valueCell);

        // Status column
        const statusCell = document.createElement('td');
        statusCell.className = 'status-cell';
        const statusBadge = createStatusBadge(reviewedKeys[keyName]?.status || 'pending');
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // Source column
        const sourceCell = document.createElement('td');
        sourceCell.className = 'source-cell';
        const sourceText = getSourceSummary(originalData);
        sourceCell.textContent = sourceText;
        row.appendChild(sourceCell);

        // Actions column
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';
        const reviewBtn = document.createElement('button');
        reviewBtn.className = 'review-btn';
        reviewBtn.textContent = 'Review';
        reviewBtn.title = 'Review this key in detail';
        reviewBtn.addEventListener('click', () => {
            // Set this key back to pending state since user wants to review it again
            const updatedKeys = { ...reviewedKeys };
            if (updatedKeys[keyName]) {
                updatedKeys[keyName] = {
                    ...updatedKeys[keyName],
                    status: 'pending'
                };
                setReviewedKeys(updatedKeys);
            }

            // Re-open carousel at this specific key
            const keyIndex = carouselKeyNames.indexOf(keyName);
            if (keyIndex !== -1) {
                openResultsCarousel(extractionResultsData, carouselKeyNames, keyIndex);
            }
        });
        actionsCell.appendChild(reviewBtn);
        row.appendChild(actionsCell);

        summaryTableBody.appendChild(row);
    });
}

// Create a status badge element
function createStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = `status-badge status-${status}`;

    switch (status) {
        case 'accepted':
            badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Accepted';
            break;
        case 'edited':
            badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10H3.5L9.5 4L8 2.5L2 8.5V10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Edited';
            break;
        case 'pending':
        default:
            badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/></svg> Pending';
            break;
    }

    return badge;
}

// Get a summary of source locations for display
function getSourceSummary(keyData) {
    if (!keyData || !keyData.source_locations || keyData.source_locations.length === 0) {
        return 'No source';
    }

    const locations = keyData.source_locations;
    if (locations.length === 1) {
        const loc = locations[0];
        const pages = loc.page_numbers || [];
        if (pages.length === 0) {
            return loc.pdf_filename;
        } else if (pages.length === 1) {
            return `${loc.pdf_filename} p${pages[0]}`;
        } else {
            return `${loc.pdf_filename} p${pages[0]}...`;
        }
    } else {
        return `${locations.length} sources`;
    }
}

// Handle "Start New Extraction" button click
function handleExtractMoreKeys() {
    // Reset the extraction view to virgin state
    resetExtractionView();

    // Set state back to setup
    setCurrentExtractionState('setup');

    // Show setup view
    showSetupView();
}

// Handle "Download Results" button click from summary view
function handleDownloadSummary() {
    const reviewedResults = getReviewedResults();
    if (Object.keys(reviewedResults).length > 0) {
        downloadReviewedResults(reviewedResults);
    }
}

// Initialize the summary module
export function initializeSummary() {
    // Attach event listeners
    if (extractMoreKeysBtn) {
        extractMoreKeysBtn.addEventListener('click', handleExtractMoreKeys);
    }

    if (downloadSummaryBtn) {
        downloadSummaryBtn.addEventListener('click', handleDownloadSummary);
    }

    console.log('Summary module initialized');
}
