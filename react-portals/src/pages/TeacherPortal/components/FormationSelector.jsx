import './FormationSelector.css';

const FormationSelector = ({ formations, selectedFormation, onSelect, disabled }) => {
  return (
    <div className="formation-selector">
      <h3>
        <i className="fas fa-book"></i>
        Select Formation
        {disabled && <span className="auto-assigned-badge">(Auto-assigned)</span>}
      </h3>
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
