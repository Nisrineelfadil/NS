// Multi-language translations for Student Management System
const translations = {
    en: {
        // Sidebar Menu
        dashboard: "Dashboard",
        groups: "Groups",
        students: "Students",
        paymentReminders: "Payment Reminders",
        grades: "Grades",
        backToAdmin: "Back to Admin",
        logout: "Logout",
        
        // Dashboard
        totalGroups: "Total Groups",
        totalStudents: "Total Students",
        upcomingPayments: "Upcoming Payments",
        overduePayments: "Overdue Payments",
        overview: "Overview",
        welcomeMessage: "Welcome to the Student Management System. Use the tabs above to manage groups, students, and payment reminders.",
        
        // Groups
        groupsManagement: "Groups Management",
        createGroup: "Create Group",
        groupName: "Group Name",
        maxStudents: "Max Students",
        formation: "Formation",
        description: "Description",
        status: "Status",
        active: "Active",
        inactive: "Inactive",
        graduated: "Graduated",
        dropped: "Dropped",
        
        // Students
        studentsManagement: "Students Management",
        addStudent: "Add Student",
        exportCSV: "Export Excel",
        searchStudents: "Search students...",
        allGroups: "All Groups",
        allFormations: "All Formations",
        allPaymentStatus: "All Payment Status",
        noStudentsFound: "No Students Found",
        
        // Student Form
        fullName: "Full Name",
        group: "Group",
        phone: "Phone",
        parentPhone: "Parent Phone",
        schoolEmail: "School Email",
        emailPassword: "Email Password",
        formationChoisie: "Formation (Languages) - Select all that apply",
        filiere: "Filière (Branches) - Select all that apply",
        paymentDate: "Payment Date",
        amount: "Amount (MAD)",
        paymentStatus: "Payment Status",
        photo: "Photo",
        notes: "Notes",
        
        // Formation Options
        allemand: "Allemand (German)",
        anglais: "Anglais (English)",
        francais: "Français (French)",
        ausbildung: "Ausbildung",
        
        // Filière Options
        geriatrie: "Gériatrie",
        aideSoignant: "Aide soignant",
        agentSocioEducatif: "Agent socio éducatif",
        assistanteSociale: "Assistante sociale",
        restauration: "Restauration",
        cuisine: "Cuisine",
        informatique: "Informatique",
        gestionHoteliere: "Gestion hôtelière",
        
        // Payment Status
        paid: "Paid",
        pending: "Pending",
        overdue: "Overdue",
        
        // Actions
        view: "View",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        update: "Update",
        cancel: "Cancel",
        add: "Add",
        create: "Create",
        generate: "Generate",
        markAsPaid: "Mark as Paid",
        sendReminder: "Send Reminder",
        
        // Messages
        confirmDelete: "Are you sure you want to delete",
        successAdded: "Successfully added!",
        successUpdated: "Successfully updated!",
        successDeleted: "Successfully deleted!",
        errorOccurred: "An error occurred",
        
        // Payment Reminders
        paymentRemindersTitle: "Payment Reminders",
        dueIn15Days: "Due in 15 Days",
        dueIn7Days: "Due in 7 Days",
        dueTomorrow: "Due Tomorrow",
        student: "Student",
        paymentAmount: "Payment Amount",
        actions: "Actions",
        
        // Grades
        studentGrades: "Student Grades",
        gradesManagement: "Grades Management",
        comingSoon: "Coming Soon!",
        gradesDescription: "This section will allow you to manage student grades by group. You'll be able to view, add, and edit grades for each student in their respective courses.",
        
        // Attendance
        attendance: "Attendance",
        attendanceMonitoring: "Attendance Monitoring",
        plannedFeatures: "Planned Features:",
        viewGradesByGroup: "View grades by group",
        addGradesForStudents: "Add grades for each student",
        trackPerformance: "Track performance over time",
        exportGradeReports: "Export grade reports",
        gradeStatistics: "Grade statistics and analytics",
        
        // My Registrations
        myRegistrations: "My Registrations",
        totalCredits: "Total Credits",
        totalRegistrations: "Total Registrations",
        thisMonth: "This Month",
        registerNewStudent: "Register New Student",
        leaderboard: "Leaderboard",
        search: "Search",
        course: "Course",
        fromDate: "From Date",
        toDate: "To Date",
        allCourses: "All Courses",
        studentName: "Student Name",
        cin: "CIN",
        courses: "Courses",
        date: "Date",
        credits: "Credits",
        approved: "Approved",
        pending: "Pending",
        rejected: "Rejected",
        exportPDF: "Export PDF"
    },
    
    fr: {
        // Menu latéral
        dashboard: "Tableau de bord",
        groups: "Groupes",
        students: "Étudiants",
        paymentReminders: "Rappels de paiement",
        grades: "Notes",
        backToAdmin: "Retour à l'admin",
        logout: "Déconnexion",
        
        // Tableau de bord
        totalGroups: "Total des groupes",
        totalStudents: "Total des étudiants",
        upcomingPayments: "Paiements à venir",
        overduePayments: "Paiements en retard",
        overview: "Aperçu",
        welcomeMessage: "Bienvenue dans le système de gestion des étudiants. Utilisez les onglets ci-dessus pour gérer les groupes, les étudiants et les rappels de paiement.",
        
        // Groupes
        groupsManagement: "Gestion des groupes",
        createGroup: "Créer un groupe",
        groupName: "Nom du groupe",
        maxStudents: "Étudiants max",
        formation: "Formation",
        description: "Description",
        status: "Statut",
        active: "Actif",
        inactive: "Inactif",
        graduated: "Diplômé",
        dropped: "Abandonné",
        
        // Étudiants
        studentsManagement: "Gestion des étudiants",
        addStudent: "Ajouter un étudiant",
        exportCSV: "Exporter Excel",
        searchStudents: "Rechercher des étudiants...",
        allGroups: "Tous les groupes",
        allFormations: "Toutes les formations",
        allPaymentStatus: "Tous les statuts de paiement",
        noStudentsFound: "Aucun étudiant trouvé",
        
        // Formulaire étudiant
        fullName: "Nom complet",
        group: "Groupe",
        phone: "Téléphone",
        parentPhone: "Téléphone des parents",
        schoolEmail: "Email scolaire",
        emailPassword: "Mot de passe email",
        formationChoisie: "Formation (Langues) - Sélectionnez tout ce qui s'applique",
        filiere: "Filière (Branches) - Sélectionnez tout ce qui s'applique",
        paymentDate: "Date de paiement",
        amount: "Montant (MAD)",
        paymentStatus: "Statut de paiement",
        photo: "Photo",
        notes: "Notes",
        
        // Options de formation
        allemand: "Allemand (German)",
        anglais: "Anglais (English)",
        francais: "Français (French)",
        ausbildung: "Ausbildung",
        
        // Options de filière
        geriatrie: "Gériatrie",
        aideSoignant: "Aide soignant",
        agentSocioEducatif: "Agent socio éducatif",
        assistanteSociale: "Assistante sociale",
        restauration: "Restauration",
        cuisine: "Cuisine",
        informatique: "Informatique",
        gestionHoteliere: "Gestion hôtelière",
        
        // Statut de paiement
        paid: "Payé",
        pending: "En attente",
        overdue: "En retard",
        
        // Actions
        view: "Voir",
        edit: "Modifier",
        delete: "Supprimer",
        save: "Enregistrer",
        update: "Mettre à jour",
        cancel: "Annuler",
        add: "Ajouter",
        create: "Créer",
        generate: "Générer",
        markAsPaid: "Marquer comme payé",
        sendReminder: "Envoyer un rappel",
        
        // Messages
        confirmDelete: "Êtes-vous sûr de vouloir supprimer",
        successAdded: "Ajouté avec succès!",
        successUpdated: "Mis à jour avec succès!",
        successDeleted: "Supprimé avec succès!",
        errorOccurred: "Une erreur s'est produite",
        
        // Rappels de paiement
        paymentRemindersTitle: "Rappels de paiement",
        dueIn15Days: "Dû dans 15 jours",
        dueIn7Days: "Dû dans 7 jours",
        dueTomorrow: "Dû demain",
        student: "Étudiant",
        paymentAmount: "Montant du paiement",
        actions: "Actions",
        
        // Notes
        studentGrades: "Notes des étudiants",
        gradesManagement: "Gestion des notes",
        comingSoon: "Bientôt disponible!",
        gradesDescription: "Cette section vous permettra de gérer les notes des étudiants par groupe. Vous pourrez consulter, ajouter et modifier les notes de chaque étudiant dans leurs cours respectifs.",
        
        // Présence
        attendance: "Présence",
        attendanceMonitoring: "Suivi de présence",
        plannedFeatures: "Fonctionnalités prévues:",
        viewGradesByGroup: "Voir les notes par groupe",
        addGradesForStudents: "Ajouter des notes pour chaque étudiant",
        trackPerformance: "Suivre les performances au fil du temps",
        exportGradeReports: "Exporter les relevés de notes",
        gradeStatistics: "Statistiques et analyses des notes",
        
        // Mes inscriptions
        myRegistrations: "Mes inscriptions",
        totalCredits: "Total des crédits",
        totalRegistrations: "Total des inscriptions",
        thisMonth: "Ce mois-ci",
        registerNewStudent: "Inscrire un nouvel étudiant",
        leaderboard: "Classement",
        search: "Rechercher",
        course: "Cours",
        fromDate: "Date de début",
        toDate: "Date de fin",
        allCourses: "Tous les cours",
        studentName: "Nom de l'étudiant",
        cin: "CIN",
        courses: "Cours",
        date: "Date",
        credits: "Crédits",
        approved: "Approuvé",
        pending: "En attente",
        rejected: "Rejeté",
        exportPDF: "Exporter PDF"
    },
    
    ar: {
        // القائمة الجانبية
        dashboard: "لوحة التحكم",
        groups: "المجموعات",
        students: "الطلاب",
        paymentReminders: "تذكيرات الدفع",
        grades: "الدرجات",
        backToAdmin: "العودة للإدارة",
        logout: "تسجيل الخروج",
        
        // لوحة التحكم
        totalGroups: "إجمالي المجموعات",
        totalStudents: "إجمالي الطلاب",
        upcomingPayments: "المدفوعات القادمة",
        overduePayments: "المدفوعات المتأخرة",
        overview: "نظرة عامة",
        welcomeMessage: "مرحبًا بك في نظام إدارة الطلاب. استخدم علامات التبويب أعلاه لإدارة المجموعات والطلاب وتذكيرات الدفع.",
        
        // المجموعات
        groupsManagement: "إدارة المجموعات",
        createGroup: "إنشاء مجموعة",
        groupName: "اسم المجموعة",
        maxStudents: "الحد الأقصى للطلاب",
        formation: "التكوين",
        description: "الوصف",
        status: "الحالة",
        active: "نشط",
        inactive: "غير نشط",
        graduated: "متخرج",
        dropped: "منسحب",
        
        // الطلاب
        studentsManagement: "إدارة الطلاب",
        addStudent: "إضافة طالب",
        exportCSV: "تصدير Excel",
        searchStudents: "البحث عن الطلاب...",
        allGroups: "جميع المجموعات",
        allFormations: "جميع التكوينات",
        allPaymentStatus: "جميع حالات الدفع",
        noStudentsFound: "لم يتم العثور على طلاب",
        
        // نموذج الطالب
        fullName: "الاسم الكامل",
        group: "المجموعة",
        phone: "الهاتف",
        parentPhone: "هاتف ولي الأمر",
        schoolEmail: "البريد الإلكتروني المدرسي",
        emailPassword: "كلمة مرور البريد الإلكتروني",
        formationChoisie: "التكوين (اللغات) - حدد كل ما ينطبق",
        filiere: "الفرع (التخصصات) - حدد كل ما ينطبق",
        paymentDate: "تاريخ الدفع",
        amount: "المبلغ (درهم)",
        paymentStatus: "حالة الدفع",
        photo: "الصورة",
        notes: "ملاحظات",
        
        // خيارات التكوين
        allemand: "الألمانية (German)",
        anglais: "الإنجليزية (English)",
        francais: "الفرنسية (French)",
        ausbildung: "Ausbildung",
        
        // خيارات الفرع
        geriatrie: "طب المسنين",
        aideSoignant: "مساعد تمريض",
        agentSocioEducatif: "وكيل اجتماعي تربوي",
        assistanteSociale: "مساعدة اجتماعية",
        restauration: "المطاعم",
        cuisine: "الطبخ",
        informatique: "المعلوماتية",
        gestionHoteliere: "إدارة الفنادق",
        
        // حالة الدفع
        paid: "مدفوع",
        pending: "قيد الانتظار",
        overdue: "متأخر",
        
        // الإجراءات
        view: "عرض",
        edit: "تعديل",
        delete: "حذف",
        save: "حفظ",
        update: "تحديث",
        cancel: "إلغاء",
        add: "إضافة",
        create: "إنشاء",
        generate: "توليد",
        markAsPaid: "وضع علامة كمدفوع",
        sendReminder: "إرسال تذكير",
        
        // الرسائل
        confirmDelete: "هل أنت متأكد من أنك تريد الحذف",
        successAdded: "تمت الإضافة بنجاح!",
        successUpdated: "تم التحديث بنجاح!",
        successDeleted: "تم الحذف بنجاح!",
        errorOccurred: "حدث خطأ",
        
        // تذكيرات الدفع
        paymentRemindersTitle: "تذكيرات الدفع",
        dueIn15Days: "مستحق خلال 15 يومًا",
        dueIn7Days: "مستحق خلال 7 أيام",
        dueTomorrow: "مستحق غدًا",
        student: "الطالب",
        paymentAmount: "مبلغ الدفع",
        actions: "الإجراءات",
        
        // الدرجات
        studentGrades: "درجات الطلاب",
        gradesManagement: "إدارة الدرجات",
        comingSoon: "قريبًا!",
        gradesDescription: "سيسمح لك هذا القسم بإدارة درجات الطلاب حسب المجموعة. ستتمكن من عرض وإضافة وتعديل درجات كل طالب في دوراتهم المعنية.",
        
        // الحضور
        attendance: "الحضور",
        attendanceMonitoring: "مراقبة الحضور",
        plannedFeatures: "الميزات المخططة:",
        viewGradesByGroup: "عرض الدرجات حسب المجموعة",
        addGradesForStudents: "إضافة درجات لكل طالب",
        trackPerformance: "تتبع الأداء مع مرور الوقت",
        exportGradeReports: "تصدير تقارير الدرجات",
        gradeStatistics: "إحصائيات وتحليلات الدرجات",
        
        // تسجيلاتي
        myRegistrations: "تسجيلاتي",
        totalCredits: "إجمالي النقاط",
        totalRegistrations: "إجمالي التسجيلات",
        thisMonth: "هذا الشهر",
        registerNewStudent: "تسجيل طالب جديد",
        leaderboard: "لوحة المتصدرين",
        search: "بحث",
        course: "الدورة",
        fromDate: "من تاريخ",
        toDate: "إلى تاريخ",
        allCourses: "جميع الدورات",
        studentName: "اسم الطالب",
        cin: "رقم البطاقة",
        courses: "الدورات",
        date: "التاريخ",
        credits: "النقاط",
        approved: "موافق عليه",
        pending: "قيد الانتظار",
        rejected: "مرفوض",
        exportPDF: "تصدير PDF"
    }
};

// Get current language from localStorage or default to English
// Check both adminLanguage (from admin panel) and selectedLanguage (from student management)
function getCurrentLanguage() {
    return localStorage.getItem('adminLanguage') || localStorage.getItem('selectedLanguage') || 'en';
}

// Set current language in both keys for cross-page sync
function setCurrentLanguage(lang) {
    localStorage.setItem('selectedLanguage', lang);
    localStorage.setItem('adminLanguage', lang);
}

// Get translated text
function t(key) {
    const lang = getCurrentLanguage();
    return translations[lang]?.[key] || translations['en'][key] || key;
}

// Translate My Registrations page
function translateMyRegistrationsPage() {
    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, getCurrentLanguage, setCurrentLanguage, t, translateMyRegistrationsPage };
}
