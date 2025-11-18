import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { useAppStore } from '../store/useAppStore'

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

interface PDFReference {
  filename: string
  pages: number[]
  bounding_box?: [number, number, number, number]
}

interface PDFViewerProps {
  references: PDFReference[]
  className?: string
}

export function PDFViewer({ references, className = '' }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const highlightCanvasRef = useRef<HTMLCanvasElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.25)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentRefIndex] = useState(0)
  const renderTaskRef = useRef<any>(null)

  const {
    currentPdfDoc,
    setCurrentPdfDoc,
    setCurrentPdfPage,
    setCurrentPdfScale,
  } = useAppStore()

  const cacheRef = useRef<Record<string, any>>({})

  // Load PDF for current reference
  useEffect(() => {
    if (!references || references.length === 0) return

    const loadPdf = async () => {
      const ref = references[currentRefIndex]
      if (!ref) return

      // Cancel any ongoing render
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }

      setIsLoading(true)
      setError(null)

      try {
        const fileId = ref.filename

        // Check cache first
        let doc = cacheRef.current[fileId]
        if (!doc) {
          const pdfUrl = `/view-pdf/${fileId}`
          const loadingTask = pdfjsLib.getDocument(pdfUrl)
          doc = await loadingTask.promise
          cacheRef.current[fileId] = doc
        }

        setCurrentPdfDoc(doc)
        const pageNum = ref.pages[0] || 1
        setCurrentPage(pageNum)
        setCurrentPdfPage(pageNum)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF')
      } finally {
        setIsLoading(false)
      }
    }

    loadPdf()
    // Zustand setters are stable and don't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRefIndex, references])

  // Render PDF page to canvas
  useEffect(() => {
    if (!currentPdfDoc || !canvasRef.current) return

    let cancelled = false

    const renderPage = async () => {
      try {
        // Cancel any ongoing render task
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel()
          } catch (e) {
            // Ignore cancellation errors
          }
          renderTaskRef.current = null
        }

        // Wait a brief moment to ensure previous render is fully cancelled
        await new Promise(resolve => setTimeout(resolve, 10))

        if (cancelled) return

        const page = await currentPdfDoc.getPage(currentPage)
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        const context = canvas.getContext('2d')
        if (!context || cancelled) return

        // Clear the canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height)

        const devicePixelRatio = window.devicePixelRatio || 1
        const viewport = page.getViewport({ scale })

        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        canvas.width = Math.floor(viewport.width * devicePixelRatio)
        canvas.height = Math.floor(viewport.height * devicePixelRatio)

        if (cancelled) return

        context.scale(devicePixelRatio, devicePixelRatio)

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        const task = page.render(renderContext)
        renderTaskRef.current = task

        await task.promise

        if (!cancelled) {
          renderTaskRef.current = null

          // Draw highlights after page is rendered
          drawHighlights()
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', err)
        }
      }
    }

    const drawHighlights = () => {
      const highlightCanvas = highlightCanvasRef.current
      const mainCanvas = canvasRef.current
      if (!highlightCanvas || !mainCanvas) {
        return
      }

      const ref = references[currentRefIndex]
      if (!ref || !ref.bounding_box) {
        return
      }

      // Only highlight if we're on the correct page
      if (!ref.pages.includes(currentPage)) {
        return
      }

      const highlightContext = highlightCanvas.getContext('2d')
      if (!highlightContext) {
        return
      }

      // Match the highlight canvas size to the main canvas
      highlightCanvas.width = mainCanvas.width
      highlightCanvas.height = mainCanvas.height
      highlightCanvas.style.width = mainCanvas.style.width
      highlightCanvas.style.height = mainCanvas.style.height

      // Clear previous highlights
      highlightContext.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height)

      const bbox = ref.bounding_box
      const devicePixelRatio = window.devicePixelRatio || 1

      // Scale coordinates from pdfplumber (PDF points) to canvas pixels
      // pdfplumber uses: [x0, top, x1, bottom]
      const x = bbox[0] * scale * devicePixelRatio
      const y = bbox[1] * scale * devicePixelRatio
      const width = (bbox[2] - bbox[0]) * scale * devicePixelRatio
      const height = (bbox[3] - bbox[1]) * scale * devicePixelRatio

      // Draw semi-transparent yellow highlight
      highlightContext.fillStyle = 'rgba(255, 255, 0, 0.3)'
      highlightContext.fillRect(x, y, width, height)
    }

    renderPage()

    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch (e) {
          // Ignore cancellation errors
        }
        renderTaskRef.current = null
      }
    }
  }, [currentPdfDoc, currentPage, scale, references, currentRefIndex])

  // Sync scale with store
  useEffect(() => {
    setCurrentPdfScale(scale)
    // Zustand setter is stable and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleZoomReset = () => {
    setScale(1.0)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPdfDoc && currentPage < currentPdfDoc.numPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  if (!references || references.length === 0) {
    return (
      <div className={`pdf-viewer-panel ${className}`}>
        <div className="pdf-no-reference">
          <p>No PDF reference available for this key</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`pdf-viewer-panel ${className}`} id="pdfViewerPanel">
      <div className="pdf-controls">
        <div className="zoom-controls">
          <button
            id="zoomOut"
            className="zoom-btn"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            title="Zoom Out"
          >
            -
          </button>
          <span id="zoomLevel" className="zoom-level">
            {Math.round(scale * 100)}%
          </span>
          <button
            id="zoomIn"
            className="zoom-btn"
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            title="Zoom In"
          >
            +
          </button>
          <button
            id="zoomReset"
            className="zoom-btn"
            onClick={handleZoomReset}
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>

        <div className="page-controls">
          <button
            id="prevPage"
            className="page-btn"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            title="Previous Page"
          >
            ←
          </button>
          <span className="page-info">
            <span id="currentPdfPage">{currentPage}</span> /{' '}
            <span id="totalPdfPages">{currentPdfDoc?.numPages || 0}</span>
          </span>
          <button
            id="nextPage"
            className="page-btn"
            onClick={handleNextPage}
            disabled={!currentPdfDoc || currentPage >= currentPdfDoc.numPages}
            title="Next Page"
          >
            →
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="pdf-loading">
          <div className="spinner" />
          <p>Loading PDF...</p>
        </div>
      )}

      {error && (
        <div className="pdf-error">
          <p>Failed to load PDF: {error}</p>
        </div>
      )}

      <div className="pdf-canvas-container" id="pdfCanvasContainer">
        <canvas ref={canvasRef} id="pdfCanvas" />
        <canvas
          ref={highlightCanvasRef}
          id="pdfHighlightCanvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  )
}
