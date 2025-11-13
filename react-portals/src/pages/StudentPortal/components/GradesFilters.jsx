import { useLanguage } from '../../../context/LanguageContext';
import './GradesFilters.css';

const GradesFilters = ({ filters, onFilterChange, formations, branches }) => {
  const { t } = useLanguage();
  const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
  const isLanguageSelected = filters.formation && languageFormations.includes(filters.formation);
  
  const handleChange = (field, value) => {
    // When changing formation or branch, clear the other and reset level/test filters
    if (field === 'formation' && value) {
      onFilterChange({
        ...filters,
        formation: value,
        branch: '', // Clear branch when selecting formation
        semester: '', // Clear semester for languages
        languageLevel: '', // Reset level
        testType: '', // Reset test type
        testNumber: null,
        [field]: value,
      });
    } else if (field === 'branch' && value) {
      onFilterChange({
        ...filters,
        branch: value,
        formation: '', // Clear formation when selecting branch
        languageLevel: '', // Clear language-specific filters
        testType: '',
        testNumber: null,
        [field]: value,
      });
    } else {
      onFilterChange({
        ...filters,
        [field]: value,
      });
    }
  };

  // Academic year is now auto-set from current season
  const isAcademicYearSet = !!filters.academicYear;

  return (
    <div className="filters">
      <h3>{t('filterGrades')}</h3>
      <div className="filter-grid">
        <div className="filter-group">
          <label>{t('languageFormation')}</label>
          <select
            value={filters.formation}
            onChange={(e) => handleChange('formation', e.target.value)}
            disabled={!!filters.branch}
          >
            <option value="">{t('allLanguages')}</option>
            {formations.map((formation) => (
              <option key={formation} value={formation}>
                {formation}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>{t('branchFiliere')}</label>
          <select
            value={filters.branch}
            onChange={(e) => handleChange('branch', e.target.value)}
            disabled={!!filters.formation}
          >
            <option value="">{t('allBranches')}</option>
            {branches && branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        {!isLanguageSelected && (
          <div className="filter-group">
            <label>{t('semester')}</label>
            <select
              value={filters.semester}
              onChange={(e) => handleChange('semester', e.target.value)}
            >
              <option value="">{t('allSemesters')}</option>
              <option value="Semester 1">{t('semester')} 1</option>
              <option value="Semester 2">{t('semester')} 2</option>
            </select>
          </div>
        )}

        <div className="filter-group">
          <label>
            {t('academicYear')}
            {isAcademicYearSet && (
              <span style={{ fontSize: '11px', color: '#10b981', marginLeft: '8px' }}>
                ({t('currentSeason')})
              </span>
            )}
          </label>
          <input
            type="text"
            value={filters.academicYear || 'Loading...'}
            disabled
            style={{
              padding: '12px',
              border: '2px solid rgba(255, 204, 0, 0.3)',
              borderRadius: '10px',
              background: 'rgba(30, 30, 50, 0.5)',
              color: '#FFCC00',
              fontSize: '14px',
              cursor: 'not-allowed',
              fontWeight: '600'
            }}
          />
          <small style={{ color: '#aaa', fontSize: '11px', marginTop: '4px', display: 'block' }}>
            {t('autoSet')}
          </small>
        </div>
      </div>
    </div>
  );
};

export default GradesFilters;
