import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Icon from '../components/Icon';
import './GradesScreen.css';
import { API_URL } from '../config';

const LANGUAGE_FORMATIONS = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
const BRANCH_FORMATIONS = ['Informatique', 'Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Gestion hôtelière'];

const GradesScreen = () => {
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  
  const [viewMode, setViewMode] = useState('languages');
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [selectedExamNumber, setSelectedExamNumber] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedTestType, setSelectedTestType] = useState(null);
  
  // Track the latest request to prevent race conditions
  const requestIdRef = useRef(0);

  useEffect(() => {
    loadStudentProfile();
  }, []);

  useEffect(() => {
    if (studentProfile) {
      // Clear grades immediately when filters change to prevent showing stale data
      setGrades([]);
      setStats({ totalGrades: 0, averageScore: 0 });
      loadGrades();
    }
  }, [studentProfile, viewMode, selectedFormation, selectedExamNumber, selectedSemester, selectedLevel, selectedTestType]);

  const loadStudentProfile = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/grades/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      }
    }
  };

  const loadGrades = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      
      // Increment request ID to track this specific request
      const currentRequestId = ++requestIdRef.current;
      
      const params = {};
      if (viewMode === 'branches' && selectedFormation) {
        params.branch = selectedFormation;
        if (selectedExamNumber) params.examNumber = selectedExamNumber;
        if (selectedSemester) params.semester = selectedSemester;
      } else if (viewMode === 'languages' && selectedFormation) {
        params.formation = selectedFormation;
        if (selectedLevel) params.languageLevel = selectedLevel;
        if (selectedTestType) params.testType = selectedTestType;
        if (selectedTestType === 'miniTest' && selectedExamNumber) params.testNumber = selectedExamNumber;
      }

      console.log(`🔍 [Request #${currentRequestId}] PWA Filter State:`, {
        viewMode,
        selectedFormation,
        selectedLevel,
        selectedTestType,
        selectedExamNumber
      });
      console.log(`📤 [Request #${currentRequestId}] Sending API params:`, params);

      const response = await axios.get(`${API_URL}/api/grades/student/grades`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        params,
        timeout: 10000,
      });

      // Only update state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        console.log(`📥 [Request #${currentRequestId}] API Response (APPLIED):`, {
          gradesCount: response.data.grades?.length || 0,
          grades: response.data.grades
        });

        // Always update grades, even if empty array
        setGrades(response.data.grades || []);
        setStats(response.data.stats || { totalGrades: 0, averageScore: 0 });
      } else {
        console.log(`⏭️ [Request #${currentRequestId}] API Response (IGNORED - outdated):`, {
          gradesCount: response.data.grades?.length || 0
        });
      }
    } catch (error) {
      console.error('Error loading grades:', error);
      if (error.code === 'ECONNABORTED') {
        alert('Server is taking too long to respond. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGrades();
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return { letter: 'A', color: '#10b981' };
    if (percentage >= 80) return { letter: 'B', color: '#3b82f6' };
    if (percentage >= 70) return { letter: 'C', color: '#f59e0b' };
    if (percentage >= 60) return { letter: 'D', color: '#f97316' };
    return { letter: 'F', color: '#ef4444' };
  };

  const getEvaluationStatus = (percentage) => {
    if (percentage >= 70) return { status: 'Approved', icon: '✓', color: '#10b981' };
    if (percentage >= 50) return { status: 'Mid', icon: '⚠', color: '#f59e0b' };
    return { status: 'Failed', icon: '✗', color: '#ef4444' };
  };

  const isLanguageFormation = (formation) => {
    return LANGUAGE_FORMATIONS.includes(formation);
  };

  const getAvailableFormations = () => {
    if (!studentProfile) return [];
    if (viewMode === 'languages') {
      return studentProfile.formation || [];
    } else {
      return studentProfile.filiere || [];
    }
  };

  const getExamCount = (formation) => {
    if (LANGUAGE_FORMATIONS.includes(formation)) {
      return 4;
    }
    return 5;
  };

  if (loading) {
    return (
      <div className="grades-loading">
        <div className="spinner"></div>
        <p>Loading grades...</p>
      </div>
    );
  }

  const availableFormations = getAvailableFormations();

  return (
    <div className="grades-container">
      <div className="grades-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <h1>My Grades</h1>
        <button className="refresh-button" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? '⟳' : '↻'}
        </button>
      </div>

      <div className="toggle-container">
        <button
          className={`toggle-button ${viewMode === 'languages' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('languages');
            setSelectedFormation(null);
            setSelectedExamNumber(null);
            setSelectedLevel(null);
            setSelectedTestType(null);
            setSelectedSemester(null);
          }}
        >
          <Icon type="globe" size={20} color={viewMode === 'languages' ? '#1D1D1F' : '#6B7280'} />
          Languages
        </button>
        
        <button
          className={`toggle-button ${viewMode === 'branches' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('branches');
            setSelectedFormation(null);
            setSelectedExamNumber(null);
            setSelectedLevel(null);
            setSelectedTestType(null);
          }}
        >
          <Icon type="graduation-cap" size={20} color={viewMode === 'branches' ? '#1D1D1F' : '#6B7280'} />
          Subjects
        </button>
      </div>

      {availableFormations.length > 0 && (
        <div className="selector-container">
          <label className="selector-label">
            Select {viewMode === 'languages' ? 'Language' : 'Subject'}:
          </label>
          <div className="chip-scroll">
            {availableFormations.map((formation) => (
              <button
                key={formation}
                className={`chip ${selectedFormation === formation ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFormation(formation);
                  setSelectedLevel(null); // Reset level when changing formation
                  setSelectedTestType(null); // Reset test type when changing formation
                  setSelectedExamNumber(null); // Reset test number when changing formation
                  setSelectedSemester(null); // Reset semester when changing formation
                }}
              >
                {formation}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedFormation && viewMode === 'languages' && (
        <div className="selector-container">
          <label className="selector-label">Language Level:</label>
          <div className="chip-scroll">
            {['A1', 'A2', 'B1', 'B2'].map((level) => (
              <button
                key={level}
                className={`chip ${selectedLevel === level ? 'active' : ''}`}
                onClick={() => {
                  setSelectedLevel(level);
                  setSelectedTestType(null); // Reset test type when changing level
                  setSelectedExamNumber(null); // Reset test number when changing level
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedFormation && viewMode === 'languages' && selectedLevel && (
        <div className="selector-container">
          <label className="selector-label">Test Type:</label>
          <div className="chip-scroll">
            <button
              className={`chip ${selectedTestType === 'miniTest' ? 'active' : ''}`}
              onClick={() => {
                setSelectedTestType('miniTest');
                setSelectedExamNumber(1); // Auto-select Test 1 when switching to Mini Tests
              }}
            >
              Mini Tests
            </button>
            <button
              className={`chip ${selectedTestType === 'finalExam' ? 'active' : ''}`}
              onClick={() => {
                setSelectedTestType('finalExam');
                setSelectedExamNumber(null); // Reset test number when changing test type
              }}
            >
              Final Exam
            </button>
          </div>
        </div>
      )}

      {selectedFormation && viewMode === 'languages' && selectedTestType === 'miniTest' && (
        <div className="selector-container">
          <label className="selector-label">Mini Test Number:</label>
          <div className="chip-scroll">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                className={`chip ${selectedExamNumber === num ? 'active' : ''}`}
                onClick={() => setSelectedExamNumber(num)}
              >
                Test {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedFormation && viewMode === 'branches' && (
        <div className="selector-container">
          <label className="selector-label">Exam Number:</label>
          <div className="chip-scroll">
            {[...Array(getExamCount(selectedFormation))].map((_, index) => {
              const examNum = index + 1;
              return (
                <button
                  key={examNum}
                  className={`chip ${selectedExamNumber === examNum ? 'active' : ''}`}
                  onClick={() => setSelectedExamNumber(examNum)}
                >
                  Exam {examNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'branches' && (
        <div className="selector-container">
          <label className="selector-label">Semester:</label>
          <div className="chip-scroll">
            {['Semester 1', 'Semester 2'].map((semester) => (
              <button
                key={semester}
                className={`chip ${selectedSemester === semester ? 'active' : ''}`}
                onClick={() => setSelectedSemester(semester)}
              >
                {semester}
              </button>
            ))}
          </div>
        </div>
      )}

      {stats && grades.length > 0 && (
        <div className="stats-card">
          <div className="stat-item">
            <span className="stat-icon">📄</span>
            <p className="stat-value">{stats.totalGrades}</p>
            <p className="stat-label">Total Grades</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-icon">📈</span>
            <p className="stat-value" style={{ color: '#10b981' }}>
              {stats.averageScore ? Number(stats.averageScore).toFixed(1) : '0.0'}%
            </p>
            <p className="stat-label">Average Score</p>
          </div>
        </div>
      )}

      <div className="grades-list">
        {grades.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎓</span>
            <h3>No grades available</h3>
            <p>
              {selectedFormation 
                ? `No grades found for ${selectedFormation}` 
                : `Select a ${viewMode === 'languages' ? 'language' : 'subject'} to view grades`}
            </p>
          </div>
        ) : (
          grades.map((grade, index) => {
            const percentage = (grade.score / grade.maxScore) * 100;
            const isLanguage = isLanguageFormation(grade.formation);
            const displayInfo = isLanguage ? getEvaluationStatus(percentage) : getGradeLetter(percentage);

            return (
              <div key={index} className="grade-card">
                <div className="grade-header">
                  <div className="grade-info">
                    <h3 className="exam-type">
                      {grade.examType}
                      {isLanguage && grade.languageLevel && ` - ${grade.languageLevel}`}
                      {isLanguage && grade.testType === 'miniTest' && grade.testNumber && ` - Test ${grade.testNumber}`}
                      {isLanguage && grade.testType === 'finalExam' && ' - Final Exam'}
                      {!isLanguage && grade.examNumber && ` - Exam ${grade.examNumber}`}
                    </h3>
                    <p className="formation">{grade.formation}</p>
                  </div>
                  <div className="grade-badge" style={{ background: displayInfo.color }}>
                    {isLanguage ? (
                      <span className="grade-letter" style={{ fontSize: '1.5rem' }}>{displayInfo.icon}</span>
                    ) : (
                      <span className="grade-letter">{displayInfo.letter}</span>
                    )}
                  </div>
                </div>

                <div className="grade-details">
                  {isLanguage && (
                    <div className="detail-row">
                      <span className="detail-icon">🏅</span>
                      <span className="detail-text">Status: {displayInfo.status}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-icon">🏆</span>
                    <span className="detail-text">
                      Score: {grade.score}/{grade.maxScore} ({percentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">
                      {new Date(grade.examDate).toLocaleDateString()}
                    </span>
                  </div>

                  {!isLanguage && grade.semester && (
                    <div className="detail-row">
                      <span className="detail-icon">⏰</span>
                      <span className="detail-text">{grade.semester}</span>
                    </div>
                  )}

                  {(grade.autoComment || grade.comments) && (
                    <div className="comments-container">
                      <p className="comments-label">Comments:</p>
                      <p className="comments-text" style={{ fontStyle: isLanguage ? 'italic' : 'normal' }}>
                        {grade.autoComment || grade.comments}
                      </p>
                    </div>
                  )}
                </div>

                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${percentage}%`, background: displayInfo.color }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GradesScreen;
