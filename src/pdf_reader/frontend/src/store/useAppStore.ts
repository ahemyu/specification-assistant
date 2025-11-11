import { create } from 'zustand'
import type {
  ProcessedFile,
  ExtractionResult,
  ReviewedKey,
  ExtractionMode,
  ExtractionState,
  ChatMessage,
  PDFCache,
  Reference,
} from '../types'

interface AppState {
  // File management state
  uploadedFileIds: string[]
  processedFiles: ProcessedFile[]
  allUploadedFiles: ProcessedFile[]
  extractionResultsData: ExtractionResult[] | null
  extractionResultsBackendFormat: Record<string, any> | null
  currentExtractionMode: ExtractionMode
  uploadedTemplateId: string | null
  uploadedTemplateKeys: string[]
  currentCardIndex: number

  // Review state
  reviewedKeys: Record<string, ReviewedKey>
  isEditMode: boolean

  // Extraction workflow state
  currentExtractionState: ExtractionState

  // PDF Viewer state
  currentPdfDoc: any | null
  currentPdfPage: number | null
  currentPdfScale: number
  currentReferences: Reference[]
  currentReferenceIndex: number
  currentRenderTask: any | null
  pdfCache: PDFCache

  // Chat state
  conversationHistory: ChatMessage[]

  // Actions
  setUploadedFileIds: (ids: string[]) => void
  setProcessedFiles: (files: ProcessedFile[]) => void
  setAllUploadedFiles: (files: ProcessedFile[]) => void
  setExtractionResultsData: (data: ExtractionResult[] | null) => void
  setExtractionResultsBackendFormat: (data: Record<string, any> | null) => void
  setCurrentExtractionMode: (mode: ExtractionMode) => void
  setUploadedTemplateId: (id: string | null) => void
  setUploadedTemplateKeys: (keys: string[]) => void
  setCurrentCardIndex: (index: number) => void
  setReviewedKeys: (keys: Record<string, ReviewedKey>) => void
  setIsEditMode: (mode: boolean) => void
  setCurrentExtractionState: (state: ExtractionState) => void
  setCurrentPdfDoc: (doc: any | null) => void
  setCurrentPdfPage: (page: number | null) => void
  setCurrentPdfScale: (scale: number) => void
  setCurrentReferences: (refs: Reference[]) => void
  setCurrentReferenceIndex: (index: number) => void
  setCurrentRenderTask: (task: any | null) => void
  setPdfCache: (cache: PDFCache) => void
  setConversationHistory: (history: ChatMessage[]) => void

  // Helper actions
  resetExtractionState: () => void
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  uploadedFileIds: [],
  processedFiles: [],
  allUploadedFiles: [],
  extractionResultsData: null,
  extractionResultsBackendFormat: null,
  currentExtractionMode: 'excel',
  uploadedTemplateId: null,
  uploadedTemplateKeys: [],
  currentCardIndex: 0,

  reviewedKeys: {},
  isEditMode: false,

  currentExtractionState: 'setup',

  currentPdfDoc: null,
  currentPdfPage: null,
  currentPdfScale: 1.0,
  currentReferences: [],
  currentReferenceIndex: 0,
  currentRenderTask: null,
  pdfCache: {},

  conversationHistory: [],

  // Setters
  setUploadedFileIds: (ids) => set({ uploadedFileIds: ids }),
  setProcessedFiles: (files) => set({ processedFiles: files }),
  setAllUploadedFiles: (files) => set({ allUploadedFiles: files }),
  setExtractionResultsData: (data) => set({ extractionResultsData: data }),
  setExtractionResultsBackendFormat: (data) => set({ extractionResultsBackendFormat: data }),
  setCurrentExtractionMode: (mode) => set({ currentExtractionMode: mode }),
  setUploadedTemplateId: (id) => set({ uploadedTemplateId: id }),
  setUploadedTemplateKeys: (keys) => set({ uploadedTemplateKeys: keys }),
  setCurrentCardIndex: (index) => set({ currentCardIndex: index }),
  setReviewedKeys: (keys) => set({ reviewedKeys: keys }),
  setIsEditMode: (mode) => set({ isEditMode: mode }),
  setCurrentExtractionState: (state) => set({ currentExtractionState: state }),
  setCurrentPdfDoc: (doc) => set({ currentPdfDoc: doc }),
  setCurrentPdfPage: (page) => set({ currentPdfPage: page }),
  setCurrentPdfScale: (scale) => set({ currentPdfScale: scale }),
  setCurrentReferences: (refs) => set({ currentReferences: refs }),
  setCurrentReferenceIndex: (index) => set({ currentReferenceIndex: index }),
  setCurrentRenderTask: (task) => set({ currentRenderTask: task }),
  setPdfCache: (cache) => set({ pdfCache: cache }),
  setConversationHistory: (history) => set({ conversationHistory: history }),

  // Helper actions
  resetExtractionState: () =>
    set({
      extractionResultsData: null,
      extractionResultsBackendFormat: null,
      currentExtractionMode: 'excel',
      uploadedTemplateId: null,
      uploadedTemplateKeys: [],
      currentCardIndex: 0,
      reviewedKeys: {},
      isEditMode: false,
      currentExtractionState: 'setup',
    }),

  addChatMessage: (message) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, message],
    })),

  clearChat: () => set({ conversationHistory: [] }),
}))

// Storage keys constants
export const CHAT_STORAGE_KEY = 'specification_assistant_chat_history'
export const PDF_STORAGE_KEY = 'specification_assistant_uploaded_pdfs'
