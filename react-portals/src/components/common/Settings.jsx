import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import './Settings.css';

const Settings = ({ securityAPI }) => {
  const [showSheet, setShowSheet] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityMsg, setSecurityMsg] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { language, changeLanguage: setLanguage, t } = useLanguage();
  const buttonRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showLangDropdown && !e.target.closest('.desktop-lang-selector')) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLangDropdown]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (showSheet) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSheet]);

  // Load 2FA settings when drawer opens
  useEffect(() => {
    if (showSheet && securityAPI) {
      securityAPI.getSettings().then(res => {
        setTwoFactorEnabled(res.data.twoFactorEnabled || false);
        setTwoFactorEmail(res.data.twoFactorEmail || '');
      }).catch(() => {});
    }
  }, [showSheet, securityAPI]);

  const handleSaveSecurity = async () => {
    if (twoFactorEnabled && !twoFactorEmail.trim()) {
      setSecurityMsg({ type: 'error', text: 'Please enter a personal email address.' });
      return;
    }
    setSecuritySaving(true);
    setSecurityMsg(null);
    try {
      await securityAPI.updateSettings({ twoFactorEnabled, twoFactorEmail: twoFactorEmail.trim() });
      setSecurityMsg({ type: 'success', text: '2FA settings saved.' });
      setTimeout(() => setSecurityMsg(null), 3000);
    } catch (err) {
      setSecurityMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save. Please try again.' });
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setShowLangDropdown(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!showLangDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right
      });
    }
    setShowLangDropdown(!showLangDropdown);
  };

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', label: 'DE' },
    { code: 'ar', name: 'العربية', flag: '🇲🇦', label: 'AR' },
    { code: 'en', name: 'English', flag: '🇬🇧', label: 'EN' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', label: 'FR' },
  ];

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  // Desktop version (dropdown + optional security gear)
  if (!isMobile) {
    return (
      <div className="desktop-settings" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Language Dropdown */}
        <div className="desktop-lang-selector">
          <button 
            ref={buttonRef}
            className="lang-dropdown-btn"
            onClick={toggleDropdown}
          >
            <span className="flag">{currentLanguage.flag}</span>
            <span className="lang-label">{currentLanguage.name}</span>
            <i className={`fas fa-chevron-down ${showLangDropdown ? 'rotate' : ''}`}></i>
          </button>
          {showLangDropdown && createPortal(
            <div 
              className="lang-dropdown" 
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                zIndex: 99999
              }}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-option ${language === lang.code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <span className="flag">{lang.flag}</span>
                  <span className="lang-name">{lang.name}</span>
                  {language === lang.code && (
                    <i className="fas fa-check"></i>
                  )}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>

        {/* Security gear icon — only when securityAPI is passed */}
        {securityAPI && (
          <>
            <button
              onClick={() => setShowSheet(true)}
              title="Security Settings"
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#f59e0b', borderRadius: '8px', padding: '8px 12px',
                cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <i className="fas fa-shield-alt"></i>
              <span style={{ fontSize: '0.8rem' }}>2FA</span>
            </button>

            {/* Backdrop */}
            {showSheet && (
              <div
                onClick={() => setShowSheet(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
              />
            )}

            {/* Security panel */}
            {showSheet && createPortal(
              <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#1e293b', borderRadius: '16px', padding: '28px',
                width: '360px', maxWidth: '90vw', zIndex: 9999,
                border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-shield-alt"></i> Two-Factor Authentication
                  </h3>
                  <button onClick={() => setShowSheet(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                {/* Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0' }}>Enable 2FA</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Require a code at every login</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input type="checkbox" checked={twoFactorEnabled} onChange={e => setTwoFactorEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '24px', background: twoFactorEnabled ? '#f59e0b' : '#334155', transition: 'background 0.2s' }}>
                      <span style={{ position: 'absolute', top: '3px', left: twoFactorEnabled ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </span>
                  </label>
                </div>

                {/* Personal email */}
                {twoFactorEnabled && (
                  <div style={{ marginTop: '16px' }}>
                    <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      Personal email to receive codes
                    </label>
                    <input
                      type="email"
                      value={twoFactorEmail}
                      onChange={e => setTwoFactorEmail(e.target.value)}
                      placeholder="yourpersonal@gmail.com"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {securityMsg && (
                  <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', background: securityMsg.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: securityMsg.type === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${securityMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    {securityMsg.text}
                  </div>
                )}

                <button
                  onClick={handleSaveSecurity}
                  disabled={securitySaving}
                  style={{ marginTop: '16px', width: '100%', padding: '11px', borderRadius: '8px', background: '#f59e0b', border: 'none', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', opacity: securitySaving ? 0.7 : 1 }}
                >
                  {securitySaving ? 'Saving...' : 'Save Security Settings'}
                </button>
              </div>,
              document.body
            )}
          </>
        )}

      </div>
    );
  }

  // Mobile version (drawer)
  return (
    <>
      <button 
        className="settings-btn" 
        onClick={() => setShowSheet(true)}
        title="Settings"
      >
        <i className="fas fa-cog"></i>
      </button>

      {/* Backdrop */}
      {showSheet && (
        <div 
          className="settings-backdrop" 
          onClick={() => setShowSheet(false)}
        />
      )}

      {/* Side Drawer */}
      <div className={`settings-drawer ${showSheet ? 'open' : ''}`}>
        <div className="settings-drawer-header">
          <h2>
            <i className="fas fa-cog"></i>
            {t('settings')}
          </h2>
          <button 
            className="close-btn" 
            onClick={() => setShowSheet(false)}
            aria-label="Close settings"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="settings-drawer-content">
          {/* Language Selector */}
          <div className="settings-section">
            <div className="settings-section-header">
              <i className="fas fa-globe"></i>
              <span>{t('language')}</span>
            </div>
            <div className="language-grid">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-card ${language === lang.code ? 'active' : ''}`}
                  onClick={() => setLanguage(lang.code)}
                >
                  <span className="flag">{lang.flag}</span>
                  <span className="lang-name">{lang.name}</span>
                  {language === lang.code && (
                    <i className="fas fa-check-circle check-icon"></i>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2FA Security Section — only shown when securityAPI is provided */}
          {securityAPI && (
            <div className="settings-section" style={{ marginTop: '20px' }}>
              <div className="settings-section-header">
                <i className="fas fa-shield-alt"></i>
                <span>Two-Factor Authentication</span>
              </div>

              {/* Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enable 2FA</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Require a code at every login</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={e => setTwoFactorEnabled(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', inset: 0, borderRadius: '24px',
                    background: twoFactorEnabled ? '#f59e0b' : '#334155',
                    transition: 'background 0.2s'
                  }}>
                    <span style={{
                      position: 'absolute', top: '3px',
                      left: twoFactorEnabled ? '23px' : '3px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: '#fff', transition: 'left 0.2s'
                    }} />
                  </span>
                </label>
              </div>

              {/* Personal email input */}
              {twoFactorEnabled && (
                <div style={{ marginTop: '14px' }}>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    Personal email to receive codes
                  </label>
                  <input
                    type="email"
                    value={twoFactorEmail}
                    onChange={e => setTwoFactorEmail(e.target.value)}
                    placeholder="yourpersonal@gmail.com"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Feedback message */}
              {securityMsg && (
                <div style={{
                  marginTop: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem',
                  background: securityMsg.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: securityMsg.type === 'success' ? '#4ade80' : '#f87171',
                  border: `1px solid ${securityMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                }}>
                  {securityMsg.text}
                </div>
              )}

              <button
                onClick={handleSaveSecurity}
                disabled={securitySaving}
                style={{
                  marginTop: '14px', width: '100%', padding: '10px', borderRadius: '8px',
                  background: '#f59e0b', border: 'none', color: '#1e293b',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', opacity: securitySaving ? 0.7 : 1
                }}
              >
                {securitySaving ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Settings;
