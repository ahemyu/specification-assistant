import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { ExtractionResult } from '../types'
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
    reviewedKeys,
    setReviewedKeys,
    setCurrentExtractionState,
    setCurrentCardIndex,
  } = useAppStore()

  // Convert extraction results to proper format
  const results = extractionResultsData || []
  const keyNames = results.map((r) => r.key)

  // Set extraction state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentExtractionState('review')
    }
  }, [isOpen, setCurrentExtractionState])

  // Sync current index with store
  useEffect(() => {
    setCurrentCardIndex(currentIndex)
  }, [currentIndex, setCurrentCardIndex])

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
    if (!allReviewed) return

    try {
      const reviewedResults: Record<string, ExtractionResult> = {}
      keyNames.forEach((keyName) => {
        const result = results.find((r) => r.key === keyName)
        const reviewState = reviewedKeys[keyName]
        if (result && reviewState) {
          reviewedResults[keyName] = {
            ...result,
            value: reviewState.value,
          }
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
  }, [allReviewed, keyNames, results, reviewedKeys])

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
        if (allReviewed) {
          e.preventDefault()
          onClose()
        }
      } else if ((e.key === 'd' || e.key === 'D') && !isEditMode && allReviewed) {
        e.preventDefault()
        handleDownload()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isEditMode, goToPrevious, goToNext, acceptValue, enterEditMode, cancelEdit, currentReviewState, allReviewed, onClose, handleDownload])

  // Handle textarea Enter key
  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    }
  }

  if (!isOpen || !currentResult) return null

  const displayValue = currentReviewState?.value || currentResult.value || 'Not found'
  const sourceLocations = (currentResult.references || []).map((ref) => ({
    pdf_filename: ref.file_id,
    page_numbers: [ref.page_number],
  }))

  // Convert references for PDFViewer
  const pdfReferences = sourceLocations.map((loc) => ({
    filename: loc.pdf_filename,
    pages: loc.page_numbers,
  }))

  return (
    <div className="modal-overlay results-carousel-modal show">
      <div className="unified-results-container">
        {/* Left Side: Carousel */}
        <div className="carousel-side">
          {/* Header */}
          <div className="carousel-modal-header">
            <h2>Review Results</h2>
            <div className={`carousel-counter ${allReviewed ? 'review-complete' : ''}`}>
              {allReviewed ? (
                <>
                  <span>Review Complete</span>
                  <span style={{ marginLeft: '4px' }}>✓</span>
                </>
              ) : (
                <>
                  <span>{currentIndex + 1}</span> / <span>{keyNames.length}</span>
                </>
              )}
            </div>
            <button className="close-modal-btn" onClick={onClose} aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Completion Banner */}
          {allReviewed && (
            <div className="completion-banner" id="completionBanner">
              <div className="completion-message">
                <span className="completion-icon">✓</span>
                <div>
                  <strong>All keys reviewed!</strong>
                  <p>You can now download results or view summary</p>
                </div>
              </div>
              <div className="completion-actions">
                <button className="completion-btn download" onClick={handleDownload}>
                  Download Results
                </button>
                <button className="completion-btn summary" onClick={onComplete}>
                  View Summary
                </button>
              </div>
            </div>
          )}

          {/* Carousel Body */}
          <div className="carousel-body">
            <button
              className="carousel-nav-btn prev"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="carousel-card-container">
              <div className="carousel-card">
                <ExtractionResultCard
                  keyName={currentKey}
                  value={displayValue}
                  description={`Key: ${currentKey}`}
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
              className="carousel-nav-btn next"
              onClick={goToNext}
              disabled={currentIndex === keyNames.length - 1}
              aria-label="Next"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Keyboard Hint */}
          <div className="carousel-keyboard-hint">
            {allReviewed
              ? 'Press D to download, ESC to view summary'
              : 'Use arrow keys to navigate'}
          </div>
        </div>

        {/* Right Side: PDF Viewer */}
        <div className="pdf-viewer-side">
          <PDFViewer references={pdfReferences} />
        </div>
      </div>
    </div>
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
        <div className="edit-mode-container">
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
                  console.log('Load PDF:', loc)
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
