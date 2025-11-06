import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, PDF_STORAGE_KEY, CHAT_STORAGE_KEY } from '../../store/useAppStore'
import { showNotification } from '../../utils/notifications'
import { Button } from '../ui'
import { PreviewModal } from '../PreviewModal'
import type { ProcessedFile } from '../../types'

interface UploadResponse {
  processed: ProcessedFile[]
  failed: string[]
}

export function UploadView() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
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
        navigate('/')
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

      navigate('/')
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
      <section className="upload-section">
        <div className="file-input-wrapper">
          <input
            type="file"
            id="fileInput"
            ref={fileInputRef}
            multiple
            accept=".pdf"
            aria-label="Choose PDF files"
            onChange={handleFileSelect}
          />
          <label htmlFor="fileInput" className="file-input-label">
            Choose PDF Files
          </label>
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
            {allUploadedFiles.map((file) => (
              <div key={file.file_id} className="result-item" data-file-id={file.file_id}>
                <h3>{file.original_filename}</h3>
                <p>
                  <strong>Pages:</strong> {(file as any).total_pages || 'N/A'}
                </p>
                <p>
                  <strong>File ID:</strong> {file.file_id}
                </p>
                <div className="result-actions">
                  <button
                    className="preview-btn"
                    onClick={() => openPreview(file.file_id, file.original_filename)}
                  >
                    Preview Text
                  </button>
                  <a
                    href={`/download/${file.file_id}`}
                    className="download-btn"
                    download
                  >
                    Download Text File
                  </a>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteFile(file.file_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
