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
    attendanceQR: 'Anwesenheits-QR',
    selectFormation: 'Formation auswählen',
    selectGroup: 'Gruppe auswählen',
    selectFormationAndGroup: 'Formation und Gruppe auswählen',
    selectFormationGroupText: 'Bitte wählen Sie eine Formation und Gruppe aus, um Schüler anzuzeigen.',
    autoAssigned: 'Automatisch zugewiesen',
    noGroupsAvailable: 'Keine Gruppen für diese Formation verfügbar',
    noStudentsFound: 'Keine Schüler gefunden',
    noStudentsEnrolled: 'Keine Schüler in dieser Formation und Gruppe eingeschrieben.',
    loadingStudents: 'Schüler werden geladen...',
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
    
    // Grade Modal
    existingGrades: 'Vorhandene Noten',
    uploadNewGrade: 'Neue Note hochladen',
    editGrade: 'Note bearbeiten',
    cancelEdit: 'Bearbeitung abbrechen',
    selectExamType: 'Prüfungstyp auswählen',
    branchGradedOutOf20: 'Fachrichtungen werden mit 20 Punkten bewertet',
    commentsOptional: 'Kommentare (Optional)',
    addCommentsPlaceholder: 'Kommentare zu dieser Note hinzufügen...',
    cancel: 'Abbrechen',
    saving: 'Speichern...',
    updateGrade: 'Note aktualisieren',
    uploadGrade: 'Note hochladen',
    scoreCannotExceedMax: 'Die Punktzahl darf die maximale Punktzahl nicht überschreiten',
    gradeUpdatedSuccess: 'Note erfolgreich aktualisiert',
    gradeUploadedSuccess: 'Note erfolgreich hochgeladen',
    failedToSaveGrade: 'Note konnte nicht gespeichert werden',
    confirmDeleteGrade: 'Sind Sie sicher, dass Sie diese Note löschen möchten?',
    gradeDeletedSuccess: 'Note erfolgreich gelöscht',
    failedToDeleteGrade: 'Note konnte nicht gelöscht werden',
    gradeAlreadyExists: 'Die Note für "{subject}" wurde bereits eingetragen. Bitte verwenden Sie die Bearbeitungstaste, um sie zu ändern, oder wählen Sie ein anderes Fach.',
    alreadyEntered: 'Bereits eingetragen',
    
    // Students Grid
    loadingGrades: 'Noten werden geladen...',
    gradeEntered: 'Note eingetragen',
    gradesEntered: 'Noten eingetragen',
    noGradesYet: 'Noch keine Noten',
    
    // Subject Labels Editor
    subjectNames: 'Fachbezeichnungen',
    customize: 'Anpassen',
    save: 'Speichern',
    resetToDefaults: 'Zurücksetzen',
    subjectNamesSaved: 'Fachbezeichnungen erfolgreich gespeichert!',
    failedToSaveSubjectNames: 'Fachbezeichnungen konnten nicht gespeichert werden',
    
    // Attendance QR
    generateAttendanceQR: 'Anwesenheits-QR-Code generieren',
    chooseFormation: 'Formation wählen...',
    chooseGroup: 'Gruppe wählen...',
    group: 'Gruppe',
    classStartTime: 'Unterrichtsbeginn',
    classEndTime: 'Unterrichtsende',
    qrValidityMinutes: 'QR-Gültigkeit (Minuten)',
    lateThresholdMinutes: 'Verspätungsschwelle (Minuten)',
    generating: 'Wird generiert...',
    generateQRCode: 'QR-Code generieren',
    scanThisQRCode: 'Diesen QR-Code scannen',
    expiresIn: 'Läuft ab in',
    expired: 'Abgelaufen',
    manualEntryCode: 'Manueller Eingabecode',
    sessionIdCopied: 'Sitzungs-ID in die Zwischenablage kopiert!',
    copySessionId: 'Sitzungs-ID kopieren',
    manualEntryNote: 'Schüler können diesen Code manuell eingeben, wenn sie den QR-Code nicht scannen können',
    downloadQR: 'QR herunterladen',
    cancelSession: 'Sitzung abbrechen',
    cancelSessionTitle: 'Diese Sitzung abbrechen, falls sie versehentlich erstellt wurde',
    cancelSessionConfirm: 'Diese Anwesenheitssitzung abbrechen?',
    cancelSessionWarning: 'Dies wird den QR-Code ungültig machen und alle ausstehenden Anwesenheitseinträge löschen. Diese Aktion kann nicht rückgängig gemacht werden.',
    sessionCancelledSuccess: 'Sitzung erfolgreich abgebrochen!',
    pendingRecordsDeleted: 'ausstehende Einträge gelöscht.',
    failedToLoadGroups: 'Gruppen konnten nicht geladen werden',
    fillAllFields: 'Bitte füllen Sie alle Pflichtfelder aus',
    qrGeneratedSuccess: 'QR-Code erfolgreich generiert!',
    failedToCancelSession: 'Sitzung konnte nicht abgebrochen werden',
    error: 'Fehler',
    
    // Batch Language Grade Modal
    testType: 'Testtyp',
    miniTest: 'Minitest',
    finalExam: 'Abschlussprüfung',
    testNumber: 'Testnummer',
    enterAtLeastOneGrade: 'Bitte geben Sie mindestens eine Note ein',
    successfullyUploaded: 'Erfolgreich hochgeladen',
    gradesCount: 'Note(n)',
    currentGrade: 'Aktuell',
    uploading: 'Wird hochgeladen',
    uploadAllGrades: 'Alle Noten hochladen',
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
    exam: 'امتحان',
    grade: 'درجة',
    examType: 'نوع الامتحان',
    level: 'مستوى',
    
    // Grade Modal
    existingGrades: 'الدرجات الموجودة',
    uploadNewGrade: 'رفع درجة جديدة',
    editGrade: 'تعديل الدرجة',
    cancelEdit: 'إلغاء التعديل',
    selectExamType: 'اختر نوع الامتحان',
    branchGradedOutOf20: 'تُقيّم التخصصات من 20',
    commentsOptional: 'تعليقات (اختياري)',
    addCommentsPlaceholder: 'أضف تعليقات حول هذه الدرجة...',
    cancel: 'إلغاء',
    saving: 'جارٍ الحفظ...',
    updateGrade: 'تحديث الدرجة',
    uploadGrade: 'رفع الدرجة',
    scoreCannotExceedMax: 'لا يمكن أن تتجاوز النتيجة الدرجة القصوى',
    gradeUpdatedSuccess: 'تم تحديث الدرجة بنجاح',
    gradeUploadedSuccess: 'تم رفع الدرجة بنجاح',
    failedToSaveGrade: 'فشل في حفظ الدرجة',
    confirmDeleteGrade: 'هل أنت متأكد أنك تريد حذف هذه الدرجة؟',
    gradeDeletedSuccess: 'تم حذف الدرجة بنجاح',
    failedToDeleteGrade: 'فشل في حذف الدرجة',
    gradeAlreadyExists: 'تم إدخال درجة "{subject}" بالفعل. يرجى استخدام زر التعديل لتغييرها أو اختيار مادة أخرى.',
    alreadyEntered: 'تم الإدخال',
    
    // Students Grid
    loadingGrades: 'جارٍ تحميل الدرجات...',
    gradeEntered: 'درجة مُدخلة',
    gradesEntered: 'درجات مُدخلة',
    noGradesYet: 'لا توجد درجات بعد',
    loadingStudents: 'جارٍ تحميل الطلاب...',
    selectFormationAndGroup: 'اختر التكوين والمجموعة',
    selectFormationGroupText: 'يرجى اختيار التكوين والمجموعة لعرض الطلاب.',
    attendanceQR: 'رمز الحضور',
    autoAssigned: 'معيّن تلقائياً',
    noGroupsAvailable: 'لا توجد مجموعات متاحة لهذا التكوين',
    
    // Subject Labels Editor
    subjectNames: 'أسماء المواد',
    customize: 'تخصيص',
    save: 'حفظ',
    resetToDefaults: 'إعادة التعيين',
    subjectNamesSaved: 'تم حفظ أسماء المواد بنجاح!',
    failedToSaveSubjectNames: 'فشل في حفظ أسماء المواد',
    
    // Attendance QR
    generateAttendanceQR: 'إنشاء رمز QR للحضور',
    chooseFormation: 'اختر التكوين...',
    chooseGroup: 'اختر المجموعة...',
    group: 'المجموعة',
    classStartTime: 'وقت بداية الحصة',
    classEndTime: 'وقت نهاية الحصة',
    qrValidityMinutes: 'صلاحية QR (دقائق)',
    lateThresholdMinutes: 'حد التأخر (دقائق)',
    generating: 'جارٍ الإنشاء...',
    generateQRCode: 'إنشاء رمز QR',
    scanThisQRCode: 'امسح رمز QR هذا',
    expiresIn: 'ينتهي في',
    expired: 'منتهي الصلاحية',
    manualEntryCode: 'رمز الإدخال اليدوي',
    sessionIdCopied: 'تم نسخ معرف الجلسة!',
    copySessionId: 'نسخ معرف الجلسة',
    manualEntryNote: 'يمكن للطلاب إدخال هذا الرمز يدوياً إذا لم يتمكنوا من مسح رمز QR',
    downloadQR: 'تحميل QR',
    cancelSession: 'إلغاء الجلسة',
    cancelSessionTitle: 'إلغاء هذه الجلسة إذا تم إنشاؤها بالخطأ',
    cancelSessionConfirm: 'إلغاء جلسة الحضور هذه؟',
    cancelSessionWarning: 'سيؤدي ذلك إلى إبطال رمز QR وحذف جميع سجلات الحضور المعلقة. لا يمكن التراجع عن هذا الإجراء.',
    sessionCancelledSuccess: 'تم إلغاء الجلسة بنجاح!',
    pendingRecordsDeleted: 'سجلات معلقة تم حذفها.',
    failedToLoadGroups: 'فشل في تحميل المجموعات',
    fillAllFields: 'يرجى ملء جميع الحقول المطلوبة',
    qrGeneratedSuccess: 'تم إنشاء رمز QR بنجاح!',
    failedToCancelSession: 'فشل في إلغاء الجلسة',
    error: 'خطأ',
    
    // Batch Language Grade Modal
    testType: 'نوع الاختبار',
    miniTest: 'اختبار قصير',
    finalExam: 'الامتحان النهائي',
    testNumber: 'رقم الاختبار',
    enterAtLeastOneGrade: 'يرجى إدخال درجة واحدة على الأقل',
    successfullyUploaded: 'تم الرفع بنجاح',
    gradesCount: 'درجة/درجات',
    currentGrade: 'الحالي',
    uploading: 'جارٍ الرفع',
    uploadAllGrades: 'رفع جميع الدرجات',
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
    selectFormationAndGroup: 'Select Formation and Group',
    selectFormationGroupText: 'Please select a formation and group to view students.',
    autoAssigned: 'Auto-assigned',
    noGroupsAvailable: 'No groups available for this formation',
    loadingStudents: 'Loading students...',
    attendanceQR: 'Attendance QR',
    
    // Grade Modal
    existingGrades: 'Existing Grades',
    uploadNewGrade: 'Upload New Grade',
    editGrade: 'Edit Grade',
    cancelEdit: 'Cancel Edit',
    selectExamType: 'Select exam type',
    branchGradedOutOf20: 'Branch formations are graded out of 20',
    commentsOptional: 'Comments (Optional)',
    addCommentsPlaceholder: 'Add any comments about this grade...',
    cancel: 'Cancel',
    saving: 'Saving...',
    updateGrade: 'Update Grade',
    uploadGrade: 'Upload Grade',
    scoreCannotExceedMax: 'Score cannot be greater than max score',
    gradeUpdatedSuccess: 'Grade updated successfully',
    gradeUploadedSuccess: 'Grade uploaded successfully',
    failedToSaveGrade: 'Failed to save grade',
    confirmDeleteGrade: 'Are you sure you want to delete this grade?',
    gradeDeletedSuccess: 'Grade deleted successfully',
    failedToDeleteGrade: 'Failed to delete grade',
    gradeAlreadyExists: 'The grade for "{subject}" has already been entered. Please use the edit button to modify it, or select a different subject.',
    alreadyEntered: 'Already entered',
    
    // Students Grid
    loadingGrades: 'Loading grades...',
    gradeEntered: 'grade entered',
    gradesEntered: 'grades entered',
    noGradesYet: 'No grades yet',
    
    // Subject Labels Editor
    subjectNames: 'Subject Names',
    customize: 'Customize',
    save: 'Save',
    resetToDefaults: 'Reset to defaults',
    subjectNamesSaved: 'Subject names saved successfully!',
    failedToSaveSubjectNames: 'Failed to save subject names',
    
    // Attendance QR
    generateAttendanceQR: 'Generate Attendance QR Code',
    chooseFormation: 'Choose Formation...',
    chooseGroup: 'Choose Group...',
    group: 'Group',
    classStartTime: 'Class Start Time',
    classEndTime: 'Class End Time',
    qrValidityMinutes: 'QR Validity (minutes)',
    lateThresholdMinutes: 'Late Threshold (minutes)',
    generating: 'Generating...',
    generateQRCode: 'Generate QR Code',
    scanThisQRCode: 'Scan This QR Code',
    expiresIn: 'Expires in',
    expired: 'Expired',
    manualEntryCode: 'Manual Entry Code',
    sessionIdCopied: 'Session ID copied to clipboard!',
    copySessionId: 'Copy Session ID',
    manualEntryNote: 'Students can enter this code manually if they can\'t scan the QR code',
    downloadQR: 'Download QR',
    cancelSession: 'Cancel Session',
    cancelSessionTitle: 'Cancel this session if it was created by mistake',
    cancelSessionConfirm: 'Cancel this attendance session?',
    cancelSessionWarning: 'This will invalidate the QR code and delete all pending attendance records. This action cannot be undone.',
    sessionCancelledSuccess: 'Session cancelled successfully!',
    pendingRecordsDeleted: 'pending record(s) deleted.',
    failedToLoadGroups: 'Failed to load groups',
    fillAllFields: 'Please fill in all required fields',
    qrGeneratedSuccess: 'QR Code generated successfully!',
    failedToCancelSession: 'Failed to cancel session',
    error: 'Error',
    
    // Batch Language Grade Modal
    testType: 'Test Type',
    miniTest: 'Mini Test',
    finalExam: 'Final Exam',
    testNumber: 'Test Number',
    enterAtLeastOneGrade: 'Please enter at least one grade',
    successfullyUploaded: 'Successfully uploaded',
    gradesCount: 'grade(s)',
    currentGrade: 'Current',
    uploading: 'Uploading',
    uploadAllGrades: 'Upload All Grades',
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
    enterGrades: 'Saisir les Notes',
    selectFormationAndGroup: 'Sélectionner Formation et Groupe',
    selectFormationGroupText: 'Veuillez sélectionner une formation et un groupe pour afficher les étudiants.',
    autoAssigned: 'Attribué automatiquement',
    noGroupsAvailable: 'Aucun groupe disponible pour cette formation',
    loadingStudents: 'Chargement des étudiants...',
    attendanceQR: 'QR de Présence',
    
    // Grade Modal
    existingGrades: 'Notes Existantes',
    uploadNewGrade: 'Ajouter une Nouvelle Note',
    editGrade: 'Modifier la Note',
    cancelEdit: 'Annuler la Modification',
    selectExamType: 'Sélectionner le type d\'examen',
    branchGradedOutOf20: 'Les filières sont notées sur 20',
    commentsOptional: 'Commentaires (Facultatif)',
    addCommentsPlaceholder: 'Ajouter des commentaires sur cette note...',
    cancel: 'Annuler',
    saving: 'Enregistrement...',
    updateGrade: 'Mettre à jour la Note',
    uploadGrade: 'Télécharger la Note',
    scoreCannotExceedMax: 'Le score ne peut pas dépasser le score maximum',
    gradeUpdatedSuccess: 'Note mise à jour avec succès',
    gradeUploadedSuccess: 'Note téléchargée avec succès',
    failedToSaveGrade: 'Échec de l\'enregistrement de la note',
    confirmDeleteGrade: 'Êtes-vous sûr de vouloir supprimer cette note ?',
    gradeDeletedSuccess: 'Note supprimée avec succès',
    failedToDeleteGrade: 'Échec de la suppression de la note',
    gradeAlreadyExists: 'La note pour "{subject}" a déjà été saisie. Veuillez utiliser le bouton de modification pour la changer, ou sélectionnez une autre matière.',
    alreadyEntered: 'Déjà saisie',
    
    // Students Grid
    loadingGrades: 'Chargement des notes...',
    gradeEntered: 'note saisie',
    gradesEntered: 'notes saisies',
    noGradesYet: 'Pas encore de notes',
    
    // Subject Labels Editor
    subjectNames: 'Noms des Matières',
    customize: 'Personnaliser',
    save: 'Enregistrer',
    resetToDefaults: 'Réinitialiser',
    subjectNamesSaved: 'Noms des matières enregistrés avec succès !',
    failedToSaveSubjectNames: 'Échec de l\'enregistrement des noms de matières',
    
    // Attendance QR
    generateAttendanceQR: 'Générer le QR Code de Présence',
    chooseFormation: 'Choisir la Formation...',
    chooseGroup: 'Choisir le Groupe...',
    group: 'Groupe',
    classStartTime: 'Heure de Début du Cours',
    classEndTime: 'Heure de Fin du Cours',
    qrValidityMinutes: 'Validité du QR (minutes)',
    lateThresholdMinutes: 'Seuil de Retard (minutes)',
    generating: 'Génération en cours...',
    generateQRCode: 'Générer le QR Code',
    scanThisQRCode: 'Scanner ce QR Code',
    expiresIn: 'Expire dans',
    expired: 'Expiré',
    manualEntryCode: 'Code de Saisie Manuelle',
    sessionIdCopied: 'ID de session copié dans le presse-papiers !',
    copySessionId: 'Copier l\'ID de session',
    manualEntryNote: 'Les étudiants peuvent saisir ce code manuellement s\'ils ne peuvent pas scanner le QR code',
    downloadQR: 'Télécharger le QR',
    cancelSession: 'Annuler la Session',
    cancelSessionTitle: 'Annuler cette session si elle a été créée par erreur',
    cancelSessionConfirm: 'Annuler cette session de présence ?',
    cancelSessionWarning: 'Cela invalidera le QR code et supprimera tous les enregistrements de présence en attente. Cette action est irréversible.',
    sessionCancelledSuccess: 'Session annulée avec succès !',
    pendingRecordsDeleted: 'enregistrement(s) en attente supprimé(s).',
    failedToLoadGroups: 'Échec du chargement des groupes',
    fillAllFields: 'Veuillez remplir tous les champs obligatoires',
    qrGeneratedSuccess: 'QR Code généré avec succès !',
    failedToCancelSession: 'Échec de l\'annulation de la session',
    error: 'Erreur',
    
    // Batch Language Grade Modal
    testType: 'Type de Test',
    miniTest: 'Mini Test',
    finalExam: 'Examen Final',
    testNumber: 'Numéro de Test',
    enterAtLeastOneGrade: 'Veuillez saisir au moins une note',
    successfullyUploaded: 'Téléchargé avec succès',
    gradesCount: 'note(s)',
    currentGrade: 'Actuelle',
    uploading: 'Téléchargement',
    uploadAllGrades: 'Télécharger Toutes les Notes',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('de');

  useEffect(() => {
    // Load saved language (default to German)
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
