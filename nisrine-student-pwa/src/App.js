import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { checkVersion } from './version';
import { setupApiInterceptor } from './services/apiInterceptor';

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

function App() {
  // Check version on app load and clear cache if version changed
  useEffect(() => {
    checkVersion();
    setupApiInterceptor();
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter basename="/pwa">
          <InstallPrompt />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/grades" element={<GradesScreen />} />
            <Route path="/attendance" element={<AttendanceScreen />} />
            <Route path="/payment" element={<PaymentScreen />} />
            <Route path="/messages" element={<MessagesScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
