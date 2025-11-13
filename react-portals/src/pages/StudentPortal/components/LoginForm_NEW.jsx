import { useState } from 'react';
import { useStudentAuth } from '../../../context/StudentAuthContext';
import { studentAPI } from '../../../services/api';
import './LoginForm.css';

const LoginForm = () => {
  const { login } = useStudentAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performLogin = async () => {
    console.log('🔐 Login started');
    setError('');
    setLoading(true);

    try {
      const response = await studentAPI.login({ 
        schoolEmail: email, 
        password 
      });
      
      const { token, student } = response.data;
      
      if (token && student) {
        login(student, token);
        console.log('✅ Login successful');
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err) {
      console.error('❌ Login failed:', err);
      
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please check if backend is running.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 404) {
        setError('Login service not found');
      } else {
        setError(err.response?.data?.error || err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Student Portal</h2>
        <p>Login with your school email and password</p>

        {error && <div className="error-message">{error}</div>}

        <div className="login-form">
          <div className="form-group">
            <label>School Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performLogin()}
              placeholder="yourname@nisrineschool.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performLogin()}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button 
            type="button" 
            onClick={performLogin} 
            className="login-btn" 
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Logging in...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Login
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
