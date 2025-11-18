import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import { useAppStore } from "../store/useAppStore";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <h2 className="sidebar-title">Trench Hub</h2>

      <ul className="sidebar-menu">
        {/* Overview */}
        <li
          className={`menu-item ${activeView === "home" ? "active" : ""}`}
          onClick={() => setActiveView("home")}
        >
          <span className="icon">
            <IoHome />
          </span>
          Übersicht
        </li>

        {/* Spec - Assistant als normaler Menüpunkt */}
        <li
          className={`menu-item ${activeView === "spec_assistant" ? "active" : ""}`}
          onClick={() => setActiveView("spec_assistant")}
        >
          Spec - Assistant
        </li>

        {/* PDF - Comparison als normaler Menüpunkt */}
        <li
          className={`menu-item ${activeView === "compare" ? "active" : ""}`}
          onClick={() => setActiveView("compare")}
        >
          PDF - Comparison
        </li>
      </ul>

      {/* Bottom Menu */}
      <ul className="sidebar-bottom">
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
