import { useState, useRef, useEffect } from 'react'
import { useAppStore, PDF_STORAGE_KEY, CHAT_STORAGE_KEY } from '../../store/useAppStore'
import { showNotification } from '../../utils/notifications'
import { Button } from '../ui'
import { PreviewModal } from '../PreviewModal'
import type { ProcessedFile } from '../../types'
import { FaUpload, FaFilePdf, FaEye, FaDownload, FaTrash } from 'react-icons/fa'

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
  } = useAppStore()

  // Load PDF state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(PDF_STORAGE_KEY)
      if (savedState) {
        const { uploadedFileIds: ids, allUploadedFiles: files } = JSON.parse(savedState)
        setUploadedFileIds(ids || [])
        setAllUploadedFiles(files || [])
        setProcessedFiles(files || [])
      }
    } catch (error) {
      console.error('Error loading PDF state:', error)
    }
  }, [setUploadedFileIds, setAllUploadedFiles, setProcessedFiles])

  // Save PDF state to localStorage whenever it changes
  useEffect(() => {
    if (uploadedFileIds.length > 0) {
      localStorage.setItem(
        PDF_STORAGE_KEY,
        JSON.stringify({ uploadedFileIds, allUploadedFiles })
      )
    }
  }, [uploadedFileIds, allUploadedFiles])

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
    showNotification('Processing PDFs...', 'info')

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      })

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
        `Successfully processed ${data.processed.length} PDF(s). Total PDFs: ${newFileIds.length}`,
        'success'
      )

      if (data.failed.length > 0) {
        showNotification(`Failed to process: ${data.failed.join(', ')}`, 'error')
      }

      // Clear file input
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Navigate immediately to Extract Keys view for faster UX
      setActiveView('spec_assistant');
      setActiveSubMenuItem('extract');

      // Detect product type from uploaded PDFs in background
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
    if (!confirm('Are you sure you want to delete this file?')) {
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
        localStorage.removeItem(PDF_STORAGE_KEY)
        showNotification('All files deleted', 'info')
        setActiveView('spec_assistant'); // Ensure we are in spec_assistant view
        setActiveSubMenuItem('upload'); // Go to upload sub-menu
      } else {
        showNotification(`File deleted. ${newFiles.length} file(s) remaining`, 'success')
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
      showNotification('No files to delete', 'info')
      return
    }

    if (
      !confirm(
        `Are you sure you want to delete all ${allUploadedFiles.length} file(s)? This action cannot be undone.`
      )
    ) {
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
      localStorage.removeItem(PDF_STORAGE_KEY)
      localStorage.removeItem(CHAT_STORAGE_KEY)

      setActiveView('spec_assistant'); // Ensure we are in spec_assistant view
      setActiveSubMenuItem('upload'); // Go to upload sub-menu
      showNotification(`Successfully deleted all ${fileCount} file(s)`, 'success')
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
        <h1>Spec-Assistant</h1>
        <p className="upload-subtitle"> Upload your PDF files and use LLMs to extract keys or ask questions</p>
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
            <h2>Drag & Drop your PDF files here</h2>
            <p>or click to select files</p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="selected-files" id="selectedFiles">
            {allUploadedFiles.length > 0 && (
              <p style={{ marginBottom: '12px', color: '#59BDB9', fontWeight: 600 }}>
                Adding {selectedFiles.length} new file(s) to {allUploadedFiles.length}{' '}
                existing file(s)
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
          Upload and Process
        </Button>
      </section>

      {isUploading && <div className="spinner" aria-live="polite" aria-label="Processing" />}

      {allUploadedFiles.length > 0 && (
        <>
          <div className="results-header" id="resultsHeader">
            <h3>Uploaded PDFs</h3>
            <button className="delete-all-btn" onClick={handleDeleteAllFiles}>
              Delete All Files
            </button>
          </div>
          <div className="results" id="results">
            <div className="file-grid">
              {allUploadedFiles.map((file) => (
                <div key={file.file_id} className="file-card" data-file-id={file.file_id}>
                  <div className="file-card-icon">
                    <FaFilePdf size={40} />
                  </div>
                  <div className="file-card-info">
                    <h3 className="file-card-name">{file.original_filename}</h3>
                    <p className="file-card-details">
                      Pages: {(file as any).total_pages || 'N/A'}
                    </p>
                  </div>
                  <div className="file-card-actions">
                    <button
                      className="action-btn preview"
                      onClick={() => openPreview(file.file_id, file.original_filename)}
                      title="Preview Text"
                    >
                      <FaEye />
                    </button>
                    <a
                      href={`/download/${file.file_id}`}
                      className="action-btn download"
                      download
                      title="Download Text File"
                    >
                      <FaDownload />
                    </a>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteFile(file.file_id)}
                      title="Delete File"
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
