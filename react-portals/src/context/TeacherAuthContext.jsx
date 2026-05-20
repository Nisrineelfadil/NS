import { createContext, useContext, useState, useEffect } from 'react';

const TeacherAuthContext = createContext(null);

export const useTeacherAuth = () => {
  const context = useContext(TeacherAuthContext);
  if (!context) {
    throw new Error('useTeacherAuth must be used within a TeacherAuthProvider');
  }
  return context;
};

export const TeacherAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending2FA, setPending2FA] = useState(null); // { tempToken, email }

  useEffect(() => {
    const storedToken = localStorage.getItem('teacherToken');
    const storedUser = localStorage.getItem('teacherUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const require2FA = (tempToken, email) => {
    setPending2FA({ tempToken, email });
  };

  const login = (userData, authToken) => {
    setPending2FA(null);
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('teacherToken', authToken);
    localStorage.setItem('teacherUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPending2FA(null);
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherUser');
  };

  const value = {
    user,
    token,
    loading,
    pending2FA,
    require2FA,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <TeacherAuthContext.Provider value={value}>{children}</TeacherAuthContext.Provider>;
};
