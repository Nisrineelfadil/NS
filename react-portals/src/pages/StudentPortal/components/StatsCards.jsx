import { useLanguage } from '../../../context/LanguageContext';
import './StatsCards.css';

const StatsCards = ({ stats }) => {
  const { t } = useLanguage();
  // Handle averageScore which can be a string or number from backend
  const getAverageScore = () => {
    if (!stats.averageScore) return 'N/A';
    const score = typeof stats.averageScore === 'string' 
      ? parseFloat(stats.averageScore) 
      : stats.averageScore;
    return isNaN(score) ? 'N/A' : `${score.toFixed(1)}%`;
  };

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon total">
          <i className="fas fa-clipboard-list"></i>
        </div>
        <div className="stat-content">
          <h3>{t('totalGrades')}</h3>
          <p>{stats.totalGrades || 0}</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon average">
          <i className="fas fa-chart-line"></i>
        </div>
        <div className="stat-content">
          <h3>{t('averageScore')}</h3>
          <p>{getAverageScore()}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
