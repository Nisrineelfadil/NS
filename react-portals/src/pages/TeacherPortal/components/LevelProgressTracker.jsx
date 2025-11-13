import { useState, useEffect } from 'react';
import './LevelProgressTracker.css';

const LevelProgressTracker = ({ student, formation, selectedLevel, grades }) => {
  const [expandedTest, setExpandedTest] = useState(null);
  
  // Define test structure for language formations
  const tests = [
    { id: 'mini1', label: 'Mini Test 1', type: 'miniTest', number: 1 },
    { id: 'mini2', label: 'Mini Test 2', type: 'miniTest', number: 2 },
    { id: 'mini3', label: 'Mini Test 3', type: 'miniTest', number: 3 },
    { id: 'mini4', label: 'Mini Test 4', type: 'miniTest', number: 4 },
    { id: 'final', label: `${selectedLevel} Final`, type: 'finalExam', number: null }
  ];

  // Check if a test has grades uploaded
  const getTestStatus = (test) => {
    if (!grades || grades.length === 0) return { uploaded: false, count: 0, total: 4 };
    
    const testGrades = grades.filter(grade => {
      const matchesLevel = grade.languageLevel === selectedLevel;
      const matchesType = grade.testType === test.type;
      const matchesNumber = test.type === 'miniTest' 
        ? grade.testNumber === test.number 
        : true;
      
      return matchesLevel && matchesType && matchesNumber;
    });
    
    // Count how many of the 4 exam types (Lesen, Hören, Schreiben, Sprechen) are uploaded
    const examTypes = ['Lesen', 'Hören', 'Schreiben', 'Sprechen'];
    const uploadedTypes = new Set(testGrades.map(g => g.examType));
    const count = uploadedTypes.size;
    
    return {
      uploaded: count === 4,
      count: count,
      total: 4,
      grades: testGrades,
      percentage: (count / 4) * 100
    };
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    let totalUploaded = 0;
    let totalTests = tests.length;
    
    tests.forEach(test => {
      const status = getTestStatus(test);
      if (status.uploaded) totalUploaded++;
    });
    
    return {
      uploaded: totalUploaded,
      total: totalTests,
      percentage: (totalUploaded / totalTests) * 100
    };
  };

  const overallProgress = calculateOverallProgress();

  const handleTestClick = (testId) => {
    setExpandedTest(expandedTest === testId ? null : testId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="level-progress-tracker">
      {/* Overall Progress Header */}
      <div className="progress-header">
        <div className="progress-header-content">
          <div className="progress-info">
            <span className="progress-level">{selectedLevel}</span>
            <span className="progress-label">Level Progress</span>
          </div>
          <div className="progress-stats">
            <span className="progress-count">{overallProgress.uploaded}/{overallProgress.total}</span>
            <span className="progress-percentage">{Math.round(overallProgress.percentage)}%</span>
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${overallProgress.percentage}%` }}
          >
            <div className="progress-bar-glow"></div>
          </div>
        </div>
      </div>

      {/* Test Progress Capsules */}
      <div className="progress-capsules">
        {tests.map((test, index) => {
          const status = getTestStatus(test);
          const isExpanded = expandedTest === test.id;
          const isFinal = test.type === 'finalExam';
          
          return (
            <div 
              key={test.id}
              className={`progress-capsule ${status.uploaded ? 'completed' : status.count > 0 ? 'in-progress' : 'pending'} ${isExpanded ? 'expanded' : ''} ${isFinal ? 'final-exam' : ''}`}
              onClick={() => handleTestClick(test.id)}
            >
              {/* Capsule Background Glow */}
              <div className="capsule-glow"></div>
              
              {/* Capsule Content */}
              <div className="capsule-content">
                <div className="capsule-header">
                  <div className="capsule-icon">
                    {status.uploaded ? (
                      <i className="fas fa-check-circle"></i>
                    ) : status.count > 0 ? (
                      <i className="fas fa-clock"></i>
                    ) : (
                      <i className="fas fa-circle"></i>
                    )}
                  </div>
                  <div className="capsule-info">
                    <h4>{test.label}</h4>
                    <span className="capsule-status">
                      {status.uploaded ? 'Complete' : status.count > 0 ? `${status.count}/4 uploaded` : 'Not started'}
                    </span>
                  </div>
                  <div className="capsule-progress-indicator">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="3"
                        strokeDasharray={`${status.percentage * 1.005} 100.5`}
                        strokeLinecap="round"
                        transform="rotate(-90 20 20)"
                        className="progress-circle"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFCC00" />
                          <stop offset="100%" stopColor="#FF9500" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="progress-text">{status.count}/4</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && status.grades && status.grades.length > 0 && (
                  <div className="capsule-details">
                    <div className="details-grid">
                      {['Lesen', 'Hören', 'Schreiben', 'Sprechen'].map(examType => {
                        const gradeData = status.grades.find(g => g.examType === examType);
                        return (
                          <div key={examType} className={`detail-item ${gradeData ? 'uploaded' : 'missing'}`}>
                            <i className={`fas ${
                              examType === 'Lesen' ? 'fa-book-open' :
                              examType === 'Hören' ? 'fa-headphones' :
                              examType === 'Schreiben' ? 'fa-pen-fancy' :
                              'fa-comments'
                            }`}></i>
                            <span className="detail-label">{examType}</span>
                            {gradeData ? (
                              <>
                                <span className="detail-score">{gradeData.score}/{gradeData.maxScore}</span>
                                <span className="detail-date">{formatDate(gradeData.examDate)}</span>
                              </>
                            ) : (
                              <span className="detail-missing">Not uploaded</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Fill Animation */}
              <div 
                className="capsule-fill"
                style={{ width: `${status.percentage}%` }}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LevelProgressTracker;
