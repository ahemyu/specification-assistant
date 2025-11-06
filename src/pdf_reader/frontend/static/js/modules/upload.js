// Upload Module
// Handles PDF file upload and management

import {
    fileInput,
    selectedFilesDiv,
    uploadBtn,
    resultsDiv,
    resultsHeader,
    deleteAllBtn,
    spinner,
    uploadedFileIds,
    processedFiles,
    allUploadedFiles,
    setUploadedFileIds,
    setProcessedFiles,
    setAllUploadedFiles,
    setCurrentExtractionState,
    setReviewedKeys,
    setExtractionResultsData
} from './state.js';

import { showStatus, savePdfState, clearPdfState, clearChatHistory } from './storage.js';
import { enableMainTabs, switchMainTab } from './navigation.js';
import { showSetupView } from './summary.js';

// Display results
export function displayResults(results) {
    if (results.length > 0) {
        resultsHeader.style.display = 'flex';
    } else {
        resultsHeader.style.display = 'none';
    }

    resultsDiv.innerHTML = results.map(result => `
        <div class="result-item" data-file-id="${result.file_id}">
            <h3>${result.filename}</h3>
            <p><strong>Pages:</strong> ${result.total_pages}</p>
            <p><strong>File ID:</strong> ${result.file_id}</p>
            <div class="result-actions">
                <button class="preview-btn" onclick="window.openPreview('${result.file_id}', '${result.filename}')">Preview Text</button>
                <a href="/download/${result.file_id}" class="download-btn" download>Download Text File</a>
                <button class="delete-btn" onclick="window.deleteFile('${result.file_id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete a file
export async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }

    try {
        const response = await fetch(`/delete-pdf/${fileId}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`Failed to delete file: ${response.status}`);
        }

        setUploadedFileIds(uploadedFileIds.filter(id => id !== fileId));
        setProcessedFiles(processedFiles.filter(f => f.file_id !== fileId));
        setAllUploadedFiles(allUploadedFiles.filter(f => f.file_id !== fileId));

        savePdfState();
        displayResults(allUploadedFiles);
        clearChatHistory();

        if (allUploadedFiles.length === 0) {
            showStatus('All files deleted', 'info');
            const extractTab = document.querySelector('[data-tab="extract"]');
            const qaTab = document.querySelector('[data-tab="qa"]');
            if (extractTab) extractTab.classList.add('disabled');
            if (qaTab) qaTab.classList.add('disabled');
            switchMainTab('upload');
        } else {
            showStatus(`File deleted. ${allUploadedFiles.length} file(s) remaining`, 'success');
        }
    } catch (error) {
        showStatus(`Error deleting file: ${error.message}`, 'error');
    }
}

// Delete all files
async function deleteAllFiles() {
    if (allUploadedFiles.length === 0) {
        showStatus('No files to delete', 'info');
        return;
    }

    if (!confirm(`Are you sure you want to delete all ${allUploadedFiles.length} file(s)? This action cannot be undone.`)) {
        return;
    }

    const fileCount = allUploadedFiles.length;
    const fileIds = [...uploadedFileIds];

    try {
        const deletePromises = fileIds.map(fileId =>
            fetch(`/delete-pdf/${fileId}`, { method: 'DELETE' })
        );
        const results = await Promise.all(deletePromises);
        const failedDeletions = results.filter(r => !r.ok);

        if (failedDeletions.length > 0) {
            throw new Error(`Failed to delete ${failedDeletions.length} file(s)`);
        }

        setUploadedFileIds([]);
        setProcessedFiles([]);
        setAllUploadedFiles([]);
        clearPdfState();
        clearChatHistory();

        resultsDiv.innerHTML = '';
        resultsHeader.style.display = 'none';

        const extractTab = document.querySelector('[data-tab="extract"]');
        const qaTab = document.querySelector('[data-tab="qa"]');
        if (extractTab) extractTab.classList.add('disabled');
        if (qaTab) qaTab.classList.add('disabled');

        switchMainTab('upload');
        showStatus(`Successfully deleted all ${fileCount} file(s)`, 'success');
    } catch (error) {
        showStatus(`Error deleting files: ${error.message}`, 'error');
        // Reload PDF state in case of partial failure
        const { loadPdfState } = await import('./storage.js');
        loadPdfState();
    }
}

// Handle file upload
async function handleUpload() {
    const files = fileInput.files;
    if (files.length === 0) return;

    const formData = new FormData();
    for (let file of files) {
        formData.append('files', file);
    }

    uploadBtn.disabled = true;
    spinner.style.display = 'block';
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
        clearChatHistory();

        // Reset extraction state when new PDFs are uploaded
        setCurrentExtractionState('setup');
        setReviewedKeys({});
        setExtractionResultsData(null);
        showSetupView();

        uploadedFileIds.push(...data.processed.map(p => p.file_id));
        processedFiles.push(...data.processed);
        allUploadedFiles.push(...data.processed);

        showStatus(`Successfully processed ${data.processed.length} PDF(s). Total PDFs: ${uploadedFileIds.length}`, 'success');
        displayResults(allUploadedFiles);
        savePdfState();

        if (uploadedFileIds.length > 0) {
            enableMainTabs();
        }

        if (data.failed.length > 0) {
            showStatus(`Failed to process: ${data.failed.join(', ')}`, 'error');
        }

        fileInput.value = '';
    } catch (error) {
        spinner.style.display = 'none';
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        uploadBtn.disabled = false;
    }
}

// Initialize upload event listeners
export function initUpload() {
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

    uploadBtn.addEventListener('click', handleUpload);
    deleteAllBtn.addEventListener('click', deleteAllFiles);
}

// Make functions globally available for onclick handlers
window.deleteFile = deleteFile;
