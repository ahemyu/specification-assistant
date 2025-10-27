import { writable } from 'svelte/store';

const STORAGE_KEY = 'specification_assistant_chat_history';

function createChatStore() {
  const { subscribe, set, update } = writable([]);

  // Load from localStorage on initialization
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        set(data);
      } catch (e) {
        console.error('Failed to parse stored chat history:', e);
      }
    }
  }

  return {
    subscribe,
    addMessage: (message) => update(messages => {
      const newMessages = [...messages, message];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
      }
      return newMessages;
    }),
    updateLastMessage: (content) => update(messages => {
      if (messages.length === 0) return messages;
      const newMessages = [...messages];
      newMessages[newMessages.length - 1] = {
        ...newMessages[newMessages.length - 1],
        content
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
      }
      return newMessages;
    }),
    clear: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      set([]);
    }
  };
}

export const chatStore = createChatStore();
export const selectedModel = writable('gemini-2.5-flash');
