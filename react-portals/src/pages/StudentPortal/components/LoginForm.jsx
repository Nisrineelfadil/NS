import { useState, useEffect } from 'react';
import { useStudentAuth } from '../../../context/StudentAuthContext';
import { studentAPI } from '../../../services/api';
import './LoginForm.css';

const LoginForm = () => {
  const { login } = useStudentAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  // 2FA state
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [tempToken, setTempToken] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    const msg = localStorage.getItem('accountDeletedMessage');
    if (msg) {
      setAccountMessage(msg);
      localStorage.removeItem('accountDeletedMessage');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await studentAPI.login(formData);
      const { requires2FA, tempToken: tmp, email, token, student } = response.data;
      if (requires2FA) {
        setTempToken(tmp);
        setSentEmail(email);
        setStep('2fa');
      } else {
        login(student, token);
      }
    } catch (err) {
      if (err.response?.status === 410 || err.response?.data?.accountDeleted) {
        setAccountMessage(err.response?.data?.error || err.response?.data?.message || 'Your account no longer exists.');
        return;
      }
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await studentAPI.verify2FA({ tempToken, code });
      const { token, student } = response.data;
      login(student, token);
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === '2fa') {
    return (
      <div className="login-container">
        <div className="login-box">
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '2rem' }}>🔐</span>
          </div>
          <h2>Verify Your Identity</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
            A 6-digit code was sent to <strong>{sentEmail}</strong>.<br />
            Valid for 10 minutes.
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                required
                autoFocus
                style={{ letterSpacing: '0.3em', fontSize: '1.4rem', textAlign: 'center' }}
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading || code.length < 6}>
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : <><i className="fas fa-check-circle"></i> Confirm</>}
            </button>
          </form>

          <button
            onClick={() => { setStep('credentials'); setCode(''); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginTop: '12px', fontSize: '0.85rem', textDecoration: 'underline' }}
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

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
