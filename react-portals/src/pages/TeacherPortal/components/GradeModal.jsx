import { useState, useEffect } from 'react';
import { teacherAPI } from '../../../services/api';
import { branchGradingConfig, isBranchFormation } from '../../../config/branchGradingConfig';
import Modal from '../../../components/common/Modal';
import './GradeModal.css';

const GradeModal = ({ isOpen, onClose, student, formation, preselectedExamType, examNumber, onSuccess }) => {
  // Check if this is a branch formation
  const isBranch = isBranchFormation(formation);
  
  const [formData, setFormData] = useState({
    examType: '',
    score: '',
    maxScore: isBranch ? '20' : '100',
    semester: '1',
    examNumber: examNumber || 1,
    academicYear: '',
    examDate: '',
    comments: '',
  });
  const [existingGrades, setExistingGrades] = useState([]);
  const [editingGrade, setEditingGrade] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Exam types based on formation
  const getExamTypes = () => {
    if (isBranchFormation(formation)) {
      const config = branchGradingConfig[formation];
      if (config && config.fields) {
        // Return objects with both key and label
        return config.fields.map(field => ({ key: field.key, label: field.label }));
      }
      return [];
    }

    // Language formations - return as objects for consistency
    return [
      { key: 'Lesen', label: 'Lesen' },
      { key: 'Hören', label: 'Hören' },
      { key: 'Schreiben', label: 'Schreiben' },
      { key: 'Sprechen', label: 'Sprechen' }
    ];
  };

  useEffect(() => {
    if (isOpen && student) {
      fetchExistingGrades();
      setDefaultAcademicYear();
      setDefaultExamDate();
      // Set maxScore based on formation type
      setFormData(prev => ({
        ...prev,
        maxScore: isBranch ? '20' : '100',
        examNumber: examNumber || 1,
        examType: preselectedExamType || prev.examType // Auto-fill exam type if preselected
      }));
    }
  }, [isOpen, student, isBranch, preselectedExamType, examNumber]);

  const setDefaultAcademicYear = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const academicYear = currentMonth >= 8 
      ? `${currentYear}-${currentYear + 1}`
      : `${currentYear - 1}-${currentYear}`;
    setFormData(prev => ({ ...prev, academicYear }));
  };

  const setDefaultExamDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, examDate: today }));
  };

  const fetchExistingGrades = async () => {
    try {
      // Fetch all grades for this formation and filter by student
      const response = await teacherAPI.getGrades({ formation });
      const allGrades = Array.isArray(response.data) ? response.data : (response.data.grades || []);
      
      // Filter grades for this specific student
      const studentGrades = allGrades.filter(grade => {
        const gradeStudentId = typeof grade.student === 'string' ? grade.student : grade.student?._id;
        return gradeStudentId === student._id;
      });
      
      setExistingGrades(studentGrades);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
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
    setFormData({
      examType: grade.examType,
      score: grade.score.toString(),
      maxScore: grade.maxScore.toString(),
      semester: grade.semester.replace('Semester ', ''), // Extract '1' from 'Semester 1'
      examNumber: grade.examNumber || examNumber || 1, // Preserve exam number
      academicYear: grade.academicYear,
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

    try {
      const gradeData = {
        student: student._id,
        formation,
        group: student.group,
        examType: formData.examType,
        score: parseFloat(formData.score),
        maxScore: parseFloat(formData.maxScore),
        semester: `Semester ${formData.semester}`, // Convert '1' to 'Semester 1'
        examNumber: formData.examNumber, // Include exam number
        academicYear: formData.academicYear,
        examDate: formData.examDate,
        comments: formData.comments,
      };

      console.log('📝 Submitting grade data with exam number:', gradeData.examNumber, gradeData);
      
      if (editingGrade) {
        await teacherAPI.updateGrade(editingGrade._id, gradeData);
        alert('Grade updated successfully');
      } else {
        await teacherAPI.uploadGrade(gradeData);
        alert('Grade uploaded successfully');
      }

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
    setFormData({
      examType: '',
      score: '',
      maxScore: isBranch ? '20' : '100',
      semester: '1',
      academicYear: formData.academicYear,
      examDate: new Date().toISOString().split('T')[0],
      comments: '',
    });
    setError('');
  };

  const examTypes = getExamTypes();

  // Get the display label for preselected exam type
  const getPreselectedLabel = () => {
    if (!preselectedExamType) return '';
    const examType = examTypes.find(t => t.key === preselectedExamType);
    return examType ? examType.label : preselectedExamType;
  };

  const modalTitle = preselectedExamType 
    ? `${getPreselectedLabel()} - ${student?.fullName}`
    : `Grade: ${student?.fullName}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="large">
      <div className="grade-modal-content">
        {/* Existing Grades */}
        {existingGrades.length > 0 && (
          <div className="existing-grades">
            <h3>Existing Grades</h3>
            <div className="grades-list">
              {existingGrades.map((grade) => (
                <div key={grade._id} className="grade-item">
                  <div className="grade-item-info">
                    <strong>{grade.examType}</strong>
                    <span>{grade.score}/{grade.maxScore} ({((grade.score/grade.maxScore)*100).toFixed(1)}%)</span>
                    <span>Semester {grade.semester} - {grade.academicYear}</span>
                  </div>
                  <div className="grade-item-actions">
                    <button 
                      className="btn-edit-small"
                      onClick={() => handleEditGrade(grade)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-delete-small"
                      onClick={() => handleDeleteGrade(grade._id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grade Form */}
        <div className="grade-form-section">
          <h3>{editingGrade ? 'Edit Grade' : 'Upload New Grade'}</h3>
          {editingGrade && (
            <button className="btn-cancel-edit" onClick={resetForm}>
              <i className="fas fa-times"></i> Cancel Edit
            </button>
          )}

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              {!preselectedExamType && (
                <div className="form-group">
                  <label>Exam Type *</label>
                  <select
                    name="examType"
                    value={formData.examType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select exam type</option>
                    {examTypes.map((type) => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Score *</label>
                <input
                  type="number"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  min="0"
                  max={isBranch ? "20" : undefined}
                  step="0.1"
                  required
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
                  readOnly={isBranch}
                  disabled={isBranch}
                  title={isBranch ? 'Branch formations are graded out of 20' : ''}
                  style={isBranch ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                />
                {isBranch && (
                  <small style={{ color: '#666', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                    Branch formations are graded out of 20
                  </small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Semester *</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>

              <div className="form-group">
                <label>Academic Year *</label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  placeholder="2024-2025"
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

            <div className="form-group">
              <label>Comments (Optional)</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows="3"
                placeholder="Add any comments about this grade..."
              />
            </div>

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

export default GradeModal;
