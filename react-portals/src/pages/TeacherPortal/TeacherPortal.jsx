import { useState, useEffect } from 'react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { teacherAPI } from '../../services/api';
import { getExamCount } from '../../utils/examHelpers';
import Header from '../../components/common/Header';
import Loading from '../../components/common/Loading';
import ExamTabs from '../../components/common/ExamTabs';
import LoginForm from './components/LoginForm';
import FormationSelector from './components/FormationSelector';
import GroupSelector from './components/GroupSelector';
import StudentsGrid from './components/StudentsGrid';
import GradeModal from './components/GradeModal';
import LanguageGradeModal from './components/LanguageGradeModal';
import BatchLanguageGradeModal from './components/BatchLanguageGradeModal';
import AttendanceQR from './components/AttendanceQR';
import './TeacherPortal.css';

const TeacherPortal = () => {
  const { user, isAuthenticated, logout } = useTeacherAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExamType, setSelectedExamType] = useState(null);
  const [selectedExam, setSelectedExam] = useState('A1'); // Can be 'A1'-'B2' for languages or 1-5 for branches
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('grades'); // 'grades' or 'attendance'
  const [activeSeason, setActiveSeason] = useState(null); // Store active season info

  useEffect(() => {
    if (isAuthenticated && user) {
      // Auto-select formation if teacher has only one
      if (user.formations && user.formations.length === 1) {
        setSelectedFormation(user.formations[0]);
      }
      fetchActiveSeason();
      fetchGroups();
    }
  }, [isAuthenticated, user]);

  // Reset selectedExam when formation changes
  useEffect(() => {
    if (selectedFormation) {
      const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
      const isLanguage = languageFormations.includes(selectedFormation);
      setSelectedExam(isLanguage ? 'A1' : 1);
    }
  }, [selectedFormation]);

  useEffect(() => {
    if (selectedFormation && selectedGroup) {
      fetchStudents();
    }
  }, [selectedFormation, selectedGroup, selectedExam]);

  const fetchActiveSeason = async () => {
    try {
      const response = await teacherAPI.getSeasons();
      const seasons = Array.isArray(response.data) ? response.data : (response.data.seasons || []);
      const active = seasons.find(s => s.status === 'active');
      if (active) {
        setActiveSeason(active);
        console.log('✅ Active season loaded:', active.name);
      }
    } catch (error) {
      console.error('Error fetching active season:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getGroups();
      console.log('Groups response:', response.data);
      
      // Handle both response formats: response.data.groups or response.data directly
      const groupsData = Array.isArray(response.data) ? response.data : (response.data.groups || []);
      console.log('Groups array:', groupsData);
      
      // Fetch student counts for each group
      const groupsWithCounts = await Promise.all(
        groupsData.map(async (group) => {
          try {
            // Fetch students for this group to get the count
            const studentsResponse = await teacherAPI.getStudents({
              formation: user?.formations?.[0] || selectedFormation,
              groupId: group._id,
            });
            const studentsData = Array.isArray(studentsResponse.data) 
              ? studentsResponse.data 
              : (studentsResponse.data.students || []);
            
            return {
              ...group,
              studentCount: studentsData.length,
            };
          } catch (error) {
            return {
              ...group,
              studentCount: 0,
            };
          }
        })
      );
      
      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to load groups: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getStudents({
        formation: selectedFormation,
        groupId: selectedGroup,
      });
      
      // Handle both response formats
      const studentsData = Array.isArray(response.data) ? response.data : (response.data.students || []);
      console.log('Students data:', studentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGradeModal = (student, examType = null) => {
    setSelectedStudent(student);
    setSelectedExamType(examType);
    setShowGradeModal(true);
  };

  const handleCloseGradeModal = () => {
    setSelectedStudent(null);
    setSelectedExamType(null);
    setShowGradeModal(false);
  };

  const handleGradeSubmitted = () => {
    fetchStudents(); // Refresh students to show updated grades
    handleCloseGradeModal();
  };

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const isFormationDisabled = user?.formations?.length === 1;

  return (
    <div className="teacher-portal">
      <div className="container">
        <Header title={t('teacherPortal')} subtitle={user?.email} user={user} logout={logout} />

        {/* Tab Switcher */}
        <div className="portal-tabs">
          <button 
            className={`portal-tab ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => setActiveTab('grades')}
          >
            <i className="fas fa-chart-bar"></i>
            {t('gradeManagement')}
          </button>
          <button 
            className={`portal-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <i className="fas fa-qrcode"></i>
            {t('attendanceQR')}
          </button>
        </div>

        {activeTab === 'grades' ? (
        <div className="card">
          <h2>
            <i className="fas fa-chalkboard-teacher"></i>
            {t('gradeManagement')}
          </h2>

          <FormationSelector
            formations={user?.formations || []}
            selectedFormation={selectedFormation}
            onSelect={setSelectedFormation}
            disabled={isFormationDisabled}
            activeSeason={activeSeason}
          />

          {selectedFormation && (
            <GroupSelector
              groups={groups}
              selectedGroup={selectedGroup}
              onSelect={setSelectedGroup}
              formation={selectedFormation}
            />
          )}

          {selectedFormation && selectedGroup && (
            <ExamTabs 
              selectedExam={selectedExam}
              onExamChange={setSelectedExam}
              examCount={getExamCount(selectedFormation)}
              formation={selectedFormation}
            />
          )}

          {loading ? (
            <Loading message={t('loadingStudents')} />
          ) : selectedFormation && selectedGroup ? (
            students.length > 0 ? (
              <StudentsGrid
                students={students}
                formation={selectedFormation}
                examNumber={selectedExam}
                onGradeStudent={handleOpenGradeModal}
              />
            ) : (
              <div className="empty-state">
                <i className="fas fa-users-slash"></i>
                <h3>{t('noStudentsFound')}</h3>
                <p>{t('noStudentsEnrolled')}</p>
              </div>
            )
          ) : (
            <div className="empty-state">
              <i className="fas fa-hand-pointer"></i>
              <h3>{t('selectFormationAndGroup')}</h3>
              <p>{t('selectFormationGroupText')}</p>
            </div>
          )}
        </div>
        ) : (
          <AttendanceQR />
        )}

        {showGradeModal && selectedStudent && (() => {
          // Determine if this is a language or branch formation
          const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
          const isLanguage = languageFormations.includes(selectedFormation);
          
          return isLanguage ? (
            // Use batch modal for language teachers (no examType means batch entry)
            <BatchLanguageGradeModal
              isOpen={showGradeModal}
              onClose={handleCloseGradeModal}
              student={selectedStudent}
              formation={selectedFormation}
              preselectedLevel={selectedExam}
              onSuccess={handleGradeSubmitted}
            />
          ) : (
            <GradeModal
              isOpen={showGradeModal}
              onClose={handleCloseGradeModal}
              student={selectedStudent}
              formation={selectedFormation}
              preselectedExamType={selectedExamType}
              examNumber={selectedExam}
              onSuccess={handleGradeSubmitted}
            />
          );
        })()}
      </div>
    </div>
  );
};

export default TeacherPortal;
