// API Configuration
// Automatically uses localhost in development, Vercel in production
export const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : 'https://nisrine-school.vercel.app');

// For testing on your local network, uncomment:
// export const API_URL = 'http://192.168.1.31:3000';
