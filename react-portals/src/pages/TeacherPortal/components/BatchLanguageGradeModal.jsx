import { useState, useEffect } from 'react';
import { teacherAPI } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';
import Modal from '../../../components/common/Modal';
import './BatchLanguageGradeModal.css';

const BatchLanguageGradeModal = ({ isOpen, onClose, student, formation, preselectedLevel, onSuccess }) => {
  const { t } = useLanguage();
  const [selectedLevel, setSelectedLevel] = useState(preselectedLevel || 'A1');
  const [selectedTestType, setSelectedTestType] = useState('miniTest');
  const [selectedTestNumber, setSelectedTestNumber] = useState(1);
  
  const [grades, setGrades] = useState({
    Lesen: { score: '', maxScore: '100', comments: '' },
    Hören: { score: '', maxScore: '100', comments: '' },
    Schreiben: { score: '', maxScore: '100', comments: '' },
    Sprechen: { score: '', maxScore: '100', comments: '' }
  });
  
  const [examDate, setExamDate] = useState('');
  const [existingGrades, setExistingGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingCount, setUploadingCount] = useState(0);

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
    setExamDate(today);
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
          : true;
        
        return matchesStudent && matchesLevel && matchesTestType && matchesTestNumber;
      });
      
      setExistingGrades(studentGrades);
      
      // Pre-fill existing grades
      const newGrades = { ...grades };
      studentGrades.forEach(grade => {
        if (newGrades[grade.examType]) {
          newGrades[grade.examType] = {
            score: grade.score.toString(),
            maxScore: grade.maxScore.toString(),
            comments: grade.comments || ''
          };
        }
      });
      setGrades(newGrades);
      
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const handleGradeChange = (examType, field, value) => {
    setGrades(prev => ({
      ...prev,
      [examType]: {
        ...prev[examType],
        [field]: value
      }
    }));
    setError('');
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!confirm(t('confirmDeleteGrade'))) return;

    try {
      await teacherAPI.deleteGrade(gradeId);
      fetchExistingGrades();
      alert(t('gradeDeletedSuccess'));
    } catch (error) {
      console.error('Error deleting grade:', error);
      alert(t('failedToDeleteGrade'));
    }
  };

  const handleSubmitAll = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setUploadingCount(0);

    try {
      // Collect all grades that have scores entered
      const gradesToUpload = [];
      
      for (const examType of Object.keys(grades)) {
        const gradeData = grades[examType];
        
        // Skip if no score entered
        if (!gradeData.score || gradeData.score.trim() === '') continue;
        
        // Validation
        if (parseFloat(gradeData.score) > parseFloat(gradeData.maxScore)) {
          throw new Error(`${t('scoreCannotExceedMax')} (${examType})`);
        }

        gradesToUpload.push({
          examType,
          score: parseFloat(gradeData.score),
          maxScore: parseFloat(gradeData.maxScore),
          comments: gradeData.comments
        });
      }

      if (gradesToUpload.length === 0) {
        setError(t('enterAtLeastOneGrade'));
        setLoading(false);
        return;
      }

      // Upload all grades
      for (const gradeData of gradesToUpload) {
        setUploadingCount(prev => prev + 1);
        
        const payload = {
          student: student._id,
          formation,
          languageLevel: selectedLevel,
          testType: selectedTestType,
          testNumber: selectedTestType === 'miniTest' ? selectedTestNumber : undefined,
          examType: gradeData.examType,
          score: gradeData.score,
          maxScore: gradeData.maxScore,
          examDate: examDate || new Date().toISOString(),
          comments: gradeData.comments,
        };

        await teacherAPI.uploadGrade(payload);
      }

      alert(`✅ ${t('successfullyUploaded')} ${gradesToUpload.length} ${t('gradesCount')}!`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setGrades({
        Lesen: { score: '', maxScore: '100', comments: '' },
        Hören: { score: '', maxScore: '100', comments: '' },
        Schreiben: { score: '', maxScore: '100', comments: '' },
        Sprechen: { score: '', maxScore: '100', comments: '' }
      });
      
      onClose();
      
    } catch (error) {
      console.error('Error uploading grades:', error);
      setError(error.message || t('failedToSaveGrade'));
    } finally {
      setLoading(false);
      setUploadingCount(0);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t('enterGrades')} - ${student?.fullName}`}>
      <div className="batch-language-grade-modal">
        {/* Student Info */}
        <div className="student-info-header">
          <h3>{student?.fullName}</h3>
          <p>{student?.schoolEmail}</p>
        </div>

        {/* Level Display (Non-editable) */}
        <div className="level-display">
          <i className="fas fa-graduation-cap"></i>
          <span className="level-label">{t('level')}:</span>
          <span className="level-value">{selectedLevel}</span>
        </div>

        {/* Test Selection */}
        <div className="selection-row">
          <div className="form-group">
            <label>{t('testType')}</label>
            <select value={selectedTestType} onChange={(e) => setSelectedTestType(e.target.value)}>
              <option value="miniTest">{t('miniTest')}</option>
              <option value="finalExam">{t('finalExam')}</option>
            </select>
          </div>

          {selectedTestType === 'miniTest' && (
            <div className="form-group">
              <label>{t('testNumber')}</label>
              <select value={selectedTestNumber} onChange={(e) => setSelectedTestNumber(parseInt(e.target.value))}>
                {[1, 2, 3, 4].map(num => (
                  <option key={num} value={num}>{t('test')} {num}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>{t('examDate')}</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Grade Entry Grid */}
        <form onSubmit={handleSubmitAll}>
          <div className="grades-grid">
            {examTypes.map(({ key, label, icon }) => {
              const existingGrade = existingGrades.find(g => g.examType === key);
              
              return (
                <div key={key} className="grade-entry-card">
                  <div className="grade-entry-header">
                    <i className={`fas ${icon}`}></i>
                    <h4>{label}</h4>
                    {existingGrade && (
                      <button
                        type="button"
                        className="btn-delete-grade"
                        onClick={() => handleDeleteGrade(existingGrade._id)}
                        title={t('confirmDeleteGrade')}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>

                  <div className="grade-inputs">
                    <div className="input-group">
                      <label>{t('score')}</label>
                      <input
                        type="number"
                        min="0"
                        max={grades[key].maxScore}
                        step="0.5"
                        value={grades[key].score}
                        onChange={(e) => handleGradeChange(key, 'score', e.target.value)}
                        placeholder={t('score')}
                      />
                    </div>

                    <div className="input-group">
                      <label>{t('maxScore')}</label>
                      <input
                        type="number"
                        min="1"
                        value={grades[key].maxScore}
                        onChange={(e) => handleGradeChange(key, 'maxScore', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>{t('commentsOptional')}</label>
                    <textarea
                      value={grades[key].comments}
                      onChange={(e) => handleGradeChange(key, 'comments', e.target.value)}
                      placeholder={t('addCommentsPlaceholder')}
                      rows="2"
                    />
                  </div>

                  {existingGrade && (
                    <div className="existing-grade-badge">
                      <i className="fas fa-check-circle"></i>
                      {t('currentGrade')}: {existingGrade.score}/{existingGrade.maxScore}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading && (
            <div className="upload-progress">
              <i className="fas fa-spinner fa-spin"></i>
              {t('uploading')} {uploadingCount} / {Object.values(grades).filter(g => g.score).length}...
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              <i className="fas fa-upload"></i>
              {t('uploadAllGrades')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default BatchLanguageGradeModal;
