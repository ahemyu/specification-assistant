import { useState } from "react";
import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { IoHome } from "react-icons/io5";

interface SidebarProps {
  isOpen: boolean;
  onSelectView?: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onSelectView }) => {
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

        {/* Spec - Assistant als normaler Menüpunkt */}
        <li
          className={`menu-item ${activeView === "spec-assistant" ? "active" : ""}`}
          onClick={() => handleSelect("spec-assistant")}
        >
          Spec - Assistant
        </li>

        {/* PDF - Comparison als normaler Menüpunkt */}
        <li
          className={`menu-item ${activeView === "pdf-comparison" ? "active" : ""}`}
          onClick={() => handleSelect("pdf-comparison")}
        >
          PDF - Comparison
        </li>
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
