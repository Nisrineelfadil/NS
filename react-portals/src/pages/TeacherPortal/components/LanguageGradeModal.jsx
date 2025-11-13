import { useState, useEffect } from 'react';
import { teacherAPI } from '../../../services/api';
import Modal from '../../../components/common/Modal';
import './LanguageGradeModal.css';

const LanguageGradeModal = ({ isOpen, onClose, student, formation, preselectedLevel, onSuccess }) => {
  const [selectedLevel, setSelectedLevel] = useState(preselectedLevel || 'A1');
  const [selectedTestType, setSelectedTestType] = useState('miniTest');
  const [selectedTestNumber, setSelectedTestNumber] = useState(1);
  const [selectedExamType, setSelectedExamType] = useState('');
  
  const [formData, setFormData] = useState({
    score: '',
    maxScore: '100',
    examDate: '',
    comments: '',
  });
  
  const [existingGrades, setExistingGrades] = useState([]);
  const [levelProgress, setLevelProgress] = useState({});
  const [editingGrade, setEditingGrade] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const levels = ['A1', 'A2', 'B1', 'B2'];
  const examTypes = [
    { key: 'Lesen', label: 'Lesen (Reading)', icon: 'fa-book-open' },
    { key: 'Hören', label: 'Hören (Listening)', icon: 'fa-headphones' },
    { key: 'Schreiben', label: 'Schreiben (Writing)', icon: 'fa-pen-fancy' },
    { key: 'Sprechen', label: 'Sprechen (Speaking)', icon: 'fa-comments' }
  ];

  useEffect(() => {
    if (preselectedLevel) {
      setSelectedLevel(preselectedLevel);
    }
  }, [preselectedLevel]);

  useEffect(() => {
    if (isOpen && student) {
      fetchExistingGrades();
      setDefaultExamDate();
    }
  }, [isOpen, student, selectedLevel, selectedTestType, selectedTestNumber]);

  const setDefaultExamDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, examDate: today }));
  };

  const fetchExistingGrades = async () => {
    try {
      const response = await teacherAPI.getGrades({ 
        formation,
        languageLevel: selectedLevel 
      });
      const allGrades = Array.isArray(response.data) ? response.data : (response.data.grades || []);
      
      // Filter grades for this specific student, level, test type, and test number
      const studentGrades = allGrades.filter(grade => {
        const gradeStudentId = typeof grade.student === 'string' ? grade.student : grade.student?._id;
        const matchesStudent = gradeStudentId === student._id;
        const matchesLevel = grade.languageLevel === selectedLevel;
        const matchesTestType = grade.testType === selectedTestType;
        const matchesTestNumber = selectedTestType === 'miniTest' 
          ? grade.testNumber === selectedTestNumber 
          : true; // For final exam, no test number filter
        
        return matchesStudent && matchesLevel && matchesTestType && matchesTestNumber;
      });
      
      setExistingGrades(studentGrades);
      
      // Calculate progress using all grades for this level
      const allStudentGrades = allGrades.filter(grade => {
        const gradeStudentId = typeof grade.student === 'string' ? grade.student : grade.student?._id;
        return gradeStudentId === student._id && grade.languageLevel === selectedLevel;
      });
      calculateLevelProgress(allStudentGrades);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const calculateLevelProgress = (grades) => {
    const miniTests = grades.filter(g => g.testType === 'miniTest');
    const finalExam = grades.find(g => g.testType === 'finalExam');
    
    const progress = {
      miniTestsCompleted: miniTests.length,
      finalExamCompleted: !!finalExam,
      totalCompleted: miniTests.length + (finalExam ? 1 : 0),
      totalRequired: 5
    };
    
    setLevelProgress(progress);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleEditGrade = (grade) => {
    setEditingGrade(grade);
    setSelectedTestType(grade.testType);
    setSelectedTestNumber(grade.testNumber || 1);
    setSelectedExamType(grade.examType);
    setFormData({
      score: grade.score.toString(),
      maxScore: grade.maxScore.toString(),
      examDate: new Date(grade.examDate).toISOString().split('T')[0],
      comments: grade.comments || '',
    });
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;

    try {
      await teacherAPI.deleteGrade(gradeId);
      fetchExistingGrades();
      alert('Grade deleted successfully');
    } catch (error) {
      console.error('Error deleting grade:', error);
      alert('Failed to delete grade');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (parseFloat(formData.score) > parseFloat(formData.maxScore)) {
      setError('Score cannot be greater than max score');
      setLoading(false);
      return;
    }

    if (!selectedExamType) {
      setError('Please select an exam type');
      setLoading(false);
      return;
    }

    try {
      const gradeData = {
        student: student._id,
        formation,
        group: student.group,
        examType: selectedExamType,
        score: parseFloat(formData.score),
        maxScore: parseFloat(formData.maxScore),
        examDate: formData.examDate,
        comments: formData.comments,
        // A1-B2 specific fields
        languageLevel: selectedLevel,
        testType: selectedTestType,
        testNumber: selectedTestType === 'miniTest' ? selectedTestNumber : undefined,
      };

      console.log('📝 Submitting A1-B2 grade data:', gradeData);
      
      if (editingGrade) {
        await teacherAPI.updateGrade(editingGrade._id, gradeData);
        alert('Grade updated successfully');
      } else {
        await teacherAPI.uploadGrade(gradeData);
        alert('Grade uploaded successfully');
      }

      resetForm();
      fetchExistingGrades();
      onSuccess();
    } catch (error) {
      console.error('Error saving grade:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to save grade');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingGrade(null);
    setSelectedExamType('');
    setFormData({
      score: '',
      maxScore: '100',
      examDate: new Date().toISOString().split('T')[0],
      comments: '',
    });
    setError('');
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${formation} - ${student?.fullName} - ${selectedLevel}`} size="xlarge">
      <div className="language-grade-modal">
        {/* Progress Indicator */}
        <div className="level-progress">
          <div className="progress-header">
            <h4>{selectedLevel} Progress</h4>
            <span className="progress-count">
              {levelProgress.totalCompleted || 0} / {levelProgress.totalRequired} Completed
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((levelProgress.totalCompleted || 0) / levelProgress.totalRequired) * 100}%` }}
            />
          </div>
          <div className="progress-details">
            <span>Mini Tests: {levelProgress.miniTestsCompleted || 0}/4</span>
            <span>Final Exam: {levelProgress.finalExamCompleted ? '✅' : '❌'}</span>
          </div>
        </div>

        {/* Existing Grades */}
        {existingGrades.length > 0 && (
          <div className="existing-grades">
            <h3>📝 Existing Grades for {selectedLevel}</h3>
            <div className="grades-grid">
              {existingGrades.map((grade) => {
                const badge = getEvaluationBadge(grade.evaluationStatus);
                return (
                  <div key={grade._id} className="grade-card">
                    <div className="grade-card-header">
                      <div className="grade-test-info">
                        <strong>{getTestLabel(grade)}</strong>
                        <span className="grade-exam-type">{grade.examType}</span>
                      </div>
                      <div className="grade-actions">
                        <button 
                          className="btn-edit-icon"
                          onClick={() => handleEditGrade(grade)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-delete-icon"
                          onClick={() => handleDeleteGrade(grade._id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="grade-card-body">
                      <div className="grade-score">
                        <span className="score-value">{grade.score}/{grade.maxScore}</span>
                        <span className="score-percentage">({((grade.score/grade.maxScore)*100).toFixed(1)}%)</span>
                      </div>
                      <div className="grade-status" style={{ color: badge.color }}>
                        <span className="status-icon">{badge.icon}</span>
                        <span className="status-label">{badge.label}</span>
                      </div>
                    </div>
                    {grade.autoComment && (
                      <div className="grade-comment">{grade.autoComment}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grade Entry Form */}
        <div className="grade-form-section">
          <h3>{editingGrade ? '✏️ Edit Grade' : '➕ Add New Grade'}</h3>
          {editingGrade && (
            <button className="btn-cancel-edit" onClick={resetForm}>
              <i className="fas fa-times"></i> Cancel Edit
            </button>
          )}

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Test Type Selection */}
            <div className="form-section">
              <label className="section-label">Test Type *</label>
              <div className="test-type-selector">
                <button
                  type="button"
                  className={`test-type-btn ${selectedTestType === 'miniTest' ? 'active' : ''}`}
                  onClick={() => setSelectedTestType('miniTest')}
                >
                  <i className="fas fa-clipboard-list"></i>
                  Mini Test
                </button>
                <button
                  type="button"
                  className={`test-type-btn ${selectedTestType === 'finalExam' ? 'active' : ''}`}
                  onClick={() => setSelectedTestType('finalExam')}
                >
                  <i className="fas fa-graduation-cap"></i>
                  Final Exam
                </button>
              </div>
            </div>

            {/* Mini Test Number (only for mini tests) */}
            {selectedTestType === 'miniTest' && (
              <div className="form-section">
                <label className="section-label">Mini Test Number *</label>
                <div className="test-number-selector">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      className={`test-number-btn ${selectedTestNumber === num ? 'active' : ''}`}
                      onClick={() => setSelectedTestNumber(num)}
                    >
                      Test {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Exam Type Selection */}
            <div className="form-section">
              <label className="section-label">Exam Type (Skill) *</label>
              <div className="exam-type-grid">
                {examTypes.map(type => {
                  // Check if this exam type has a grade entered
                  const hasGrade = existingGrades.some(g => g.examType === type.key);
                  
                  return (
                    <button
                      key={type.key}
                      type="button"
                      className={`exam-type-card ${selectedExamType === type.key ? 'active' : ''} ${hasGrade ? 'has-grade' : ''}`}
                      onClick={() => setSelectedExamType(type.key)}
                    >
                      <i className={`fas ${type.icon} exam-icon`}></i>
                      <span className="exam-label">{type.label}</span>
                      {hasGrade && <i className="fas fa-check-circle grade-indicator"></i>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Score Input */}
            <div className="form-row">
              <div className="form-group">
                <label>Score *</label>
                <input
                  type="number"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  placeholder="Enter score (0-100)"
                />
              </div>

              <div className="form-group">
                <label>Max Score *</label>
                <input
                  type="number"
                  name="maxScore"
                  value={formData.maxScore}
                  onChange={handleChange}
                  min="1"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Exam Date *</label>
                <input
                  type="date"
                  name="examDate"
                  value={formData.examDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Comments */}
            <div className="form-group">
              <label>Comments (Optional)</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows="3"
                placeholder="Add any additional comments about this grade..."
              />
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Saving...
                  </>
                ) : editingGrade ? (
                  <>
                    <i className="fas fa-save"></i> Update Grade
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload"></i> Upload Grade
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default LanguageGradeModal;
