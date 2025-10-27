<script>
  import { extractionMode } from '$lib/stores/extractionStore';
  import ExcelTemplateTab from './ExcelTemplateTab.svelte';
  import ManualInputTab from './ManualInputTab.svelte';
</script>

<section class="key-extraction-section">
  <h2>Extract Keys from Uploaded PDFs</h2>
  <p class="section-subtitle">Use AI to extract specificied keys from your PDFs</p>

  <!-- Tab Navigation -->
  <div class="extraction-tabs">
    <button
      class="tab-btn"
      class:active={$extractionMode === 'excel'}
      id="excelTab"
      data-tab="excel"
      onclick={() => extractionMode.set('excel')}
    >
      Excel Template
    </button>
    <button
      class="tab-btn"
      class:active={$extractionMode === 'manual'}
      id="manualTab"
      data-tab="manual"
      onclick={() => extractionMode.set('manual')}
    >
      Manual Input
    </button>
  </div>

  <div class="tab-content" class:active={$extractionMode === 'excel'}>
    {#if $extractionMode === 'excel'}
      <ExcelTemplateTab />
    {/if}
  </div>

  <div class="tab-content" class:active={$extractionMode === 'manual'}>
    {#if $extractionMode === 'manual'}
      <ManualInputTab />
    {/if}
  </div>
</section>

<style>
  .key-extraction-section {
    padding: 0;
  }

  .key-extraction-section h2 {
    color: #1a202c;
    margin-bottom: 8px;
    font-size: 1.9em;
    font-weight: 700;
    text-align: center;
  }

  .section-subtitle {
    color: #718096;
    margin-bottom: 32px;
    font-size: 1em;
    text-align: center;
    line-height: 1.6;
  }

  /* Tab Navigation */
  .extraction-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 0;
  }

  .tab-btn {
    padding: 12px 24px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: #718096;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    bottom: -2px;
  }

  .tab-btn:hover {
    color: #1C2C8C;
  }

  .tab-btn.active {
    color: #1C2C8C;
    border-bottom-color: #1C2C8C;
  }

  /* Tab Content */
  .tab-content {
    display: none;
  }

  .tab-content.active {
    display: block;
  }
</style>
