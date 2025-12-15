import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { UploadView } from './SpecAI/UploadView';
import { ExtractionView } from './SpecAI/ExtractionView';
import "../styles/modules/maincontainer.css";
import { FaQuestionCircle } from "react-icons/fa";
import { Button } from './ui/Button';
import { LanguageProvider } from '../core/i18n/LanguageContext';
import { LanguageToggle } from './LanguageToggle';


export const MainContainer: React.FC = () => {
  const activeSubMenuItem = useAppStore((state) => state.activeSubMenuItem);
  const uploadedFileIds = useAppStore((state) => state.uploadedFileIds);
  const hasUploadedFiles = uploadedFileIds.length > 0;

  return (
    <LanguageProvider>
      <div className="main-content-area">
        <div className="lang-toggle-topright">
          <LanguageToggle />
        </div>

        {activeSubMenuItem === 'upload' && <UploadView />}
        {activeSubMenuItem === 'extract' && <ExtractionView />}

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
    </LanguageProvider>
  );
};
