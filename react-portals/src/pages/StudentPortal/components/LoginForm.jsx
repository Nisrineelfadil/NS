import { useState, useEffect } from 'react';
import { useStudentAuth } from '../../../context/StudentAuthContext';
import { studentAPI } from '../../../services/api';
import './LoginForm.css';

const LoginForm = () => {
  const { login } = useStudentAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');

  useEffect(() => {
    const msg = localStorage.getItem('accountDeletedMessage');
    if (msg) {
      setAccountMessage(msg);
      localStorage.removeItem('accountDeletedMessage');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await studentAPI.login(formData);
      const { token, student } = response.data;
      login(student, token);
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 410 || error.response?.data?.accountDeleted) {
        setAccountMessage(error.response?.data?.error || error.response?.data?.message || 'Your account no longer exists.');
        return;
      }
      setError(error.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Student Portal</h2>
        <p>Login with your school email and password</p>

        {accountMessage && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px',
            padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px'
          }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ margin: 0, color: '#991b1b', fontSize: '0.88rem', fontWeight: 600 }}>{accountMessage}</p>
              <button onClick={() => setAccountMessage('')}
                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem', padding: '4px 0', marginTop: '4px', textDecoration: 'underline' }}>
                ✕ Dismiss
              </button>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>School Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="yourname@nisrineschool.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
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
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
