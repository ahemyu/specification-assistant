import { writable } from 'svelte/store';

function createNotificationStore() {
  const { subscribe, set } = writable(null);

  return {
    subscribe,
    show: (message, type = 'info') => {
      set({ message, type });
      // Auto-clear after 5 seconds
      setTimeout(() => set(null), 5000);
    },
    clear: () => set(null)
  };
}

export const notification = createNotificationStore();
