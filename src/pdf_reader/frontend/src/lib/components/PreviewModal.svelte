<script>
  import { previewModal } from '$lib/stores/extractionStore';
  import { formatFileSize } from '$lib/utils/helpers';

  function close() {
    previewModal.set({
      isOpen: false,
      fileId: null,
      filename: null,
      content: null,
      size: null
    });
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      close();
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      close();
    }
  }
</script>

{#if $previewModal.isOpen}
  <div
    class="modal-overlay"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">
          <h2>Preview: {$previewModal.filename}</h2>
          {#if $previewModal.size}
            <p class="file-size">Size: {formatFileSize($previewModal.size)} KB</p>
          {/if}
        </div>
        <button class="close-btn" onclick={close} aria-label="Close modal">
          ×
        </button>
      </div>

      <div class="modal-body">
        <pre>{$previewModal.content}</pre>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  }

  .modal-content {
    background: white;
    border-radius: 15px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 25px;
    border-bottom: 2px solid #e2e8f0;
    background: linear-gradient(135deg, #1C2C8C 0%, #59BDB9 100%);
    color: white;
    border-radius: 15px 15px 0 0;
  }

  .modal-title h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .file-size {
    margin: 5px 0 0 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    line-height: 1;
    padding: 0;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 25px;
  }

  .modal-body::-webkit-scrollbar {
    width: 10px;
  }

  .modal-body::-webkit-scrollbar-track {
    background: #f7fafc;
  }

  .modal-body::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 5px;
  }

  .modal-body::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }

  pre {
    margin: 0;
    padding: 20px;
    background-color: #f7fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #2d3748;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  @media (max-width: 768px) {
    .modal-overlay {
      padding: 10px;
    }

    .modal-content {
      max-height: 95vh;
    }

    .modal-header {
      padding: 20px;
    }

    .modal-title h2 {
      font-size: 1.2rem;
    }

    .modal-body {
      padding: 20px;
    }

    pre {
      font-size: 0.8rem;
      padding: 15px;
    }
  }
</style>
