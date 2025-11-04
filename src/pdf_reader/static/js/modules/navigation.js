// Navigation Module
// Handles tab switching and main navigation

import { mainTabButtons, uploadView, extractView, qaView } from './state.js';

// Main tab switching
export function switchMainTab(tabName) {
    const targetButton = document.querySelector(`[data-tab="${tabName}"]`);

    // Don't switch if the tab is disabled
    if (targetButton && targetButton.classList.contains('disabled')) {
        return;
    }

    // Remove active class from all tabs and views
    mainTabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));

    // Add active class to selected tab and view
    if (targetButton) {
        targetButton.classList.add('active');
    }

    // Show corresponding view
    if (tabName === 'upload') {
        uploadView.classList.add('active');
    } else if (tabName === 'extract') {
        extractView.classList.add('active');
    } else if (tabName === 'qa') {
        qaView.classList.add('active');
    }
}

export function enableMainTabs() {
    // Enable Extract Keys and Ask Questions tabs
    const extractTab = document.querySelector('[data-tab="extract"]');
    const qaTab = document.querySelector('[data-tab="qa"]');

    if (extractTab) {
        extractTab.classList.remove('disabled');
        extractTab.removeAttribute('data-tooltip');
    }
    if (qaTab) {
        qaTab.classList.remove('disabled');
        qaTab.removeAttribute('data-tooltip');
    }
}

// Initialize navigation event listeners
export function initNavigation() {
    mainTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchMainTab(targetTab);
        });
    });
}
