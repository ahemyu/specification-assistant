import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useState, useEffect } from 'react'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  fileId: string | null
  filename: string | null
}

interface PreviewData {
  content: string
  size: number
}

export function PreviewModal({ isOpen, onClose, fileId, filename }: PreviewModalProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !fileId) {
      setPreviewData(null)
      setError(null)
      return
    }

    const loadPreview = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/preview/${fileId}`)
        if (!response.ok) {
          throw new Error(`Failed to load preview: ${response.status}`)
        }

        const data = await response.json()
        setPreviewData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    loadPreview()
  }, [isOpen, fileId])

  const sizeKB = previewData ? (previewData.size / 1024).toFixed(2) : '0'

  return (
    <Dialog open={isOpen} onClose={onClose} className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container">
        <DialogPanel className="modal">
          <div className="modal-header">
            <DialogTitle className="modal-title">
              Preview: {filename || 'Loading...'}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="modal-close"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="preview-info">
              <div className="preview-filename">{filename}</div>
              <div className="preview-size">{sizeKB} KB</div>
            </div>

            <div className="preview-content">
              {isLoading && (
                <div className="preview-loading">Loading text content...</div>
              )}
              {error && (
                <div className="preview-error">Error loading preview: {error}</div>
              )}
              {!isLoading && !error && previewData && (
                <pre>{previewData.content}</pre>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
