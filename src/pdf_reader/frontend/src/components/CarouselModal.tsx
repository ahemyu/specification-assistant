import { useState, useEffect, useCallback, useRef, KeyboardEvent, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '../store/useAppStore'
import { PDFViewer } from './PDFViewer'

interface CarouselModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

interface SourceLocation {
  pdf_filename: string
  page_numbers: number[]
}

export function CarouselModal({ isOpen, onClose, onComplete }: CarouselModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editValue, setEditValue] = useState('')
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    extractionResultsData,
    extractionResultsBackendFormat,
    reviewedKeys,
    setReviewedKeys,
    setCurrentExtractionState,
    setCurrentCardIndex,
  } = useAppStore()

  // Initialize reviewedKeys when modal opens
  useEffect(() => {
    if (isOpen && extractionResultsData) {
      // Initialize reviewedKeys for any keys that don't have review state yet
      const updatedKeys = { ...reviewedKeys }
      let needsUpdate = false

      extractionResultsData.forEach((result) => {
        const keyName = result.key
        if (!updatedKeys[keyName]) {
          needsUpdate = true
          const originalValue = result.value || 'Not found'
          updatedKeys[keyName] = {
            status: 'pending',
            value: originalValue,
            originalValue: originalValue,
          }
        }
      })

      if (needsUpdate) {
        setReviewedKeys(updatedKeys)
      }
    }
  }, [isOpen, extractionResultsData])

  // Set extraction state when modal opens and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      setCurrentExtractionState('review')
      setCurrentIndex(0)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, setCurrentExtractionState])

  // Sync current index with store
  useEffect(() => {
    setCurrentCardIndex(currentIndex)
  }, [currentIndex, setCurrentCardIndex])

  // Convert extraction results to proper format
  const results = extractionResultsData || []
  const keyNames = results.map((r) => r.key)

  // Get current key and result
  const currentKey = keyNames[currentIndex] || ''
  const currentResult = results.find((r) => r.key === currentKey)
  const currentReviewState = reviewedKeys[currentKey]

  // Check if all keys are reviewed
  const allReviewed = keyNames.every((keyName) => {
    const state = reviewedKeys[keyName]
    return state && state.status !== 'pending'
  })

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentIndex < keyNames.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsEditMode(false)
    }
  }, [currentIndex, keyNames.length])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setIsEditMode(false)
    }
  }, [currentIndex])

  // Review actions
  const acceptValue = useCallback(() => {
    if (!currentKey || !currentReviewState) return

    const updatedKeys = {
      ...reviewedKeys,
      [currentKey]: {
        ...currentReviewState,
        status: 'accepted' as const,
      },
    }
    setReviewedKeys(updatedKeys)

    // Auto-advance to next card
    if (currentIndex < keyNames.length - 1) {
      goToNext()
    }
  }, [currentKey, currentReviewState, reviewedKeys, setReviewedKeys, currentIndex, keyNames.length, goToNext])

  const enterEditMode = useCallback(() => {
    if (!currentReviewState) return
    setIsEditMode(true)
    setEditValue(currentReviewState.value)
    setTimeout(() => editTextareaRef.current?.focus(), 0)
  }, [currentReviewState])

  const saveEdit = useCallback(() => {
    if (!currentKey || !currentReviewState) return

    const updatedKeys = {
      ...reviewedKeys,
      [currentKey]: {
        ...currentReviewState,
        value: editValue.trim(),
        status: 'edited' as const,
      },
    }
    setReviewedKeys(updatedKeys)
    setIsEditMode(false)

    // Auto-advance to next card
    if (currentIndex < keyNames.length - 1) {
      goToNext()
    }
  }, [currentKey, currentReviewState, reviewedKeys, setReviewedKeys, editValue, currentIndex, keyNames.length, goToNext])

  const cancelEdit = useCallback(() => {
    setIsEditMode(false)
    setEditValue(currentReviewState?.value || '')
  }, [currentReviewState])

  // Download reviewed results
  const handleDownload = useCallback(async () => {
    if (!allReviewed || !extractionResultsBackendFormat) return

    try {
      // Keep backend format and update key_value with reviewed values
      const reviewedResults: Record<string, any> = {}
      Object.entries(extractionResultsBackendFormat).forEach(([keyName, backendResult]) => {
        const reviewState = reviewedKeys[keyName]

        // Create a copy of the backend result
        reviewedResults[keyName] = { ...backendResult }

        // Update key_value with reviewed value if available
        if (reviewState) {
          reviewedResults[keyName].key_value = reviewState.value
        }
      })

      const response = await fetch('/download-extraction-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraction_results: reviewedResults }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to download Excel file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reviewed_extraction_results.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(`Error downloading results: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [allReviewed, extractionResultsBackendFormat, reviewedKeys])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // If in edit mode, only handle Escape (Enter is handled in textarea)
      if (isEditMode && editTextareaRef.current === document.activeElement) {
        if (e.key === 'Escape') {
          e.preventDefault()
          cancelEdit()
        }
        return
      }

      // Global shortcuts (when not in edit mode)
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      } else if (e.key === 'Enter' && !isEditMode) {
        e.preventDefault()
        if (currentReviewState?.status === 'pending') {
          acceptValue()
        }
      } else if ((e.key === 'e' || e.key === 'E') && !isEditMode) {
        e.preventDefault()
        enterEditMode()
      } else if (e.key === 'Escape' && !isEditMode) {
        e.preventDefault()
        if (allReviewed) {
          onComplete()
        } else {
          onClose()
        }
      } else if ((e.key === 'd' || e.key === 'D') && !isEditMode && allReviewed) {
        e.preventDefault()
        handleDownload()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isEditMode, goToPrevious, goToNext, acceptValue, enterEditMode, cancelEdit, currentReviewState, allReviewed, onClose, onComplete, handleDownload])

  // Handle textarea Enter key
  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    }
  }

  // Prepare data BEFORE early returns (Rules of Hooks)
  const displayValue = currentReviewState?.value || currentResult?.value || 'Not found'
  const description = currentResult?.references?.[0]?.text || 'No description available'

  // Convert references for PDFViewer - memoize to prevent infinite re-renders
  // MUST be called before any early returns
  const pdfReferences = useMemo(() => {
    if (!currentResult?.references) return []

    const sourceLocations = currentResult.references.map((ref) => ({
      pdf_filename: ref.file_id,
      page_numbers: [ref.page_number],
    }))

    return sourceLocations.map((loc) => ({
      filename: loc.pdf_filename,
      pages: loc.page_numbers,
    }))
  }, [currentKey])

  const sourceLocations = pdfReferences.map((ref) => ({
    pdf_filename: ref.filename,
    page_numbers: ref.pages,
  }))

  // Early returns AFTER all hooks
  if (!isOpen) {
    return null
  }

  if (!currentResult) {
    return null
  }

  return createPortal(
    <div className="modal show">
      <div className="unified-results-container">
        {/* Left Side: Carousel */}
        <div className="carousel-side">
          {/* Header */}
          <div className="carousel-modal-header">
            <h2>Extraction Results</h2>
            <div className="carousel-counter">
              <span>{currentIndex + 1}</span> / <span>{keyNames.length}</span>
            </div>
            <button
              className="modal-close"
              onClick={allReviewed ? onComplete : onClose}
              aria-label="Close results"
            >
              &times;
            </button>
          </div>

          {/* Carousel Body */}
          <div className="carousel-body">
            <button
              className="carousel-nav-btn carousel-prev"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              aria-label="Previous result"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div className="carousel-card-container">
              <div className="carousel-card">
                <ExtractionResultCard
                  keyName={currentKey}
                  value={displayValue}
                  description={description}
                  status={currentReviewState?.status || 'pending'}
                  sourceLocations={sourceLocations}
                  isEditMode={isEditMode}
                  editValue={editValue}
                  onEditValueChange={setEditValue}
                  onAccept={acceptValue}
                  onEnterEdit={enterEditMode}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  editTextareaRef={editTextareaRef}
                  onTextareaKeyDown={handleTextareaKeyDown}
                />
              </div>
            </div>

            <button
              className="carousel-nav-btn carousel-next"
              onClick={goToNext}
              disabled={currentIndex === keyNames.length - 1}
              aria-label="Next result"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          {/* Completion Banner */}
          {allReviewed && (
            <div className="completion-banner">
              <div className="completion-content">
                <svg className="completion-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <div className="completion-message">
                  <h3>All Keys Reviewed</h3>
                </div>
              </div>
              <div className="completion-actions">
                <button className="completion-view-summary-btn" onClick={onComplete}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h18v18H3z"></path>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                  View Summary
                </button>
                <button className="completion-download-btn" onClick={handleDownload}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download (D)
                </button>
              </div>
            </div>
          )}

          {/* Keyboard Hint */}
          <div className="carousel-keyboard-hint">
            Use arrow keys to navigate
          </div>
        </div>

        {/* Right Side: PDF Viewer */}
        <div className="pdf-side">
          <PDFViewer references={pdfReferences} />
        </div>
      </div>
    </div>,
    document.body
  )
}

interface ExtractionResultCardProps {
  keyName: string
  value: string
  description: string
  status: 'pending' | 'accepted' | 'edited'
  sourceLocations: SourceLocation[]
  isEditMode: boolean
  editValue: string
  onEditValueChange: (value: string) => void
  onAccept: () => void
  onEnterEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  editTextareaRef: React.RefObject<HTMLTextAreaElement>
  onTextareaKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
}

function ExtractionResultCard({
  keyName,
  value,
  description,
  status,
  sourceLocations,
  isEditMode,
  editValue,
  onEditValueChange,
  onAccept,
  onEnterEdit,
  onSaveEdit,
  onCancelEdit,
  editTextareaRef,
  onTextareaKeyDown,
}: ExtractionResultCardProps) {
  return (
    <div className="extraction-result-item">
      {/* Key Header */}
      <div className="key-header">
        <h3 className="key-name">{keyName}</h3>
        <span className={`review-status-badge status-${status}`}>
          {status === 'accepted' && 'Accepted'}
          {status === 'edited' && 'Edited'}
          {status === 'pending' && 'Pending Review'}
        </span>
      </div>

      {/* View Mode */}
      {!isEditMode && (
        <div className="view-mode-container">
          <div className="key-value">
            <strong>Value:</strong>{' '}
            <span className={value === 'Not found' ? 'not-found' : 'found'}>{value}</span>
          </div>
          <div className="review-actions">
            <button
              className="accept-btn"
              onClick={onAccept}
              disabled={status !== 'pending'}
            >
              Accept (Enter)
            </button>
            <button className="edit-value-btn" onClick={onEnterEdit}>
              Edit (E)
            </button>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditMode && (
        <div className="edit-mode-container" style={{ display: 'block' }}>
          <div className="edit-value-input-container">
            <label htmlFor="editValueInput">
              <strong>Edit Value:</strong>{' '}
              <span style={{ color: '#718096', fontWeight: 'normal', fontSize: '0.9em' }}>
                (Shift+Enter for new line)
              </span>
            </label>
            <textarea
              ref={editTextareaRef}
              id="editValueInput"
              className="edit-value-input"
              rows={3}
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onKeyDown={onTextareaKeyDown}
            />
          </div>
          <div className="edit-actions">
            <button className="save-edit-btn" onClick={onSaveEdit}>
              Save (Enter)
            </button>
            <button className="cancel-edit-btn" onClick={onCancelEdit}>
              Cancel (Esc)
            </button>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="key-description">
        <strong>Description:</strong> {description}
      </div>

      {/* Source Locations */}
      {sourceLocations.length > 0 && (
        <div className="source-locations">
          <strong>References:</strong>
          <div className="reference-buttons">
            {sourceLocations.map((loc, i) => (
              <button
                key={i}
                className="reference-btn"
                onClick={() => {
                  // TODO: Load PDF reference
                }}
              >
                {loc.pdf_filename} - p.{loc.page_numbers.join(', ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
