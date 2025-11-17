import { useLanguage } from '../../../context/LanguageContext';
import './FormationSelector.css';

const FormationSelector = ({ formations, selectedFormation, onSelect, disabled, activeSeason }) => {
  const { t } = useLanguage();
  
  return (
    <div className="formation-selector">
      <h3>
        <i className="fas fa-book"></i>
        {t('selectFormation')}
        {disabled && <span className="auto-assigned-badge">({t('autoAssigned')})</span>}
      </h3>
      {activeSeason && (
        <div style={{
          fontSize: '0.85rem',
          color: '#10b981',
          marginTop: '-8px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '2px solid #10b981',
          display: 'inline-block'
        }}>
          <i className="fas fa-calendar-check" style={{ marginRight: '6px' }}></i>
          {activeSeason.name}
        </div>
      )}
      <div className="formation-grid">
        {formations.map((formation) => (
          <button
            key={formation}
            className={`formation-btn ${selectedFormation === formation ? 'active' : ''}`}
            onClick={() => onSelect(formation)}
            disabled={disabled}
          >
            <i className="fas fa-graduation-cap"></i>
            {formation}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FormationSelector;
