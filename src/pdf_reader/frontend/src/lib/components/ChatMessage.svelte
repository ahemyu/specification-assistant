<script>
  import { marked } from 'marked';
  import { escapeHtml } from '$lib/utils/helpers';

  let { message } = $props();

  let formattedContent = $derived(() => {
    if (message.role === 'assistant') {
      // Parse markdown for assistant messages
      try {
        return marked.parse(message.content || '');
      } catch (e) {
        return escapeHtml(message.content || '');
      }
    } else {
      // Escape HTML for user/system messages
      return escapeHtml(message.content || '');
    }
  });
</script>

<div class="chat-message {message.role}">
  <div class="chat-message-role">
    {#if message.role === 'user'}
      User
    {:else if message.role === 'assistant'}
      Assistant
    {:else}
      System
    {/if}
  </div>
  <div class="chat-message-content">
    {#if message.role === 'assistant'}
      {@html formattedContent()}
    {:else}
      {formattedContent()}
    {/if}
  </div>
</div>

<style>
  .chat-message {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 20px 24px;
    border-radius: 12px;
    max-width: 100%;
    animation: messageSlideIn 0.3s ease;
  }

  .chat-message.user {
    background: linear-gradient(135deg, #e6f9f8 0%, #d4f3f1 100%);
    border-left: 4px solid #59BDB9;
  }

  .chat-message.assistant {
    background: #f7fafc;
    border-left: 4px solid #87BD25;
  }

  .chat-message.system {
    background: #fff5f5;
    border-left: 4px solid #e53e3e;
  }

  .chat-message-role {
    font-weight: 700;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .chat-message.user .chat-message-role {
    color: #3d9894;
  }

  .chat-message.assistant .chat-message-role {
    color: #6a9919;
  }

  .chat-message.system .chat-message-role {
    color: #e53e3e;
  }

  .chat-message-content {
    color: #2d3748;
    line-height: 1.7;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 0.95em;
  }

  /* Markdown styles for assistant messages */
  .chat-message.assistant .chat-message-content {
    white-space: normal;
  }

  .chat-message-content :global(p) {
    margin-bottom: 12px;
  }

  .chat-message-content :global(p:last-child) {
    margin-bottom: 0;
  }

  .chat-message-content :global(strong) {
    font-weight: 600;
    color: #1a202c;
  }

  .chat-message-content :global(em) {
    font-style: italic;
  }

  .chat-message-content :global(ul),
  .chat-message-content :global(ol) {
    margin: 12px 0;
    padding-left: 24px;
  }

  .chat-message-content :global(li) {
    margin-bottom: 6px;
  }

  .chat-message-content :global(code) {
    background: #f7fafc;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    color: #e53e3e;
  }

  .chat-message-content :global(pre) {
    background: #2d3748;
    color: #e2e8f0;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 12px 0;
  }

  .chat-message-content :global(pre code) {
    background: transparent;
    padding: 0;
    color: inherit;
    font-size: 0.9em;
  }

  .chat-message-content :global(blockquote) {
    border-left: 4px solid #59BDB9;
    padding-left: 16px;
    margin: 12px 0;
    color: #4a5568;
    font-style: italic;
  }

  .chat-message-content :global(h1),
  .chat-message-content :global(h2),
  .chat-message-content :global(h3),
  .chat-message-content :global(h4),
  .chat-message-content :global(h5),
  .chat-message-content :global(h6) {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
    color: #1a202c;
  }

  .chat-message-content :global(h1) {
    font-size: 1.5em;
  }

  .chat-message-content :global(h2) {
    font-size: 1.3em;
  }

  .chat-message-content :global(h3) {
    font-size: 1.1em;
  }

  .chat-message-content :global(a) {
    color: #59BDB9;
    text-decoration: underline;
  }

  .chat-message-content :global(a:hover) {
    color: #1C2C8C;
  }

  .chat-message-content :global(hr) {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 16px 0;
  }

  .chat-message-content :global(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
  }

  .chat-message-content :global(table th),
  .chat-message-content :global(table td) {
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    text-align: left;
  }

  .chat-message-content :global(table th) {
    background: #f7fafc;
    font-weight: 600;
  }
</style>
