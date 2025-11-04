// PDF Viewer Module
// Handles PDF rendering and navigation

import {
    pdfCanvas,
    pdfControls,
    pdfLoading,
    pdfError,
    pdfNoReference,
    zoomInBtn,
    zoomOutBtn,
    zoomResetBtn,
    zoomLevel,
    currentPdfPageSpan,
    totalPdfPagesSpan,
    prevPageBtn,
    nextPageBtn,
    currentPdfDoc,
    currentPdfScale,
    currentReferences,
    currentRenderTask,
    pdfCache,
    setCurrentPdfDoc,
    setCurrentPdfScale,
    setCurrentReferences,
    setCurrentRenderTask
} from './state.js';

// Track current PDF page number
let currentPdfPageNum = 1;
let currentReferenceIndex = 0;

// Initialize PDF.js worker
let pdfjsLib;
(async function initPdfJs() {
    try {
        pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
    } catch (error) {
        console.error('Failed to load PDF.js:', error);
    }
})();

// Show "no PDF reference" message
export function showNoPdfReference() {
    pdfCanvas.style.display = 'none';
    pdfLoading.classList.add('hidden');
    pdfError.style.display = 'none';
    pdfControls.style.display = 'none';
    pdfNoReference.classList.remove('hidden');
    setCurrentPdfDoc(null);
    setCurrentReferences([]);
    updatePageNavButtons();
}

// Helper function to load PDF for a result
export async function loadPdfForResult(result) {
    const locations = (result && result.source_locations) || [];

    if (locations.length > 0) {
        const references = locations.map(loc => ({
            filename: loc.pdf_filename,
            pages: loc.page_numbers || []
        }));
        await openPdfViewer(references);
    } else {
        showNoPdfReference();
    }
}

// Open PDF Viewer with references
async function openPdfViewer(references) {
    if (!references || references.length === 0) {
        showNoPdfReference();
        return;
    }

    setCurrentReferences(references);
    currentReferenceIndex = 0;

    pdfNoReference.classList.add('hidden');
    pdfControls.style.display = 'flex';

    // Set first reference button as active
    const allRefButtons = document.querySelectorAll('.reference-btn');
    allRefButtons.forEach((btn, i) => {
        btn.classList.toggle('active', i === 0);
    });

    await loadReference(0);
}

// Load a specific reference by index
async function loadReferenceByIndex(index) {
    if (index < 0 || index >= currentReferences.length) return;
    currentReferenceIndex = index;

    const allRefButtons = document.querySelectorAll('.reference-btn');
    allRefButtons.forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    await loadReference(index);
}

// Load a specific reference (PDF + page)
async function loadReference(index) {
    const ref = currentReferences[index];
    if (!ref) return;

    // Cancel any ongoing render task
    if (currentRenderTask) {
        currentRenderTask.cancel();
        setCurrentRenderTask(null);
    }

    pdfLoading.classList.remove('hidden');
    pdfError.style.display = 'none';
    pdfCanvas.style.display = 'none';

    try {
        const fileId = ref.filename.replace('.pdf', '');

        // Check if PDF is already cached
        if (pdfCache[fileId]) {
            setCurrentPdfDoc(pdfCache[fileId]);
        } else {
            const pdfUrl = `/pdf/${fileId}`;
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const doc = await loadingTask.promise;
            setCurrentPdfDoc(doc);
            pdfCache[fileId] = doc;
        }

        const pageNum = ref.pages[0] || 1;
        await renderPdfPage(pageNum);

        pdfLoading.classList.add('hidden');
        pdfCanvas.style.display = 'block';
    } catch (error) {
        console.error('Error loading PDF:', error);
        pdfLoading.classList.add('hidden');
        pdfError.style.display = 'block';
        pdfError.querySelector('p').textContent = `Failed to load PDF: ${error.message}`;
    }
}

// Render a specific page of the current PDF
async function renderPdfPage(pageNumber) {
    if (!currentPdfDoc) return;

    try {
        // Cancel any ongoing render task
        if (currentRenderTask) {
            currentRenderTask.cancel();
            setCurrentRenderTask(null);
        }

        const page = await currentPdfDoc.getPage(pageNumber);
        currentPdfPageNum = pageNumber;

        currentPdfPageSpan.textContent = pageNumber;
        totalPdfPagesSpan.textContent = currentPdfDoc.numPages;

        const devicePixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: currentPdfScale });

        const canvas = pdfCanvas;
        const context = canvas.getContext('2d');

        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';
        canvas.width = Math.floor(viewport.width * devicePixelRatio);
        canvas.height = Math.floor(viewport.height * devicePixelRatio);

        context.scale(devicePixelRatio, devicePixelRatio);

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        const task = page.render(renderContext);
        setCurrentRenderTask(task);
        await task.promise;
        setCurrentRenderTask(null);

        updatePageNavButtons();
    } catch (error) {
        if (error.name !== 'RenderingCancelledException') {
            console.error('Error rendering PDF page:', error);
        }
        setCurrentRenderTask(null);
    }
}

// Zoom controls
function zoomIn() {
    setCurrentPdfScale(Math.min(currentPdfScale + 0.25, 3.0));
    updateZoom();
}

function zoomOut() {
    setCurrentPdfScale(Math.max(currentPdfScale - 0.25, 0.5));
    updateZoom();
}

function resetZoom() {
    setCurrentPdfScale(1.0);
    updateZoom();
}

async function updateZoom() {
    zoomLevel.textContent = `${Math.round(currentPdfScale * 100)}%`;
    if (currentPdfDoc && currentPdfPageNum) {
        await renderPdfPage(currentPdfPageNum);
    }
}

// Page navigation
function nextPdfPage() {
    if (currentPdfDoc && currentPdfPageNum < currentPdfDoc.numPages) {
        renderPdfPage(currentPdfPageNum + 1);
    }
}

function prevPdfPage() {
    if (currentPdfDoc && currentPdfPageNum > 1) {
        renderPdfPage(currentPdfPageNum - 1);
    }
}

function updatePageNavButtons() {
    if (currentPdfDoc) {
        prevPageBtn.disabled = currentPdfPageNum <= 1;
        nextPageBtn.disabled = currentPdfPageNum >= currentPdfDoc.numPages;
    } else {
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
    }
}

// Initialize PDF viewer event listeners
export function initPdfViewer() {
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    zoomResetBtn.addEventListener('click', resetZoom);
    prevPageBtn.addEventListener('click', prevPdfPage);
    nextPageBtn.addEventListener('click', nextPdfPage);

    // Handle clicks on reference buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('reference-btn')) {
            const clickedIndex = parseInt(e.target.dataset.refIndex);
            loadReferenceByIndex(clickedIndex);
        }
    });
}
