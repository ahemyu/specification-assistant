<script>
  import { uploadStore } from '$lib/stores/uploadStore';
  import { uploadedTemplate, carouselState } from '$lib/stores/extractionStore';
  import { notification } from '$lib/stores/notificationStore';
  import { uploadExcelTemplate, extractKeysFromTemplate, downloadFilledExcel } from '$lib/api/client';
  import { downloadBlob } from '$lib/utils/helpers';

  let excelFileInput;
  let additionalContext = $state('');
  let isUploading = $state(false);
  let isExtracting = $state(false);

  async function handleExcelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    isUploading = true;
    try {
      const result = await uploadExcelTemplate(file);
      uploadedTemplate.set({
        id: result.template_id,
        keys: result.keys
      });
      notification.show(`Template uploaded: ${result.total_keys} keys found`, 'success');
    } catch (error) {
      notification.show(`Template upload failed: ${error.message}`, 'error');
    } finally {
      isUploading = false;
    }
  }

  async function handleExtract() {
    if (!$uploadedTemplate.id || $uploadStore.fileIds.length === 0) return;

    isExtracting = true;
    notification.show('Extracting keys...', 'info');

    try {
      const results = await extractKeysFromTemplate(
        $uploadedTemplate.id,
        $uploadStore.fileIds,
        additionalContext.trim() || undefined
      );

      const keyNames = Object.keys(results);
      carouselState.set({
        isOpen: true,
        currentIndex: 0,
        results: results,
        keyNames: keyNames
      });

      notification.show('Extraction completed!', 'success');
    } catch (error) {
      notification.show(`Extraction failed: ${error.message}`, 'error');
    } finally {
      isExtracting = false;
    }
  }

  async function handleDownload() {
    if (!$uploadedTemplate.id) return;

    try {
      const blob = await downloadFilledExcel($uploadedTemplate.id);
      downloadBlob(blob, 'filled_template.xlsx');
      notification.show('Template downloaded', 'success');
    } catch (error) {
      notification.show(`Download failed: ${error.message}`, 'error');
    }
  }

  function handleViewResults() {
    if ($carouselState.results && Object.keys($carouselState.results).length > 0) {
      carouselState.update(state => ({
        ...state,
        isOpen: true,
        currentIndex: 0
      }));
    }
  }
</script>

<div class="excel-tab">
  <div class="upload-section">
    <h3>Upload Excel Template</h3>
    <p class="description">
      Upload an Excel file with columns "Key" and "Value". The assistant will extract these keys from your PDFs.
    </p>

    <label class="file-input-label">
      <input
        bind:this={excelFileInput}
        type="file"
        accept=".xlsx,.xls"
        onchange={handleExcelUpload}
        style="display: none;"
      />
      <div class="upload-icon">📊</div>
      <div class="upload-text">
        {#if isUploading}
          Uploading...
        {:else}
          Click to select Excel file
        {/if}
      </div>
    </label>

    {#if $uploadedTemplate.id}
      <div class="template-info">
        <h4>Template Loaded</h4>
        <p class="key-count">{$uploadedTemplate.keys.length} keys to extract</p>
        <div class="keys-preview">
          <h5>Keys Preview:</h5>
          <div class="keys-grid">
            {#each $uploadedTemplate.keys.slice(0, 20) as key}
              <span class="key-badge">{key}</span>
            {/each}
            {#if $uploadedTemplate.keys.length > 20}
              <span class="key-badge more">+{$uploadedTemplate.keys.length - 20} more</span>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="context-section">
    <h3>Additional Context (Optional)</h3>
    <textarea
      bind:value={additionalContext}
      placeholder="Provide any additional context or instructions for the extraction..."
      rows="4"
    ></textarea>
  </div>

  <div class="actions-section">
    <button
      class="extract-btn"
      onclick={handleExtract}
      disabled={isExtracting || !$uploadedTemplate.id || $uploadStore.fileIds.length === 0}
    >
      {#if isExtracting}
        <span class="spinner"></span>
        Extracting...
      {:else}
        Extract Keys
      {/if}
    </button>

    {#if $uploadedTemplate.id}
      <button
        class="download-btn"
        onclick={handleDownload}
      >
        Download Filled Template
      </button>
    {/if}

    {#if $carouselState.results && Object.keys($carouselState.results).length > 0}
      <button
        class="view-results-btn"
        onclick={handleViewResults}
      >
        View Extraction Results
      </button>
    {/if}
  </div>
</div>

<style>
  .excel-tab {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .upload-section,
  .context-section,
  .actions-section {
    background: white;
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  h3 {
    margin: 0 0 15px 0;
    color: #2d3748;
    font-size: 1.3rem;
  }

  .description {
    margin: 0 0 20px 0;
    color: #718096;
    line-height: 1.6;
  }

  .file-input-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    border: 3px dashed #cbd5e0;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
    background-color: #f7fafc;
  }

  .file-input-label:hover {
    border-color: #59BDB9;
    background-color: #e6f9f8;
  }

  .upload-icon {
    font-size: 3rem;
    margin-bottom: 10px;
  }

  .upload-text {
    font-size: 1rem;
    color: #4a5568;
  }

  .template-info {
    margin-top: 20px;
    padding: 20px;
    background-color: #e6f9f8;
    border-radius: 8px;
    border: 2px solid #59BDB9;
  }

  .template-info h4 {
    margin: 0 0 10px 0;
    color: #1C2C8C;
    font-size: 1.1rem;
  }

  .key-count {
    margin: 0 0 15px 0;
    color: #4a5568;
    font-weight: 600;
  }

  .keys-preview h5 {
    margin: 0 0 10px 0;
    color: #2d3748;
    font-size: 1rem;
  }

  .keys-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .key-badge {
    padding: 8px 12px;
    background-color: white;
    border: 1px solid #cbd5e0;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #2d3748;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .key-badge.more {
    background-color: #59BDB9;
    color: white;
    font-weight: 600;
    border-color: #59BDB9;
  }

  textarea {
    width: 100%;
    padding: 15px;
    border: 2px solid #cbd5e0;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    color: #2d3748;
    resize: vertical;
    transition: border-color 0.2s;
  }

  textarea:focus {
    outline: none;
    border-color: #59BDB9;
    box-shadow: 0 0 0 3px rgba(89, 189, 185, 0.1);
  }

  textarea::placeholder {
    color: #a0aec0;
  }

  .actions-section {
    display: flex;
    gap: 15px;
  }

  .extract-btn,
  .download-btn,
  .view-results-btn {
    flex: 1;
    padding: 15px 30px;
    border: none;
    border-radius: 25px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .extract-btn {
    background: linear-gradient(135deg, #1C2C8C 0%, #59BDB9 100%);
    color: white;
  }

  .extract-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(28, 44, 140, 0.3);
  }

  .extract-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .download-btn {
    background-color: #87BD25;
    color: white;
  }

  .download-btn:hover {
    background-color: #6fa01d;
    transform: translateY(-2px);
  }

  .view-results-btn {
    background: linear-gradient(135deg, #1C2C8C 0%, #59BDB9 100%);
    color: white;
  }

  .view-results-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(28, 44, 140, 0.4);
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @media (max-width: 768px) {
    .actions-section {
      flex-direction: column;
    }

    .keys-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
  }
</style>
