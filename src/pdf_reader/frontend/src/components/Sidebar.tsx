import { FaUser, FaCog, FaSignOutAlt, FaFileAlt, FaBalanceScale } from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import { useAppStore } from "../store/useAppStore";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);

  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <header className="sidebar-header">
        <h2 className="sidebar-title">Trench Hub</h2>
      </header>

      <ul className="sidebar-menu">
        {/* Main Section */}
        <li
          className={`menu-item ${activeView === "home" ? "active" : ""}`}
          onClick={() => setActiveView("home")}
        >
          <span className="icon"><IoHome /></span>
          <span>Home</span>
        </li>

        {/* Tools Section */}
        <div className="sidebar-section-title">Tools</div>
        <li
          className={`menu-item ${activeView === "spec_assistant" ? "active" : ""}`}
          onClick={() => setActiveView("spec_assistant")}
        >
          <span className="icon"><FaFileAlt /></span>
          <span>Spec-Assistant</span>
        </li>
        <li
          className={`menu-item ${activeView === "compare" ? "active" : ""}`}
          onClick={() => setActiveView("compare")}
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
