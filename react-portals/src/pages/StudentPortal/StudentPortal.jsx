import { useState, useEffect } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { studentAPI } from '../../services/api';
import { getExamCount } from '../../utils/examHelpers';
import Header from '../../components/common/Header';
import Loading from '../../components/common/Loading';
import ExamTabs from '../../components/common/ExamTabs';
import LoginForm from './components/LoginForm';
import StatsCards from './components/StatsCards';
import PaymentStatus from './components/PaymentStatus';
import GradesFilters from './components/GradesFilters';
import GradesTable from './components/GradesTable';
import MessagesPanel from './components/MessagesPanel';
import './StudentPortal.css';

const StudentPortal = () => {
  const { user, isAuthenticated, logout } = useStudentAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedExam, setSelectedExam] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState('A1'); // For language levels
  const [selectedTest, setSelectedTest] = useState(null); // For test selection (1-4 or 'final')
  const [currentSeason, setCurrentSeason] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    formation: '',
    branch: '',
    semester: '',
    academicYear: '',
    examNumber: 1,
    languageLevel: '', // A1, A2, B1, B2
    testType: '', // miniTest, finalExam
    testNumber: null, // 1-4 for mini tests
  });
  
  // Check if selected formation is a language
  const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
  const isLanguageSelected = filters.formation && languageFormations.includes(filters.formation);

  // Update filters when exam/level/test changes
  useEffect(() => {
    if (isLanguageSelected) {
      // For languages, use selectedLevel (A1-B2) and selectedTest
      setFilters(prev => ({ 
        ...prev, 
        languageLevel: selectedLevel,
        testType: selectedTest === 'final' ? 'finalExam' : (selectedTest ? 'miniTest' : ''),
        testNumber: (selectedTest && selectedTest !== 'final') ? selectedTest : null,
        examNumber: null
      }));
    } else {
      // For branches, use examNumber
      setFilters(prev => ({ 
        ...prev, 
        examNumber: selectedExam, 
        languageLevel: '',
        testType: '',
        testNumber: null 
      }));
    }
  }, [selectedExam, selectedLevel, selectedTest, isLanguageSelected]);

  // Fetch grades when filters change
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchGrades();
    }
  }, [isAuthenticated, user, filters]);

  // Fetch messages and current season on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMessages();
      fetchCurrentSeason();
    }
  }, [isAuthenticated, user]);
  
  // Update academic year filter when season is loaded
  useEffect(() => {
    if (currentSeason) {
      setFilters(prev => ({ ...prev, academicYear: currentSeason.name }));
    }
  }, [currentSeason]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      console.log('📚 Fetching grades with filters:', filters);
      const response = await studentAPI.getGrades(filters);
      console.log('✅ Received grades:', response.data.grades?.length || 0, 'for exam', filters.examNumber);
      setGrades(response.data.grades || []);
      setStats(response.data.stats || null);
    } catch (error) {
      console.error('Error fetching grades:', error);
      alert('Failed to load grades. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await studentAPI.getMessages();
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const fetchCurrentSeason = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      const response = await fetch('/api/seasons/current', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📅 Current season loaded:', data.name);
        setCurrentSeason(data);
      } else {
        console.warn('No active season found, using default year');
        // Fallback to current academic year
        const now = new Date();
        const currentYear = now.getFullYear();
        const month = now.getMonth();
        const academicYear = month >= 8 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
        setFilters(prev => ({ ...prev, academicYear }));
      }
    } catch (error) {
      console.error('Error fetching current season:', error);
      // Fallback to current academic year
      const now = new Date();
      const currentYear = now.getFullYear();
      const month = now.getMonth();
      const academicYear = month >= 8 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
      setFilters(prev => ({ ...prev, academicYear }));
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await studentAPI.deleteMessage(messageId);
      setMessages(messages.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const handleClearMessages = async () => {
    if (!confirm('Are you sure you want to clear all messages?')) return;
    
    try {
      await studentAPI.clearMessages();
      setMessages([]);
    } catch (error) {
      console.error('Error clearing messages:', error);
      alert('Failed to clear messages');
    }
  };

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="student-portal">
      <div className="container">
        <Header title="Student Portal" subtitle={user?.schoolEmail} user={user} logout={logout} securityAPI={studentAPI}>
          <button 
            className="messages-btn" 
            onClick={() => setShowMessages(true)}
          >
            <i className="fas fa-paper-plane"></i>
            Messages
            {messages.length > 0 && <span className="message-badge"></span>}
          </button>
        </Header>

        <PaymentStatus />

        {stats && <StatsCards stats={stats} />}

        <GradesFilters 
          filters={filters} 
          onFilterChange={setFilters}
          formations={user?.formation || []}
          branches={user?.filiere || []}
        />

        <ExamTabs 
          selectedExam={isLanguageSelected ? selectedLevel : selectedExam}
          onExamChange={isLanguageSelected ? setSelectedLevel : setSelectedExam}
          examCount={filters.branch ? getExamCount(filters.branch) : 4}
          formation={filters.formation || filters.branch}
        />
        
        {/* Test Selection Tabs for Languages */}
        {isLanguageSelected && (
          <div className="test-tabs-container" style={{ marginTop: '20px' }}>
            <div className="test-tabs">
              <button
                className={`test-tab ${selectedTest === null ? 'active' : ''}`}
                onClick={() => setSelectedTest(null)}
              >
                <i className="fas fa-list"></i>
                {t('enterGrades')}
              </button>
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  className={`test-tab ${selectedTest === num ? 'active' : ''}`}
                  onClick={() => setSelectedTest(num)}
                >
                  <i className="fas fa-file-alt"></i>
                  {t('test')} {num}
                </button>
              ))}
              <button
                className={`test-tab exam-tab ${selectedTest === 'final' ? 'active' : ''}`}
                onClick={() => setSelectedTest('final')}
              >
                <i className="fas fa-star"></i>
                {t('exam')}-{selectedLevel}
              </button>
            </div>
          </div>
        )}

        <div className="grades-section">
          <h2>
            <i className="fas fa-chart-line"></i>
            {isLanguageSelected 
              ? `${t('myGrades')} - ${filters.formation} - ${t('level')} ${selectedLevel}${selectedTest ? (selectedTest === 'final' ? ` - ${t('exam')}` : ` - ${t('test')} ${selectedTest}`) : ` - ${t('enterGrades')}`}`
              : `${t('myGrades')} - ${t('exam')} ${selectedExam}`
            }
          </h2>
          
          {loading ? (
            <Loading message="Loading grades..." />
          ) : grades.length > 0 ? (
            <GradesTable grades={grades} />
          ) : (
            <div className="no-grades">
              <i className="fas fa-clipboard-list"></i>
              <h3>
                {isLanguageSelected 
                  ? `No Grades Yet for Level ${selectedLevel}${selectedTest ? (selectedTest === 'final' ? ' - Final Exam' : ` - Test ${selectedTest}`) : ''}`
                  : `No Grades Yet for Exam ${selectedExam}`
                }
              </h3>
              <p>Your grades will appear here once your teachers upload them.</p>
            </div>
          )}
        </div>

        <MessagesPanel
          isOpen={showMessages}
          onClose={() => setShowMessages(false)}
          messages={messages}
          onDeleteMessage={handleDeleteMessage}
          onClearMessages={handleClearMessages}
        />
      </div>
    </div>
  );
};

export default StudentPortal;
