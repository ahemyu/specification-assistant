const fileInput = document.getElementById('fileInput');
const selectedFilesDiv = document.getElementById('selectedFiles');
const uploadBtn = document.getElementById('uploadBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const spinner = document.getElementById('spinner');

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
            <a href="/download/${result.file_id}" class="download-btn" download>Download Text File</a>
        </div>
    `).join('');
}
