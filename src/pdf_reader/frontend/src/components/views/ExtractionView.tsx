import { useState, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { showNotification } from '../../utils/notifications'
import { Button } from '../ui'
import { CarouselModal } from '../CarouselModal'
import { SummaryView } from '../SummaryView'
import type { ExtractionMode, ExtractionResult } from '../../types'

// Backend extraction response format
interface BackendExtractionResult {
  key_value: string | null
  source_locations: Array<{
    pdf_filename: string
    page_numbers: number[]
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
      }))
    )

    return {
      key: keyName,
      value: result.key_value || 'Not found',
      references,
    }
  })
}

export function ExtractionView() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const keyTextareaRef = useRef<HTMLTextAreaElement>(null)

  const [currentTab, setCurrentTab] = useState<ExtractionMode>('manual')
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [previewKeys, setPreviewKeys] = useState<string[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [manualKeys, setManualKeys] = useState('')
  const [isCarouselOpen, setIsCarouselOpen] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const {
    uploadedFileIds,
    uploadedTemplateId,
    extractionResultsData,
    reviewedKeys,
    setUploadedTemplateId,
    setUploadedTemplateKeys,
    setExtractionResultsData,
    setExtractionResultsBackendFormat,
    setCurrentExtractionMode,
    setCurrentExtractionState,
    resetExtractionState,
    setReviewedKeys,
  } = useAppStore()

  const handleTabSwitch = (mode: ExtractionMode) => {
    setCurrentTab(mode)
    setCurrentExtractionMode(mode)
  }

  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setExcelFile(null)
      setPreviewKeys([])
      return
    }

    setExcelFile(file)

    const formData = new FormData()
    formData.append('file', file)

    try {
      showNotification('Uploading Excel template...', 'info')
      const response = await fetch('/upload-excel-template', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to upload template')
      }

      const data = await response.json()
      setUploadedTemplateId(data.template_id)
      setUploadedTemplateKeys(data.keys)
      setPreviewKeys(data.keys)

      showNotification(
        `Template uploaded successfully with ${data.total_keys} keys`,
        'success'
      )
    } catch (error) {
      showNotification(
        `Error uploading template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
      setExcelFile(null)
      setPreviewKeys([])
    }
  }

  const handleExtractFromExcel = async () => {
    if (!uploadedTemplateId || uploadedFileIds.length === 0) {
      showNotification('Please upload both Excel template and PDF files', 'error')
      return
    }

    setIsExtracting(true)
    showNotification('Extracting keys from template...', 'info')

    try {
      const response = await fetch('/extract-keys-from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: uploadedTemplateId,
          file_ids: uploadedFileIds,
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
    setExcelFile(null)
    setPreviewKeys([])
    setManualKeys('')
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
          Use an Excel template or enter keys manually to extract information from your PDFs
        </p>

        <nav className="extraction-tabs">
          <button
            id="excelTab"
            className={`tab-btn ${currentTab === 'excel' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('excel')}
          >
            Excel Template
          </button>
          <button
            id="manualTab"
            className={`tab-btn ${currentTab === 'manual' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('manual')}
          >
            Manual Input
          </button>
        </nav>

        {currentTab === 'excel' && (
          <div className="tab-content active" id="excelTabContent">
            <div className="excel-upload-area">
              <h3>Upload Excel Template</h3>
              <p className="section-subtitle">
                Upload an Excel file with keys in the first column
              </p>

              <div className="file-input-group">
                <input
                  type="file"
                  id="excelFileInput"
                  ref={fileInputRef}
                  accept=".xlsx,.xls"
                  onChange={handleExcelFileSelect}
                  style={{ display: 'none' }}
                />
                <label htmlFor="excelFileInput" className="excel-upload-label">
                  <span className="upload-icon">📄</span>
                  <span className="upload-text">Choose Excel File</span>
                </label>
              </div>

              {excelFile && (
                <div className="excel-filename" id="excelFileName">
                  Selected: {excelFile.name}
                </div>
              )}

              {previewKeys.length > 0 && (
                <div className="keys-preview" id="keysPreview">
                  <h4>Keys Found ({previewKeys.length}):</h4>
                  <ul>
                    {previewKeys.map((key, index) => (
                      <li key={index}>{key}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                id="extractExcelBtn"
                className="extract-btn"
                onClick={handleExtractFromExcel}
                disabled={!uploadedTemplateId || uploadedFileIds.length === 0 || isExtracting}
                isLoading={isExtracting}
                title={
                  uploadedFileIds.length === 0
                    ? 'Please upload PDFs first'
                    : !uploadedTemplateId
                    ? 'Please upload Excel template first'
                    : ''
                }
              >
                Extract Keys from Template
              </Button>

              {uploadedFileIds.length === 0 && (
                <p style={{ color: '#EF4444', marginTop: '8px', fontSize: '0.9em' }}>
                  Please upload PDF files in the Upload tab first
                </p>
              )}
              {uploadedFileIds.length > 0 && !uploadedTemplateId && (
                <p style={{ color: '#EF4444', marginTop: '8px', fontSize: '0.9em' }}>
                  Please upload an Excel template above
                </p>
              )}

            </div>
          </div>
        )}

        {currentTab === 'manual' && (
          <div className="tab-content active" id="manualTabContent">
            <div className="key-input-area">
              <h3>Enter Keys to Extract</h3>
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
