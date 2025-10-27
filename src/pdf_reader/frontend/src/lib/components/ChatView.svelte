<script>
  import { chatStore, selectedModel } from '$lib/stores/chatStore';
  import { uploadStore } from '$lib/stores/uploadStore';
  import { notification } from '$lib/stores/notificationStore';
  import { askQuestionStream } from '$lib/api/client';
  import { scrollToBottom } from '$lib/utils/helpers';
  import ChatMessage from './ChatMessage.svelte';
  import ChatInput from './ChatInput.svelte';

  let messagesContainer;
  let isProcessing = $state(false);
  let currentQuestion = $state('');

  function scrollToBottomNow() {
    if (messagesContainer) {
      scrollToBottom(messagesContainer);
    }
  }

  async function handleSubmit() {
    if (!currentQuestion.trim() || isProcessing) return;

    const question = currentQuestion.trim();
    currentQuestion = '';
    isProcessing = true;

    // Add user message
    chatStore.addMessage({ role: 'user', content: question });
    scrollToBottomNow();

    let assistantMessage = '';
    let lastRenderTime = 0;
    const RENDER_THROTTLE = 33; // ~30fps
    let messageStarted = false;

    try {
      const stream = askQuestionStream(
        $uploadStore.fileIds,
        question,
        $chatStore,
        $selectedModel
      );

      for await (const data of stream) {
        if (data.type === 'chunk') {
          // Only add the assistant message when we receive the first chunk
          if (!messageStarted) {
            chatStore.addMessage({ role: 'assistant', content: '' });
            messageStarted = true;
          }

          assistantMessage += data.content;

          const now = Date.now();
          if (now - lastRenderTime > RENDER_THROTTLE) {
            chatStore.updateLastMessage(assistantMessage);
            lastRenderTime = now;
            scrollToBottomNow();
          }
        } else if (data.type === 'done') {
          if (messageStarted) {
            chatStore.updateLastMessage(assistantMessage);
          }
          scrollToBottomNow();
        } else if (data.type === 'error') {
          throw new Error(data.content);
        }
      }
    } catch (error) {
      chatStore.addMessage({
        role: 'system',
        content: `Error: ${error.message}`
      });
      notification.show(`Error: ${error.message}`, 'error');
    } finally {
      isProcessing = false;
      scrollToBottomNow();
    }
  }

  function handleClear() {
    if (confirm('Are you sure you want to clear the chat history?')) {
      chatStore.clear();
      notification.show('Chat history cleared', 'success');
    }
  }

  $effect(() => {
    scrollToBottomNow();
  });
</script>

<div class="chat-container">
  <section class="chat-section">
    <div class="chat-header">
      <div class="model-picker-inline">
        <label for="modelSelect" class="model-picker-label">Model:</label>
        <select id="modelSelect" class="model-select" bind:value={$selectedModel}>
          <option value="gemini-2.5-flash" selected>Fast</option>
          <option value="gemini-2.5-pro">Intelligent, Slow</option>
        </select>
      </div>

      <button class="clear-chat-btn" id="clearChatBtn" onclick={handleClear} title="Start a new conversation">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
        Clear Chat
      </button>
    </div>

    <div bind:this={messagesContainer} class="chat-messages-container" id="chatMessages">
      {#if $chatStore.length === 0}
        <div class="chat-welcome">
          <p>Welcome! Ask me anything about your uploaded documents.</p>
        </div>
      {:else}
        {#each $chatStore as message, i (i)}
          <ChatMessage {message} />
        {/each}
      {/if}
    </div>

    {#if isProcessing}
      <div class="typing-indicator" id="typingIndicator" class:active={isProcessing}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    {/if}

    <ChatInput
      bind:value={currentQuestion}
      {isProcessing}
      onSubmit={handleSubmit}
    />
  </section>
</div>

<style>
  /* Chat Container - Outer teal box */
  .chat-container {
    background: linear-gradient(135deg, #e6f9f8 0%, #d4f3f1 100%);
    padding: 16px;
    border-radius: 20px;
    border: 2px solid #59BDB9;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  /* Chat Section Styles */
  .chat-section {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 260px);
    min-height: 500px;
    max-height: none;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(89, 189, 185, 0.15);
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 2px solid #e6f9f8;
    background: linear-gradient(135deg, #f0fffe 0%, #e6f9f8 100%);
    gap: 16px;
  }

  /* Model Picker Inline Styles */
  .model-picker-inline {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .model-picker-label {
    color: #3d9894;
    font-weight: 600;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .model-select {
    padding: 6px 12px;
    background: white;
    border: 2px solid #59BDB9;
    border-radius: 8px;
    color: #2d3748;
    font-size: 0.85em;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .model-select:hover {
    background: #f0fffe;
    border-color: #3d9894;
  }

  .model-select:focus {
    outline: none;
    border-color: #3d9894;
    box-shadow: 0 0 0 3px rgba(89, 189, 185, 0.15);
  }

  .clear-chat-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: white;
    color: #59BDB9;
    border: 2px solid #59BDB9;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.85em;
    font-weight: 600;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .clear-chat-btn:hover {
    background: #59BDB9;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(89, 189, 185, 0.25);
  }

  .clear-chat-btn svg {
    width: 16px;
    height: 16px;
  }

  .chat-messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    background: white;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
  }

  .chat-welcome {
    text-align: center;
    padding: 60px 20px;
    color: #718096;
    font-size: 1.1em;
  }

  .typing-indicator {
    display: none;
    padding: 20px 24px;
    background: #f7fafc;
    border-left: 4px solid #87BD25;
    border-radius: 12px;
    margin: 0 24px 16px 24px;
    align-items: center;
    gap: 8px;
  }

  .typing-indicator.active {
    display: flex;
  }

  .typing-indicator span {
    width: 8px;
    height: 8px;
    background: #87BD25;
    border-radius: 50%;
    animation: typingBounce 1.4s infinite;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }
</style>
