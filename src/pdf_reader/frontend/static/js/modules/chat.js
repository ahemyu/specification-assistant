// Chat Module
// Handles Q&A chat functionality

import {
    questionInput,
    askBtn,
    chatMessages,
    typingIndicator,
    clearChatBtn,
    modelSelect,
    uploadedFileIds,
    conversationHistory,
    setConversationHistory
} from './state.js';

import { saveChatHistory, clearChatHistory as clearChatHistoryStorage, removeChatWelcome } from './storage.js';

// Append a message to the chat
export function appendMessage(role, content, saveToHistory = true) {
    // Don't render system messages in the UI
    if (role === 'system') {
        if (saveToHistory) {
            conversationHistory.push({ role, content });
            saveChatHistory();
        }
        return;
    }

    removeChatWelcome();

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;

    const roleLabel = role === 'user' ? 'You' : 'Assistant';

    // Parse markdown for assistant messages
    const messageContent = role === 'assistant' ? marked.parse(content) : escapeHtml(content);

    messageDiv.innerHTML = `
        <div class="chat-message-role">${roleLabel}</div>
        <div class="chat-message-content">${messageContent}</div>
    `;

    chatMessages.appendChild(messageDiv);
    scrollToBottom();

    if (saveToHistory) {
        conversationHistory.push({ role, content });
        saveChatHistory();
    }
}

// Escape HTML for user messages to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Scroll to bottom of chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.classList.add('active');
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.classList.remove('active');
}

// Auto-resize textarea
function autoResizeTextarea() {
    questionInput.style.height = 'auto';
    questionInput.style.height = Math.min(questionInput.scrollHeight, 120) + 'px';
}

// Submit question with streaming
async function submitQuestion() {
    const question = questionInput.value.trim();
    if (!question || uploadedFileIds.length === 0) {
        alert('Please enter a question and ensure PDFs are uploaded.');
        return;
    }

    appendMessage('user', question);
    questionInput.value = '';
    questionInput.style.height = 'auto';
    askBtn.disabled = true;
    questionInput.disabled = true;
    showTypingIndicator();

    let fullAnswer = '';
    let systemMessage = null;
    let messageDiv = null;
    let contentDiv = null;
    let isFirstChunk = true;
    let pendingRenderFrame = null;
    let lastRenderTime = 0;
    const RENDER_THROTTLE_MS = 32;

    const scheduleRender = () => {
        if (pendingRenderFrame) return;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime;

        if (timeSinceLastRender >= RENDER_THROTTLE_MS) {
            pendingRenderFrame = requestAnimationFrame(() => {
                contentDiv.innerHTML = marked.parse(fullAnswer);
                scrollToBottom();
                lastRenderTime = Date.now();
                pendingRenderFrame = null;
            });
        } else {
            const delay = RENDER_THROTTLE_MS - timeSinceLastRender;
            setTimeout(() => {
                if (!pendingRenderFrame) {
                    pendingRenderFrame = requestAnimationFrame(() => {
                        contentDiv.innerHTML = marked.parse(fullAnswer);
                        scrollToBottom();
                        lastRenderTime = Date.now();
                        pendingRenderFrame = null;
                    });
                }
            }, delay);
        }
    };

    try {
        const selectedModel = modelSelect ? modelSelect.value : 'gpt-4.1';
        const response = await fetch('/ask-question-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_ids: uploadedFileIds,
                question: question,
                conversation_history: conversationHistory.slice(0, -1),
                model_name: selectedModel
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.substring(6));

                    if (data.type === 'system_message') {
                        systemMessage = data.content;
                    } else if (data.type === 'chunk') {
                        if (isFirstChunk) {
                            hideTypingIndicator();
                            removeChatWelcome();
                            messageDiv = document.createElement('div');
                            messageDiv.className = 'chat-message assistant';
                            messageDiv.innerHTML = `
                                <div class="chat-message-role">Assistant</div>
                                <div class="chat-message-content"></div>
                            `;
                            chatMessages.appendChild(messageDiv);
                            contentDiv = messageDiv.querySelector('.chat-message-content');
                            scrollToBottom();
                            isFirstChunk = false;
                        }
                        fullAnswer += data.content;
                        scheduleRender();
                    } else if (data.type === 'done') {
                        if (pendingRenderFrame) {
                            cancelAnimationFrame(pendingRenderFrame);
                            pendingRenderFrame = null;
                        }
                        if (contentDiv) {
                            contentDiv.innerHTML = marked.parse(fullAnswer);
                            scrollToBottom();
                        }
                    } else if (data.type === 'error') {
                        throw new Error(data.content);
                    }
                }
            }
        }

        if (systemMessage) {
            conversationHistory.unshift({ role: 'system', content: systemMessage });
        }
        conversationHistory.push({ role: 'assistant', content: fullAnswer });
        saveChatHistory();

    } catch (error) {
        hideTypingIndicator();
        if (isFirstChunk) {
            removeChatWelcome();
            messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message assistant';
            messageDiv.innerHTML = `
                <div class="chat-message-role">Assistant</div>
                <div class="chat-message-content"></div>
            `;
            chatMessages.appendChild(messageDiv);
            contentDiv = messageDiv.querySelector('.chat-message-content');
        }
        contentDiv.innerHTML = `<span style="color: #EF4444;">Error: ${escapeHtml(error.message)}</span>`;
    } finally {
        hideTypingIndicator();
        askBtn.disabled = false;
        questionInput.disabled = false;
        questionInput.focus();
    }
}

// Initialize chat event listeners
export function initChat() {
    askBtn.addEventListener('click', submitQuestion);
    questionInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitQuestion();
        }
    });
    questionInput.addEventListener('input', autoResizeTextarea);
    clearChatBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the conversation history?')) {
            clearChatHistoryStorage();
        }
    });
}
