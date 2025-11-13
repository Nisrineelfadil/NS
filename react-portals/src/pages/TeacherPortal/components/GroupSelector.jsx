import './GroupSelector.css';

const GroupSelector = ({ groups, selectedGroup, onSelect, formation }) => {
  console.log('GroupSelector - Received groups:', groups);
  console.log('GroupSelector - Formation:', formation);
  
  // Filter groups that match the selected formation
  const filteredGroups = groups.filter(group => {
    // Show all groups for branch formations
    const isBranchFormation = [
      'Informatique', 'Gériatrie', 'Cuisine', 'Aide soignant',
      'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Gestion hôtelière'
    ].includes(formation);

    if (isBranchFormation) {
      return true; // Branch teachers see all groups
    }

    // Language teachers see only their formation groups
    return group.formation === formation || group.formation === 'Mixed';
  });
  
  console.log('GroupSelector - Filtered groups:', filteredGroups);

  return (
    <div className="group-selector">
      <h3>
        <i className="fas fa-users"></i>
        Select Group
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
                  {group.studentCount || 0} students
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
            <p>No groups available for this formation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSelector;
