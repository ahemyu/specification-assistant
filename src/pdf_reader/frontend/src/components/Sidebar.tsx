import { FaUser, FaCog, FaSignOutAlt, FaFileAlt, FaBalanceScale, FaUpload, FaKey } from "react-icons/fa";
import { IoHome, IoChevronForward } from "react-icons/io5"; // Import IoChevronForward
import { useAppStore } from "../store/useAppStore";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const uploadedFileIds = useAppStore((state) => state.uploadedFileIds);
  const activeSubMenuItem = useAppStore((state) => state.activeSubMenuItem);
  const setActiveSubMenuItem = useAppStore((state) => state.setActiveSubMenuItem);

  const hasUploadedFiles = uploadedFileIds.length > 0;
  const isSpecAssistantExpanded = activeView === "spec_assistant";

  const handleSpecAssistantClick = () => {
    setActiveView("spec_assistant");
    if (!activeSubMenuItem) { // If no sub-menu item is active, default to 'upload'
      setActiveSubMenuItem("upload");
    }
  };

  const handleMainViewClick = (view: "home" | "compare") => {
    setActiveView(view);
    setActiveSubMenuItem(null); // Clear sub-menu item when switching to a different main view
  };

  const handleSubMenuClick = (item: "upload" | "extract") => {
    setActiveView("spec_assistant");
    setActiveSubMenuItem(item);
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <header className="sidebar-header">
        <h2 className="sidebar-title">Trench Hub</h2>
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
        <h3 className="sidebar-section-title">Tools</h3>
        <li
          className={`menu-item ${isSpecAssistantExpanded ? "active" : ""} ${!isSpecAssistantExpanded ? 'spec-assistant-collapsed' : ''}`}
          onClick={handleSpecAssistantClick}
        >
          <span className="icon"><FaFileAlt /></span>
          <span>Spec-Assistant</span>
          <span className={`dropdown-icon ${isSpecAssistantExpanded ? "expanded" : ""}`}>
            <IoChevronForward />
          </span>
        </li>
        {isSpecAssistantExpanded && (
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
              </>
            )}
          </ul>
        )}
        <li
          className={`menu-item ${activeView === "compare" ? "active" : ""}`}
          onClick={() => handleMainViewClick("compare")}
        >
          <span className="icon"><FaBalanceScale /></span>
          <span>PDF-Vergleich</span>
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
        <li className="menu-item">
          <span className="icon"><FaSignOutAlt /></span>
          <span>Abmelden</span>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
