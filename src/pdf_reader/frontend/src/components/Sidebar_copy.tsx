import { useState } from "react";
import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { IoHome, IoChevronDown } from "react-icons/io5";
import { BiHistory } from "react-icons/bi";
import { AiOutlineFileAdd } from "react-icons/ai";

interface SidebarProps {
  isOpen: boolean;
  onSelectView?: (view: string) => void; // callback to notify parent which view is active
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onSelectView }) => {
  const [isSpecAssistantOpen, setSpecAssistantOpen] = useState(true);
  const [isPdfVergleichOpen, setPdfVergleichOpen] = useState(true);

  // Track currently active view, default to 'home'
  const [activeView, setActiveView] = useState("home");

  const handleSelect = (view: string) => {
    setActiveView(view);
    onSelectView?.(view);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <h2 className="sidebar-title">Trench Hub</h2>

      <ul className="sidebar-menu">
        {/* Overview */}
        <li
          className={`menu-item ${activeView === "home" ? "active" : ""}`}
          onClick={() => handleSelect("home")}
        >
          <span className="icon">
            <IoHome />
          </span>
          Übersicht
        </li>

        {/* Spec-Assistant */}
        <li
          className="menu-item dropdown"
          onClick={() => setSpecAssistantOpen(!isSpecAssistantOpen)}
        >
          <span>Spec - Assistant</span>
          <span className={`arrow ${isSpecAssistantOpen ? "open" : ""}`}>
            <IoChevronDown />
          </span>
        </li>
        {isSpecAssistantOpen && (
          <>
            <li
              className={`menu-subitem ${activeView === "pdf-upload" ? "active" : ""}`}
              onClick={() => handleSelect("pdf-upload")}
            >
              <span className="icon small">
                <AiOutlineFileAdd />
              </span>
              PDF hochladen
            </li>
            <li
              className={`menu-subitem ${activeView === "history" ? "active" : ""}`}
              onClick={() => handleSelect("history")}
            >
              <span className="icon small">
                <BiHistory />
              </span>
              Historie
            </li>
          </>
        )}

        {/* PDF-Vergleich */}
        <li
          className="menu-item dropdown"
          onClick={() => setPdfVergleichOpen(!isPdfVergleichOpen)}
        >
          <span>PDF - Comparison</span>
          <span className={`arrow ${isPdfVergleichOpen ? "open" : ""}`}>
            <IoChevronDown />
          </span>
        </li>
        {isPdfVergleichOpen && (
          <>
            <li
              className={`menu-subitem ${activeView === "pdf-upload" ? "active" : ""}`}
              onClick={() => handleSelect("pdf-upload")}
            >
              <span className="icon small">
                <AiOutlineFileAdd />
              </span>
              PDF hochladen
            </li>
            <li
              className={`menu-subitem ${activeView === "history" ? "active" : ""}`}
              onClick={() => handleSelect("history")}
            >
              <span className="icon small">
                <BiHistory />
              </span>
              Historie
            </li>
          </>
        )}
      </ul>

      {/* Bottom Menu */}
      <ul className="sidebar-menu sidebar-bottom">
        <li className="menu-item">
          <span className="icon">
            <FaUser />
          </span>
          Konto
        </li>
        <li className="menu-item">
          <span className="icon">
            <FaCog />
          </span>
          Einstellungen
        </li>
        <li className="menu-item">
          <span className="icon">
            <FaSignOutAlt />
          </span>
          Abmelden
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
