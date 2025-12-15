import { useRef } from 'react';
import { Button } from './ui';
import type { ExtractionResult } from '../types';
import '../styles/modules/ManualKeyInput.css';
import { useTranslation } from '../core/i18n/LanguageContext';

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
  const { t } = useTranslation();
  const keyTextareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="manual-key-input-container">
      <div className="key-input-area">
        <div className="manual-input-header">
          <h3>{t('manualInputHeader')}</h3>
          <button onClick={onHide} className="hide-manual-input-btn">
            {t('hideButton')}
          </button>
        </div>
        <p className="section-subtitle">{t('manualInputSubtitle')}</p>

        <div className="key-input-group">
          <textarea
            id="keyInput"
            ref={keyTextareaRef}
            rows={8}
            placeholder={t('manualInputPlaceholder')}
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
          title={uploadedFileIds.length === 0 ? t('pleaseUploadFirst') : ''}
        >
          {isExtracting ? t('extractingKeysLoading') : t('extractKeysButton')}
        </Button>

        {uploadedFileIds.length === 0 && (
          <p className="upload-notice">
            {t('pleaseUploadFirstNotice')}
          </p>
        )}

        {isExtracting && (
          <div className="extraction-in-progress-notice">
            <div className="spinner" />
            <div>
              <div className="extraction-notice-title">
                {t('extractingKeysNoticeTitle')}
              </div>
              <div className="extraction-notice-subtitle">
                {t('extractingKeysNoticeSubtitle')}
              </div>
            </div>
          </div>
        )}

        {extractionComplete && extractionResultsData && extractionResultsData.length > 0 && (
          <Button
            onClick={onViewResults}
            className="view-results-btn-inline"
          >
            {t('viewResultsWithCount').replace('{count}', String(extractionResultsData.length))}
          </Button>
        )}
      </div>
    </div>
  );
}
