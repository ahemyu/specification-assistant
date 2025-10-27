import { writable } from 'svelte/store';

const STORAGE_KEY = 'specification_assistant_uploaded_pdfs';

function createUploadStore() {
  const { subscribe, set, update } = writable({
    fileIds: [],
    allFiles: [],
    processedFiles: []
  });

  // Load from localStorage on initialization
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        set(data);
      } catch (e) {
        console.error('Failed to parse stored PDF data:', e);
      }
    }
  }

  return {
    subscribe,
    addFiles: (files) => update(state => {
      const newState = {
        fileIds: [...state.fileIds, ...files.map(f => f.file_id)],
        allFiles: [...state.allFiles, ...files],
        processedFiles: [...state.processedFiles, ...files]
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      }
      return newState;
    }),
    removeFile: (fileId) => update(state => {
      const newState = {
        fileIds: state.fileIds.filter(id => id !== fileId),
        allFiles: state.allFiles.filter(f => f.file_id !== fileId),
        processedFiles: state.processedFiles.filter(f => f.file_id !== fileId)
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      }
      return newState;
    }),
    clear: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      set({ fileIds: [], allFiles: [], processedFiles: [] });
    }
  };
}

export const uploadStore = createUploadStore();
