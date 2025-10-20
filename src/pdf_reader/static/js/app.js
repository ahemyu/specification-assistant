const fileInput = document.getElementById('fileInput');
const selectedFilesDiv = document.getElementById('selectedFiles');
const uploadBtn = document.getElementById('uploadBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const spinner = document.getElementById('spinner');

// Main view elements
const uploadView = document.getElementById('uploadView');
const extractView = document.getElementById('extractView');
const qaView = document.getElementById('qaView');
const mainTabButtons = document.querySelectorAll('.main-tab-btn');

// Q&A elements
const questionInput = document.getElementById('questionInput');
const askBtn = document.getElementById('askBtn');
const qaSpinner = document.getElementById('qaSpinner');
const qaStatus = document.getElementById('qaStatus');
const qaResults = document.getElementById('qaResults');

// Tab elements
const excelTab = document.getElementById('excelTab');
const manualTab = document.getElementById('manualTab');
const excelTabContent = document.getElementById('excelTabContent');
const manualTabContent = document.getElementById('manualTabContent');

// Excel template elements
const excelFileInput = document.getElementById('excelFileInput');
const excelFileName = document.getElementById('excelFileName');
const excelContextInput = document.getElementById('excelContextInput');
const extractExcelBtn = document.getElementById('extractExcelBtn');
const keysPreview = document.getElementById('keysPreview');
const keysPreviewList = document.getElementById('keysPreviewList');

// Manual input elements
const keyInput = document.getElementById('keyInput');
const contextInput = document.getElementById('contextInput');
const extractBtn = document.getElementById('extractBtn');

// Shared elements
const extractSpinner = document.getElementById('extractSpinner');
const extractStatus = document.getElementById('extractStatus');
const extractionResults = document.getElementById('extractionResults');

// Modal elements
const previewModal = document.getElementById('previewModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const previewFilename = document.getElementById('previewFilename');
const previewSize = document.getElementById('previewSize');
const previewContent = document.getElementById('previewContent');

let uploadedFileIds = [];
let processedFiles = [];
let extractionResultsData = null;
let currentExtractionMode = 'excel'; // 'excel' or 'manual'
let uploadedTemplateId = null;
let uploadedTemplateKeys = [];
let allUploadedFiles = []; // Track all files across multiple uploads

// Main tab switching
mainTabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        switchMainTab(targetTab);
    });
});

function switchMainTab(tabName) {
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

function enableMainTabs() {
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

fileInput.addEventListener('change', function() {
    const files = Array.from(this.files);
    if (files.length > 0) {
        uploadBtn.disabled = false;
        const fileCountText = allUploadedFiles.length > 0
            ? `<p style="margin-bottom: 12px; color: #59BDB9; font-weight: 600;">Adding ${files.length} new file(s) to ${allUploadedFiles.length} existing file(s)</p>`
            : '';
        selectedFilesDiv.innerHTML = `
            ${fileCountText}
            <ul>
                ${files.map(f => `<li>${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)</li>`).join('')}
            </ul>
        `;
        selectedFilesDiv.style.display = 'block';
    } else {
        uploadBtn.disabled = true;
        selectedFilesDiv.style.display = 'none';
    }
});

uploadBtn.addEventListener('click', async function() {
    const files = fileInput.files;
    if (files.length === 0) return;

    const formData = new FormData();
    for (let file of files) {
        formData.append('files', file);
    }

    uploadBtn.disabled = true;
    spinner.style.display = 'block';
    statusDiv.style.display = 'none';
    resultsDiv.innerHTML = '';

    showStatus('Processing PDFs...', 'info');

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        spinner.style.display = 'none';

        // Add new files to the cumulative list
        uploadedFileIds.push(...data.processed.map(p => p.file_id));
        processedFiles.push(...data.processed);
        allUploadedFiles.push(...data.processed);

        showStatus(`Successfully processed ${data.processed.length} PDF(s). Total PDFs: ${uploadedFileIds.length}`, 'success');

        displayResults(allUploadedFiles);

        // Enable Extract Keys and Ask Questions tabs after first successful upload
        if (uploadedFileIds.length > 0) {
            enableMainTabs();
        }

        if (data.failed.length > 0) {
            showStatus(`Failed to process: ${data.failed.join(', ')}`, 'error');
        }

        // Reset file input to allow uploading more files
        fileInput.value = '';

    } catch (error) {
        spinner.style.display = 'none';
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        uploadBtn.disabled = false;
    }
});

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
}

function displayResults(results) {
    resultsDiv.innerHTML = results.map(result => `
        <div class="result-item">
            <h3>${result.filename}</h3>
            <p><strong>Pages:</strong> ${result.total_pages}</p>
            <p><strong>File ID:</strong> ${result.file_id}</p>
            <div class="result-actions">
                <button class="preview-btn" onclick="openPreview('${result.file_id}', '${result.filename}')">Preview Text</button>
                <a href="/download/${result.file_id}" class="download-btn" download>Download Text File</a>
            </div>
        </div>
    `).join('');
}

// Tab switching functionality
excelTab.addEventListener('click', function() {
    switchTab('excel');
});

manualTab.addEventListener('click', function() {
    switchTab('manual');
});

function switchTab(mode) {
    currentExtractionMode = mode;

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

    // Clear results when switching tabs
    extractionResults.innerHTML = '';
    extractStatus.style.display = 'none';
}

// Excel file upload handling
excelFileInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) {
        extractExcelBtn.disabled = true;
        excelFileName.textContent = '';
        keysPreview.style.display = 'none';
        return;
    }

    // Clear previous results
    extractionResults.innerHTML = '';
    extractStatus.style.display = 'none';

    excelFileName.textContent = `Selected: ${file.name}`;

    // Upload the Excel template
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

        uploadedTemplateId = data.template_id;
        uploadedTemplateKeys = data.keys;

        // Show keys preview
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
});

// Excel extraction
extractExcelBtn.addEventListener('click', async function() {
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
            headers: {
                'Content-Type': 'application/json'
            },
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

        // Get extraction results as JSON (same format as manual mode)
        const data = await response.json();

        extractSpinner.style.display = 'none';
        showExtractStatus('Extraction complete! Review results below and download when ready.', 'success');

        // Display results with download button
        // For single key, unwrap the result to match the format expected by displayExtractionResults
        const dataToDisplay = uploadedTemplateKeys.length === 1
            ? data[uploadedTemplateKeys[0]]
            : data;
        displayExtractionResultsWithDownload(dataToDisplay, uploadedTemplateKeys);

    } catch (error) {
        extractSpinner.style.display = 'none';
        showExtractStatus(`Error: ${error.message}`, 'error');
    } finally {
        extractExcelBtn.disabled = false;
    }
});

// Q&A functionality
// Function to submit question
async function submitQuestion() {
    const question = questionInput.value.trim();
    if (!question || uploadedFileIds.length === 0) {
        showQAStatus('Please enter a question', 'error');
        return;
    }

    askBtn.disabled = true;
    qaSpinner.style.display = 'block';
    qaStatus.style.display = 'none';
    qaResults.innerHTML = '';

    showQAStatus('Processing your question...', 'info');

    try {
        const response = await fetch('/ask-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_ids: uploadedFileIds,
                question: question
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        qaSpinner.style.display = 'none';
        showQAStatus('Answer generated successfully', 'success');

        displayQAResult(data);

    } catch (error) {
        qaSpinner.style.display = 'none';
        showQAStatus(`Error: ${error.message}`, 'error');
    } finally {
        askBtn.disabled = false;
    }
}

// Submit question on button click
askBtn.addEventListener('click', submitQuestion);

// Submit question on Enter key (but allow Shift+Enter for new line)
questionInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitQuestion();
    }
});

function showQAStatus(message, type) {
    qaStatus.textContent = message;
    qaStatus.className = `status ${type}`;
    qaStatus.style.display = 'block';
}

function displayQAResult(data) {
    const docText = data.document_count === 1 ? 'document' : 'documents';
    qaResults.innerHTML = `
        <div class="qa-answer-item">
            <div class="qa-question">${data.question}</div>
            <div class="qa-answer">${data.answer}</div>
            <div class="qa-meta">Based on ${data.document_count} ${docText}</div>
        </div>
    `;
}

extractBtn.addEventListener('click', async function() {
    const keysText = keyInput.value.trim();
    if (!keysText || uploadedFileIds.length === 0) {
        showExtractStatus('Please enter at least one key to extract', 'error');
        return;
    }

    const keyNames = keysText.split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 0);

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
        const endpoint = keyNames.length === 1 ? '/extract-key' : '/extract-multiple-keys';
        const requestBody = keyNames.length === 1
            ? {
                file_ids: uploadedFileIds,
                key_name: keyNames[0],
                additional_context: additionalContext || undefined
              }
            : {
                file_ids: uploadedFileIds,
                key_names: keyNames,
                additional_context: additionalContext || undefined
              };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        extractSpinner.style.display = 'none';
        showExtractStatus(`Successfully extracted ${keyNames.length} key(s)`, 'success');

        // Store extraction results for Excel download
        // For single key, wrap result in a dictionary with the key name
        extractionResultsData = keyNames.length === 1 ? {[keyNames[0]]: data} : data;

        displayExtractionResults(data, keyNames);

    } catch (error) {
        extractSpinner.style.display = 'none';
        showExtractStatus(`Error: ${error.message}`, 'error');
    } finally {
        extractBtn.disabled = false;
    }
});

function showExtractStatus(message, type) {
    extractStatus.textContent = message;
    extractStatus.className = `status ${type}`;
    extractStatus.style.display = 'block';
}

function displayExtractionResults(data, keyNames) {
    let resultsHTML = '<div class="extraction-results-container">';

    // Show extraction results for manual mode (display-only, no download)

    if (keyNames.length === 1) {
        resultsHTML += formatSingleKeyResult(keyNames[0], data);
    } else {
        for (const keyName of keyNames) {
            if (data[keyName]) {
                resultsHTML += formatSingleKeyResult(keyName, data[keyName]);
            }
        }
    }

    resultsHTML += '</div>';
    extractionResults.innerHTML = resultsHTML;
}

function displayExtractionResultsWithDownload(data, keyNames) {
    let resultsHTML = '<div class="extraction-results-container">';

    // Add download button at the top for Excel template mode
    resultsHTML += `
        <div class="download-excel-section">
            <button class="download-excel-btn" onclick="downloadFilledExcel()">
                Download Filled Excel
            </button>
        </div>
    `;

    // Show extraction results
    if (keyNames.length === 1) {
        resultsHTML += formatSingleKeyResult(keyNames[0], data);
    } else {
        for (const keyName of keyNames) {
            if (data[keyName]) {
                resultsHTML += formatSingleKeyResult(keyName, data[keyName]);
            }
        }
    }

    resultsHTML += '</div>';
    extractionResults.innerHTML = resultsHTML;
}

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

        // Download the filled Excel file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Extract filename from response headers or use default
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

function formatSingleKeyResult(keyName, result) {
    const value = result.key_value || 'Not found';
    const description = result.description || 'No description available';
    const locations = result.source_locations || [];

    let locationsHTML = '';
    if (locations.length > 0) {
        locationsHTML = '<div class="source-locations"><strong>Found in:</strong><ul>';
        for (const loc of locations) {
            const pages = loc.page_numbers.join(', ');
            locationsHTML += `<li>${loc.pdf_filename} - Page(s): ${pages}</li>`;
        }
        locationsHTML += '</ul></div>';
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

// Modal functions
async function openPreview(fileId, originalFilename) {
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

        // Format file size
        const sizeKB = (data.size / 1024).toFixed(2);
        previewSize.textContent = `${sizeKB} KB`;

        // Display content
        previewContent.textContent = data.content;

    } catch (error) {
        previewContent.innerHTML = `<div class="preview-error">Error loading preview: ${error.message}</div>`;
    }
}

function closePreviewModal() {
    previewModal.classList.remove('show');
}

// Modal event listeners
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

// Download extraction results as Excel
async function downloadExtractionExcel() {
    if (!extractionResultsData) {
        showExtractStatus('No extraction results available to download', 'error');
        return;
    }

    try {
        const response = await fetch('/download-extraction-excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                extraction_results: extractionResultsData
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        // Create a blob from the response
        const blob = await response.blob();

        // Create a temporary download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'extracted_keys.xlsx';
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showExtractStatus('Excel file downloaded successfully', 'success');

    } catch (error) {
        showExtractStatus(`Error downloading Excel: ${error.message}`, 'error');
    }
}
