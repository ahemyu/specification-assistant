
import { useAppStore } from "../store/useAppStore";
import { FaFileAlt, FaBalanceScale } from "react-icons/fa";
import "../styles/modules/home.css";
import { useTranslation } from "../core/i18n/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

const cards = [
  {
    id: "spec_ai",
    titleKey: "spec_ai_title" as const,
    descriptionKey: "spec_ai_description" as const,
    icon: <FaFileAlt size={48} />,
  },
  {
    id: "compare",
    titleKey: "compare_title" as const,
    descriptionKey: "compare_description" as const,
    icon: <FaBalanceScale size={48} />,
  },
];

export const Home = () => {
  const setActiveView = useAppStore((state) => state.setActiveView);
  const setActiveSubMenuItem = useAppStore((state) => state.setActiveSubMenuItem);
  const { t } = useTranslation();

  const handleCardClick = (id: string) => {
    if (id === "spec_ai") {
      setActiveView("spec_ai");
      setActiveSubMenuItem("upload");
    } else if (id === "compare") {
      setActiveView("compare");
      setActiveSubMenuItem(null);
    }
  };

  return (
    <div className="home-container" style={{ position: 'relative' }}>
      <div className="lang-toggle-topright">
        <LanguageToggle />
      </div>

      <div className="home-header">
        <h1>{t("headerTitle")}</h1>
        <p className="subtitle">{t("subtitle")}</p>
      </div>
      <div className="cards-wrapper">
        {cards.map((card) => (
          <div key={card.id} className="card" onClick={() => handleCardClick(card.id)}>
            <div className="card-icon">{card.icon}</div>
            <div className="card-content">
              <h3 className="card-title">{t(card.titleKey)}</h3>
              <p className="card-description">{t(card.descriptionKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
