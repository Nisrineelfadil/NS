import { useState } from 'react';
import { useTeacherAuth } from '../../../context/TeacherAuthContext';
import { teacherAPI } from '../../../services/api';
import './LoginForm.css';

const LoginForm = () => {
  const { login } = useTeacherAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // 2FA state
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [tempToken, setTempToken] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [code, setCode] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await teacherAPI.login(formData);
      const { requires2FA, tempToken: tmp, email, token, teacher } = response.data;
      if (requires2FA) {
        setTempToken(tmp);
        setSentEmail(email);
        setStep('2fa');
      } else {
        login(teacher, token);
      }
    } catch (err) {
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
      const response = await teacherAPI.verify2FA({ tempToken, code });
      const { token, teacher } = response.data;
      login(teacher, token);
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
        <h2>Teacher Portal</h2>
        <p>Login with your @nisrineschool.com email</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
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
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Logging in...</> : <><i className="fas fa-sign-in-alt"></i> Login</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
