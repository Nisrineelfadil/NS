import { useLanguage } from '../../context/LanguageContext';
import './ExamTabs.css';

const ExamTabs = ({ selectedExam, onExamChange, examCount = 4, formation }) => {
  const { t } = useLanguage();
  // Determine if this is a language formation
  const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
  const isLanguage = languageFormations.includes(formation);
  
  // For languages, show A1-B2 levels; for branches, show exam numbers
  const levels = ['A1', 'A2', 'B1', 'B2'];
  const exams = Array.from({ length: examCount }, (_, i) => i + 1);
  
  const tabs = isLanguage ? levels : exams;

  return (
    <div className="exam-tabs-container">
      <div className="exam-tabs">
        {tabs.map((tab, index) => {
          const tabValue = isLanguage ? tab : tab;
          const isActive = isLanguage 
            ? selectedExam === tab 
            : selectedExam === tab;
          
          return (
            <button
              key={tab}
              className={`exam-tab ${isActive ? 'active' : ''}`}
              onClick={() => onExamChange(tab)}
            >
              <i className={isLanguage ? "fas fa-graduation-cap" : "fas fa-file-alt"}></i>
              {isLanguage ? tab : `${t('exam')} ${tab}`}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExamTabs;
