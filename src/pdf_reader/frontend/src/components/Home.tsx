import { useAppStore } from "../store/useAppStore";
import { FaFileAlt, FaBalanceScale } from "react-icons/fa";
import "../styles/modules/home.css";

const cards = [
  {
    id: 'spec_assistant',
    title: "Spec-Assistant",
    description: "Extract information and chat with your PDF specifications.",
    icon: <FaFileAlt size={48} />,
  },
  {
    id: 'compare',
    title: "PDF-Vergleich",
    description: "Compare two PDF documents to find differences.",
    icon: <FaBalanceScale size={48} />,
  },
];

export const Home = () => {
  const setActiveView = useAppStore((state) => state.setActiveView);

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Willkommen</h1>
        <p className="home-subtitle">Wählen Sie ein Werkzeug, um zu beginnen</p>
      </div>
      <div className="cards-wrapper">
        {cards.map((card) => (
          <div key={card.id} className="card" onClick={() => setActiveView(card.id as any)}>
            <div className="card-icon">{card.icon}</div>
            <div className="card-content">
              <h2 className="card-title">{card.title}</h2>
              <p className="card-description">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
