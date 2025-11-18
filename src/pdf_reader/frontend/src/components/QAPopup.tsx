import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { QAView } from './views/QAView';
import '../styles/modules/qapopup.css';

export const QAPopup: React.FC = () => {
  const isQAPopupOpen = useAppStore((state) => state.isQAPopupOpen);
  const setIsQAPopupOpen = useAppStore((state) => state.setIsQAPopupOpen);

  if (!isQAPopupOpen) {
    return null;
  }

  return (
    <div className="qa-popup-overlay" onClick={() => setIsQAPopupOpen(false)}>
      <div className="qa-popup-content" onClick={(e) => e.stopPropagation()}>
        <QAView />
      </div>
    </div>
  );
};
