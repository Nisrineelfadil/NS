import { useLanguage } from '../../../context/LanguageContext';
import './GradesTable.css';

const GradesTable = ({ grades }) => {
  const { t } = useLanguage();
  const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
  
  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return { letter: 'A', class: 'excellent' };
    if (percentage >= 80) return { letter: 'B', class: 'good' };
    if (percentage >= 70) return { letter: 'C', class: 'average' };
    if (percentage >= 60) return { letter: 'D', class: 'average' };
    return { letter: 'F', class: 'poor' };
  };

  const getEvaluationStatus = (percentage) => {
    if (percentage >= 70) {
      return { icon: '✅', label: 'Approved', class: 'approved' };
    } else if (percentage >= 50) {
      return { icon: '⚠️', label: 'Mid', class: 'mid' };
    } else {
      return { icon: '❌', label: 'Failed', class: 'failed' };
    }
  };

  const getSkillLabel = (examType) => {
    const skillLabels = {
      'Lesen': '📖 Lesen (Reading)',
      'Hören': '🎧 Hören (Listening)',
      'Schreiben': '✍️ Schreiben (Writing)',
      'Sprechen': '💬 Sprechen (Speaking)'
    };
    return skillLabels[examType] || examType;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group grades by formation and level/semester
  const groupedGrades = {};
  grades.forEach(grade => {
    const isLanguage = languageFormations.includes(grade.formation) && grade.languageLevel;
    const key = isLanguage 
      ? `${grade.formation} - Level ${grade.languageLevel}`
      : `${grade.formation} - ${grade.semester} (${grade.academicYear})`;
    
    if (!groupedGrades[key]) {
      groupedGrades[key] = { grades: [], isLanguage };
    }
    groupedGrades[key].grades.push(grade);
  });

  return (
    <div className="grades-table-container">
      {Object.entries(groupedGrades).map(([groupKey, { grades: groupGrades, isLanguage }]) => (
        <div key={groupKey} className="grade-group">
          <h3 className="group-title">
            <i className="fas fa-book"></i> {groupKey}
          </h3>
          <table className="grades-table">
            <thead>
              <tr>
                {isLanguage ? (
                  <>
                    <th>{t('test')}</th>
                    <th>{t('skill')}</th>
                    <th>{t('score')}</th>
                    <th>{t('status')}</th>
                    <th>{t('date')}</th>
                    <th>{t('teacher')}</th>
                  </>
                ) : (
                  <>
                    <th>{t('formation')}</th>
                    <th>{t('examType')}</th>
                    <th>{t('score')}</th>
                    <th>{t('grade')}</th>
                    <th>{t('semester')}</th>
                    <th>{t('academicYear')}</th>
                    <th>{t('date')}</th>
                    <th>{t('comments')}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {groupGrades.map((grade) => {
                const percentage = (grade.score / grade.maxScore) * 100;
                const gradeLetter = getGradeLetter(percentage);
                const status = getEvaluationStatus(percentage);

                return (
                  <tr key={grade._id}>
                    {isLanguage ? (
                      <>
                        <td data-label="Test">
                          <span className="exam-type-badge">
                            {grade.testType === 'miniTest' ? `Mini Test ${grade.testNumber}` : 'Final Exam'}
                          </span>
                        </td>
                        <td data-label="Skill">{getSkillLabel(grade.examType)}</td>
                        <td data-label="Score">
                          {grade.score}/{grade.maxScore} ({percentage.toFixed(1)}%)
                        </td>
                        <td data-label="Status">
                          <span className={`status-badge ${status.class}`}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td data-label="Date">{formatDate(grade.examDate)}</td>
                        <td data-label="Teacher">{grade.uploadedBy?.fullName || 'N/A'}</td>
                      </>
                    ) : (
                      <>
                        <td data-label="Formation">{grade.formation}</td>
                        <td data-label="Exam Type">
                          <span className="exam-type-badge">{grade.examType}</span>
                        </td>
                        <td data-label="Score">
                          {grade.score}/{grade.maxScore} ({percentage.toFixed(1)}%)
                        </td>
                        <td data-label="Grade">
                          <span className={`grade-badge ${gradeLetter.class}`}>
                            {gradeLetter.letter}
                          </span>
                        </td>
                        <td data-label="Semester">Semester {grade.semester}</td>
                        <td data-label="Academic Year">{grade.academicYear}</td>
                        <td data-label="Date">{formatDate(grade.examDate)}</td>
                        <td data-label="Comments">{grade.comments || '-'}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default GradesTable;
