import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { UploadView } from './SpecAI/UploadView';
import { ExtractionView } from './SpecAI/ExtractionView';
import { SummaryView } from './SpecAI/SummaryView';
import "../styles/modules/maincontainer.css";
import { FaQuestionCircle } from "react-icons/fa";
import { Button } from './ui/Button';
import { LanguageToggle } from './LanguageToggle';


export const MainContainer: React.FC = () => {
  const activeSubMenuItem = useAppStore((state) => state.activeSubMenuItem);
  const uploadedFileIds = useAppStore((state) => state.uploadedFileIds);
  const hasUploadedFiles = uploadedFileIds.length > 0;
  const extractionResultsData = useAppStore((state) => state.extractionResultsData);

  return (
    <div className="main-content-area">
      <div className="lang-toggle-topright">
        <LanguageToggle />
      </div>

      {activeSubMenuItem === 'upload' && <UploadView />}
      {activeSubMenuItem === 'extract' && <ExtractionView />}
      {activeSubMenuItem === 'summary' && extractionResultsData && (
        <SummaryView
          onReviewKey={() => {
            useAppStore.getState().setCurrentExtractionState('review');
            useAppStore.getState().setActiveSubMenuItem('extract');
          }}
          onStartNewExtraction={() => {
            useAppStore.getState().resetExtractionState();
            useAppStore.getState().setActiveSubMenuItem('upload');
          }}
        />
      )}


      {/* Copilot Button */}
      <div className="copilot-button-container">
        {hasUploadedFiles && (
          <Button
            className="copilot-button"
            size='sm'
            onClick={() => useAppStore.getState().setIsQAPopupOpen(true)}
          >
            <FaQuestionCircle />
          </Button>
        )}
      </div>
    </div>
  );
};
