import { FaUser, FaCog, FaSignOutAlt, FaFileAlt, FaBalanceScale, FaUpload, FaKey, FaListAlt, FaMoon } from "react-icons/fa";
import { IoHome, IoChevronForward, IoSunny } from "react-icons/io5"; // Import IoChevronForward
import { useAppStore } from "../store/useAppStore";
import { useState, useEffect } from "react";
import './../styles/modules/theme-toggle.css';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const uploadedFileIds = useAppStore((state) => state.uploadedFileIds);
  const activeSubMenuItem = useAppStore((state) => state.activeSubMenuItem);
  const setActiveSubMenuItem = useAppStore((state) => state.setActiveSubMenuItem);

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

  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <header className="sidebar-header">
        <img src={theme === 'dark' ? "/assets/trench-logo-dark.png" : "/assets/trench-logo.png"} alt="Trench Hub Logo" className="sidebar-logo" style={{ width: '200px', marginBottom: '20px' }} />
        <h2 className="page-title">Trench Hub</h2>
      </header>

      <ul className="sidebar-menu">
        {/* Main Section */}
        <li
          className={`menu-item ${activeView === "home" ? "active" : ""}`}
          onClick={() => handleMainViewClick("home")}
        >
          <span className="icon"><IoHome /></span>
          <span>Home</span>
        </li>

        {/* Tools Section */}
        <h3 className="subsection-title">Tools</h3>
        <li
          className={`menu-item ${isSpecAIExpanded ? "active" : ""} ${!isSpecAIExpanded ? 'spec-assistant-collapsed' : ''}`}
          onClick={handleSpecAIClick}
        >
          <span className="icon"><FaFileAlt /></span>
          <span>SpecAI</span>
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
              <span>Upload PDFs</span>
            </li>
            {hasUploadedFiles && (
              <>
                <li
                  className={`menu-item ${activeSubMenuItem === "extract" ? "active" : ""}`}
                  onClick={() => handleSubMenuClick("extract")}
                >
                  <span className="icon"><FaKey /></span>
                  <span>Extract Keys</span>
                </li>
                <li
                  className={`menu-item ${activeSubMenuItem === "summary" ? "active" : ""}`}
                  onClick={() => handleSubMenuClick("summary")}
                >
                  <span className="icon"><FaListAlt /></span>
                  <span>Summary</span>
                </li>
              </>
            )}
          </ul>
        )}
        <li
          className={`menu-item ${activeView === "compare" ? "active" : ""}`}
          onClick={() => handleMainViewClick("compare")}
        >
          <span className="icon"><FaBalanceScale /></span>
          <span>Doc Compare</span>
        </li>
      </ul>

      {/* Bottom Menu */}
      <ul className="sidebar-bottom">
        <li className="menu-item">
          <span className="icon"><FaUser /></span>
          <span>Konto</span>
        </li>
        <li className="menu-item">
          <span className="icon"><FaCog /></span>
          <span>Einstellungen</span>
        </li>
        <li className="menu-item theme-toggle-container" onClick={toggleTheme}>
          <span className="icon">{theme === 'light' ? <FaMoon /> : <IoSunny />}</span>
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </li>
        <li className="menu-item">
          <span className="icon"><FaSignOutAlt /></span>
          <span>Abmelden</span>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;