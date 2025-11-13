import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Translation strings
const translations = {
  de: {
    // Common
    settings: 'Einstellungen',
    appearance: 'Erscheinungsbild',
    language: 'Sprache',
    darkMode: 'Dunkelmodus',
    lightMode: 'Hellmodus',
    
    // Teacher Portal
    teacherPortal: 'Lehrerportal',
    gradeManagement: 'Notenverwaltung',
    selectFormation: 'Formation auswählen',
    selectGroup: 'Gruppe auswählen',
    noStudentsFound: 'Keine Schüler gefunden',
    noStudentsEnrolled: 'Keine Schüler in dieser Formation und Gruppe eingeschrieben.',
    students: 'Schüler',
    logout: 'Abmelden',
    enterGrades: 'Noten eingeben',
    
    // Student Portal
    studentPortal: 'Schülerportal',
    myGrades: 'Meine Noten',
    totalGrades: 'Gesamtnoten',
    averageScore: 'Durchschnittsnote',
    exam: 'Prüfung',
    paymentPending: 'Zahlung ausstehend',
    due: 'Fällig',
    level: 'Niveau',
    
    // Login
    email: 'E-Mail',
    password: 'Passwort',
    login: 'Anmelden',
    
    // Grades
    score: 'Punktzahl',
    maxScore: 'Maximale Punktzahl',
    semester: 'Semester',
    academicYear: 'Schuljahr',
    examDate: 'Prüfungsdatum',
    comments: 'Kommentare',
    test: 'Test',
    skill: 'Fähigkeit',
    status: 'Status',
    date: 'Datum',
    teacher: 'Lehrer',
    formation: 'Formation',
    examType: 'Prüfungstyp',
    grade: 'Note',
    filterGrades: 'Noten filtern',
    languageFormation: 'Sprachausbildung',
    allLanguages: 'Alle Sprachen',
    branchFiliere: 'Zweig (Filière)',
    allBranches: 'Alle Zweige',
    allSemesters: 'Alle Semester',
    currentSeason: 'Aktuelle Saison',
    autoSet: 'Automatisch vom Admin-Portal festgelegt',
  },
  ar: {
    // Common
    settings: 'الإعدادات',
    appearance: 'المظهر',
    language: 'اللغة',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    
    // Teacher Portal
    teacherPortal: 'بوابة المعلم',
    gradeManagement: 'إدارة الدرجات',
    selectFormation: 'اختر التكوين',
    selectGroup: 'اختر المجموعة',
    noStudentsFound: 'لم يتم العثور على طلاب',
    noStudentsEnrolled: 'لا يوجد طلاب مسجلون في هذا التكوين والمجموعة.',
    students: 'الطلاب',
    logout: 'تسجيل الخروج',
    enterGrades: 'إدخال الدرجات',
    
    // Student Portal
    studentPortal: 'بوابة الطالب',
    myGrades: 'درجاتي',
    totalGrades: 'إجمالي الدرجات',
    averageScore: 'متوسط الدرجات',
    
    // Login
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    
    // Grades
    score: 'النتيجة',
    maxScore: 'الدرجة القصوى',
    semester: 'الفصل الدراسي',
    academicYear: 'السنة الدراسية',
    examDate: 'تاريخ الامتحان',
    comments: 'تعليقات',
  },
  en: {
    // Common
    settings: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    
    // Teacher Portal
    teacherPortal: 'Teacher Portal',
    gradeManagement: 'Grade Management',
    selectFormation: 'Select Formation',
    selectGroup: 'Select Group',
    noStudentsFound: 'No Students Found',
    noStudentsEnrolled: 'No students are enrolled in this formation and group.',
    students: 'Students',
    logout: 'Logout',
    enterGrades: 'Enter Grades',
    
    // Student Portal
    studentPortal: 'Student Portal',
    myGrades: 'My Grades',
    totalGrades: 'Total Grades',
    averageScore: 'Average Score',
    exam: 'Exam',
    paymentPending: 'Payment Pending',
    due: 'Due',
    level: 'Level',
    
    // Login
    email: 'Email',
    password: 'Password',
    login: 'Login',
    
    // Grades
    score: 'Score',
    maxScore: 'Max Score',
    semester: 'Semester',
    academicYear: 'Academic Year',
    examDate: 'Exam Date',
    comments: 'Comments',
    test: 'Test',
    skill: 'Skill',
    status: 'Status',
    date: 'Date',
    teacher: 'Teacher',
    formation: 'Formation',
    examType: 'Exam Type',
    grade: 'Grade',
    filterGrades: 'Filter Grades',
    languageFormation: 'Language Formation',
    allLanguages: 'All Languages',
    branchFiliere: 'Branch (Filière)',
    allBranches: 'All Branches',
    allSemesters: 'All Semesters',
    currentSeason: 'Current Season',
    autoSet: 'Automatically set from admin portal',
  },
  fr: {
    // Common
    settings: 'Paramètres',
    appearance: 'Apparence',
    language: 'Langue',
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    
    // Teacher Portal
    teacherPortal: 'Portail Enseignant',
    gradeManagement: 'Gestion des Notes',
    selectFormation: 'Sélectionner la Formation',
    selectGroup: 'Sélectionner le Groupe',
    noStudentsFound: 'Aucun Étudiant Trouvé',
    noStudentsEnrolled: 'Aucun étudiant inscrit dans cette formation et ce groupe.',
    students: 'Étudiants',
    logout: 'Déconnexion',
    
    // Student Portal
    studentPortal: 'Portail Étudiant',
    myGrades: 'Mes Notes',
    totalGrades: 'Notes Totales',
    averageScore: 'Moyenne',
    exam: 'Examen',
    paymentPending: 'Paiement en attente',
    due: 'Dû',
    level: 'Niveau',
    
    // Login
    email: 'Email',
    password: 'Mot de passe',
    login: 'Connexion',
    
    // Grades
    score: 'Score',
    maxScore: 'Score Maximum',
    semester: 'Semestre',
    academicYear: 'Année Académique',
    examDate: 'Date d\'Examen',
    comments: 'Commentaires',
    test: 'Test',
    skill: 'Compétence',
    status: 'Statut',
    date: 'Date',
    teacher: 'Professeur',
    formation: 'Formation',
    examType: 'Type d\'Examen',
    grade: 'Note',
    filterGrades: 'Filtrer les Notes',
    languageFormation: 'Formation Linguistique',
    allLanguages: 'Toutes les Langues',
    branchFiliere: 'Branche (Filière)',
    allBranches: 'Toutes les Branches',
    allSemesters: 'Tous les Semestres',
    currentSeason: 'Saison Actuelle',
    autoSet: 'Défini automatiquement depuis le portail admin',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('de');

  useEffect(() => {
    // Load saved language
    const savedLanguage = localStorage.getItem('language') || 'de';
    setLanguage(savedLanguage);
    
    // Set HTML dir attribute for RTL languages
    document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLanguage;
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
