import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StudentAuthProvider } from './context/StudentAuthContext';
import { TeacherAuthProvider } from './context/TeacherAuthContext';
import { LanguageProvider } from './context/LanguageContext';
import StudentPortal from './pages/StudentPortal/StudentPortal';
import TeacherPortal from './pages/TeacherPortal/TeacherPortal';

function App() {
  return (
    <LanguageProvider>
      <StudentAuthProvider>
        <TeacherAuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/student-portal" element={<StudentPortal />} />
              <Route path="/teacher-portal" element={<TeacherPortal />} />
              <Route path="/" element={<Navigate to="/student-portal" replace />} />
              <Route path="*" element={<Navigate to="/student-portal" replace />} />
            </Routes>
          </Router>
        </TeacherAuthProvider>
      </StudentAuthProvider>
    </LanguageProvider>
  );
}

export default App;
