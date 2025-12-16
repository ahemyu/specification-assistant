import { Notifications } from './components/Notifications'
import Sidebar from './components/Sidebar'
import { MainContainer } from './components/MainContainer'
import { Home } from './components/Home'
import { CompareView } from './components/DocCompare/CompareView'
import { useAppStore } from './store/useAppStore'
import { QAPopup } from './components/QAPopup'
import { AuthModal } from './components/AuthModal'
import LoginPage from './components/LoginPage'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { GradientDefinitions } from './components/GradientDefinitions'

import './styles/styles.css'
import { useEffect } from 'react';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Token validation on app load
const useTokenValidation = () => {
  const validateToken = useAppStore((state) => state.validateToken);
  
  useEffect(() => {
    validateToken();
  }, [validateToken]);
};

// Main App Content component
const MainAppContent = () => {
  const activeView = useAppStore((state) => state.activeView);

  return (
    <div className="app-layout">
      <div className="app-wrapper">
        <Sidebar isOpen={true} />
        <div className="main-content">
          <main className="scroll-area">
            {activeView === 'home' && <Home />}
            {activeView === 'spec_ai' && <MainContainer />}
            {activeView === 'compare' && <CompareView />}
          </main>
        </div>
      </div>
    </div>
  );
};

function App() {
  useTokenValidation();
  
  return (
    <Router>
      <Notifications />
      <QAPopup />
      <AuthModal />
      <GradientDefinitions />

      <Routes>
        <Route 
          path="/login" 
          element={<LoginPage />}
        />
        <Route 
          path="/*" 
          element={(
            <ProtectedRoute>
              <MainAppContent />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </Router>
  );
}


export default App

