// Storage Module
// Handles localStorage operations for chat history and PDF state

import {
    CHAT_STORAGE_KEY,
    PDF_STORAGE_KEY,
    conversationHistory,
    uploadedFileIds,
    processedFiles,
    allUploadedFiles,
    setConversationHistory,
    setUploadedFileIds,
    setProcessedFiles,
    setAllUploadedFiles,
    statusDiv,
    resultsDiv,
    chatMessages
} from './state.js';

// Note: These imports may cause circular dependencies
// Functions will be imported dynamically where needed

// Load chat history from localStorage
export async function loadChatHistory() {
    try {
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
            setConversationHistory(JSON.parse(stored));
            // Import appendMessage dynamically to avoid circular dependency
            const { appendMessage } = await import('./chat.js');
            conversationHistory.forEach(msg => {
                appendMessage(msg.role, msg.content, false);
            });
            if (conversationHistory.length > 0) {
                removeChatWelcome();
            }
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
        setConversationHistory([]);
    }
}

// Save chat history to localStorage
export function saveChatHistory() {
    try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversationHistory));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}

// Clear chat history
export function clearChatHistory() {
    setConversationHistory([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    chatMessages.innerHTML = '<div class="chat-welcome"><p>Welcome! Ask me anything about your uploaded documents.</p></div>';
}

// Remove welcome message
export function removeChatWelcome() {
    const welcome = chatMessages.querySelector('.chat-welcome');
    if (welcome) {
        welcome.remove();
    }
}

// Save PDF state to localStorage
export function savePdfState() {
    try {
        const pdfState = {
            uploadedFileIds,
            processedFiles,
            allUploadedFiles
        };
        localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(pdfState));
    } catch (error) {
        console.error('Error saving PDF state:', error);
    }
}

// Load PDF state from localStorage
export async function loadPdfState() {
    try {
        const stored = localStorage.getItem(PDF_STORAGE_KEY);
        if (stored) {
            const pdfState = JSON.parse(stored);
            setUploadedFileIds(pdfState.uploadedFileIds || []);
            setProcessedFiles(pdfState.processedFiles || []);
            setAllUploadedFiles(pdfState.allUploadedFiles || []);

            if (allUploadedFiles.length > 0) {
                // Import functions dynamically to avoid circular dependency
                const { displayResults } = await import('./upload.js');
                const { enableMainTabs } = await import('./navigation.js');

                displayResults(allUploadedFiles);
                showStatus(`Restored ${allUploadedFiles.length} previously uploaded PDF(s)`, 'success');
                enableMainTabs();
            }
        }
    } catch (error) {
        console.error('Error loading PDF state:', error);
        setUploadedFileIds([]);
        setProcessedFiles([]);
        setAllUploadedFiles([]);
    }
}

// Clear PDF state
export function clearPdfState() {
    setUploadedFileIds([]);
    setProcessedFiles([]);
    setAllUploadedFiles([]);
    localStorage.removeItem(PDF_STORAGE_KEY);
    resultsDiv.innerHTML = '';
    statusDiv.style.display = 'none';
}

// Show status message
export function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
}
