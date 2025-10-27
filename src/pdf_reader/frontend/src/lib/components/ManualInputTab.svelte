<script>
  import { uploadStore } from '$lib/stores/uploadStore';
  import { carouselState } from '$lib/stores/extractionStore';
  import { notification } from '$lib/stores/notificationStore';
  import { extractKeys, downloadExtractionExcel } from '$lib/api/client';
  import { downloadBlob } from '$lib/utils/helpers';

  let keyNames = $state('');
  let additionalContext = $state('');
  let isExtracting = $state(false);
  let lastResults = $state(null);

  function parseKeyNames() {
    return keyNames
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }

  let parsedKeys = $derived(parseKeyNames());

  async function handleExtract() {
    if (parsedKeys.length === 0 || $uploadStore.fileIds.length === 0) return;

    isExtracting = true;
    notification.show('Extracting keys...', 'info');

    try {
      const results = await extractKeys(
        $uploadStore.fileIds,
        parsedKeys,
        additionalContext.trim() || undefined
      );

      lastResults = results;
      const keyNamesList = Object.keys(results);

      carouselState.set({
        isOpen: true,
        currentIndex: 0,
        results: results,
        keyNames: keyNamesList
      });

      notification.show('Extraction completed!', 'success');
    } catch (error) {
      notification.show(`Extraction failed: ${error.message}`, 'error');
    } finally {
      isExtracting = false;
    }
  }

  async function handleDownloadExcel() {
    if (!lastResults) return;

    try {
      const blob = await downloadExtractionExcel(lastResults);
      downloadBlob(blob, 'extraction_results.xlsx');
      notification.show('Results downloaded', 'success');
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

<div class="manual-tab">
  <div class="input-section">
    <h3>Enter Keys to Extract</h3>
    <p class="description">
      Enter one key per line. The assistant will search for these keys in your PDFs.
    </p>

    <textarea
      bind:value={keyNames}
      placeholder="Example:&#10;Project Name&#10;Budget&#10;Timeline&#10;Contact Person"
      rows="10"
      class="keys-input"
    ></textarea>

    {#if parsedKeys.length > 0}
      <div class="keys-count">
        {parsedKeys.length} key{parsedKeys.length !== 1 ? 's' : ''} to extract
      </div>
    {/if}
  </div>

  <div class="context-section">
    <h3>Additional Context (Optional)</h3>
    <textarea
      bind:value={additionalContext}
      placeholder="Provide any additional context or instructions for the extraction..."
      rows="4"
      class="context-input"
    ></textarea>
  </div>

  <div class="actions-section">
    <button
      class="extract-btn"
      onclick={handleExtract}
      disabled={isExtracting || parsedKeys.length === 0 || $uploadStore.fileIds.length === 0}
    >
      {#if isExtracting}
        <span class="spinner"></span>
        Extracting...
      {:else}
        Extract Keys
      {/if}
    </button>

    {#if lastResults}
      <button
        class="download-btn"
        onclick={handleDownloadExcel}
      >
        Download Results as Excel
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
  .manual-tab {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .input-section,
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
    margin: 0 0 15px 0;
    color: #718096;
    line-height: 1.6;
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

  .keys-input {
    font-family: 'Courier New', Courier, monospace;
  }

  .keys-count {
    margin-top: 10px;
    padding: 10px 15px;
    background-color: #e6f9f8;
    border-radius: 6px;
    color: #1C2C8C;
    font-weight: 600;
    text-align: center;
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

    .input-section,
    .context-section,
    .actions-section {
      padding: 20px;
    }
  }
</style>
