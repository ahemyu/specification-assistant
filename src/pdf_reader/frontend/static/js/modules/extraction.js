// Extraction Module
// Handles key extraction functionality (both Excel and manual modes)

import {
    excelTab,
    manualTab,
    excelTabContent,
    manualTabContent,
    excelFileInput,
    excelFileName,
    excelContextInput,
    extractExcelBtn,
    keysPreview,
    keysPreviewList,
    keyInput,
    contextInput,
    extractBtn,
    extractSpinner,
    extractStatus,
    extractionResults,
    uploadedFileIds,
    currentExtractionMode,
    uploadedTemplateId,
    uploadedTemplateKeys,
    extractionResultsData,
    setCurrentExtractionMode,
    setUploadedTemplateId,
    setUploadedTemplateKeys,
    setExtractionResultsData
} from './state.js';

import { openResultsCarousel } from './carousel.js';

// Show extraction status
function showExtractStatus(message, type) {
    extractStatus.textContent = message;
    extractStatus.className = `status ${type}`;
    extractStatus.style.display = 'block';
}

// Switch extraction tab (Excel vs Manual)
function switchTab(mode) {
    setCurrentExtractionMode(mode);

    if (mode === 'excel') {
        excelTab.classList.add('active');
        manualTab.classList.remove('active');
        excelTabContent.classList.add('active');
        manualTabContent.classList.remove('active');
    } else {
        manualTab.classList.add('active');
        excelTab.classList.remove('active');
        manualTabContent.classList.add('active');
        excelTabContent.classList.remove('active');
    }

    extractionResults.innerHTML = '';
    extractStatus.style.display = 'none';
}

// Display extraction results with download button (for Excel mode)
function displayExtractionResultsWithDownload(data, keyNames) {
    let resultsHTML = '<div class="extraction-results-container">';

    resultsHTML += `
        <div class="download-excel-section">
            <button class="download-excel-btn" id="downloadExcelBtn">
                Download Filled Excel
            </button>
        </div>
    `;

    resultsHTML += `
        <button class="view-results-btn" id="viewResultsExcelBtn">
            View Extraction Results
        </button>
    `;

    resultsHTML += '</div>';
    extractionResults.innerHTML = resultsHTML;

    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    if (downloadExcelBtn) {
        downloadExcelBtn.addEventListener('click', downloadFilledExcel);
    }

    const viewResultsExcelBtn = document.getElementById('viewResultsExcelBtn');
    if (viewResultsExcelBtn) {
        viewResultsExcelBtn.addEventListener('click', function() {
            openResultsCarousel(data, keyNames);
        });
    }
}

// Display extraction results (for manual mode)
function displayExtractionResults(data, keyNames) {
    let resultsHTML = '<div class="extraction-results-container">';

    resultsHTML += `
        <div class="download-excel-section">
            <button class="download-excel-btn" id="downloadManualExcelBtn">
                Download as Excel
            </button>
        </div>
    `;

    resultsHTML += `
        <button class="view-results-btn" id="viewResultsBtn">
            View Extraction Results
        </button>
    `;

    resultsHTML += '</div>';
    extractionResults.innerHTML = resultsHTML;

    const downloadManualExcelBtn = document.getElementById('downloadManualExcelBtn');
    if (downloadManualExcelBtn) {
        downloadManualExcelBtn.addEventListener('click', downloadExtractionExcel);
    }

    const viewResultsBtn = document.getElementById('viewResultsBtn');
    if (viewResultsBtn) {
        viewResultsBtn.addEventListener('click', function() {
            openResultsCarousel(data, keyNames);
        });
    }
}

// Download filled Excel template
async function downloadFilledExcel() {
    if (!uploadedTemplateId) {
        showExtractStatus('No Excel file available to download', 'error');
        return;
    }

    try {
        const response = await fetch(`/download-filled-excel/${uploadedTemplateId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to download Excel file');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'filled_template.xlsx';
        if (contentDisposition && contentDisposition.includes('filename=')) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showExtractStatus('Excel file downloaded successfully!', 'success');
    } catch (error) {
        showExtractStatus(`Error downloading Excel: ${error.message}`, 'error');
    }
}

// Download extraction results as Excel (manual mode)
async function downloadExtractionExcel() {
    if (!extractionResultsData) {
        showExtractStatus('No extraction results available to download', 'error');
        return;
    }

    try {
        const response = await fetch('/download-extraction-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ extraction_results: extractionResultsData })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'extracted_keys.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showExtractStatus('Excel file downloaded successfully', 'success');
    } catch (error) {
        showExtractStatus(`Error downloading Excel: ${error.message}`, 'error');
    }
}

// Handle Excel file upload
async function handleExcelUpload() {
    const file = excelFileInput.files[0];
    if (!file) {
        extractExcelBtn.disabled = true;
        excelFileName.textContent = '';
        keysPreview.style.display = 'none';
        return;
    }

    extractionResults.innerHTML = '';
    extractStatus.style.display = 'none';
    excelFileName.textContent = `Selected: ${file.name}`;

    const formData = new FormData();
    formData.append('file', file);

    try {
        showExtractStatus('Uploading Excel template...', 'info');
        const response = await fetch('/upload-excel-template', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUploadedTemplateId(data.template_id);
        setUploadedTemplateKeys(data.keys);

        keysPreviewList.innerHTML = `
            <ul>
                ${data.keys.map(key => `<li>${key}</li>`).join('')}
            </ul>
        `;
        keysPreview.style.display = 'block';
        extractExcelBtn.disabled = false;
        showExtractStatus(`Template uploaded successfully with ${data.total_keys} keys`, 'success');
    } catch (error) {
        showExtractStatus(`Error uploading template: ${error.message}`, 'error');
        extractExcelBtn.disabled = true;
    }
}

// Extract keys from Excel template
async function extractFromExcel() {
    if (!uploadedTemplateId || uploadedFileIds.length === 0) {
        showExtractStatus('Please upload both Excel template and PDF files', 'error');
        return;
    }

    const additionalContext = excelContextInput.value.trim();
    extractExcelBtn.disabled = true;
    extractSpinner.style.display = 'block';
    extractStatus.style.display = 'none';
    extractionResults.innerHTML = '';
    showExtractStatus('Extracting keys from template...', 'info');

    try {
        const response = await fetch('/extract-keys-from-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_id: uploadedTemplateId,
                file_ids: uploadedFileIds,
                additional_context: additionalContext || undefined
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        extractSpinner.style.display = 'none';
        showExtractStatus('Extraction complete! Review results below and download when ready.', 'success');
        displayExtractionResultsWithDownload(data, uploadedTemplateKeys);
    } catch (error) {
        extractSpinner.style.display = 'none';
        showExtractStatus(`Error: ${error.message}`, 'error');
    } finally {
        extractExcelBtn.disabled = false;
    }
}

// Extract keys manually
async function extractManually() {
    const keysText = keyInput.value.trim();
    if (!keysText || uploadedFileIds.length === 0) {
        showExtractStatus('Please enter at least one key to extract', 'error');
        return;
    }

    const keyNames = keysText.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    if (keyNames.length === 0) {
        showExtractStatus('Please enter at least one key to extract', 'error');
        return;
    }

    const additionalContext = contextInput.value.trim();
    extractBtn.disabled = true;
    extractSpinner.style.display = 'block';
    extractStatus.style.display = 'none';
    extractionResults.innerHTML = '';
    showExtractStatus('Extracting keys using AI...', 'info');

    try {
        const response = await fetch('/extract-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_ids: uploadedFileIds,
                key_names: keyNames,
                additional_context: additionalContext || undefined
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        extractSpinner.style.display = 'none';
        showExtractStatus(`Successfully extracted ${keyNames.length} key(s)`, 'success');
        setExtractionResultsData(data);
        displayExtractionResults(data, keyNames);
    } catch (error) {
        extractSpinner.style.display = 'none';
        showExtractStatus(`Error: ${error.message}`, 'error');
    } finally {
        extractBtn.disabled = false;
    }
}

// Initialize extraction event listeners
export function initExtraction() {
    excelTab.addEventListener('click', () => switchTab('excel'));
    manualTab.addEventListener('click', () => switchTab('manual'));
    excelFileInput.addEventListener('change', handleExcelUpload);
    extractExcelBtn.addEventListener('click', extractFromExcel);
    extractBtn.addEventListener('click', extractManually);
}
