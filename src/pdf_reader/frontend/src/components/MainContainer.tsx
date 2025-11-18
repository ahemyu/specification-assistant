import { useAppStore } from '../store/useAppStore';
import { UploadView } from './views/UploadView';
import { ExtractionView } from './views/ExtractionView';
import "../styles/modules/maincontainer.css";
import { FaQuestionCircle } from "react-icons/fa";
import { Button } from './ui/Button';


export const MainContainer: React.FC = () => {
  const activeSubMenuItem = useAppStore((state) => state.activeSubMenuItem);
  const uploadedFileIds = useAppStore((state) => state.uploadedFileIds);
  const hasUploadedFiles = uploadedFileIds.length > 0;

  return (
    <div className="main-content-area">
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
  );
};
