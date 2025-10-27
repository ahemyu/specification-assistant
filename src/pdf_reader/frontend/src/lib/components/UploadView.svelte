<script>
  import { uploadStore } from '$lib/stores/uploadStore';
  import { notification } from '$lib/stores/notificationStore';
  import { chatStore } from '$lib/stores/chatStore';
  import { carouselState } from '$lib/stores/extractionStore';
  import { uploadPdfs, deletePdf } from '$lib/api/client';
  import { formatFileSize } from '$lib/utils/helpers';
  import FileCard from './FileCard.svelte';

  let fileInput;
  let selectedFiles = $state([]);
  let isUploading = $state(false);
  let isDragging = $state(false);

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    selectedFiles = files;
  }

  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    const files = Array.from(e.dataTransfer?.files || []);
    selectedFiles = files;
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return;

    isUploading = true;
    notification.show('Uploading and processing PDFs...', 'info');

    try {
      const dt = new DataTransfer();
      selectedFiles.forEach(f => dt.items.add(f));

      const result = await uploadPdfs(dt.files);

      if (result.processed.length > 0) {
        uploadStore.addFiles(result.processed);
        // Clear chat history and extraction results when new files are uploaded
        chatStore.clear();
        carouselState.set({
          isOpen: false,
          currentIndex: 0,
          results: {},
          keyNames: []
        });
        notification.show(
          `Successfully processed ${result.processed.length} PDF(s)`,
          'success'
        );
      }

      if (result.failed.length > 0) {
        notification.show(
          `Failed to process: ${result.failed.join(', ')}`,
          'error'
        );
      }

      selectedFiles = [];
      if (fileInput) fileInput.value = '';
    } catch (error) {
      notification.show(`Upload failed: ${error.message}`, 'error');
    } finally {
      isUploading = false;
    }
  }

  async function handleDelete(fileId) {
    try {
      await deletePdf(fileId);
      uploadStore.removeFile(fileId);
      // Clear chat history when deleting files
      chatStore.clear();
      notification.show('File deleted successfully', 'success');
    } catch (error) {
      notification.show(`Delete failed: ${error.message}`, 'error');
    }
  }

  function clearAllFiles() {
    uploadStore.clear();
    // Clear chat history and extraction results when clearing all files
    chatStore.clear();
    carouselState.set({
      isOpen: false,
      currentIndex: 0,
      results: {},
      keyNames: []
    });
    notification.show('All files cleared', 'success');
  }
</script>

<div class="upload-view">
  <div class="upload-section">
    <label
      class="file-input-label"
      class:dragging={isDragging}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
    >
      <input
        bind:this={fileInput}
        type="file"
        accept=".pdf"
        multiple
        onchange={handleFileSelect}
        style="display: none;"
      />
      <div class="upload-icon">📁</div>
      <div class="upload-text">
        {#if isDragging}
          Drop PDF files here
        {:else}
          Click to select or drag & drop PDF files
        {/if}
      </div>
    </label>

    {#if selectedFiles.length > 0}
      <div class="selected-files">
        <h3>Selected Files ({selectedFiles.length})</h3>
        <ul>
          {#each selectedFiles as file}
            <li>{file.name} ({formatFileSize(file.size)} KB)</li>
          {/each}
        </ul>
      </div>
    {/if}

    <button
      class="upload-btn"
      onclick={handleUpload}
      disabled={isUploading || selectedFiles.length === 0}
    >
      {#if isUploading}
        <span class="spinner"></span>
        Processing...
      {:else}
        Upload {selectedFiles.length} PDF{selectedFiles.length !== 1 ? 's' : ''}
      {/if}
    </button>
  </div>

  {#if $uploadStore.processedFiles.length > 0}
    <div class="results-section">
      <div class="results-header">
        <h2>Uploaded PDFs ({$uploadStore.processedFiles.length})</h2>
        <button class="clear-all-btn" onclick={clearAllFiles}>
          Clear All
        </button>
      </div>
      <div class="results-grid">
        {#each $uploadStore.processedFiles as file (file.file_id)}
          <FileCard {file} onDelete={() => handleDelete(file.file_id)} />
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .upload-view {
    animation: fadeIn 0.3s ease-out;
  }

  .upload-section {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
  }

  .file-input-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px;
    border: 3px dashed #cbd5e0;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
    background-color: #f7fafc;
  }

  .file-input-label:hover, .file-input-label.dragging {
    border-color: #59BDB9;
    background-color: #e6f9f8;
  }

  .upload-icon {
    font-size: 4rem;
    margin-bottom: 15px;
  }

  .upload-text {
    font-size: 1.1rem;
    color: #4a5568;
    text-align: center;
  }

  .selected-files {
    margin: 20px 0;
    padding: 20px;
    background-color: #f7fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .selected-files h3 {
    margin: 0 0 10px 0;
    color: #2d3748;
    font-size: 1.1rem;
  }

  .selected-files ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .selected-files li {
    padding: 8px 0;
    border-bottom: 1px solid #e2e8f0;
    color: #4a5568;
  }

  .selected-files li:last-child {
    border-bottom: none;
  }

  .upload-btn {
    width: 100%;
    padding: 15px 30px;
    background: linear-gradient(135deg, #1C2C8C 0%, #59BDB9 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .upload-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(28, 44, 140, 0.3);
  }

  .upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .results-section {
    animation: fadeIn 0.3s ease-out;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .results-header h2 {
    margin: 0;
    color: #2d3748;
    font-size: 1.5rem;
  }

  .clear-all-btn {
    padding: 10px 20px;
    background-color: #e53e3e;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .clear-all-btn:hover {
    background-color: #c53030;
    transform: translateY(-2px);
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  @media (max-width: 768px) {
    .upload-section {
      padding: 20px;
    }

    .file-input-label {
      padding: 30px;
    }

    .upload-icon {
      font-size: 3rem;
    }

    .results-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
