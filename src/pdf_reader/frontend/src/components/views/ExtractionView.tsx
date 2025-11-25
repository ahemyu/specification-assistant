import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { showNotification } from '../../utils/notifications'
import { Button } from '../ui'
import { CarouselModal } from '../CarouselModal'
import { SummaryView } from '../SummaryView'
import { getKeysForProductType, filterKeysByCount, type KeyWithCategory } from '../../data/keyTemplates'
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

export function ExtractionView() {
  const keyTextareaRef = useRef<HTMLTextAreaElement>(null)

  const [isExtracting, setIsExtracting] = useState(false)
  const [manualKeys, setManualKeys] = useState('')
  const [isCarouselOpen, setIsCarouselOpen] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showDevInput, setShowDevInput] = useState(false)
  const [isDetectingCounts, setIsDetectingCounts] = useState(false)
  const [extractionComplete, setExtractionComplete] = useState(false)
  const [showAllKeysModal, setShowAllKeysModal] = useState(false)

  const {
    uploadedFileIds,
    extractionResultsData,
    reviewedKeys,
    detectedProductType,
    productTypeConfidence,
    selectedProductType,
    templateKeys,
    isDetectingProductType,
    setExtractionResultsData,
    setExtractionResultsBackendFormat,
    setCurrentExtractionState,
    resetExtractionState,
    setReviewedKeys,
    setSelectedProductType,
    setTemplateKeys,
  } = useAppStore()

  useEffect(() => {
    if (detectedProductType && !selectedProductType) {
      setSelectedProductType(detectedProductType)
    }
  }, [detectedProductType, selectedProductType, setSelectedProductType])

  // Load template keys and detect counts when product type is selected
  useEffect(() => {
    if (selectedProductType && uploadedFileIds.length > 0) {
      const baseKeys = getKeysForProductType(selectedProductType)

      // Detect core/winding counts to optimize key list
      setIsDetectingCounts(true)
      fetch('/detect-core-winding-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: uploadedFileIds,
          product_type: selectedProductType,
        }),
      })
        .then(async (response) => {
          if (response.ok) {
            const data = await response.json()

            // Filter keys based on detected counts
            const filteredKeys = filterKeysByCount(
              baseKeys,
              data.max_core_number,
              data.max_winding_number
            )
            setTemplateKeys(filteredKeys)
          } else {
            // If detection fails, use all keys
            setTemplateKeys(baseKeys)
          }
        })
        .catch((error) => {
          console.error('Error detecting counts:', error)
          // If detection fails, use all keys
          setTemplateKeys(baseKeys)
        })
        .finally(() => {
          setIsDetectingCounts(false)
        })
    } else if (selectedProductType) {
      // No PDFs uploaded yet, just load base template
      const keys = getKeysForProductType(selectedProductType)
      setTemplateKeys(keys)
    }
  }, [selectedProductType, uploadedFileIds, setTemplateKeys])

  const handleProductTypeSelect = (productType: ProductType) => {
    setSelectedProductType(productType)
  }

  const handleExtractFromTemplate = async () => {
    if (!selectedProductType || templateKeys.length === 0 || uploadedFileIds.length === 0) {
      showNotification('Please select a product type and upload PDFs first', 'error')
      return
    }

    setIsExtracting(true)
    setExtractionComplete(false)
    showNotification(`Extracting ${templateKeys.length} keys using AI...`, 'info')

    try {
      const response = await fetch('/extract-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: uploadedFileIds,
          key_names: templateKeys.map(k => k.name),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to extract keys')
      }

      const backendData: ExtractionResponse = await response.json()
      console.log('========== TEMPLATE EXTRACTION COMPLETE ==========')
      console.log('Received backend data with', Object.keys(backendData).length, 'keys')

      const transformedData = transformExtractionResponse(backendData)
      console.log('Transformed to', transformedData.length, 'results')
      console.log('Setting extraction results data...')

      setExtractionResultsData(transformedData)
      setExtractionResultsBackendFormat(backendData)

      console.log('Setting extractionComplete to true...')
      setExtractionComplete(true)

      showNotification('Keys extracted successfully!', 'success')

      // Force carousel to open with multiple attempts
      console.log('Attempting to open carousel in 200ms...')
      setTimeout(() => {
        console.log('ATTEMPTING CAROUSEL OPEN - extractionResultsData should be set')
        try {
          openCarousel()
        } catch (error) {
          console.error('FAILED to open carousel on first attempt:', error)
          // Try again after a longer delay
          setTimeout(() => {
            console.log('RETRY: Attempting carousel open again...')
            try {
              openCarousel()
            } catch (retryError) {
              console.error('FAILED on retry:', retryError)
            }
          }, 500)
        }
      }, 200)
    } catch (error) {
      showNotification(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setIsExtracting(false)
    }
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
    setExtractionComplete(false)
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
      console.log('========== MANUAL EXTRACTION COMPLETE ==========')
      console.log('Received backend data with', Object.keys(backendData).length, 'keys')

      const transformedData = transformExtractionResponse(backendData)
      console.log('Transformed to', transformedData.length, 'results')
      console.log('Setting extraction results data...')

      setExtractionResultsData(transformedData)
      setExtractionResultsBackendFormat(backendData)

      console.log('Setting extractionComplete to true...')
      setExtractionComplete(true)

      showNotification('Keys extracted successfully!', 'success')

      // Force carousel to open with multiple attempts
      console.log('Attempting to open carousel in 200ms...')
      setTimeout(() => {
        console.log('ATTEMPTING CAROUSEL OPEN - extractionResultsData should be set')
        try {
          openCarousel()
        } catch (error) {
          console.error('FAILED to open carousel on first attempt:', error)
          // Try again after a longer delay
          setTimeout(() => {
            console.log('RETRY: Attempting carousel open again...')
            try {
              openCarousel()
            } catch (retryError) {
              console.error('FAILED on retry:', retryError)
            }
          }, 500)
        }
      }, 200)
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
    console.log('========== OPEN CAROUSEL CALLED ==========')
    console.log('extractionResultsData:', extractionResultsData)
    console.log('extractionResultsData length:', extractionResultsData?.length)
    console.log('extractionComplete:', extractionComplete)
    console.log('isCarouselOpen:', isCarouselOpen)

    if (!extractionResultsData || extractionResultsData.length === 0) {
      console.error('❌ CANNOT OPEN CAROUSEL: No extraction results available')
      console.error('extractionResultsData is:', extractionResultsData)
      showNotification('No extraction results available', 'error')
      return
    }

    try {
      initializeReviewedKeys()
      setIsCarouselOpen(true)
    } catch (error) {
      console.error('ERROR OPENING CAROUSEL:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      showNotification('Error opening results viewer. Please try again.', 'error')
    }
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
    setExtractionComplete(false)
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
          <h1 className="view-title">Extract Keys from PDFs</h1>
          <p className="view-subtitle">
            Select the product type to extract relevant specifications
          </p>

          {/* Product Type Selection - Hidden when in manual mode */}
          {!showDevInput && (
          <div className="product-cards-wrapper" style={{ marginBottom: '2rem' }}>
            {PRODUCT_TYPES.map((type) => {
              const isDetected = detectedProductType === type
              const isSelected = selectedProductType === type
              const isDisabled = isDetectingProductType

              return (
                <button
                  key={type}
                  onClick={() => handleProductTypeSelect(type)}
                  disabled={isDisabled}
                  className={`product-card ${isSelected ? 'selected' : ''} ${
                    isDisabled ? 'disabled' : ''
                  }`}
                >
                  <div className="product-card-icon">
                    <span style={{ fontSize: '3em' }}>
                      {type === 'Stromwandler' && '🔌'}
                      {type === 'Spannungswandler' && '⚡'}
                      {type === 'Kombiwandler' && '🎛️'}
                    </span>
                  </div>
                  <div className="product-card-content">
                    <h3 className="product-card-title">{type}</h3>
                    {isDetected && productTypeConfidence > 0 && (
                      <div className="confidence-bar-container">
                        <div className="confidence-bar-bg">
                          <div
                            className="confidence-bar-fg"
                            style={{ width: `${productTypeConfidence * 100}%` }}
                          />
                        </div>
                        <span className="confidence-bar-text">
                          {Math.round(productTypeConfidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          )}

          {/* Template Keys Preview and Extract Button - Hidden when in manual mode */}
          {!showDevInput && selectedProductType && templateKeys.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="key-input-area">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#2d3748', margin: 0, marginBottom: '0.5rem', fontWeight: '600' }}>
                      Template: {selectedProductType}
                      {isDetectingCounts && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#F59E0B',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.3rem 0.8rem',
                          backgroundColor: '#FEF3C7',
                          borderRadius: '20px',
                          border: '2px solid #FCD34D',
                          fontWeight: '600',
                          marginLeft: '0.75rem',
                        }}>
                          <div className="spinner" style={{
                            width: '10px',
                            height: '10px',
                            borderWidth: '2px',
                            borderTopColor: '#F59E0B',
                          }} />
                          Loading...
                        </span>
                      )}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#4a5568', margin: 0 }}>
                      {templateKeys.length} keys will be extracted
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAllKeysModal(true)}
                    style={{
                      padding: '0.4rem 0.9rem',
                      backgroundColor: 'white',
                      color: '#4a5568',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#59BDB9'
                      e.currentTarget.style.color = '#1C2C8C'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.color = '#4a5568'
                    }}
                  >
                    View All Keys
                  </button>
                </div>

                <Button
                  id="extractTemplateBtn"
                  className="extract-btn"
                  onClick={handleExtractFromTemplate}
                  disabled={uploadedFileIds.length === 0 || isExtracting || isDetectingCounts}
                  isLoading={isExtracting}
                  title={uploadedFileIds.length === 0 ? 'Please upload PDFs first' : isDetectingCounts ? 'Optimizing key list...' : ''}
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  {isExtracting ? `Extracting ${templateKeys.length} keys...` : `Extract ${templateKeys.length} Keys`}
                </Button>

                {uploadedFileIds.length === 0 && (
                  <p style={{ color: '#EF4444', marginTop: '8px', fontSize: '0.9em', textAlign: 'center' }}>
                    Please upload PDF files in the Upload tab first
                  </p>
                )}

                {isExtracting && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem 1.5rem',
                    backgroundColor: '#e6f9f8',
                    borderRadius: '20px',
                    border: '2px solid #59BDB9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}>
                    <div className="spinner" style={{
                      width: '24px',
                      height: '24px',
                      borderWidth: '3px',
                      borderColor: '#e2e8f0',
                      borderTopColor: '#59BDB9',
                    }} />
                    <div>
                      <div style={{ fontSize: '0.95rem', color: '#1C2C8C', fontWeight: '600' }}>
                        Extracting keys using AI...
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '0.25rem' }}>
                        This may take a few moments depending on the number of keys and pages
                      </div>
                    </div>
                  </div>
                )}

                {extractionComplete && extractionResultsData && extractionResultsData.length > 0 && (
                  <Button
                    onClick={() => {
                      console.log('Show Results button clicked')
                      console.log('extractionResultsData:', extractionResultsData)
                      openCarousel()
                    }}
                    className="view-results-btn-inline"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    View Results ({extractionResultsData.length} keys)
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Manual Input Toggle - Available for all users */}
          {!showDevInput && (
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <button
                onClick={() => setShowDevInput(true)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #6B7280',
                  backgroundColor: 'transparent',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textDecoration: 'underline',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E5E7EB'
                  e.currentTarget.style.backgroundColor = '#374151'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9CA3AF'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Or enter keys manually...
              </button>
            </div>
          )}

          {/* Manual Input */}
          {showDevInput && (
            <div className="tab-content active" id="manualTabContent" style={{ marginTop: '2rem' }}>
              <div className="key-input-area">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Enter Keys to Extract Manually</h3>
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
                  {isExtracting ? 'Extracting keys...' : 'Extract Keys'}
                </Button>

                {uploadedFileIds.length === 0 && (
                  <p style={{ color: '#EF4444', marginTop: '8px', fontSize: '0.9em' }}>
                    Please upload PDF files in the Upload tab first
                  </p>
                )}

                {isExtracting && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem 1.5rem',
                    backgroundColor: '#e6f9f8',
                    borderRadius: '20px',
                    border: '2px solid #59BDB9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}>
                    <div className="spinner" style={{
                      width: '24px',
                      height: '24px',
                      borderWidth: '3px',
                      borderColor: '#e2e8f0',
                      borderTopColor: '#59BDB9',
                    }} />
                    <div>
                      <div style={{ fontSize: '0.95rem', color: '#1C2C8C', fontWeight: '600' }}>
                        Extracting keys using AI...
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '0.25rem' }}>
                        This may take a few moments depending on the number of keys and pages
                      </div>
                    </div>
                  </div>
                )}

                {extractionComplete && extractionResultsData && extractionResultsData.length > 0 && (
                  <Button
                    onClick={() => {
                      console.log('Show Results button clicked')
                      console.log('extractionResultsData:', extractionResultsData)
                      openCarousel()
                    }}
                    className="view-results-btn-inline"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    View Results ({extractionResultsData.length} keys)
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Keys Modal */}
      {showAllKeysModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
          }}
          onClick={() => setShowAllKeysModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              maxWidth: '800px',
              maxHeight: '80vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.5rem 2rem',
                borderBottom: '2px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1C2C8C', fontWeight: '700' }}>
                  All Keys for {selectedProductType}
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#4a5568' }}>
                  {templateKeys.length} keys will be extracted
                </p>
              </div>
              <button
                onClick={() => setShowAllKeysModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f7fafc',
                  color: '#4a5568',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e2e8f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f7fafc'
                }}
              >
                Close
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                padding: '1.5rem 2rem',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {(() => {
                // Group keys by category
                const grouped = templateKeys.reduce((acc, key) => {
                  if (!acc[key.category]) {
                    acc[key.category] = []
                  }
                  acc[key.category].push(key)
                  return acc
                }, {} as Record<string, KeyWithCategory[]>)

                let globalIndex = 0
                return Object.entries(grouped).map(([category, keys]) => (
                  <div key={category} style={{ marginBottom: '2rem' }}>
                    {/* Category Header */}
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f7fafc',
                        borderBottom: '3px solid #59BDB9',
                        marginBottom: '1rem',
                        borderRadius: '8px 8px 0 0',
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: '1rem', color: '#1C2C8C', fontWeight: '700' }}>
                        {category} ({keys.length} keys)
                      </h3>
                    </div>

                    {/* Keys Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '1rem',
                      }}
                    >
                      {keys.map((key) => {
                        const index = globalIndex++
                        return (
                          <div
                            key={index}
                            style={{
                              padding: '0.75rem 1rem',
                              backgroundColor: '#f7fafc',
                              border: '2px solid #e2e8f0',
                              borderRadius: '12px',
                              fontSize: '0.9rem',
                              color: '#2d3748',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e6f9f8'
                              e.currentTarget.style.borderColor = '#59BDB9'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f7fafc'
                              e.currentTarget.style.borderColor = '#e2e8f0'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: '#9CA3AF', fontSize: '0.85rem', fontWeight: '600' }}>
                                {index + 1}.
                              </span>
                              <span style={{ flex: 1 }}>{key.name}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
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
