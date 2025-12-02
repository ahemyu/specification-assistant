
import { IoClose } from 'react-icons/io5';
import type { KeyWithCategory } from '../data/keyTemplates';
import '../styles/modules/AllKeysModal.css';

interface AllKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateKeys: KeyWithCategory[];
  selectedProductType: string | null;
}

export function AllKeysModal({
  isOpen,
  onClose,
  templateKeys,
  selectedProductType,
}: AllKeysModalProps) {
  if (!isOpen) {
    return null;
  }

  // Group keys by category
  const grouped = templateKeys.reduce((acc, key) => {
    if (!acc[key.category]) {
      acc[key.category] = [];
    }
    acc[key.category].push(key);
    return acc;
  }, {} as Record<string, KeyWithCategory[]>);

  let globalIndex = 0;

  return (
    <div className="all-keys-modal-overlay" onClick={onClose}>
      <div className="all-keys-modal-content" onClick={(e) => e.stopPropagation()}>
       
        {/* Header Container */}
        <div className="all-keys-modal-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>

          {/* Row 1: Title (Left) and Button (Far Right) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h1 className="section-title" style={{ margin: 0 }}>
              All Keys for {selectedProductType}
            </h1>
            
            <button onClick={onClose} className="all-keys-modal-close-btn" aria-label="Close">
              <IoClose size={24} />
            </button>
          </div>

          {/* Row 2: Subtitle (Left Aligned) */}
          <p className="subtitle" style={{ margin: 0, marginTop: '4px', textAlign: 'left' }}>
            {templateKeys.length} keys will be extracted
          </p>

        </div>

        {/* Content */}
        <div className="all-keys-modal-body">
          {Object.entries(grouped).map(([category, keys]) => (
            <div key={category} className="category-section">
              {/* Category Header */}
              <div className="category-header">
                <h3 className="subsection-title">
                  {category} ({keys.length} keys)
                </h3>
              </div>

              {/* Keys Grid */}
              <div className="keys-grid">
                {keys.map((key) => {
                  const index = globalIndex++;
                  return (
                    <div key={index} className="key-item">
                      <div className="key-item-content">
                        <span className="key-item-index">
                          {index + 1}.
                        </span>
                        <span className="key-item-name">{key.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
