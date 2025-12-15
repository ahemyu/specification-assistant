import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { showNotification } from '../../utils/notifications'
import { Button } from '../ui'
import { CarouselModal } from '../CarouselModal'
import { SummaryView } from './SummaryView'
import { getKeysForProductType, filterKeysByCount } from '../../data/keyTemplates'
import type { ExtractionResult } from '../../types'
import { AllKeysModal } from '../AllKeysModal'
import { ManualKeyInput } from '../ManualKeyInput'
import { Spinner } from '@/components/ui/spinner'
import { useTranslation } from '../../core/i18n/LanguageContext'

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
  // const keyTextareaRef = useRef<HTMLTextAreaElement>(null)

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
    detectedProductType,
    productTypeConfidence,
    selectedProductType,
    templateKeys,
    isDetectingProductType,
    detectedCoreCount,
    detectedWindingCount,
    setExtractionResultsData,
    setExtractionResultsBackendFormat,
    setCurrentExtractionState,
    resetExtractionState,
    setReviewedKeys,
    setSelectedProductType,
    setTemplateKeys,
    setDetectedCoreCount,
    setDetectedWindingCount,
  } = useAppStore()
  const { t } = useTranslation()

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

            // Save detected counts to store
            setDetectedCoreCount(data.max_core_number)
            setDetectedWindingCount(data.max_winding_number)

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
            setDetectedCoreCount(null)
            setDetectedWindingCount(null)
          }
        })
        .catch((error) => {
          console.error('Error detecting counts:', error)
          // If detection fails, use all keys
          setTemplateKeys(baseKeys)
          setDetectedCoreCount(null)
          setDetectedWindingCount(null)
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
      showNotification(t('selectProductAndUpload'), 'error')
      return
    }

    setIsExtracting(true)
    setExtractionComplete(false)
    showNotification(t('extractingKeysNotification').replace('{count}', String(templateKeys.length)), 'info')

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
        throw new Error(errorData.detail || t('failedToExtract'))
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

      showNotification(t('keysExtractedSuccess'), 'success')

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
      showNotification(t('enterKeyError'), 'error')
      return
    }

    const keyNames = keysText
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    if (keyNames.length === 0) {
      showNotification(t('enterKeyError'), 'error')
      return
    }

    setIsExtracting(true)
    setExtractionComplete(false)
    showNotification(t('extractingManualNotification'), 'info')

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
        throw new Error(errorData.detail || t('failedToExtract'))
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

      showNotification(t('keysExtractedSuccess'), 'success')

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
    // Get fresh state directly from store to avoid stale closure values
    const currentData = useAppStore.getState().extractionResultsData
    const currentReviewedKeys = useAppStore.getState().reviewedKeys

    if (!currentData) return

    const initialReviewedKeys: Record<string, import('../../types').ReviewedKey> = {}
    currentData.forEach((result) => {
      const keyName = result.key
      if (!currentReviewedKeys[keyName]) {
        const originalValue = result.value || 'Not found'
        initialReviewedKeys[keyName] = {
          status: 'pending',
          value: originalValue,
          originalValue: originalValue,
        }
      } else {
        initialReviewedKeys[keyName] = currentReviewedKeys[keyName]
      }
    })
    setReviewedKeys(initialReviewedKeys)
  }

  const openCarousel = () => {
    // Get fresh state directly from store to avoid stale closure values
    const currentData = useAppStore.getState().extractionResultsData

    console.log('========== OPEN CAROUSEL CALLED ==========')
    console.log('extractionResultsData:', currentData)
    console.log('extractionResultsData length:', currentData?.length)
    console.log('extractionComplete:', extractionComplete)
    console.log('isCarouselOpen:', isCarouselOpen)

    if (!currentData || currentData.length === 0) {
      console.error('❌ CANNOT OPEN CAROUSEL: No extraction results available')
      console.error('extractionResultsData is:', currentData)
      showNotification(t('noResultsAvailable'), 'error')
      return
    }

    try {
      initializeReviewedKeys()
      setIsCarouselOpen(true)
    } catch (error) {
      console.error('ERROR OPENING CAROUSEL:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      showNotification(t('errorOpeningCarousel'), 'error')
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
      {/* Key Extraction Loading Overlay */}
      {isExtracting && (
        <div className="loading-overlay">
          <div className="loading-overlay-content">
            <div className="loading-overlay-spinner">
              <Spinner className="size-16 text-[#59BDB9]" />
            </div>
            <h2 className="loading-overlay-title">
              {t('extractingTitle')}
            </h2>
            <p className="loading-overlay-description">
              {t('theAIIsExtracting')} <strong>{templateKeys.length} {t('keys')}</strong> {t('fromYourPDFs')}
            </p>
            <p className="loading-overlay-timing">
              {t('extractingTiming')}
            </p>
          </div>
        </div>
      )}

      {/* Unified Detection Loading Overlay - Product Type & Core/Winding Counts */}
      {(isDetectingProductType || isDetectingCounts) && (
        <div className="loading-overlay">
          <div className="loading-overlay-content">
            <div className="loading-overlay-spinner">
              <Spinner className="size-16 text-[#59BDB9]" />
            </div>
            <h2 className="loading-overlay-title" style={{ transition: 'opacity 0.3s ease' }}>
              {isDetectingProductType ? t('detectingProductTypeTitle') : t('optimizingKeyListTitle')}
            </h2>
            <p className="loading-overlay-description" style={{ transition: 'opacity 0.3s ease' }}>
              {isDetectingProductType ? (
                <>{t('detectDesc1')}</>
              ) : (
                <>{t('detectDesc2Template').replace('{productType}', t(('product_type_' + (selectedProductType?.toLowerCase() || '')) as any))}</>
              )}
            </p>
            <p className="loading-overlay-timing">
              {t('detectTiming')}
            </p>
          </div>
        </div>
      )}

      {/* Show summary view if in summary state */}
      {showSummary ? (
        <SummaryView
          onReviewKey={handleReviewKey}
          onStartNewExtraction={handleStartNewExtraction}
        />
      ) : (
        <div id="extractionSetupView">
          <div className="upload-header">
            <h1>{t('extractHeader')}</h1>
            <p className="subtitle">{t('extractSubtitle')}</p>
          </div>

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
                    {type === 'Stromwandler' && <img src="/assets/current-transformer.png" alt="Current Transformer" style={{ height: '10em' }} />}
                    {type === 'Spannungswandler' && <img src="/assets/voltage-transformer.png" alt="Voltage Transformer" style={{ height: '10em' }} />}
                    {type === 'Kombiwandler' && <img src="/assets/combi-transformer.png" alt="Combi Transformer" style={{ height: '10em' }} />}
                  </div>
                  <div className="product-card-content">
                    <h4 className="product-card-title">{t(('product_type_' + type.toLowerCase()) as any)}</h4>
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

                    {/* Template Keys Preview and Extract Button - Hidden when in manual mode */}          {!showDevInput && selectedProductType && templateKeys.length > 0 && (

                      <div className="template-key-header-section">

                        <div className="key-input-area">

                          <div className="template-key-header">

                            <div>

                              <h3 style={{ fontSize: '1.1rem', color: '#2d3748', margin: 0, marginBottom: '0.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>

                                {t('templateLabel').replace('{productType}', t(('product_type_' + (selectedProductType?.toLowerCase() || '')) as any))}

                                {(detectedCoreCount !== null || detectedWindingCount !== null) && (

                                  <div className="detected-counts-container">

                                    {detectedCoreCount !== null && (

                                      <div className="detected-count-badge">

                                        <span className="detected-count-number core">{detectedCoreCount}</span>

                                        <span className="detected-count-label">{detectedCoreCount !== 1 ? t('cores') : t('core')}</span>

                                      </div>

                                    )}

                                    {detectedWindingCount !== null && (

                                      <div className="detected-count-badge">

                                        <span className="detected-count-number winding">{detectedWindingCount}</span>

                                        <span className="detected-count-label">{detectedWindingCount !== 1 ? t('windings') : t('winding')}</span>

                                      </div>

                                    )}

                                  </div>

                                )}

                              </h3>

                              <p className="template-key-count-text">

                                {t('keysWillBeExtracted').replace('{count}', String(templateKeys.length))}

                              </p>

                            </div>

                            <button

                              onClick={() => setShowAllKeysModal(true)}

                              className="view-all-keys-button"

                            >

                              {t('viewAllKeys')}

                            </button>

                          </div>

                        </div>

          

                        <Button

                          id="extractTemplateBtn"

                          className="extract-btn"

                          onClick={handleExtractFromTemplate}

                          disabled={uploadedFileIds.length === 0 || isExtracting || isDetectingCounts}

                          isLoading={isExtracting}

                          title={uploadedFileIds.length === 0 ? t('pleaseUploadFirst') : isDetectingCounts ? t('optimizingKeyListTitle') : ''}

                        >

                          {isExtracting ? `${t('extracting')} ${templateKeys.length} ${t('keys')}...` : `${t('extractBtn')} ${templateKeys.length} ${t('keys')}`}

                        </Button>

          

                        {uploadedFileIds.length === 0 && (

                          <p style={{ color: '#EF4444', marginTop: '8px', fontSize: '0.9em', textAlign: 'center' }}>

                            {t('pleaseUploadFirst')}

                          </p>

                        )}

          

                        {extractionComplete && extractionResultsData && extractionResultsData.length > 0 && (

                                                    <Button

                                                      onClick={() => {

                                                        console.log('Show Results button clicked')

                                                        console.log('extractionResultsData:', extractionResultsData)

                                                        openCarousel()

                                                      }}

                                                      className="view-results-btn-inline"

                                                    >

                                                      {t('viewResultsWithCount').replace('{count}', String(extractionResultsData.length))}

                                                    </Button>

                        )}

                      </div>
          )}

          {/* Manual Input Toggle - Available for all users */}
          {!showDevInput && (
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <button
                onClick={() => setShowDevInput(true)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
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
                {t('manualInputToggle')}
              </button>
            </div>
          )}

          {/* Manual Input */}
          {showDevInput && (
            <ManualKeyInput
              onHide={() => setShowDevInput(false)}
              manualKeys={manualKeys}
              onManualKeysChange={setManualKeys}
              onExtract={handleExtractManually}
              isExtracting={isExtracting}
              uploadedFileIds={uploadedFileIds}
              extractionComplete={extractionComplete}
              extractionResultsData={extractionResultsData}
              onViewResults={() => {
                console.log('Show Results button clicked')
                console.log('extractionResultsData:', extractionResultsData)
                openCarousel()
              }}
            />
          )}
        </div>
      )}

      {/* All Keys Modal */}
      <AllKeysModal
        isOpen={showAllKeysModal}
        onClose={() => setShowAllKeysModal(false)}
        templateKeys={templateKeys}
        selectedProductType={selectedProductType}
      />

      {/* Carousel Modal */}
      <CarouselModal
        isOpen={isCarouselOpen}
        onClose={handleCarouselClose}
        onComplete={handleCarouselComplete}
      />
    </div>
  )
}
