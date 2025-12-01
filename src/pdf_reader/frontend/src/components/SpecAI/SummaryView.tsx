import { useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { ExtractionResult } from '../../types'

interface SummaryViewProps {
  onReviewKey: (keyName: string) => void
  onStartNewExtraction: () => void
}

export function SummaryView({ onReviewKey, onStartNewExtraction }: SummaryViewProps) {
  const { extractionResultsData, reviewedKeys, extractionResultsBackendFormat } = useAppStore()

  const results = extractionResultsData || []
  const keyCount = results.length

  //neues kommentar

  // Get reviewed results with updated values in backend format
  const getReviewedResults = useCallback(() => {
    const reviewedData: Record<string, any> = {}

    // Use backend format and update key_value with reviewed values
    if (extractionResultsBackendFormat) {
      Object.entries(extractionResultsBackendFormat).forEach(([keyName, backendResult]) => {
        const reviewState = reviewedKeys[keyName]

        // Create a copy of the backend result
        reviewedData[keyName] = { ...backendResult }

        // Update key_value with reviewed value if available
        if (reviewState) {
          reviewedData[keyName].key_value = reviewState.value
        }
      })
    }

    return reviewedData
  }, [extractionResultsBackendFormat, reviewedKeys])

  // Download results
  const handleDownload = useCallback(async () => {
    const reviewedResults = getReviewedResults()

    try {
      const response = await fetch('/download-extraction-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraction_results: reviewedResults }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to download Excel file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reviewed_extraction_results.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(`Error downloading results: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [getReviewedResults])

  // Get source summary for display
  const getSourceSummary = (result: ExtractionResult) => {
    const locations = result.references || []
    if (locations.length === 0) {
      return 'No source'
    }

    if (locations.length === 1) {
      const loc = locations[0]
      return `${loc.file_id} p${loc.page_number}`
    }

    return `${locations.length} sources`
  }

  // Sort results by key name
  const sortedResults = [...results].sort((a, b) => a.key.localeCompare(b.key))

  return (
    <div className="summary-section">
      {/* Header */}
      <div className="summary-header">
        <div className="summary-title-group">
          <h2>Extraction Summary</h2>
          <p className="summary-subtitle">
            Successfully extracted <span>{keyCount}</span> key{keyCount !== 1 ? 's' : ''} from your
            documents
          </p>
        </div>
        <div className="summary-actions">
          <button className="btn-secondary" onClick={onStartNewExtraction}>
            Start New Extraction
          </button>
          <button className="btn-primary" onClick={handleDownload}>
            Download Results
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="summary-table-container">
        <table className="summary-table">
          <thead>
            <tr>
              <th>Key Name</th>
              <th>Extracted Value</th>
              <th>Status</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result) => {
              const keyName = result.key
              const reviewState = reviewedKeys[keyName]
              const value = reviewState?.value || result.value || 'Not found'
              const status = reviewState?.status || 'pending'
              const sourceSummary = getSourceSummary(result)

              return (
                <tr key={keyName} className="summary-row">
                  <td className="key-name-cell">{keyName}</td>
                  <td className={`value-cell ${!value || value === 'Not found' ? 'value-not-found' : ''}`}>
                    {value}
                  </td>
                  <td className="status-cell">
                    <StatusBadge status={status} />
                  </td>
                  <td className="source-cell">{sourceSummary}</td>
                  <td className="actions-cell">
                    <button
                      className="review-btn"
                      onClick={() => onReviewKey(keyName)}
                      title="Review this key in detail"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface StatusBadgeProps {
  status: 'pending' | 'accepted' | 'edited'
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${status}`}>
      {status === 'accepted' && (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>{' '}
          Accepted
        </>
      )}
      {status === 'edited' && (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 10H3.5L9.5 4L8 2.5L2 8.5V10Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>{' '}
          Edited
        </>
      )}
      {status === 'pending' && (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
          </svg>{' '}
          Pending
        </>
      )}
    </span>
  )
}
