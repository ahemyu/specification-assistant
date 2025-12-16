import { FaUser, FaCog, FaSignOutAlt, FaSignInAlt, FaFileAlt, FaBalanceScale, FaUpload, FaKey, FaListAlt, FaMoon } from "react-icons/fa";
import { IoHome, IoChevronForward, IoSunny } from "react-icons/io5";
import { useAppStore } from "../store/useAppStore";
import { useState, useEffect } from "react";
import './../styles/modules/theme-toggle.css';
import { useTranslation } from "../core/i18n/LanguageContext";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { t } = useTranslation();
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const uploadedFileIds = useAppStore((state) => state.uploadedFileIds);
  const extractionResultsData = useAppStore((state) => state.extractionResultsData);
  const activeSubMenuItem = useAppStore((state) => state.activeSubMenuItem);
  const setActiveSubMenuItem = useAppStore((state) => state.setActiveSubMenuItem);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const setShowAuthModal = useAppStore((state) => state.setShowAuthModal);
  const setAuthModalMode = useAppStore((state) => state.setAuthModalMode);
  const logout = useAppStore((state) => state.logout);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const hasUploadedFiles = uploadedFileIds.length > 0;
  const isSpecAIExpanded = activeView === "spec_ai";

  const handleSpecAIClick = () => {
    if (isSpecAIExpanded) {
      setActiveView("home");
      setActiveSubMenuItem(null);
    } else {
      setActiveView("spec_ai");
      setActiveSubMenuItem("upload");
    }
  };

  const handleMainViewClick = (view: "home" | "compare") => {
    setActiveView(view);
    setActiveSubMenuItem(null); // Clear sub-menu item when switching to a different main view
  };

  const handleSubMenuClick = (item: "upload" | "extract" | "summary") => {
    setActiveView("spec_ai");
    setActiveSubMenuItem(item);
  };

  const handleLoginClick = () => {
    setAuthModalMode("login");
    setShowAuthModal(true);
  };

  const handleLogoutClick = () => {
    logout();
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <header className="sidebar-header">
        <img src={theme === 'dark' ? "/assets/trench-logo-dark.png" : "/assets/trench-logo.png"} alt="Trench Hub Logo" className="sidebar-logo" style={{ width: '200px' }} />
      </header>

      <ul className="sidebar-menu">
        {/* Main Section */}
        <li
          className={`menu-item ${activeView === "home" ? "active" : ""}`}
          onClick={() => handleMainViewClick("home")}
        >
          <span className="icon"><IoHome /></span>
          <span>{t('homeTitle')}</span>
        </li>

        {/* Tools Section */}
        <h3 className="subsection-title">{t('toolsTitle')}</h3>
        <li
          className={`menu-item ${isSpecAIExpanded ? "active" : ""} ${!isSpecAIExpanded ? 'spec-assistant-collapsed' : ''}`}
          onClick={handleSpecAIClick}
        >
          <span className="icon"><FaFileAlt /></span>
          <span>{t('specAITitle')}</span>
          <span className={`dropdown-icon ${isSpecAIExpanded ? "expanded" : ""}`}>
            <IoChevronForward />
          </span>
        </li>
        {isSpecAIExpanded && (
          <ul className="submenu spec-assistant-expanded">
            <li
              className={`menu-item ${activeSubMenuItem === "upload" ? "active" : ""}`}
              onClick={() => handleSubMenuClick("upload")}
            >
              <span className="icon"><FaUpload /></span>
              <span>{t('uploadPDFsTitle')}</span>
            </li>
            {hasUploadedFiles && (
              <>
                <li
                  className={`menu-item ${activeSubMenuItem === "extract" ? "active" : ""}`}
                  onClick={() => handleSubMenuClick("extract")}
                >
                  <span className="icon"><FaKey /></span>
                  <span>{t('extractKeysTitle')}</span>
                </li>
                {extractionResultsData && extractionResultsData.length > 0 && (
                  <li
                    className={`menu-item ${activeSubMenuItem === "summary" ? "active" : ""}`}
                    onClick={() => handleSubMenuClick("summary")}
                  >
                    <span className="icon"><FaListAlt /></span>
                    <span>{t('summaryTitle')}</span>
                  </li>
                )}
              </>
            )}
          </ul>
        )}
        <li
          className={`menu-item ${activeView === "compare" ? "active" : ""}`}
          onClick={() => handleMainViewClick("compare")}
        >
          <span className="icon"><FaBalanceScale /></span>
          <span>{t('compareTitle')}</span>
        </li>
      </ul>

      {/* Bottom Menu */}
      <ul className="sidebar-bottom">
        <li className="menu-item">
          <span className="icon"><FaUser /></span>
          <span>{t('accountTitle')}</span>
        </li>
        <li className="menu-item">
          <span className="icon"><FaCog /></span>
          <span>{t('settingsTitle')}</span>
        </li>
        <li className="menu-item theme-toggle-container" onClick={toggleTheme}>
          <span className="icon">{theme === 'light' ? <FaMoon /> : <IoSunny />}</span>
          <span>{theme === 'light' ? t('darkMode') : t('lightMode')}</span>
        </li>
        {isAuthenticated ? (
          <li className="menu-item" onClick={handleLogoutClick}>
            <span className="icon"><FaSignOutAlt /></span>
            <span>{t('logoutTitle')}</span>
          </li>
        ) : (
          <li className="menu-item" onClick={handleLoginClick}>
            <span className="icon"><FaSignInAlt /></span>
            <span>{t('loginTitle')}</span>
          </li>
        )}
      </ul>
    </aside>
  );
};

export default Sidebar;