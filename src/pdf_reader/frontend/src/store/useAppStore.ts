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
import type { KeyWithCategory } from '../data/keyTemplates'

export type ActiveView = 'home' | 'spec_ai' | 'compare';
export type ActiveSubMenuItem = 'upload' | 'extract' | 'summary' | null;

// Auth types
export interface AuthUser {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  showAuthModal: boolean;
  authModalMode: 'login' | 'register';
}

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

  // Product type detection state
  detectedProductType: string | null
  productTypeConfidence: number
  selectedProductType: string | null
  templateKeys: KeyWithCategory[]
  isDetectingProductType: boolean
  detectedCoreCount: number | null
  detectedWindingCount: number | null

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

  // View state
  activeView: ActiveView;
  activeSubMenuItem: ActiveSubMenuItem;
  isQAPopupOpen: boolean;

  // Auth state
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  showAuthModal: boolean;
  authModalMode: 'login' | 'register';

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
  setDetectedProductType: (type: string | null) => void
  setProductTypeConfidence: (confidence: number) => void
  setSelectedProductType: (type: string | null) => void
  setTemplateKeys: (keys: KeyWithCategory[]) => void
  setIsDetectingProductType: (isDetecting: boolean) => void
  setDetectedCoreCount: (count: number | null) => void
  setDetectedWindingCount: (count: number | null) => void
  setCurrentPdfDoc: (doc: any | null) => void
  setCurrentPdfPage: (page: number | null) => void
  setCurrentPdfScale: (scale: number) => void
  setCurrentReferences: (refs: Reference[]) => void
  setCurrentReferenceIndex: (index: number) => void
  setCurrentRenderTask: (task: any | null) => void
  setPdfCache: (cache: PDFCache) => void
  setConversationHistory: (history: ChatMessage[]) => void
  setActiveView: (view: ActiveView) => void;
  setActiveSubMenuItem: (item: ActiveSubMenuItem) => void;
  setIsQAPopupOpen: (isOpen: boolean) => void;

  // Auth actions
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (isAuth: boolean) => void;
  setIsAuthLoading: (isLoading: boolean) => void;
  setAuthError: (error: string | null) => void;
  setShowAuthModal: (show: boolean) => void;
  setAuthModalMode: (mode: 'login' | 'register') => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  validateToken: () => Promise<boolean>;

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

  detectedProductType: null,
  productTypeConfidence: 0,
  selectedProductType: null,
  templateKeys: [],
  isDetectingProductType: false,
  detectedCoreCount: null,
  detectedWindingCount: null,

  currentPdfDoc: null,
  currentPdfPage: null,
  currentPdfScale: 1.0,
  currentReferences: [],
  currentReferenceIndex: 0,
  currentRenderTask: null,
  pdfCache: {},

  conversationHistory: [],

  activeView: 'home',
  activeSubMenuItem: null,
  isQAPopupOpen: false,

  // Auth initial state
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,
  isAuthLoading: false,
  authError: null,
  showAuthModal: false,
  authModalMode: 'login',

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
  setDetectedProductType: (type) => set({ detectedProductType: type }),
  setProductTypeConfidence: (confidence) => set({ productTypeConfidence: confidence }),
  setSelectedProductType: (type) => set({ selectedProductType: type }),
  setTemplateKeys: (keys) => set({ templateKeys: keys }),
  setIsDetectingProductType: (isDetecting) => set({ isDetectingProductType: isDetecting }),
  setDetectedCoreCount: (count) => set({ detectedCoreCount: count }),
  setDetectedWindingCount: (count) => set({ detectedWindingCount: count }),
  setCurrentPdfDoc: (doc) => set({ currentPdfDoc: doc }),
  setCurrentPdfPage: (page) => set({ currentPdfPage: page }),
  setCurrentPdfScale: (scale) => set({ currentPdfScale: scale }),
  setCurrentReferences: (refs) => set({ currentReferences: refs }),
  setCurrentReferenceIndex: (index) => set({ currentReferenceIndex: index }),
  setCurrentRenderTask: (task) => set({ currentRenderTask: task }),
  setPdfCache: (cache) => set({ pdfCache: cache }),
  setConversationHistory: (history) => set({ conversationHistory: history }),
  setActiveView: (view) => set({ activeView: view }),
  setActiveSubMenuItem: (item) => set({ activeSubMenuItem: item }),
  setIsQAPopupOpen: (isOpen) => set({ isQAPopupOpen: isOpen }),

  // Auth setters and actions
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setIsAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
  setIsAuthLoading: (isLoading) => set({ isAuthLoading: isLoading }),
  setAuthError: (error) => set({ authError: error }),
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setAuthModalMode: (mode) => set({ authModalMode: mode }),

  login: async (email: string, password: string) => {
    set({ isAuthLoading: true, authError: null });
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        set({ authError: data.detail || 'Login failed', isAuthLoading: false });
        return false;
      }
      const data = await response.json();
      localStorage.setItem('auth_token', data.access_token);

      // Fetch user info
      const userResponse = await fetch('/auth/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` },
      });
      const user = userResponse.ok ? await userResponse.json() : null;

      set({
        token: data.access_token,
        user,
        isAuthenticated: true,
        isAuthLoading: false,
        showAuthModal: false,
        authError: null,
        activeView: 'home',
      });
      return true;
    } catch {
      set({ authError: 'Network error', isAuthLoading: false });
      return false;
    }
  },

  register: async (email: string, username: string, password: string) => {
    set({ isAuthLoading: true, authError: null });
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        set({ authError: data.detail || 'Registration failed', isAuthLoading: false });
        return false;
      }
      set({ isAuthLoading: false, authModalMode: 'login', authError: null });
      return true;
    } catch {
      set({ authError: 'Network error', isAuthLoading: false });
      return false;
    }
  },

  logout: async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch {
        // Ignore errors, still clear local state
      }
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem(CHAT_STORAGE_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      authError: null,
      // Clear uploaded files state
      uploadedFileIds: [],
      processedFiles: [],
      allUploadedFiles: [],
      conversationHistory: [],
    });
  },

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
      detectedProductType: null,
      productTypeConfidence: 0,
      selectedProductType: null,
      templateKeys: [],
      isDetectingProductType: false,
      detectedCoreCount: null,
      detectedWindingCount: null,
    }),

  addChatMessage: (message) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, message],
    })),

  clearChat: () => set({ conversationHistory: [] }),
  
  // Auth validation function
  validateToken: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isAuthenticated: false });
      return false;
    }
    
    try {
      // Try to get user info to validate token
      const response = await fetch('/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const user = await response.json();
        set({ 
          token,
          user,
          isAuthenticated: true,
        });
        return true;
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        set({ 
          token: null,
          user: null,
          isAuthenticated: false,
        });
        return false;
      }
    } catch {
      // Network error, assume not authenticated
      set({ isAuthenticated: false });
      return false;
    }
  },
}))

// Storage keys constants
export const CHAT_STORAGE_KEY = 'spec_ai_chat_history'

// Helper to handle expired tokens - call this when API returns 401
export const handleExpiredToken = () => {
  localStorage.removeItem('auth_token');
  useAppStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    authError: 'Session expired. Please log in again.',
    showAuthModal: true,
    authModalMode: 'login',
  });
}
