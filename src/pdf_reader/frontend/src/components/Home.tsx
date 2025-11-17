import React from "react";
import "./Home.css";

const cards = [
  {
    title: "Spec-Assistant",
    description: "Verwalten Sie Ihre PDF-Spezifikationen einfach.",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "PDF-Vergleich",
    description: "Vergleichen Sie PDF-Dokumente schnell und effektiv.",
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80",
  },
];

export const Home = () => {
  return (
    <div className="home-container">
      <h1>Übersicht</h1>
      <div className="cards-wrapper">
        {cards.map((card, idx) => (
          <div key={idx} className="card">
            <img src={card.imageUrl} alt={card.title} />
            <div className="card-title">{card.title}</div>
            <div className="card-description">{card.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
