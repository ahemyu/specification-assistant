import { useState, useRef } from 'react'
import { useAppStore, CHAT_STORAGE_KEY, handleExpiredToken } from '../../store/useAppStore'
import { showNotification } from '../../utils/notifications'
import { Button } from '../ui'
import { PreviewModal } from '../PreviewModal'
import type { ProcessedFile } from '../../types'
import { FaUpload, FaFilePdf, FaEye, FaDownload, FaTrash } from 'react-icons/fa'
import { useTranslation } from '../../core/i18n/LanguageContext'

interface UploadResponse {
  processed: ProcessedFile[]
  failed: string[]
}

export function UploadView() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    fileId: string | null
    filename: string | null
  }>({ isOpen: false, fileId: null, filename: null })

  const {
    uploadedFileIds,
    allUploadedFiles,
    extractionResultsData,
    setUploadedFileIds,
    setProcessedFiles,
    setAllUploadedFiles,
    setConversationHistory,
    resetExtractionState,
    setDetectedProductType,
    setProductTypeConfidence,
    setIsDetectingProductType,
    setActiveSubMenuItem,
    setActiveView,
    token,
  } = useAppStore()
  const { t } = useTranslation()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files || [])
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    const formData = new FormData()
    selectedFiles.forEach((file) => {
      formData.append('files', file)
    })

    setIsUploading(true)
    showNotification(t('processingNotification'), 'info')

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/upload', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (response.status === 401) {
        handleExpiredToken();
        setIsUploading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: UploadResponse = await response.json()

      // Clear chat history
      setConversationHistory([])
      localStorage.removeItem(CHAT_STORAGE_KEY)

      // Reset extraction state
      resetExtractionState()

      // Update state
      const newFileIds = [...uploadedFileIds, ...data.processed.map((p) => p.file_id)]
      const newFiles = [...allUploadedFiles, ...data.processed]

      setUploadedFileIds(newFileIds)
      setProcessedFiles(newFiles)
      setAllUploadedFiles(newFiles)

      showNotification(
        t('successProcessedNotification').replace('{count}', String(data.processed.length)).replace('{total}', String(newFileIds.length)),
        'success'
      )

      if (data.failed.length > 0) {
        showNotification(t('failedProcessNotification').replace('{failed}', data.failed.join(', ')), 'error')
      }

      // Clear file input
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Navigate immediately to Extract Keys view for faster UX
      setActiveView('spec_ai');
      setActiveSubMenuItem('extract');

      // Detect product type from uploaded PDFs in background (only if no existing extraction results)
      if (!extractionResultsData || extractionResultsData.length === 0) {
        setIsDetectingProductType(true)
        fetch('/detect-product-type', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_ids: newFileIds,
          }),
        })
        .then(async (detectionResponse) => {
          if (detectionResponse.ok) {
            const detectionData = await detectionResponse.json()
            setDetectedProductType(detectionData.product_type)
            setProductTypeConfidence(detectionData.confidence)
            showNotification(
              `Product type detected: ${detectionData.product_type}`,
              'success'
            )
          }
        })
        .catch((error) => {
          console.error('Error detecting product type:', error)
        })
        .finally(() => {
          setIsDetectingProductType(false)
        })
      } else {
        // Skip product type detection since extraction results already exist
        console.log('Skipping product type detection - extraction results already exist')
      }
    } catch (error) {
      showNotification(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm(t('confirmDeleteFile'))) {
      return
    }

    try {
      const response = await fetch(`/delete-pdf/${fileId}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status}`)
      }

      const newFileIds = uploadedFileIds.filter((id) => id !== fileId)
      const newFiles = allUploadedFiles.filter((f) => f.file_id !== fileId)

      setUploadedFileIds(newFileIds)
      setProcessedFiles(newFiles)
      setAllUploadedFiles(newFiles)

      // Clear chat history
      setConversationHistory([])
      localStorage.removeItem(CHAT_STORAGE_KEY)

      if (newFiles.length === 0) {
        showNotification(t('allFilesDeletedNotification'), 'info')
        setActiveView('spec_ai'); // Ensure we are in spec_ai view
        setActiveSubMenuItem('upload'); // Go to upload sub-menu
      } else {
        showNotification(t('fileDeletedRemaining').replace('{remaining}', String(newFiles.length)), 'success')
      }
    } catch (error) {
      showNotification(
        `Error deleting file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    }
  }

  const handleDeleteAllFiles = async () => {
    if (allUploadedFiles.length === 0) {
      showNotification(t('noFilesToDelete'), 'info')
      return
    }

    if (!confirm(t('confirmDeleteAll'))) {
      return
    }

    const fileCount = allUploadedFiles.length
    const fileIds = [...uploadedFileIds]

    try {
      const deletePromises = fileIds.map((fileId) =>
        fetch(`/delete-pdf/${fileId}`, { method: 'DELETE' })
      )
      const results = await Promise.all(deletePromises)
      const failedDeletions = results.filter((r) => !r.ok)

      if (failedDeletions.length > 0) {
        throw new Error(`Failed to delete ${failedDeletions.length} file(s)`)
      }

      setUploadedFileIds([])
      setProcessedFiles([])
      setAllUploadedFiles([])
      setConversationHistory([])
      localStorage.removeItem(CHAT_STORAGE_KEY)

      setActiveView('spec_ai'); // Ensure we are in spec_ai view
      setActiveSubMenuItem('upload'); // Go to upload sub-menu
      showNotification(t('deletingAllSuccess').replace('{count}', String(fileCount)), 'success')
    } catch (error) {
      showNotification(
        `Error deleting files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    }
  }

  const openPreview = (fileId: string, filename: string) => {
    setPreviewModal({ isOpen: true, fileId, filename })
  }

  return (
    <div className="tab-view active" id="uploadView">
      <div className="upload-header">
        <h1>{t('specAIHeader')}</h1>
        <p className="subtitle">{t('specAISubtitle')}</p>
      </div>
      <section className="upload-section">
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            id="fileInput"
            ref={fileInputRef}
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className="drop-zone-icon">
            <FaUpload size={48} />
          </div>
          <div className="drop-zone-text">
            <h2 className="section-title">{t('dropzoneTitle')}</h2>
            <p>{t('dropzoneHint')}</p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="selected-files" id="selectedFiles">
            {allUploadedFiles.length > 0 && (
              <p style={{ marginBottom: '12px', color: '#59BDB9', fontWeight: 600 }}>
                {t('addingFilesInfo').replace('{newCount}', String(selectedFiles.length)).replace('{existingCount}', String(allUploadedFiles.length))}
              </p>
            )}
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          className="upload-btn"
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          isLoading={isUploading}
        >
          {t('uploadButton')}
        </Button>
      </section>

      {allUploadedFiles.length > 0 && (
        <>
          <div className="results-header" id="resultsHeader">
            <h3 className="subsection-title">{t('uploadedPDFs')}</h3>
            <button className="delete-all-btn" onClick={handleDeleteAllFiles}>
              {t('deleteAllFiles')}
            </button>
          </div>
          <div className="results" id="results">
            <div className="file-grid">
              {allUploadedFiles.map((file) => (
                <div key={file.file_id} className="file-card" data-file-id={file.file_id}>
                  <div className="file-card-icon-container">
                    <FaFilePdf size={24} />
                  </div>
                  <div className="file-card-content">
                    <h4 className="file-card-name">{file.original_filename}</h4>
                    <p className="file-card-details">
                      {t('pagesLabel')} {(file as any).total_pages || 'N/A'}
                    </p>
                  </div>
                  <div className="file-card-actions">
                    <button
                      className="action-btn preview"
                      onClick={() => openPreview(file.file_id, file.original_filename)}
                      title={t('previewTitle')}
                    >
                      <FaEye />
                    </button>
                    <a
                      href={`/download/${file.file_id}`}
                      className="action-btn download"
                      download
                      title={t('downloadTitle')}
                    >
                      <FaDownload />
                    </a>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteFile(file.file_id)}
                      title={t('deleteTitle')}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <PreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, fileId: null, filename: null })}
        fileId={previewModal.fileId}
        filename={previewModal.filename}
      />
    </div>
  )
}
