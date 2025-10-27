<script>
  let { activeTab = $bindable(), tabsEnabled } = $props();

  const tabs = [
    { id: 'upload', label: 'Upload PDFs' },
    { id: 'extract', label: 'Extract Keys' },
    { id: 'qa', label: 'Ask Questions' }
  ];

  function selectTab(tabId) {
    if (tabId === 'upload' || tabsEnabled) {
      activeTab = tabId;
    }
  }
</script>

<nav class="main-tabs">
  {#each tabs as tab}
    <button
      class="main-tab-btn"
      class:active={activeTab === tab.id}
      class:disabled={tab.id !== 'upload' && !tabsEnabled}
      data-tab={tab.id}
      onclick={() => selectTab(tab.id)}
      data-tooltip={tab.id !== 'upload' && !tabsEnabled ? 'First upload PDFs before continuing' : ''}
    >
      {tab.label}
    </button>
  {/each}
</nav>

<style>
  .main-tabs {
    display: flex;
    gap: 32px;
    margin-bottom: 20px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 0;
    justify-content: center;
  }

  .main-tab-btn {
    padding: 14px 28px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: #718096;
    font-size: 1.05em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    bottom: -2px;
  }

  .main-tab-btn:hover {
    color: #59BDB9;
    background: rgba(89, 189, 185, 0.05);
  }

  .main-tab-btn.active {
    color: #1C2C8C;
    border-bottom-color: #1C2C8C;
    background: rgba(28, 44, 140, 0.03);
  }

  .main-tab-btn.disabled {
    display: none;
  }
</style>
