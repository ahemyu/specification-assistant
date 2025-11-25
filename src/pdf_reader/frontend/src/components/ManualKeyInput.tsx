import { useRef } from 'react';
import { Button } from './ui';
import type { ExtractionResult } from '../types';
import '../styles/modules/ManualKeyInput.css';

interface ManualKeyInputProps {
  onHide: () => void;
  manualKeys: string;
  onManualKeysChange: (value: string) => void;
  onExtract: () => void;
  isExtracting: boolean;
  uploadedFileIds: string[];
  extractionComplete: boolean;
  extractionResultsData: ExtractionResult[] | null;
  onViewResults: () => void;
}

export function ManualKeyInput({
  onHide,
  manualKeys,
  onManualKeysChange,
  onExtract,
  isExtracting,
  uploadedFileIds,
  extractionComplete,
  extractionResultsData,
  onViewResults,
}: ManualKeyInputProps) {
  const keyTextareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="manual-key-input-container">
      <div className="key-input-area">
        <div className="manual-input-header">
          <h3>Enter Keys to Extract Manually</h3>
          <button onClick={onHide} className="hide-manual-input-btn">
            Hide
          </button>
        </div>
        <p className="section-subtitle">Enter one key per line</p>

        <div className="key-input-group">
          <textarea
            id="keyInput"
            ref={keyTextareaRef}
            rows={8}
            placeholder="Enter key names, one per line..."
            value={manualKeys}
            onChange={(e) => onManualKeysChange(e.target.value)}
          />
        </div>

        <Button
          id="extractBtn"
          className="extract-btn"
          onClick={onExtract}
          disabled={uploadedFileIds.length === 0 || isExtracting}
          isLoading={isExtracting}
          title={uploadedFileIds.length === 0 ? 'Please upload PDFs first' : ''}
        >
          {isExtracting ? 'Extracting keys...' : 'Extract Keys'}
        </Button>

        {uploadedFileIds.length === 0 && (
          <p className="upload-notice">
            Please upload PDF files in the Upload tab first
          </p>
        )}

        {isExtracting && (
          <div className="extraction-in-progress-notice">
            <div className="spinner" />
            <div>
              <div className="extraction-notice-title">
                Extracting keys using AI...
              </div>
              <div className="extraction-notice-subtitle">
                This may take a few moments depending on the number of keys and pages
              </div>
            </div>
          </div>
        )}

        {extractionComplete && extractionResultsData && extractionResultsData.length > 0 && (
          <Button
            onClick={onViewResults}
            className="view-results-btn-inline"
          >
            View Results ({extractionResultsData.length} keys)
          </Button>
        )}
      </div>
    </div>
  );
}
