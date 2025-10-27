import { writable } from 'svelte/store';

export const extractionMode = writable('excel');

export const uploadedTemplate = writable({
  id: null,
  keys: []
});

export const extractionResults = writable(null);

export const carouselState = writable({
  isOpen: false,
  currentIndex: 0,
  results: {},
  keyNames: []
});

export const previewModal = writable({
  isOpen: false,
  fileId: null,
  filename: null,
  content: null,
  size: null
});
