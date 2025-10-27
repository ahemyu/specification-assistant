<script>
  let { value = $bindable(), isProcessing, onSubmit } = $props();

  let textarea;

  function autoResize() {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  $effect(() => {
    // Auto-resize when value changes
    autoResize();
  });
</script>

<div class="chat-input-area">
  <textarea
    bind:this={textarea}
    bind:value
    id="questionInput"
    rows="1"
    placeholder="Type your question here..."
    aria-label="Enter your question"
    disabled={isProcessing}
    oninput={autoResize}
    onkeydown={handleKeydown}
  ></textarea>
  <button
    class="send-btn"
    id="askBtn"
    title="Send message"
    onclick={onSubmit}
    disabled={isProcessing || !value.trim()}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>
  </button>
</div>

<style>
  .chat-input-area {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    background: white;
    border-top: 2px solid #e6f9f8;
    align-items: flex-end;
  }

  .chat-input-area textarea {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 0.95em;
    resize: none;
    transition: all 0.3s ease;
    line-height: 1.5;
    max-height: 120px;
    min-height: 44px;
  }

  .chat-input-area textarea:focus {
    outline: none;
    border-color: #59BDB9;
    box-shadow: 0 0 0 3px rgba(89, 189, 185, 0.1);
  }

  .chat-input-area textarea::placeholder {
    color: #a0aec0;
  }

  .send-btn {
    padding: 12px;
    background: #59BDB9;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
  }

  .send-btn:hover:not(:disabled) {
    background: #3d9894;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(89, 189, 185, 0.35);
  }

  .send-btn:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .send-btn svg {
    width: 20px;
    height: 20px;
  }
</style>
