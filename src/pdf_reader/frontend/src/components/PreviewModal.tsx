import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useState, useEffect } from 'react'
import { IoClose } from 'react-icons/io5'

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


  return (
    <Dialog open={isOpen} onClose={onClose} className={`modal ${isOpen ? 'show' : ''}`}>
      <DialogPanel className="modal-content">
        <div className="modal-header">
          <DialogTitle as="h2">
            Preview: {filename || 'Loading...'}
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >
            <IoClose size={24} />
          </button>
        </div>

        <div className="modal-body">
          
          <div className="preview-content">
            {isLoading && (
              <div className="preview-loading">Loading text content...</div>
            )}
            {error && (
              <div className="preview-error">Error loading preview: {error}</div>
            )}
            {!isLoading && !error && previewData && (
              <>{previewData.content}</>
            )}
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  )
}
