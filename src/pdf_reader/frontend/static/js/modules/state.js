// State Management Module
// Manages all application state and DOM element references

// Storage keys
export const CHAT_STORAGE_KEY = 'specification_assistant_chat_history';
export const PDF_STORAGE_KEY = 'specification_assistant_uploaded_pdfs';

// File management state
export let uploadedFileIds = [];
export let processedFiles = [];
export let allUploadedFiles = [];
export let extractionResultsData = null;
export let currentExtractionMode = 'excel';
export let uploadedTemplateId = null;
export let uploadedTemplateKeys = [];

// Carousel state
export let carouselResults = [];
export let carouselKeyNames = [];
export let currentCardIndex = 0;

// Review state for key extraction
// Structure: { keyName: { status: 'pending'|'accepted'|'edited', value: string, originalValue: string } }
export let reviewedKeys = {};
export let isEditMode = false;

// PDF Viewer state
export let currentPdfDoc = null;
export let currentPdfPage = null;
export let currentPdfScale = 1.0;
export let currentReferences = [];
export let currentReferenceIndex = 0;
export let currentRenderTask = null;
export let pdfCache = {};

// Chat history state
export let conversationHistory = [];

// State update functions
export function setUploadedFileIds(ids) { uploadedFileIds = ids; }
export function setProcessedFiles(files) { processedFiles = files; }
export function setAllUploadedFiles(files) { allUploadedFiles = files; }
export function setExtractionResultsData(data) { extractionResultsData = data; }
export function setCurrentExtractionMode(mode) { currentExtractionMode = mode; }
export function setUploadedTemplateId(id) { uploadedTemplateId = id; }
export function setUploadedTemplateKeys(keys) { uploadedTemplateKeys = keys; }
export function setCarouselResults(results) { carouselResults = results; }
export function setCarouselKeyNames(names) { carouselKeyNames = names; }
export function setCurrentCardIndex(index) { currentCardIndex = index; }
export function setReviewedKeys(keys) { reviewedKeys = keys; }
export function setIsEditMode(mode) { isEditMode = mode; }
export function setCurrentPdfDoc(doc) { currentPdfDoc = doc; }
export function setCurrentPdfPage(page) { currentPdfPage = page; }
export function setCurrentPdfScale(scale) { currentPdfScale = scale; }
export function setCurrentReferences(refs) { currentReferences = refs; }
export function setCurrentReferenceIndex(index) { currentReferenceIndex = index; }
export function setCurrentRenderTask(task) { currentRenderTask = task; }
export function setPdfCache(cache) { pdfCache = cache; }
export function setConversationHistory(history) { conversationHistory = history; }

// DOM element references
export const fileInput = document.getElementById('fileInput');
export const selectedFilesDiv = document.getElementById('selectedFiles');
export const uploadBtn = document.getElementById('uploadBtn');
export const statusDiv = document.getElementById('status');
export const resultsDiv = document.getElementById('results');
export const resultsHeader = document.getElementById('resultsHeader');
export const deleteAllBtn = document.getElementById('deleteAllBtn');
export const spinner = document.getElementById('spinner');

// Main view elements
export const uploadView = document.getElementById('uploadView');
export const extractView = document.getElementById('extractView');
export const qaView = document.getElementById('qaView');
export const mainTabButtons = document.querySelectorAll('.main-tab-btn');

// Chat elements
export const questionInput = document.getElementById('questionInput');
export const askBtn = document.getElementById('askBtn');
export const chatMessages = document.getElementById('chatMessages');
export const typingIndicator = document.getElementById('typingIndicator');
export const clearChatBtn = document.getElementById('clearChatBtn');
export const modelSelect = document.getElementById('modelSelect');

// Tab elements
export const excelTab = document.getElementById('excelTab');
export const manualTab = document.getElementById('manualTab');
export const excelTabContent = document.getElementById('excelTabContent');
export const manualTabContent = document.getElementById('manualTabContent');

// Excel template elements
export const excelFileInput = document.getElementById('excelFileInput');
export const excelFileName = document.getElementById('excelFileName');
export const excelContextInput = document.getElementById('excelContextInput');
export const extractExcelBtn = document.getElementById('extractExcelBtn');
export const keysPreview = document.getElementById('keysPreview');
export const keysPreviewList = document.getElementById('keysPreviewList');

// Manual input elements
export const keyInput = document.getElementById('keyInput');
export const contextInput = document.getElementById('contextInput');
export const extractBtn = document.getElementById('extractBtn');

// Shared elements
export const extractSpinner = document.getElementById('extractSpinner');
export const extractStatus = document.getElementById('extractStatus');
export const extractionResults = document.getElementById('extractionResults');

// Modal elements
export const previewModal = document.getElementById('previewModal');
export const closeModal = document.getElementById('closeModal');
export const modalTitle = document.getElementById('modalTitle');
export const previewFilename = document.getElementById('previewFilename');
export const previewSize = document.getElementById('previewSize');
export const previewContent = document.getElementById('previewContent');

// Carousel modal elements
export const resultsCarouselModal = document.getElementById('resultsCarouselModal');
export const carouselModalContent = document.getElementById('carouselModalContent');
export const closeCarousel = document.getElementById('closeCarousel');
export const carouselCard = document.getElementById('carouselCard');
export const prevCardBtn = document.getElementById('prevCardBtn');
export const nextCardBtn = document.getElementById('nextCardBtn');
export const currentCardNumber = document.getElementById('currentCardNumber');
export const totalCards = document.getElementById('totalCards');

// PDF Viewer elements
export const pdfViewerPanel = document.getElementById('pdfViewerPanel');
export const pdfControls = document.querySelector('.pdf-controls');
export const pdfCanvas = document.getElementById('pdfCanvas');
export const pdfCanvasContainer = document.getElementById('pdfCanvasContainer');
export const pdfTextLayer = document.getElementById('pdfTextLayer');
export const pdfHighlightLayer = document.getElementById('pdfHighlightLayer');
export const pdfLoading = document.getElementById('pdfLoading');
export const pdfError = document.getElementById('pdfError');
export const pdfNoReference = document.getElementById('pdfNoReference');
export const zoomInBtn = document.getElementById('zoomIn');
export const zoomOutBtn = document.getElementById('zoomOut');
export const zoomResetBtn = document.getElementById('zoomReset');
export const zoomLevel = document.getElementById('zoomLevel');
export const currentPdfPageSpan = document.getElementById('currentPdfPage');
export const totalPdfPagesSpan = document.getElementById('totalPdfPages');
export const prevPageBtn = document.getElementById('prevPage');
export const nextPageBtn = document.getElementById('nextPage');
