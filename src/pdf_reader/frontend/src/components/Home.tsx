import { useAppStore } from "../store/useAppStore";
import "../styles/modules/home.css";

const cards = [
  {
    id: 'spec_assistant',
    title: "Spec-Assistant",
    description: "Verwalten Sie Ihre PDF-Spezifikationen einfach.",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 'compare',
    title: "PDF-Vergleich",
    description: "Vergleichen Sie PDF-Dokumente schnell und effektiv.",
    imageUrl: "https/images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80",
  },
];

export const Home = () => {
  const setActiveView = useAppStore((state) => state.setActiveView);

  return (
    <div className="home-container">
      <h1>Übersicht</h1>
      <div className="cards-wrapper">
        {cards.map((card) => (
          <div key={card.id} className="card" onClick={() => setActiveView(card.id as any)}>
            <img src={card.imageUrl} alt={card.title} />
            <div className="card-title">{card.title}</div>
            <div className="card-description">{card.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
