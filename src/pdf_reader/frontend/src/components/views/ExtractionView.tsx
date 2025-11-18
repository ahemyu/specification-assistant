import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { showNotification } from '../../utils/notifications'
import { Button } from '../ui'
import { CarouselModal } from '../CarouselModal'
import { SummaryView } from '../SummaryView'
import type { ExtractionResult } from '../../types'

// Backend extraction response format
interface BackendExtractionResult {
  key_value: string | null
  source_locations: Array<{
    pdf_filename: string
    page_numbers: number[]
    bounding_box?: [number, number, number, number]
  }>
  description: string
}

interface ExtractionResponse {
  [key: string]: BackendExtractionResult
}

// Transform backend response to frontend format
function transformExtractionResponse(backendData: ExtractionResponse): ExtractionResult[] {
  return Object.entries(backendData).map(([keyName, result]) => {
    // Flatten source_locations to references
    const references = result.source_locations.flatMap((location) =>
      location.page_numbers.map((pageNum) => ({
        file_id: location.pdf_filename.replace(/.pdf$/i, ''),
        page_number: pageNum,
        text: result.description || '',
        bounding_box: location.bounding_box,
      }))
    )

    return {
      key: keyName,
      value: result.key_value || 'Not found',
      references,
    }
  })
}

const PRODUCT_TYPES = ['Stromwandler', 'Spannungswandler', 'Kombiwandler'] as const
type ProductType = typeof PRODUCT_TYPES[number]

const isDevMode = import.meta.env.VITE_DEV_MODE === 'true' || localStorage.getItem('dev_mode') === 'true'

export function ExtractionView() {
  const keyTextareaRef = useRef<HTMLTextAreaElement>(null)

  const [isExtracting, setIsExtracting] = useState(false)
  const [manualKeys, setManualKeys] = useState('')
  const [isCarouselOpen, setIsCarouselOpen] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showDevInput, setShowDevInput] = useState(false)

  const {
    uploadedFileIds,
    extractionResultsData,
    reviewedKeys,
    detectedProductType,
    productTypeConfidence,
    selectedProductType,
    setExtractionResultsData,
    setExtractionResultsBackendFormat,
    setCurrentExtractionState,
    resetExtractionState,
    setReviewedKeys,
    setSelectedProductType,
  } = useAppStore()

  useEffect(() => {
    if (detectedProductType && !selectedProductType) {
      setSelectedProductType(detectedProductType)
    }
  }, [detectedProductType, selectedProductType, setSelectedProductType])

  const handleProductTypeSelect = (productType: ProductType) => {
    setSelectedProductType(productType)
  }

  const handleExtractManually = async () => {
    const keysText = manualKeys.trim()
    if (!keysText || uploadedFileIds.length === 0) {
      showNotification('Please enter at least one key to extract', 'error')
      return
    }

    const keyNames = keysText
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    if (keyNames.length === 0) {
      showNotification('Please enter at least one key to extract', 'error')
      return
    }

    setIsExtracting(true)
    showNotification('Extracting keys using AI...', 'info')

    try {
      const response = await fetch('/extract-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: uploadedFileIds,
          key_names: keyNames,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to extract keys')
      }

      const backendData: ExtractionResponse = await response.json()
      const transformedData = transformExtractionResponse(backendData)
      setExtractionResultsData(transformedData)
      setExtractionResultsBackendFormat(backendData)
      showNotification('Keys extracted successfully!', 'success')

      // Open carousel modal immediately
      setTimeout(() => openCarousel(), 100)
    } catch (error) {
      showNotification(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setIsExtracting(false)
    }
  }

  const initializeReviewedKeys = () => {
    if (!extractionResultsData) return

    const initialReviewedKeys: Record<string, import('../../types').ReviewedKey> = {}
    extractionResultsData.forEach((result) => {
      const keyName = result.key
      if (!reviewedKeys[keyName]) {
        const originalValue = result.value || 'Not found'
        initialReviewedKeys[keyName] = {
          status: 'pending',
          value: originalValue,
          originalValue: originalValue,
        }
      } else {
        initialReviewedKeys[keyName] = reviewedKeys[keyName]
      }
    })
    setReviewedKeys(initialReviewedKeys)
  }

  const openCarousel = () => {
    initializeReviewedKeys()
    setIsCarouselOpen(true)
  }

  const handleCarouselClose = () => {
    setIsCarouselOpen(false)
  }

  const handleCarouselComplete = () => {
    setIsCarouselOpen(false)
    setShowSummary(true)
    setCurrentExtractionState('summary')
  }

  const handleReviewKey = () => {
    // Reopen carousel for reviewing
    setShowSummary(false)
    openCarousel()
  }

  const handleStartNewExtraction = () => {
    setShowSummary(false)
    resetExtractionState()
    setManualKeys('')
    setShowDevInput(false)
    setCurrentExtractionState('setup')
  }

  return (
    <div className="tab-view active" id="extractView">
      {/* Show summary view if in summary state */}
      {showSummary ? (
        <SummaryView
          onReviewKey={handleReviewKey}
          onStartNewExtraction={handleStartNewExtraction}
        />
      ) : (
        <div id="extractionSetupView">
          <h2 className="view-title">Extract Keys from PDFs</h2>
          <p className="view-subtitle">
            Select the product type to extract relevant specifications
          </p>

          {/* Product Type Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Product Type</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {PRODUCT_TYPES.map((type) => {
                const isDetected = detectedProductType === type
                const isSelected = selectedProductType === type
                return (
                  <button
                    key={type}
                    onClick={() => handleProductTypeSelect(type)}
                    style={{
                      padding: '1rem 1.5rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #10B981' : '2px solid #374151',
                      backgroundColor: isSelected ? '#D1FAE5' : '#1F2937',
                      color: isSelected ? '#065F46' : '#E5E7EB',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: isSelected ? '600' : '400',
                      transition: 'all 0.2s',
                      minWidth: '180px',
                      position: 'relative',
                    }}
                  >
                    <div>{type}</div>
                    {isDetected && productTypeConfidence > 0 && (
                      <div style={{
                        marginTop: '0.25rem',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          flex: 1,
                          height: '4px',
                          backgroundColor: isSelected ? '#10B981' : '#374151',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${productTypeConfidence * 100}%`,
                            backgroundColor: isSelected ? '#059669' : '#10B981',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{
                          whiteSpace: 'nowrap',
                          opacity: 0.9
                        }}>
                          {Math.round(productTypeConfidence * 100)}%
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            {detectedProductType && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#1F2937',
                borderRadius: '6px',
                border: '1px solid #374151'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: '500' }}>
                    Auto-detected:
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#E5E7EB' }}>
                    {detectedProductType}
                  </span>
                  {productTypeConfidence > 0 && (
                    <span style={{
                      fontSize: '0.85rem',
                      color: '#9CA3AF',
                      marginLeft: 'auto'
                    }}>
                      Confidence: {Math.round(productTypeConfidence * 100)}%
                    </span>
                  )}
                </div>
                {productTypeConfidence > 0 && productTypeConfidence < 0.7 && (
                  <div style={{ fontSize: '0.8rem', color: '#F59E0B', marginTop: '0.25rem' }}>
                    Low confidence - please verify the selection
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dev Mode Button */}
          {isDevMode && !showDevInput && (
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={() => setShowDevInput(true)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #6B7280',
                  backgroundColor: '#374151',
                  color: '#E5E7EB',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Dev Mode: Manual Input
              </button>
            </div>
          )}

          {/* Manual Input (Dev Mode Only) */}
          {showDevInput && (
            <div className="tab-content active" id="manualTabContent" style={{ marginTop: '2rem' }}>
              <div className="key-input-area">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Enter Keys to Extract (Dev Mode)</h3>
                  <button
                    onClick={() => setShowDevInput(false)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #6B7280',
                      backgroundColor: '#374151',
                      color: '#E5E7EB',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Hide
                  </button>
                </div>
                <p className="section-subtitle">Enter one key per line</p>

                <div className="key-input-group">
                  <textarea
                    id="keyInput"
                    ref={keyTextareaRef}
                    rows={8}
                    placeholder="Enter key names, one per line..."
                    value={manualKeys}
                    onChange={(e) => setManualKeys(e.target.value)}
                  />
                </div>

                <Button
                  id="extractBtn"
                  className="extract-btn"
                  onClick={handleExtractManually}
                  disabled={uploadedFileIds.length === 0 || isExtracting}
                  isLoading={isExtracting}
                  title={uploadedFileIds.length === 0 ? 'Please upload PDFs first' : ''}
                >
                  Extract Keys
                </Button>

                {uploadedFileIds.length === 0 && (
                  <p style={{ color: '#EF4444', marginTop: '8px', fontSize: '0.9em' }}>
                    Please upload PDF files in the Upload tab first
                  </p>
                )}
              </div>
            </div>
          )}

          {isExtracting && (
            <div className="spinner" id="extractSpinner" aria-live="polite" aria-label="Extracting" />
          )}
        </div>
      )}

      {/* Carousel Modal */}
      <CarouselModal
        isOpen={isCarouselOpen}
        onClose={handleCarouselClose}
        onComplete={handleCarouselComplete}
      />
    </div>
  )
}
