import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { checkVersion } from './version';
import { autoLogin, isLoggedIn } from './services/authService';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import GradesScreen from './screens/GradesScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import PaymentScreen from './screens/PaymentScreen';
import MessagesScreen from './screens/MessagesScreen';
import SettingsScreen from './screens/SettingsScreen';

// Install prompt component
import InstallPrompt from './components/InstallPrompt';

// Protected Route Component
function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      const loggedIn = await isLoggedIn();
      setAuthenticated(loggedIn);
      setChecking(false);
      
      if (!loggedIn && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
    
    checkAuth();
  }, [navigate, location.pathname]);

  if (checking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return authenticated ? children : null;
}

function App() {
  // Check version on app load and clear cache if version changed
  useEffect(() => {
    checkVersion();
    
    // Try auto-login on app start
    async function tryAutoLogin() {
      const loginData = await autoLogin();
      if (loginData) {
        console.log('✅ Auto-login successful');
      }
    }
    
    tryAutoLogin();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter basename="/pwa">
        <InstallPrompt />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
          <Route path="/grades" element={<ProtectedRoute><GradesScreen /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendanceScreen /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><PaymentScreen /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesScreen /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
