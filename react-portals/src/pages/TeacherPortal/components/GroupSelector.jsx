import { useLanguage } from '../../../context/LanguageContext';
import './GroupSelector.css';

const GroupSelector = ({ groups, selectedGroup, onSelect, formation }) => {
  const { t } = useLanguage();
  console.log('GroupSelector - Received groups:', groups);
  console.log('GroupSelector - Formation:', formation);
  
  // Filter groups that match the selected formation
  const filteredGroups = groups.filter(group => {
    const isBranch = [
      'Informatique', 'Gériatrie', 'Cuisine', 'Aide soignant',
      'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Gestion hôtelière'
    ].includes(formation);

    if (isBranch) {
      // Branch teachers: only show subgroups matching the selected branch formation
      return group.formation === formation;
    }

    // Language teachers see only their formation groups
    return group.formation === formation || group.formation === 'Mixed';
  });
  
  console.log('GroupSelector - Filtered groups:', filteredGroups);

  return (
    <div className="group-selector">
      <h3>
        <i className="fas fa-users"></i>
        {t('selectGroup')}
      </h3>
      <div className="group-grid">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <button
              key={group._id}
              className={`group-btn ${selectedGroup === group._id ? 'active' : ''}`}
              onClick={() => onSelect(group._id)}
            >
              <div className="group-name">{group.name}</div>
              <div className="group-info">
                <span>
                  <i className="fas fa-user-graduate"></i>
                  {group.studentCount || 0} {t('students')}
                </span>
                <span>
                  <i className="fas fa-language"></i>
                  {group.formation}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="no-groups">
            <i className="fas fa-info-circle"></i>
            <p>{t('noGroupsAvailable')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSelector;
