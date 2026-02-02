import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import './LoginScreen.css';
import logo from '../Logo/logo.png';
import { useInstallPWA } from '../hooks/useInstallPWA';
import { API_URL } from '../config';
import { animations } from '../gradients';
import { saveAuthData, isLoggedIn } from '../services/authService';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking'); // checking, online, offline
  
  // PWA install hook
  const { handleInstall, platform, isInstalled, canInstall } = useInstallPWA();
  
  // Check if already logged in
  useEffect(() => {
    async function checkLogin() {
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        console.log('✅ Already logged in, redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      }
    }
    checkLogin();
  }, [navigate]);
  
  // Check API connectivity on mount
  useEffect(() => {
    const checkAPI = async () => {
      try {
        console.log('🔍 Checking API connectivity...');
        console.log('API URL:', API_URL);
        console.log('Full health URL:', `${API_URL}/api/health`);
        
        const response = await axios.get(`${API_URL}/api/health`, {
          timeout: 5000
        });
        console.log('✅ API is online:', response.data);
        setApiStatus('online');
      } catch (error) {
        console.error('❌ API check failed:', error.message);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        // Don't block login if health check fails
        // User can still try to login
        setApiStatus('unknown');
      }
    };
    
    checkAPI();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    setLoading(true);
    
    // Add detailed logging
    console.log('🔍 Login attempt:', {
      apiUrl: API_URL,
      fullUrl: `${API_URL}/api/grades/student/login`,
      email: email,
      timestamp: new Date().toISOString()
    });
    
    try {
      const response = await axios.post(`${API_URL}/api/grades/student/login`, {
        email,
        password,
      }, {
        timeout: 30000, // Increased to 30 seconds for cold starts
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.token && response.data.student) {
        // Store login data persistently (survives cache clear)
        await saveAuthData(response.data.token, response.data.student);
        
        console.log('✅ Login successful, navigating to dashboard...');
        
        // Use React Router navigate instead of window.location
        navigate('/dashboard', { replace: true });
      } else {
        alert(response.data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });
      
      let errorMessage = 'Failed to connect to server. Please check your connection.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. The server is taking too long to respond. Please try again.';
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="login-container"
      initial="initial"
      animate="animate"
      variants={animations.fadeIn}
    >
      <motion.div 
        className="login-content"
        variants={animations.slideUp}
      >
        <motion.div 
          className="logo-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <img src={logo} alt="Nisrine School Logo" className="logo-image" />
          <h1 className="title">Herzlich willkommen</h1>
        </motion.div>

        <motion.form 
          className="login-form" 
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="email"
                className="input-field"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                className="input-field"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <motion.button 
            type="submit" 
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </motion.button>

          <motion.a
            href="https://api.whatsapp.com/send/?phone=212664648455&text&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-support"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contact support
          </motion.a>

          {!isInstalled && (
            <div className="download-section">
              <p className="download-title">
                {canInstall ? 'Install App' : 'Download Mobile App'}
              </p>
              <div className="download-buttons">
                <button 
                  type="button"
                  className="download-btn apple-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    handleInstall();
                  }}
                >
                  <span className="download-icon">🍎</span>
                  <div className="download-text">
                    <span className="download-label">
                      {platform === 'ios' ? 'Install on' : 'Download on the'}
                    </span>
                    <span className="download-store">
                      {platform === 'ios' ? 'iPhone/iPad' : 'App Store'}
                    </span>
                  </div>
                </button>

                <button 
                  type="button"
                  className="download-btn android-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    handleInstall();
                  }}
                >
                  <span className="download-icon">🤖</span>
                  <div className="download-text">
                    <span className="download-label">
                      {platform === 'android' ? 'Install on' : 'Get it on'}
                    </span>
                    <span className="download-store">
                      {platform === 'android' ? 'Android' : 'Google Play'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}
          
          {isInstalled && (
            <div className="download-section">
              <p className="download-title installed-message">
                ✅ App Installed Successfully!
              </p>
              <p className="installed-subtitle">
                You can find the app on your home screen
              </p>
            </div>
          )}
        </motion.form>

        <p className="footer">© 2025 Nisrine School. All rights reserved.</p>
      </motion.div>
    </motion.div>
  );
};

export default LoginScreen;
