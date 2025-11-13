import { useLanguage } from '../../context/LanguageContext';
import Settings from './Settings';
import './Header.css';

const Header = ({ title, subtitle, showLogout = true, showSettings = true, children, user, logout }) => {
  const { t } = useLanguage();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `http://localhost:3000${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  return (
    <div className="header">
      <div className="logo">
        <i className="fas fa-graduation-cap"></i>
        <h1>{title || t('studentPortal')}</h1>
      </div>

      <div className="user-info">
        {children}
        
        {user && (
          <>
            <div className="user-avatar">
              {user.photoPath ? (
                <img src={getPhotoUrl(user.photoPath)} alt={user.fullName || user.name} />
              ) : (
                getInitials(user.fullName || user.name)
              )}
            </div>
            <div className="user-details">
              <h3>{user.fullName || user.name}</h3>
              <p>{subtitle || user.schoolEmail || user.email}</p>
            </div>
          </>
        )}

        {showSettings && <Settings />}

        {showLogout && (
          <button className="logout-btn" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i> {t('logout')}
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
