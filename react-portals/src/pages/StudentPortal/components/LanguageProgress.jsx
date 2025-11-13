import { useState, useEffect } from 'react';
import { studentAPI } from '../../../services/api';
import './LanguageProgress.css';

const LanguageProgress = ({ formation }) => {
  const [progress, setProgress] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('A1');
  const [levelGrades, setLevelGrades] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const levels = ['A1', 'A2', 'B1', 'B2'];

  useEffect(() => {
    if (formation) {
      fetchProgress();
      fetchPerformanceData();
    }
  }, [formation]);

  useEffect(() => {
    if (selectedLevel) {
      fetchLevelGrades();
    }
  }, [selectedLevel, formation]);

  const fetchProgress = async () => {
    try {
      const response = await studentAPI.getLanguageProgress(formation);
      setProgress(response.data.progress);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await studentAPI.getPerformanceData(formation);
      setPerformanceData(response.data.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const fetchLevelGrades = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getGradesByLevel(formation, selectedLevel);
      setLevelGrades(response.data.grades || []);
    } catch (error) {
      console.error('Error fetching level grades:', error);
      setLevelGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const getLevelStatus = (levelData) => {
    if (!levelData) return { icon: '❌', label: 'Not Started', color: '#9ca3af' };
    
    const completed = levelData.totalTests;
    const total = levelData.maxTests;
    
    if (completed === total && levelData.finalExam?.completed) {
      return { icon: '✅', label: 'Completed', color: '#10b981' };
    } else if (completed > 0) {
      return { icon: '⏳', label: 'In Progress', color: '#f59e0b' };
    }
    return { icon: '❌', label: 'Not Started', color: '#9ca3af' };
  };

  const getEvaluationBadge = (status) => {
    const badges = {
      approved: { icon: '✅', label: 'Approved', color: '#10b981' },
      mid: { icon: '⚠️', label: 'Mid', color: '#f59e0b' },
      failed: { icon: '❌', label: 'Failed', color: '#ef4444' }
    };
    return badges[status] || badges.mid;
  };

  const getTestLabel = (grade) => {
    if (grade.testType === 'miniTest') {
      return `Mini Test ${grade.testNumber}`;
    }
    return 'Final Exam';
  };

  const getSkillIcon = (examType) => {
    const icons = {
      'Lesen': '📖',
      'Hören': '🎧',
      'Schreiben': '✍️',
      'Sprechen': '🗣️'
    };
    return icons[examType] || '📝';
  };

  if (!progress) {
    return (
      <div className="language-progress-container">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="language-progress-container">
      {/* Header */}
      <div className="progress-header">
        <h2>📊 {formation} - Language Progress Tracker</h2>
        <p className="progress-subtitle">Track your journey from A1 to B2</p>
      </div>

      {/* Level Overview Cards */}
      <div className="levels-overview">
        {levels.map(level => {
          const levelData = progress[level];
          const status = getLevelStatus(levelData);
          const percentage = levelData ? (levelData.totalTests / levelData.maxTests) * 100 : 0;

          return (
            <div 
              key={level}
              className={`level-overview-card ${selectedLevel === level ? 'selected' : ''}`}
              onClick={() => setSelectedLevel(level)}
            >
              <div className="level-card-header">
                <h3>{level}</h3>
                <span className="level-status-icon" style={{ color: status.color }}>
                  {status.icon}
                </span>
              </div>
              <div className="level-card-body">
                <div className="level-progress-bar">
                  <div 
                    className="level-progress-fill"
                    style={{ 
                      width: `${percentage}%`,
                      background: status.color
                    }}
                  />
                </div>
                <div className="level-stats">
                  <span className="level-completion">
                    {levelData?.totalTests || 0}/{levelData?.maxTests || 5} Tests
                  </span>
                  <span className="level-status-label" style={{ color: status.color }}>
                    {status.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Level Details */}
      <div className="level-details">
        <div className="level-details-header">
          <h3>📝 {selectedLevel} - Detailed View</h3>
          {progress[selectedLevel] && (
            <span className="level-detail-count">
              {progress[selectedLevel].totalTests} / {progress[selectedLevel].maxTests} Completed
            </span>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading grades...</p>
          </div>
        ) : levelGrades.length > 0 ? (
          <div className="grades-detail-grid">
            {levelGrades.map(grade => {
              const badge = getEvaluationBadge(grade.evaluationStatus);
              const percentage = ((grade.score / grade.maxScore) * 100).toFixed(1);

              return (
                <div key={grade._id} className="grade-detail-card">
                  <div className="grade-detail-header">
                    <div className="grade-test-badge">
                      {grade.testType === 'finalExam' ? (
                        <span className="final-exam-badge">🎓 Final Exam</span>
                      ) : (
                        <span className="mini-test-badge">📝 {getTestLabel(grade)}</span>
                      )}
                    </div>
                    <div className="grade-skill">
                      <span className="skill-icon">{getSkillIcon(grade.examType)}</span>
                      <span className="skill-name">{grade.examType}</span>
                    </div>
                  </div>

                  <div className="grade-detail-body">
                    <div className="grade-score-display">
                      <div className="score-main">
                        <span className="score-value">{grade.score}</span>
                        <span className="score-separator">/</span>
                        <span className="score-max">{grade.maxScore}</span>
                      </div>
                      <div className="score-percentage">{percentage}%</div>
                    </div>

                    <div className="grade-evaluation" style={{ borderColor: badge.color }}>
                      <span className="eval-icon">{badge.icon}</span>
                      <span className="eval-label" style={{ color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {grade.autoComment && (
                    <div className="grade-auto-comment">
                      <i className="fas fa-comment-dots"></i>
                      <p>{grade.autoComment}</p>
                    </div>
                  )}

                  {grade.comments && (
                    <div className="grade-teacher-comment">
                      <i className="fas fa-user-tie"></i>
                      <p>{grade.comments}</p>
                    </div>
                  )}

                  <div className="grade-meta">
                    <span className="grade-date">
                      <i className="fas fa-calendar"></i>
                      {new Date(grade.examDate).toLocaleDateString()}
                    </span>
                    {grade.uploadedBy && (
                      <span className="grade-teacher">
                        <i className="fas fa-chalkboard-teacher"></i>
                        {grade.uploadedBy.fullName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-clipboard-list"></i>
            <h4>No Grades Yet</h4>
            <p>You haven't received any grades for {selectedLevel} level yet.</p>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      {performanceData && performanceData.evaluations && (
        <div className="performance-summary">
          <h3>📈 Overall Performance Summary</h3>
          <div className="performance-stats">
            <div className="performance-stat approved">
              <span className="stat-icon">✅</span>
              <div className="stat-info">
                <span className="stat-value">{performanceData.evaluations.approved}</span>
                <span className="stat-label">Approved</span>
              </div>
            </div>
            <div className="performance-stat mid">
              <span className="stat-icon">⚠️</span>
              <div className="stat-info">
                <span className="stat-value">{performanceData.evaluations.mid}</span>
                <span className="stat-label">Mid</span>
              </div>
            </div>
            <div className="performance-stat failed">
              <span className="stat-icon">❌</span>
              <div className="stat-info">
                <span className="stat-value">{performanceData.evaluations.failed}</span>
                <span className="stat-label">Failed</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageProgress;
