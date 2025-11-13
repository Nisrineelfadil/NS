import axios from 'axios';

// Create base axios instance
const createAPIInstance = (tokenKey, userKey) => {
  const instance = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(tokenKey);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create separate instances for student and teacher
const studentAPI_instance = createAPIInstance('studentToken', 'studentUser');
const teacherAPI_instance = createAPIInstance('teacherToken', 'teacherUser');
const adminAPI_instance = createAPIInstance('token', 'user'); // Admin uses generic token

// ============================================
// STUDENT PORTAL API
// ============================================

export const studentAPI = {
  // Login
  login: (credentials) => studentAPI_instance.post('/grades/student/login', credentials),
  
  // Get student grades with filters
  getGrades: (params) => studentAPI_instance.get('/grades/student/grades', { params }),
  
  // Get student messages
  getMessages: () => studentAPI_instance.get('/grades/student/messages'),
  
  // Delete message
  deleteMessage: (messageId) => 
    studentAPI_instance.delete(`/grades/student/messages/${messageId}`),
  
  // Clear all messages
  clearMessages: () => 
    studentAPI_instance.delete('/grades/student/messages/clear-all'),
  
  // NEW: A1-B2 Language Progress APIs
  getLanguageProgress: (formation) => 
    studentAPI_instance.get('/grades/student/language-progress', { params: { formation } }),
  
  getPerformanceData: (formation) => 
    studentAPI_instance.get('/grades/student/performance-data', { params: { formation } }),
  
  getGradesByLevel: (formation, languageLevel) => 
    studentAPI_instance.get('/grades/student/grades-by-level', { 
      params: { formation, languageLevel } 
    }),
};

// ============================================
// TEACHER PORTAL API
// ============================================

export const teacherAPI = {
  // Login
  login: (credentials) => teacherAPI_instance.post('/grades/teacher/login', credentials),
  
  // Get teacher's groups
  getGroups: () => teacherAPI_instance.get('/grades/teacher/groups'),
  
  // Get students by formation and group
  getStudents: (params) => teacherAPI_instance.get('/grades/teacher/students', { params }),
  
  // Get all grades uploaded by teacher (with filters)
  getGrades: (params) => teacherAPI_instance.get('/grades/teacher/grades', { params }),
  
  // Upload grade
  uploadGrade: (gradeData) => teacherAPI_instance.post('/grades/teacher/grades', gradeData),
  
  // Update grade
  updateGrade: (gradeId, gradeData) => teacherAPI_instance.put(`/grades/teacher/grades/${gradeId}`, gradeData),
  
  // Delete grade
  deleteGrade: (gradeId) => teacherAPI_instance.delete(`/grades/teacher/grades/${gradeId}`),
};

// ============================================
// STUDENT MANAGEMENT API (Admin)
// ============================================

export const adminAPI = {
  // Dashboard stats
  getDashboardStats: () => adminAPI_instance.get('/student-management/dashboard/stats'),
  
  // Groups
  getGroups: () => adminAPI_instance.get('/student-management/groups'),
  createGroup: (groupData) => adminAPI_instance.post('/student-management/groups', groupData),
  updateGroup: (groupId, groupData) => adminAPI_instance.put(`/student-management/groups/${groupId}`, groupData),
  deleteGroup: (groupId) => adminAPI_instance.delete(`/student-management/groups/${groupId}`),
  
  // Students
  getStudents: (params) => adminAPI_instance.get('/student-management/students', { params }),
  createStudent: (studentData) => adminAPI_instance.post('/student-management/students', studentData),
  updateStudent: (studentId, studentData) => 
    adminAPI_instance.put(`/student-management/students/${studentId}`, studentData),
  deleteStudent: (studentId) => adminAPI_instance.delete(`/student-management/students/${studentId}`),
  exportStudents: (params) => 
    adminAPI_instance.get('/student-management/students/export/csv', { params, responseType: 'blob' }),
  
  // Student passwords
  getStudentPassword: (studentId) => 
    adminAPI_instance.get(`/student-management/students/${studentId}/password`),
  updateStudentPassword: (studentId, passwordData) => 
    adminAPI_instance.put(`/student-management/students/${studentId}/password`, passwordData),
  
  // Teachers
  getTeachers: () => adminAPI_instance.get('/grades/admin/teachers'),
  createTeacher: (teacherData) => adminAPI_instance.post('/grades/admin/teachers', teacherData),
  updateTeacher: (teacherId, teacherData) => 
    adminAPI_instance.put(`/grades/admin/teachers/${teacherId}`, teacherData),
  deleteTeacher: (teacherId) => adminAPI_instance.delete(`/grades/admin/teachers/${teacherId}`),
  
  // Grades (admin view)
  getStudentGrades: (studentId, params) => 
    adminAPI_instance.get(`/grades/admin/students/${studentId}/grades`, { params }),
  
  // Payment reminders
  getPaymentReminders: () => adminAPI_instance.get('/student-management/payment-reminders'),
  markReminderSent: (reminderId) => 
    adminAPI_instance.post(`/student-management/payment-reminders/${reminderId}/sent`),
};

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  // Admin login
  adminLogin: (credentials) => adminAPI_instance.post('/admin/login', credentials),
  
  // Verify token
  verifyToken: () => adminAPI_instance.get('/admin/verify'),
};

export default adminAPI_instance;
