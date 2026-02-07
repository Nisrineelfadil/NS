import { useState, useEffect } from 'react';
import { teacherAPI } from '../../../services/api';
import { branchGradingConfig, isBranchFormation } from '../../../config/branchGradingConfig';
import { useLanguage } from '../../../context/LanguageContext';
import LevelProgressTracker from './LevelProgressTracker';
import './StudentsGrid.css';

const StudentsGrid = ({ students, formation, examNumber, onGradeStudent, customLabels = {} }) => {
  const { t } = useLanguage();
  const [studentsWithGrades, setStudentsWithGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Exam types based on formation type
  const getExamTypes = (formation) => {
    if (isBranchFormation(formation)) {
      // Branch formations have specific fields from config
      // Return the KEYS (not labels) because that's what's stored in the database
      const config = branchGradingConfig[formation];
      if (config && config.fields) {
        return config.fields.map(field => field.key);
      }
      return [];
    }

    // Language formations have standard 4 exam types
    return ['Lesen', 'Hören', 'Schreiben', 'Sprechen'];
  };

  // Get the display label for an exam type (uses custom labels if set)
  const getExamTypeLabel = (formation, examTypeKey) => {
    if (customLabels[examTypeKey]) return customLabels[examTypeKey];
    if (isBranchFormation(formation)) {
      const config = branchGradingConfig[formation];
      if (config && config.fields) {
        const field = config.fields.find(f => f.key === examTypeKey);
        return field ? field.label : examTypeKey;
      }
    }
    return examTypeKey;
  };

  useEffect(() => {
    fetchGradesForStudents();
  }, [students, formation, examNumber]);

  const fetchGradesForStudents = async () => {
    setLoading(true);
    try {
      // Determine if this is a language formation (A1-B2) or branch formation (1-5)
      const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
      const isLanguage = languageFormations.includes(formation);
      
      // For languages, use languageLevel; for branches, use examNumber
      const params = { formation };
      if (isLanguage) {
        params.languageLevel = examNumber; // A1, A2, B1, B2
      } else {
        params.examNumber = examNumber; // 1, 2, 3, 4, 5
      }
      
      console.log('🔍 Fetching grades for formation:', formation, 'params:', params);
      const response = await teacherAPI.getGrades(params);
      const allGrades = Array.isArray(response.data) ? response.data : (response.data.grades || []);
      
      console.log('✅ Fetched', allGrades.length, 'grades for formation:', formation, 'exam:', examNumber);
      
      // Match grades to students
      const studentsData = students.map(student => {
        const studentGrades = allGrades.filter(grade => {
          // Try to match by ID (string or object)
          const gradeStudentId = typeof grade.student === 'string' 
            ? grade.student 
            : grade.student?._id;
          
          // Also try to match by populated student object
          const gradeStudentEmail = grade.student?.schoolEmail;
          
          const matchById = gradeStudentId === student._id;
          const matchByEmail = gradeStudentEmail === student.schoolEmail;
          
          if (matchById || matchByEmail) {
            console.log('✅ Grade matched:', grade.examType, 'for', student.fullName);
          }
          
          return matchById || matchByEmail;
        });
        
        console.log(`Student ${student.fullName} (${student._id}):`, studentGrades.length, 'grades found');
        if (studentGrades.length > 0) {
          console.log('  Grade exam types:', studentGrades.map(g => g.examType));
        }
        
        return {
          ...student,
          grades: studentGrades,
        };
      });
      
      console.log('Students with grades:', studentsData);
      setStudentsWithGrades(studentsData);
    } catch (error) {
      console.error('Error fetching grades:', error);
      setStudentsWithGrades(students.map(s => ({ ...s, grades: [] })));
    } finally {
      setLoading(false);
    }
  };

  const getGradeForExamType = (grades, examType) => {
    const grade = grades.find(g => {
      // Try exact match first
      if (g.examType === examType) return true;
      
      // For branch formations, also try matching without special characters
      const normalizeText = (text) => text?.toLowerCase().replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').trim();
      return normalizeText(g.examType) === normalizeText(examType);
    });
    
    if (!grade) {
      console.log(`❌ No grade found for exam type: "${examType}"`);
      console.log('   Available exam types in grades:', grades.map(g => g.examType));
    }
    
    return grade;
  };

  const getGradePercentage = (grade) => {
    if (!grade) return null;
    return ((grade.score / grade.maxScore) * 100).toFixed(1);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    // If it's already a full URL, return it
    if (photoPath.startsWith('http')) return photoPath;
    // Otherwise, prepend the backend URL
    return `http://localhost:3000${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  const examTypes = getExamTypes(formation);
  
  // Check if this is a language formation
  const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
  const isLanguage = languageFormations.includes(formation);

  if (loading) {
    return <div className="loading-students">{t('loadingGrades')}</div>;
  }

  return (
    <div className="students-grid">
      {studentsWithGrades.map((student) => (
        <div key={student._id} className="student-card">
          <div className="student-header">
            <div className="student-avatar">
              {student.photoPath ? (
                <img src={getPhotoUrl(student.photoPath)} alt={student.fullName} />
              ) : (
                getInitials(student.fullName)
              )}
            </div>
            <div className="student-info">
              <h3>{student.fullName}</h3>
              <p>{student.schoolEmail}</p>
            </div>
          </div>

          <div className="student-actions">
            <button 
              className="btn-enter-grades"
              onClick={() => onGradeStudent(student)}
            >
              <i className="fas fa-edit"></i>
              {t('enterGrades')}
            </button>
            
            {/* Show Apple Glass Progress Tracker for Language Formations */}
            {isLanguage ? (
              <LevelProgressTracker
                student={student}
                formation={formation}
                selectedLevel={examNumber}
                grades={student.grades}
              />
            ) : (
              /* Show simple grade summary for Branch Formations */
              <div className="grade-summary">
                {student.grades.length > 0 ? (
                  <>
                    <span className="grades-count">
                      <i className="fas fa-check-circle"></i>
                      {student.grades.length} {student.grades.length === 1 ? t('gradeEntered') : t('gradesEntered')}
                    </span>
                  </>
                ) : (
                  <span className="no-grades">
                    <i className="fas fa-info-circle"></i>
                    {t('noGradesYet')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentsGrid;
