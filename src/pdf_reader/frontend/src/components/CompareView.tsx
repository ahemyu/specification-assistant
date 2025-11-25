import { useState, useEffect, useRef } from 'react'
import type { ComparisonResult, ChangeFilter } from '../types'
import { showNotification } from '../utils/notifications'
import {
  // FaBalanceScale,
  // FaSearchPlus,
  FaFilePdf,
  FaExchangeAlt,
  FaTrash,
  FaVial,
} from 'react-icons/fa'
import '../styles/modules/home.css' // For card styles
import '../styles/modules/compare.css'

const STORAGE_KEY_PREFIX = 'pdf_compare_'
const STORAGE_KEYS = {
  baseFileId: STORAGE_KEY_PREFIX + 'base_file_id',
  newFileId: STORAGE_KEY_PREFIX + 'new_file_id',
  baseFileName: STORAGE_KEY_PREFIX + 'base_file_name',
  newFileName: STORAGE_KEY_PREFIX + 'new_file_name',
  comparisonResult: STORAGE_KEY_PREFIX + 'comparison_result',
}

const StandardCompareView = () => {
  // State
  const [baseFile, setBaseFile] = useState<File | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [baseFileId, setBaseFileId] = useState<string | null>(null)
  const [newFileId, setNewFileId] = useState<string | null>(null)
  const [context, setContext] = useState<string>('')
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [currentFilter, /*setCurrentFilter*/] = useState<ChangeFilter>('all')
  const [/*selectedChangeIndex*/, setSelectedChangeIndex] = useState<number | null>(null)
  const [/*showPreviewModal*/, setShowPreviewModal] = useState(false)
  const [/*showChangeModal*/, setShowChangeModal] = useState(false)

  // Refs for file inputs
  const baseFileInputRef = useRef<HTMLInputElement>(null)
  const newFileInputRef = useRef<HTMLInputElement>(null)

  // Load state from localStorage on mount
  useEffect(() => {
    restoreState()
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: 'base' | 'new'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showNotification('Please select a PDF file', 'error')
      e.target.value = ''
      return
    }

    if (fileType === 'base') {
      setBaseFile(file)
      setBaseFileId(null)
    } else {
      setNewFile(file)
      setNewFileId(null)
    }

    setComparisonResult(null)
    clearState() // Clear old results when new files are selected
  }

  const handleSwapFiles = () => {
    if (!baseFile && !newFile) return

    setBaseFile(newFile)
    setNewFile(baseFile)
    setBaseFileId(newFileId)
    setNewFileId(baseFileId)

    setUploadStatus('Files swapped! Please upload again.')
  }

  const handleClearFiles = () => {
    setBaseFile(null)
    setNewFile(null)
    setBaseFileId(null)
    setNewFileId(null)
    setComparisonResult(null)
    setUploadStatus('')
    setShowPreviewModal(false)
    setShowChangeModal(false)
    clearState()
  }

  const uploadPDF = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('files', file)

    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Upload failed')
    }

    const data = await response.json()

    if (data.processed && data.processed.length > 0) {
      return data.processed[0].file_id
    } else if (data.failed && data.failed.length > 0) {
      throw new Error(`Upload failed: ${data.failed[0]}`)
    } else {
      throw new Error('Upload failed: No files processed')
    }
  }

  const handleUploadBoth = async () => {
    if (!baseFile || !newFile) {
      showNotification('Please select both PDF files before uploading', 'error')
      return
    }

    setIsUploading(true)
    setUploadStatus('Uploading and processing both PDFs...')
    setComparisonResult(null)

    try {
      setUploadStatus('Uploading base PDF...')
      const baseId = await uploadPDF(baseFile)
      setBaseFileId(baseId)

      setUploadStatus('Uploading new PDF...')
      const newId = await uploadPDF(newFile)
      setNewFileId(newId)

      setUploadStatus('✓ Both PDFs uploaded and processed successfully!')
      showNotification('PDFs uploaded successfully', 'success')

      saveState(baseId, newId, baseFile.name, newFile.name)
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus(`✗ Upload failed: ${error.message}`)
      showNotification(`Failed to upload PDFs: ${error.message}`, 'error')
      setBaseFileId(null)
      setNewFileId(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCompare = async () => {
    if (!baseFileId || !newFileId) {
      showNotification('Please upload both PDF files before comparing', 'error')
      return
    }

    setIsComparing(true)
    setComparisonResult(null)

    try {
      const response = await fetch('/compare-pdfs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_file_id: baseFileId,
          new_file_id: newFileId,
          additional_context: context.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Comparison failed')
      }

      const result: ComparisonResult = await response.json()
      setComparisonResult(result)
      showNotification('Comparison completed successfully', 'success')

      localStorage.setItem(STORAGE_KEYS.comparisonResult, JSON.stringify(result))
    } catch (error: any) {
      console.error('Comparison error:', error)
      showNotification(`Comparison failed: ${error.message}`, 'error')
    } finally {
      setIsComparing(false)
    }
  }

  // State persistence functions (save, restore, clear)
  const saveState = (baseId: string, newId: string, baseName: string, newName: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.baseFileId, baseId)
      localStorage.setItem(STORAGE_KEYS.newFileId, newId)
      localStorage.setItem(STORAGE_KEYS.baseFileName, baseName)
      localStorage.setItem(STORAGE_KEYS.newFileName, newName)
    } catch (error) {
      console.error('Failed to save state:', error)
    }
  }

  const restoreState = () => {
    try {
      const savedBaseFileId = localStorage.getItem(STORAGE_KEYS.baseFileId)
      const savedNewFileId = localStorage.getItem(STORAGE_KEYS.newFileId)
      const savedComparisonResult = localStorage.getItem(STORAGE_KEYS.comparisonResult)

      if (savedBaseFileId && savedNewFileId) {
        setBaseFileId(savedBaseFileId)
        setNewFileId(savedNewFileId)
        setUploadStatus('✓ Files restored from previous session')
      }

      if (savedComparisonResult) {
        setComparisonResult(JSON.parse(savedComparisonResult))
      }
    } catch (error) {
      console.error('Failed to restore state:', error)
    }
  }

  const clearState = () => {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
    } catch (error) {
      console.error('Failed to clear state:', error)
    }
  }

  // Derived state for summary and filtering
  const added = comparisonResult?.changes.filter((c) => c.change_type === 'added').length || 0
  const modified =
    comparisonResult?.changes.filter((c) => c.change_type === 'modified').length || 0
  const removed = comparisonResult?.changes.filter((c) => c.change_type === 'removed').length || 0
  const filteredChanges =
    comparisonResult?.changes.filter(
      (change) => currentFilter === 'all' || change.change_type === currentFilter
    ) || []

  // Modal logic
  const openChangeModal = (index: number) => {
    setSelectedChangeIndex(index)
    setShowChangeModal(true)
  }
  // ... other modal functions remain the same

  // Helper component for the upload boxes
  const UploadBox = ({
    fileType,
    file,
    fileId,
    storageKey,
    inputRef,
    onFileSelect,
  }: {
    fileType: 'base' | 'new'
    file: File | null
    fileId: string | null
    storageKey: string
    inputRef: React.RefObject<HTMLInputElement>
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, fileType: 'base' | 'new') => void
  }) => (
    <div className="pdf-upload-box" onClick={() => inputRef.current?.click()}>
      <div className="upload-box-header">
        <h4>{fileType === 'base' ? 'Original Version' : 'New Version'}</h4>
        <span className={`upload-badge ${fileType}`}>{fileType.toUpperCase()}</span>
      </div>
      <p className="upload-hint">
        {fileType === 'base' ? 'The older or reference version' : 'The updated or modified version'}
      </p>
      <input
        type="file"
        ref={inputRef}
        accept=".pdf"
        onChange={(e) => onFileSelect(e, fileType)}
        style={{ display: 'none' }}
      />
      <div className="upload-placeholder">
        <FaFilePdf size={40} />
      </div>
      {(file || (fileId && localStorage.getItem(storageKey))) && (
        <div className="selected-file-info">
          <strong>📄 {file?.name || localStorage.getItem(storageKey)}</strong>
          <br />
          {file && (
            <span style={{ color: '#64748b', fontSize: '0.9em' }}>
              {formatFileSize(file.size)}
            </span>
          )}
          {fileId && !file && (
            <span style={{ color: '#059669', fontSize: '0.85em' }}>✓ Previously uploaded</span>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="comparison-container">
      <div className="comparison-header">
        <h1>PDF Version Comparison</h1>
        <p className="upload-subtitle">
          Compare two versions of a PDF to identify changes in specifications
        </p>
      </div>

      <section className="upload-comparison-section">
        <div className="pdf-upload-grid">
          <UploadBox
            fileType="base"
            file={baseFile}
            fileId={baseFileId}
            storageKey={STORAGE_KEYS.baseFileName}
            inputRef={baseFileInputRef}
            onFileSelect={handleFileSelect}
          />

          <div className="swap-button-container">
            <button
              className="swap-btn"
              onClick={handleSwapFiles}
              disabled={!baseFile || !newFile}
              title="Swap base and new versions"
            >
              <FaExchangeAlt />
            </button>
          </div>

          <UploadBox
            fileType="new"
            file={newFile}
            fileId={newFileId}
            storageKey={STORAGE_KEYS.newFileName}
            inputRef={newFileInputRef}
            onFileSelect={handleFileSelect}
          />
        </div>

        <div className="upload-actions">
          <button className="action-button change-files-btn" onClick={handleClearFiles}>
            <FaTrash /> &nbsp; Clear All
          </button>
          <button
            className="action-button upload-both-btn"
            onClick={handleUploadBoth}
            disabled={!baseFile || !newFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload & Process'}
          </button>
        </div>

        {uploadStatus && (
          <div
            className={`upload-status-combined ${
              uploadStatus.includes('✓')
                ? 'success'
                : uploadStatus.includes('✗')
                ? 'error'
                : 'processing'
            }`}
          >
            {uploadStatus}
          </div>
        )}

        <div className="context-section">
          <textarea
            id="contextInput"
            rows={3}
            placeholder="e.g., Focus on electrical ratings, dimensions, or specific parameters..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        <button
          className="action-button compare-btn"
          onClick={handleCompare}
          disabled={!baseFileId || !newFileId || isComparing}
        >
          {isComparing ? 'Comparing...' : <><FaVial /> &nbsp; Compare PDFs</>}
        </button>
      </section>

      {comparisonResult && (
        <section className="comparison-results">
          <div className="summary-section">
            <h4>Summary</h4>
            <div className="summary-content">{comparisonResult.summary}</div>
            <div className="summary-stats">
              <span className="stat-badge">{comparisonResult.total_changes} changes</span>
              <span className="stat-badge added">{added} added</span>
              <span className="stat-badge modified">{modified} modified</span>
              <span className="stat-badge removed">{removed} removed</span>
            </div>
          </div>

          <div className="changes-section">
            <h4>Detailed Changes</h4>
            <div className="changes-filter">
              {/* Filter buttons */}
            </div>
            <div className="changes-list">
              {filteredChanges.length > 0 ? (
                filteredChanges.map((change, index) => (
                  <div
                    key={index}
                    className={`change-item ${change.change_type}`}
                    onClick={() => openChangeModal(index)}
                  >
                    <div className="change-header">
                      <div className="change-name">{change.specification_name}</div>
                      <div className={`change-type-badge ${change.change_type}`}>
                        {change.change_type}
                      </div>
                    </div>
                    {/* ... rest of the card content */}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  {/* ... empty state ... */}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      {/* ... Modals ... */}
    </div>
  )
}

// Main CompareView component that shows tool selection
export function CompareView() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  // Auto-select standard comparison for now
  useEffect(() => {
    setSelectedTool('standard_comparison')
  }, [])

  if (selectedTool === 'standard_comparison') {
    return <StandardCompareView />
  }

  // The tool selection UI can be a future enhancement
  return null 
}