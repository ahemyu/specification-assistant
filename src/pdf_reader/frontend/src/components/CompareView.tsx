import { useState, useEffect } from 'react'
import type { ComparisonResult, ChangeFilter } from '../types'
import { showNotification } from '../utils/notifications'
import { FaBalanceScale, FaSearchPlus } from 'react-icons/fa'
import '../styles/modules/home.css' // For card styles

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
  const [currentFilter, setCurrentFilter] = useState<ChangeFilter>('all')
  const [selectedChangeIndex, setSelectedChangeIndex] = useState<number | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showChangeModal, setShowChangeModal] = useState(false)

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

  const handleBaseFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showNotification('Please select a PDF file', 'error')
      e.target.value = ''
      return
    }

    setBaseFile(file)
    setBaseFileId(null)
    setComparisonResult(null)
    clearState()
  }

  const handleNewFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showNotification('Please select a PDF file', 'error')
      e.target.value = ''
      return
    }

    setNewFile(file)
    setNewFileId(null)
    setComparisonResult(null)
    clearState()
  }

  const handleSwapFiles = () => {
    if (!baseFile || !newFile) return

    const tempFile = baseFile
    const tempFileId = baseFileId

    setBaseFile(newFile)
    setBaseFileId(newFileId)
    setNewFile(tempFile)
    setNewFileId(tempFileId)

    setUploadStatus('Files swapped! Please upload again.')
    setBaseFileId(null)
    setNewFileId(null)
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

  const filteredChanges =
    comparisonResult?.changes.filter(
      (change) => currentFilter === 'all' || change.change_type === currentFilter
    ) || []

  const openChangeModal = (index: number) => {
    setSelectedChangeIndex(index)
    setShowChangeModal(true)
  }

  const closeChangeModal = () => {
    setShowChangeModal(false)
    setSelectedChangeIndex(null)
  }

  const navigateChange = (direction: 'prev' | 'next') => {
    if (selectedChangeIndex === null) return

    const newIndex =
      direction === 'prev'
        ? Math.max(0, selectedChangeIndex - 1)
        : Math.min(filteredChanges.length - 1, selectedChangeIndex + 1)

    setSelectedChangeIndex(newIndex)
  }

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
      const savedBaseFileName = localStorage.getItem(STORAGE_KEYS.baseFileName)
      const savedNewFileName = localStorage.getItem(STORAGE_KEYS.newFileName)
      const savedComparisonResult = localStorage.getItem(STORAGE_KEYS.comparisonResult)

      if (savedBaseFileId && savedNewFileId && savedBaseFileName && savedNewFileName) {
        setBaseFileId(savedBaseFileId)
        setNewFileId(savedNewFileId)
        setUploadStatus('✓ Files restored from previous session')
      }

      if (savedComparisonResult) {
        try {
          const result: ComparisonResult = JSON.parse(savedComparisonResult)
          setComparisonResult(result)
        } catch (e) {
          console.error('Failed to restore comparison result:', e)
        }
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

  const added = comparisonResult?.changes.filter((c) => c.change_type === 'added').length || 0
  const modified =
    comparisonResult?.changes.filter((c) => c.change_type === 'modified').length || 0
  const removed = comparisonResult?.changes.filter((c) => c.change_type === 'removed').length || 0

  const selectedChange = selectedChangeIndex !== null ? filteredChanges[selectedChangeIndex] : null

  return (
    <div className="comparison-container">
      <div className="comparison-header">
        <h1>PDF Version Comparison</h1>
        <p className="upload-subtitle"> Compare two versions of a PDF to identify changes in specifications</p>
      </div>

      {/* Upload Section */}
      <section className="upload-comparison-section">
        <h3>Upload PDFs to Compare</h3>

        <div className="pdf-upload-grid">
          {/* Base PDF */}
          <div className="pdf-upload-box">
            <div className="upload-box-header">
              <h4>Original Version</h4>
              <span className="upload-badge base">BASE</span>
            </div>
            <p className="upload-hint">The older or reference version</p>
            <input
              type="file"
              id="baseFileInput"
              accept=".pdf"
              onChange={handleBaseFileSelected}
              style={{ display: 'none' }}
            />
            <button
              className="upload-file-btn"
              onClick={() => document.getElementById('baseFileInput')?.click()}
            >
              Choose File
            </button>
            {baseFile && (
              <div className="selected-file-info">
                <strong>📄 {baseFile.name}</strong>
                <br />
                <span style={{ color: '#64748b', fontSize: '0.9em' }}>
                  {formatFileSize(baseFile.size)}
                </span>
              </div>
            )}
            {baseFileId && !baseFile && (
              <div className="selected-file-info">
                <strong>📄 {localStorage.getItem(STORAGE_KEYS.baseFileName)}</strong>
                <br />
                <span style={{ color: '#059669', fontSize: '0.85em' }}>✓ Previously uploaded</span>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="swap-button-container">
            <button
              className="swap-btn"
              onClick={handleSwapFiles}
              disabled={!baseFile || !newFile}
              title="Swap base and new versions"
            >
              ⇄
            </button>
          </div>

          {/* New PDF */}
          <div className="pdf-upload-box">
            <div className="upload-box-header">
              <h4>New Version</h4>
              <span className="upload-badge new">NEW</span>
            </div>
            <p className="upload-hint">The updated or modified version</p>
            <input
              type="file"
              id="newFileInput"
              accept=".pdf"
              onChange={handleNewFileSelected}
              style={{ display: 'none' }}
            />
            <button
              className="upload-file-btn"
              onClick={() => document.getElementById('newFileInput')?.click()}
            >
              Choose File
            </button>
            {newFile && (
              <div className="selected-file-info">
                <strong>📄 {newFile.name}</strong>
                <br />
                <span style={{ color: '#64748b', fontSize: '0.9em' }}>
                  {formatFileSize(newFile.size)}
                </span>
              </div>
            )}
            {newFileId && !newFile && (
              <div className="selected-file-info">
                <strong>📄 {localStorage.getItem(STORAGE_KEYS.newFileName)}</strong>
                <br />
                <span style={{ color: '#059669', fontSize: '0.85em' }}>✓ Previously uploaded</span>
              </div>
            )}
          </div>
        </div>

        <div className="upload-actions">
          <button className="change-files-btn" onClick={handleClearFiles}>
            Clear All
          </button>
          <button
            className="upload-both-btn"
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

        {/* Preview Button */}
        {baseFileId && newFileId && (
          <div className="preview-button-container">
            <button className="preview-both-btn" onClick={() => setShowPreviewModal(true)}>
              👁 Preview Both PDFs
            </button>
          </div>
        )}

        {/* Additional Context */}
        <div className="context-section">
          <label htmlFor="contextInput">Additional Context (Optional)</label>
          <textarea
            id="contextInput"
            rows={3}
            placeholder="e.g., Focus on electrical ratings, dimensions, or specific parameters..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        {/* Compare Button */}
        <button
          className="compare-btn"
          onClick={handleCompare}
          disabled={!baseFileId || !newFileId || isComparing}
        >
          {isComparing ? 'Comparing...' : 'Compare PDFs'}
        </button>
      </section>

      {/* Comparison Results */}
      {comparisonResult && (
        <section className="comparison-results">
          <h3>Comparison Results</h3>

          {/* Summary Section */}
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

          {/* Changes List */}
          <div className="changes-section">
            <h4>Detailed Changes</h4>
            <div className="changes-filter">
              <button
                className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCurrentFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${currentFilter === 'added' ? 'active' : ''}`}
                onClick={() => setCurrentFilter('added')}
              >
                Added
              </button>
              <button
                className={`filter-btn ${currentFilter === 'modified' ? 'active' : ''}`}
                onClick={() => setCurrentFilter('modified')}
              >
                Modified
              </button>
              <button
                className={`filter-btn ${currentFilter === 'removed' ? 'active' : ''}`}
                onClick={() => setCurrentFilter('removed')}
              >
                Removed
              </button>
            </div>

            <div className="changes-list">
              {filteredChanges.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✓</div>
                  <div className="empty-state-text">No changes of this type detected</div>
                </div>
              ) : (
                filteredChanges.map((change, index) => (
                  <div
                    key={index}
                    className={`change-item ${change.change_type}`}
                    onClick={() => openChangeModal(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="change-header">
                      <div className="change-name">{change.specification_name}</div>
                      <div className={`change-type-badge ${change.change_type}`}>
                        {change.change_type}
                      </div>
                    </div>

                    <div className="change-values">
                      <div className="value-box old">
                        <div className="value-label">Old Version</div>
                        <div className="value-content">
                          {change.old_value || <span className="null">Not present</span>}
                        </div>
                      </div>
                      <div className="value-box new">
                        <div className="value-label">New Version</div>
                        <div className="value-content">
                          {change.new_value || <span className="null">Removed</span>}
                        </div>
                      </div>
                    </div>

                    <div className="change-description">{change.description}</div>

                    <div className="change-pages">
                      <div className="page-ref">
                        <strong>Old PDF:</strong> Page{change.pages_old.length > 1 ? 's' : ''}{' '}
                        {change.pages_old.length > 0 ? change.pages_old.join(', ') : 'N/A'}
                      </div>
                      <div className="page-ref">
                        <strong>New PDF:</strong> Page{change.pages_new.length > 1 ? 's' : ''}{' '}
                        {change.pages_new.length > 0 ? change.pages_new.join(', ') : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Preview Modal */}
      {showPreviewModal && baseFileId && newFileId && (
        <div className="preview-modal" onClick={() => setShowPreviewModal(false)}>
          <div className="preview-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview-btn" onClick={() => setShowPreviewModal(false)}>
              Close Preview
            </button>
            <div className="preview-grid">
              <div className="preview-panel">
                <div className="preview-panel-header">
                  <h4>Base Version (Original)</h4>
                </div>
                <div className="preview-content">
                  <iframe
                    src={`/view-pdf/${baseFileId}`}
                    className="pdf-iframe"
                    title="Base PDF Preview"
                  />
                </div>
              </div>
              <div className="preview-panel">
                <div className="preview-panel-header">
                  <h4>New Version (Updated)</h4>
                </div>
                <div className="preview-content">
                  <iframe
                    src={`/view-pdf/${newFileId}`}
                    className="pdf-iframe"
                    title="New PDF Preview"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Detail Modal */}
      {showChangeModal && selectedChange && baseFileId && newFileId && (
        <div className="change-modal" onClick={closeChangeModal}>
          <div className="change-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="change-modal-header">
              <h3>{selectedChange.specification_name}</h3>
              <div className="modal-nav-controls">
                <span className="modal-counter">
                  {selectedChangeIndex! + 1} of {filteredChanges.length}
                </span>
                <button
                  className="modal-nav-btn"
                  onClick={() => navigateChange('prev')}
                  disabled={selectedChangeIndex === 0}
                  title="Previous change"
                >
                  ←
                </button>
                <button
                  className="modal-nav-btn"
                  onClick={() => navigateChange('next')}
                  disabled={selectedChangeIndex === filteredChanges.length - 1}
                  title="Next change"
                >
                  →
                </button>
                <button className="modal-close-btn" onClick={closeChangeModal} title="Close">
                  ✕
                </button>
              </div>
            </div>
            <div className="change-modal-body">
              <div className="modal-change-type">
                <span className={`change-type-badge ${selectedChange.change_type}`}>
                  {selectedChange.change_type}
                </span>
              </div>

              <div className="modal-pdf-grid">
                <div className="modal-pdf-container">
                  <div className="modal-pdf-header">
                    <div className="modal-pdf-label">
                      Original Version - Page{selectedChange.pages_old.length > 1 ? 's' : ''}:{' '}
                      {selectedChange.pages_old.length > 0
                        ? selectedChange.pages_old.join(', ')
                        : 'N/A'}
                    </div>
                    <div className="modal-value-section">
                      <div className="modal-value-title">Old Value:</div>
                      <div className="modal-value-display">
                        {selectedChange.old_value || (
                          <span className="null">
                            {selectedChange.change_type === 'added'
                              ? 'Not in original version'
                              : 'Not present'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedChange.pages_old.length > 0 ? (
                    <iframe
                      src={`/view-pdf/${baseFileId}#page=${selectedChange.pages_old[0]}`}
                      className="modal-pdf-viewer"
                      title="Old Version PDF"
                    />
                  ) : (
                    <div className="modal-pdf-placeholder">Not present in original version</div>
                  )}
                </div>
                <div className="modal-pdf-container">
                  <div className="modal-pdf-header">
                    <div className="modal-pdf-label">
                      New Version - Page{selectedChange.pages_new.length > 1 ? 's' : ''}:{' '}
                      {selectedChange.pages_new.length > 0
                        ? selectedChange.pages_new.join(', ')
                        : 'N/A'}
                    </div>
                    <div className="modal-value-section">
                      <div className="modal-value-title">New Value:</div>
                      <div className="modal-value-display">
                        {selectedChange.new_value || (
                          <span className="null">
                            {selectedChange.change_type === 'removed'
                              ? 'Removed in new version'
                              : 'Not present'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedChange.pages_new.length > 0 ? (
                    <iframe
                      src={`/view-pdf/${newFileId}#page=${selectedChange.pages_new[0]}`}
                      className="modal-pdf-viewer"
                      title="New Version PDF"
                    />
                  ) : (
                    <div className="modal-pdf-placeholder">Removed in new version</div>
                  )}
                </div>
              </div>

              <div className="modal-description">
                <strong>Change Description:</strong>
                <p>{selectedChange.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const comparisonTools = [
  {
    id: 'standard_comparison',
    title: 'Standard PDF Comparison',
    description: 'Upload two PDFs and get a summary of changes. Ideal for version control.',
    icon: <FaBalanceScale size={48} />,
  },
  {
    id: 'semantic_comparison',
    title: 'Semantic Search Comparison',
    description: 'Compare documents based on semantic meaning. (Coming soon!)',
    icon: <FaSearchPlus size={48} />,
    disabled: true,
  },
]

export function CompareView() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  if (selectedTool === 'standard_comparison') {
    return <StandardCompareView />
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>PDF Comparison Tools</h1>
        <p className="home-subtitle">Choose a tool to compare your PDF documents.</p>
      </div>
      <div className="cards-wrapper">
        {comparisonTools.map((card) => (
          <div
            key={card.id}
            className={`card ${card.disabled ? 'disabled' : ''}`}
            onClick={() => !card.disabled && setSelectedTool(card.id)}
          >
            <div className="card-icon">{card.icon}</div>
            <div className="card-content">
              <h2 className="card-title">{card.title}</h2>
              <p className="card-description">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
