const fileInput = document.getElementById('fileInput');
const selectedFilesDiv = document.getElementById('selectedFiles');
const uploadBtn = document.getElementById('uploadBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const spinner = document.getElementById('spinner');

const keyExtractionSection = document.getElementById('keyExtractionSection');
const keyInput = document.getElementById('keyInput');
const contextInput = document.getElementById('contextInput');
const extractBtn = document.getElementById('extractBtn');
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

fileInput.addEventListener('change', function() {
    const files = Array.from(this.files);
    if (files.length > 0) {
        uploadBtn.disabled = false;
        selectedFilesDiv.innerHTML = `
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
        showStatus(`Successfully processed ${data.processed.length} PDF(s)`, 'success');

        displayResults(data.processed);

        uploadedFileIds = data.processed.map(p => p.file_id);
        processedFiles = data.processed;

        if (uploadedFileIds.length > 0) {
            keyExtractionSection.style.display = 'block';
            keyExtractionSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (data.failed.length > 0) {
            showStatus(`Failed to process: ${data.failed.join(', ')}`, 'error');
        }

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
