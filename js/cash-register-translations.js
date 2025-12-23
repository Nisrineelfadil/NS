// Cash Register Translations
const translations = {
    en: {
        // Header
        title: "Cash Register",
        returnBtn: "Return To Student Management",
        logout: "Logout",
        
        // Tabs
        tabDashboard: "Dashboard",
        tabTransactions: "Transactions",
        tabYearly: "Yearly Overview",
        
        // Months
        january: "January",
        february: "February",
        march: "March",
        april: "April",
        may: "May",
        june: "June",
        july: "July",
        august: "August",
        september: "September",
        october: "October",
        november: "November",
        december: "December",
        
        // Summary Cards
        totalIncome: "Total Income",
        totalExpenses: "Total Expenses",
        netResult: "Net Result",
        profitable: "Profitable",
        loss: "Loss",
        
        // Chart Section
        chartTitle: "Financial Overview",
        chartType: "Chart Type",
        pieChart: "Pie Chart",
        barChart: "Bar Chart",
        lineChart: "Line Chart",
        filterBy: "Filter by Category",
        allCategories: "All Categories",
        
        // Insights
        insightsTitle: "Auto-Generated Insights",
        noInsights: "No insights available for this month",
        
        // Transactions
        transactionsTitle: "Transactions",
        addTransaction: "Add Transaction",
        searchPlaceholder: "Search transactions...",
        filterType: "Filter by Type",
        allTypes: "All Types",
        income: "Income",
        expense: "Expense",
        noTransactions: "No transactions found",
        
        // Transaction Table
        date: "Date",
        type: "Type",
        title: "Title",
        category: "Category",
        amount: "Amount",
        status: "Status",
        remarks: "Remarks",
        actions: "Actions",
        
        // Status
        completed: "Completed",
        pending: "Pending",
        
        // Actions
        edit: "Edit",
        delete: "Delete",
        
        // Notes
        notesTitle: "Monthly Notes",
        notesPlaceholder: "Add notes for this month...",
        saveNotes: "Save Notes",
        
        // Export
        exportPDF: "Export as PDF",
        
        // Modal
        addTransactionTitle: "Add Transaction",
        editTransactionTitle: "Edit Transaction",
        transactionTitle: "Title",
        transactionType: "Type",
        transactionAmount: "Amount (MAD)",
        transactionCategory: "Category",
        transactionDate: "Date",
        transactionStatus: "Status",
        transactionRemarks: "Remarks (Optional)",
        selectType: "Select Type",
        selectCategory: "Select Category",
        selectStatus: "Select Status",
        cancel: "Cancel",
        save: "Save",
        
        // Income Categories
        tuitionFees: "Tuition Fees",
        registrationFees: "Registration Fees",
        examFees: "Exam Fees",
        donations: "Donations",
        otherIncome: "Other Income",
        
        // Expense Categories
        salaries: "Salaries",
        rent: "Rent",
        utilities: "Utilities",
        supplies: "Supplies",
        maintenance: "Maintenance",
        transportation: "Transportation",
        marketing: "Marketing",
        insurance: "Insurance",
        taxes: "Taxes",
        otherExpenses: "Other Expenses",
        
        // Yearly Overview
        yearlyTitle: "Yearly Overview",
        totalAnnualIncome: "Total Annual Income",
        totalAnnualExpenses: "Total Annual Expenses",
        annualNetResult: "Annual Net Result",
        cashFlowTimeline: "Cash Flow Timeline",
        from: "From",
        to: "To",
        reset: "Reset",
        
        // Messages
        deleteConfirm: "Are you sure you want to delete this transaction?",
        deleteSuccess: "Transaction deleted successfully",
        saveSuccess: "Transaction saved successfully",
        notesSuccess: "Notes saved successfully",
        error: "An error occurred",
        
        // Validation
        required: "This field is required",
        invalidAmount: "Please enter a valid amount",
        
        // Overlapping
        tabOverlapping: "Overlapping",
        unpaidServices: "Unpaid Services",
        paidServices: "Paid Services",
        totalPending: "Total Pending",
        addUnpaidService: "Add Unpaid Service",
        editUnpaidService: "Edit Unpaid Service",
        clientName: "Client Name",
        phone: "Phone",
        serviceType: "Service Type",
        dateRequested: "Date Requested",
        age: "Age",
        description: "Description",
        descriptionPlaceholder: "Additional details about the service...",
        selectService: "Select Service",
        searchNamePhone: "Search by name or phone...",
        allStatus: "All Status",
        unpaid: "Unpaid",
        paid: "Paid",
        cancelled: "Cancelled",
        markAsPaid: "Mark as Paid",
        call: "Call",
        cancelService: "Cancel Service",
        noServicesFound: "No services found",
        serviceAdded: "Service added successfully",
        serviceUpdated: "Service updated successfully",
        serviceDeleted: "Service deleted successfully",
        serviceCancelled: "Service cancelled successfully",
        markedAsPaid: "Service marked as paid and income recorded",
        confirmMarkPaid: "Mark this service as paid? This will create an income transaction.",
        confirmCancelService: "Cancel this service? The client will not be charged.",
        confirmDeleteService: "Delete this service record permanently?",
        loadingServices: "Loading services...",
        
        // Receipt
        viewReceipt: "View Receipt",
        downloadReceipt: "Download Receipt",
        uploadReceipt: "Upload Receipt",
        deleteReceipt: "Delete Receipt",
        receipt: "Receipt",
        fileName: "File Name",
        uploadedBy: "Uploaded By",
        uploadedAt: "Uploaded At",
        loadingReceipt: "Loading receipt...",
        dragDropReceipt: "Drag & drop receipt image here",
        orClickToSelect: "or click to select file",
        receiptUploadNote: "Supported formats: JPEG, PNG, PDF. Max size: 5MB. Images will be optimized automatically.",
        upload: "Upload",
        uploading: "Uploading...",
        close: "Close",
        receiptUploaded: "Receipt uploaded successfully",
        receiptDeleted: "Receipt deleted successfully",
        receiptNotFound: "No receipt found",
        uploadFailed: "Failed to upload receipt",
        downloadFailed: "Failed to download receipt",
        loadReceiptFailed: "Failed to load receipt",
        deleteFailed: "Failed to delete",
        confirmDeleteReceipt: "Delete this receipt? The transaction will not be deleted.",
        invalidFileType: "Invalid file type. Only JPEG, PNG, and PDF are allowed.",
        fileTooLarge: "File too large. Maximum size is 5MB.",
        noFileSelected: "No file selected"
    },
    
    fr: {
        // Header
        title: "Caisse Enregistreuse",
        returnBtn: "Retour à la Gestion des Étudiants",
        logout: "Déconnexion",
        
        // Tabs
        tabDashboard: "Tableau de Bord",
        tabTransactions: "Transactions",
        tabYearly: "Vue Annuelle",
        
        // Months
        january: "Janvier",
        february: "Février",
        march: "Mars",
        april: "Avril",
        may: "Mai",
        june: "Juin",
        july: "Juillet",
        august: "Août",
        september: "Septembre",
        october: "Octobre",
        november: "Novembre",
        december: "Décembre",
        
        // Summary Cards
        totalIncome: "Revenu Total",
        totalExpenses: "Dépenses Totales",
        netResult: "Résultat Net",
        profitable: "Rentable",
        loss: "Perte",
        
        // Chart Section
        chartTitle: "Aperçu Financier",
        chartType: "Type de Graphique",
        pieChart: "Graphique Circulaire",
        barChart: "Graphique à Barres",
        lineChart: "Graphique Linéaire",
        filterBy: "Filtrer par Catégorie",
        allCategories: "Toutes les Catégories",
        
        // Insights
        insightsTitle: "Analyses Automatiques",
        noInsights: "Aucune analyse disponible pour ce mois",
        
        // Transactions
        transactionsTitle: "Transactions",
        addTransaction: "Ajouter une Transaction",
        searchPlaceholder: "Rechercher des transactions...",
        filterType: "Filtrer par Type",
        allTypes: "Tous les Types",
        income: "Revenu",
        expense: "Dépense",
        noTransactions: "Aucune transaction trouvée",
        
        // Transaction Table
        date: "Date",
        type: "Type",
        title: "Titre",
        category: "Catégorie",
        amount: "Montant",
        status: "Statut",
        remarks: "Remarques",
        actions: "Actions",
        
        // Status
        completed: "Terminé",
        pending: "En Attente",
        
        // Actions
        edit: "Modifier",
        delete: "Supprimer",
        
        // Notes
        notesTitle: "Notes Mensuelles",
        notesPlaceholder: "Ajouter des notes pour ce mois...",
        saveNotes: "Enregistrer les Notes",
        
        // Export
        exportPDF: "Exporter en PDF",
        
        // Modal
        addTransactionTitle: "Ajouter une Transaction",
        editTransactionTitle: "Modifier la Transaction",
        transactionTitle: "Titre",
        transactionType: "Type",
        transactionAmount: "Montant (MAD)",
        transactionCategory: "Catégorie",
        transactionDate: "Date",
        transactionStatus: "Statut",
        transactionRemarks: "Remarques (Optionnel)",
        selectType: "Sélectionner le Type",
        selectCategory: "Sélectionner la Catégorie",
        selectStatus: "Sélectionner le Statut",
        cancel: "Annuler",
        save: "Enregistrer",
        
        // Income Categories
        tuitionFees: "Frais de Scolarité",
        registrationFees: "Frais d'Inscription",
        examFees: "Frais d'Examen",
        donations: "Dons",
        otherIncome: "Autres Revenus",
        
        // Expense Categories
        salaries: "Salaires",
        rent: "Loyer",
        utilities: "Services Publics",
        supplies: "Fournitures",
        maintenance: "Maintenance",
        transportation: "Transport",
        marketing: "Marketing",
        insurance: "Assurance",
        taxes: "Impôts",
        otherExpenses: "Autres Dépenses",
        
        // Yearly Overview
        yearlyTitle: "Vue Annuelle",
        totalAnnualIncome: "Revenu Annuel Total",
        totalAnnualExpenses: "Dépenses Annuelles Totales",
        annualNetResult: "Résultat Net Annuel",
        cashFlowTimeline: "Chronologie des Flux de Trésorerie",
        from: "De",
        to: "À",
        reset: "Réinitialiser",
        
        // Messages
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette transaction?",
        deleteSuccess: "Transaction supprimée avec succès",
        saveSuccess: "Transaction enregistrée avec succès",
        notesSuccess: "Notes enregistrées avec succès",
        error: "Une erreur s'est produite",
        
        // Validation
        required: "Ce champ est obligatoire",
        invalidAmount: "Veuillez entrer un montant valide",
        
        // Overlapping
        tabOverlapping: "Recouvrement",
        unpaidServices: "Services Impayés",
        paidServices: "Services Payés",
        totalPending: "Total en Attente",
        addUnpaidService: "Ajouter un Service Impayé",
        editUnpaidService: "Modifier le Service Impayé",
        clientName: "Nom du Client",
        phone: "Téléphone",
        serviceType: "Type de Service",
        dateRequested: "Date Demandée",
        age: "Âge",
        description: "Description",
        descriptionPlaceholder: "Détails supplémentaires sur le service...",
        selectService: "Sélectionner le Service",
        searchNamePhone: "Rechercher par nom ou téléphone...",
        allStatus: "Tous les Statuts",
        unpaid: "Impayé",
        paid: "Payé",
        cancelled: "Annulé",
        markAsPaid: "Marquer comme Payé",
        call: "Appeler",
        cancelService: "Annuler le Service",
        noServicesFound: "Aucun service trouvé",
        serviceAdded: "Service ajouté avec succès",
        serviceUpdated: "Service mis à jour avec succès",
        serviceDeleted: "Service supprimé avec succès",
        serviceCancelled: "Service annulé avec succès",
        markedAsPaid: "Service marqué comme payé et revenu enregistré",
        confirmMarkPaid: "Marquer ce service comme payé? Cela créera une transaction de revenu.",
        confirmCancelService: "Annuler ce service? Le client ne sera pas facturé.",
        confirmDeleteService: "Supprimer définitivement cet enregistrement de service?",
        loadingServices: "Chargement des services...",
        
        // Receipt
        viewReceipt: "Voir le Reçu",
        downloadReceipt: "Télécharger le Reçu",
        uploadReceipt: "Téléverser le Reçu",
        deleteReceipt: "Supprimer le Reçu",
        receipt: "Reçu",
        fileName: "Nom du Fichier",
        uploadedBy: "Téléversé Par",
        uploadedAt: "Téléversé Le",
        loadingReceipt: "Chargement du reçu...",
        dragDropReceipt: "Glissez-déposez l'image du reçu ici",
        orClickToSelect: "ou cliquez pour sélectionner un fichier",
        receiptUploadNote: "Formats supportés: JPEG, PNG, PDF. Taille max: 5Mo. Les images seront optimisées automatiquement.",
        upload: "Téléverser",
        uploading: "Téléversement...",
        close: "Fermer",
        receiptUploaded: "Reçu téléversé avec succès",
        receiptDeleted: "Reçu supprimé avec succès",
        receiptNotFound: "Aucun reçu trouvé",
        uploadFailed: "Échec du téléversement",
        downloadFailed: "Échec du téléchargement",
        loadReceiptFailed: "Échec du chargement du reçu",
        deleteFailed: "Échec de la suppression",
        confirmDeleteReceipt: "Supprimer ce reçu? La transaction ne sera pas supprimée.",
        invalidFileType: "Type de fichier invalide. Seuls JPEG, PNG et PDF sont autorisés.",
        fileTooLarge: "Fichier trop volumineux. Taille maximale: 5Mo.",
        noFileSelected: "Aucun fichier sélectionné"
    },
    
    ar: {
        // Header
        title: "سجل النقدية",
        returnBtn: "العودة إلى إدارة الطلاب",
        logout: "تسجيل الخروج",
        
        // Tabs
        tabDashboard: "لوحة التحكم",
        tabTransactions: "المعاملات",
        tabYearly: "النظرة السنوية",
        
        // Months
        january: "يناير",
        february: "فبراير",
        march: "مارس",
        april: "أبريل",
        may: "مايو",
        june: "يونيو",
        july: "يوليو",
        august: "أغسطس",
        september: "سبتمبر",
        october: "أكتوبر",
        november: "نوفمبر",
        december: "ديسمبر",
        
        // Summary Cards
        totalIncome: "إجمالي الدخل",
        totalExpenses: "إجمالي المصروفات",
        netResult: "النتيجة الصافية",
        profitable: "مربح",
        loss: "خسارة",
        
        // Chart Section
        chartTitle: "النظرة المالية",
        chartType: "نوع الرسم البياني",
        pieChart: "رسم بياني دائري",
        barChart: "رسم بياني شريطي",
        lineChart: "رسم بياني خطي",
        filterBy: "تصفية حسب الفئة",
        allCategories: "جميع الفئات",
        
        // Insights
        insightsTitle: "رؤى تلقائية",
        noInsights: "لا توجد رؤى متاحة لهذا الشهر",
        
        // Transactions
        transactionsTitle: "المعاملات",
        addTransaction: "إضافة معاملة",
        searchPlaceholder: "البحث عن المعاملات...",
        filterType: "تصفية حسب النوع",
        allTypes: "جميع الأنواع",
        income: "دخل",
        expense: "مصروف",
        noTransactions: "لم يتم العثور على معاملات",
        
        // Transaction Table
        date: "التاريخ",
        type: "النوع",
        title: "العنوان",
        category: "الفئة",
        amount: "المبلغ",
        status: "الحالة",
        remarks: "ملاحظات",
        actions: "الإجراءات",
        
        // Status
        completed: "مكتمل",
        pending: "قيد الانتظار",
        
        // Actions
        edit: "تعديل",
        delete: "حذف",
        
        // Notes
        notesTitle: "ملاحظات شهرية",
        notesPlaceholder: "إضافة ملاحظات لهذا الشهر...",
        saveNotes: "حفظ الملاحظات",
        
        // Export
        exportPDF: "تصدير كـ PDF",
        
        // Modal
        addTransactionTitle: "إضافة معاملة",
        editTransactionTitle: "تعديل المعاملة",
        transactionTitle: "العنوان",
        transactionType: "النوع",
        transactionAmount: "المبلغ (درهم)",
        transactionCategory: "الفئة",
        transactionDate: "التاريخ",
        transactionStatus: "الحالة",
        transactionRemarks: "ملاحظات (اختياري)",
        selectType: "اختر النوع",
        selectCategory: "اختر الفئة",
        selectStatus: "اختر الحالة",
        cancel: "إلغاء",
        save: "حفظ",
        
        // Income Categories
        tuitionFees: "رسوم دراسية",
        registrationFees: "رسوم التسجيل",
        examFees: "رسوم الامتحانات",
        donations: "تبرعات",
        otherIncome: "دخل آخر",
        
        // Expense Categories
        salaries: "رواتب",
        rent: "إيجار",
        utilities: "مرافق",
        supplies: "مستلزمات",
        maintenance: "صيانة",
        transportation: "نقل",
        marketing: "تسويق",
        insurance: "تأمين",
        taxes: "ضرائب",
        otherExpenses: "مصروفات أخرى",
        
        // Yearly Overview
        yearlyTitle: "النظرة السنوية",
        totalAnnualIncome: "إجمالي الدخل السنوي",
        totalAnnualExpenses: "إجمالي المصروفات السنوية",
        annualNetResult: "النتيجة الصافية السنوية",
        cashFlowTimeline: "الجدول الزمني للتدفق النقدي",
        from: "من",
        to: "إلى",
        reset: "إعادة تعيين",
        
        // Messages
        deleteConfirm: "هل أنت متأكد من حذف هذه المعاملة؟",
        deleteSuccess: "تم حذف المعاملة بنجاح",
        saveSuccess: "تم حفظ المعاملة بنجاح",
        notesSuccess: "تم حفظ الملاحظات بنجاح",
        error: "حدث خطأ",
        
        // Validation
        required: "هذا الحقل مطلوب",
        invalidAmount: "الرجاء إدخال مبلغ صحيح",
        
        // Overlapping
        tabOverlapping: "التداخل",
        unpaidServices: "خدمات غير مدفوعة",
        paidServices: "خدمات مدفوعة",
        totalPending: "إجمالي المعلق",
        addUnpaidService: "إضافة خدمة غير مدفوعة",
        editUnpaidService: "تعديل الخدمة غير المدفوعة",
        clientName: "اسم العميل",
        phone: "الهاتف",
        serviceType: "نوع الخدمة",
        dateRequested: "تاريخ الطلب",
        age: "العمر",
        description: "الوصف",
        descriptionPlaceholder: "تفاصيل إضافية عن الخدمة...",
        selectService: "اختر الخدمة",
        searchNamePhone: "البحث بالاسم أو الهاتف...",
        allStatus: "جميع الحالات",
        unpaid: "غير مدفوع",
        paid: "مدفوع",
        cancelled: "ملغى",
        markAsPaid: "وضع علامة كمدفوع",
        call: "اتصال",
        cancelService: "إلغاء الخدمة",
        noServicesFound: "لم يتم العثور على خدمات",
        serviceAdded: "تمت إضافة الخدمة بنجاح",
        serviceUpdated: "تم تحديث الخدمة بنجاح",
        serviceDeleted: "تم حذف الخدمة بنجاح",
        serviceCancelled: "تم إلغاء الخدمة بنجاح",
        markedAsPaid: "تم وضع علامة على الخدمة كمدفوعة وتسجيل الدخل",
        confirmMarkPaid: "وضع علامة على هذه الخدمة كمدفوعة؟ سيؤدي هذا إلى إنشاء معاملة دخل.",
        confirmCancelService: "إلغاء هذه الخدمة؟ لن يتم تحصيل رسوم من العميل.",
        confirmDeleteService: "حذف سجل الخدمة هذا نهائياً؟",
        loadingServices: "جاري تحميل الخدمات...",
        
        // Receipt
        viewReceipt: "عرض الإيصال",
        downloadReceipt: "تحميل الإيصال",
        uploadReceipt: "رفع الإيصال",
        deleteReceipt: "حذف الإيصال",
        receipt: "إيصال",
        fileName: "اسم الملف",
        uploadedBy: "رفع بواسطة",
        uploadedAt: "تاريخ الرفع",
        loadingReceipt: "جاري تحميل الإيصال...",
        dragDropReceipt: "اسحب وأفلت صورة الإيصال هنا",
        orClickToSelect: "أو انقر لاختيار ملف",
        receiptUploadNote: "الصيغ المدعومة: JPEG، PNG، PDF. الحد الأقصى: 5 ميجابايت. سيتم تحسين الصور تلقائياً.",
        upload: "رفع",
        uploading: "جاري الرفع...",
        close: "إغلاق",
        receiptUploaded: "تم رفع الإيصال بنجاح",
        receiptDeleted: "تم حذف الإيصال بنجاح",
        receiptNotFound: "لم يتم العثور على إيصال",
        uploadFailed: "فشل رفع الإيصال",
        downloadFailed: "فشل تحميل الإيصال",
        loadReceiptFailed: "فشل تحميل الإيصال",
        deleteFailed: "فشل الحذف",
        confirmDeleteReceipt: "حذف هذا الإيصال؟ لن يتم حذف المعاملة.",
        invalidFileType: "نوع ملف غير صالح. يُسمح فقط بـ JPEG و PNG و PDF.",
        fileTooLarge: "الملف كبير جداً. الحد الأقصى 5 ميجابايت.",
        noFileSelected: "لم يتم اختيار ملف"
    },
    
    de: {
        // Header
        title: "Kasse",
        returnBtn: "Zurück zur Studentenverwaltung",
        logout: "Abmelden",
        
        // Tabs
        tabDashboard: "Dashboard",
        tabTransactions: "Transaktionen",
        tabYearly: "Jahresübersicht",
        
        // Months
        january: "Januar",
        february: "Februar",
        march: "März",
        april: "April",
        may: "Mai",
        june: "Juni",
        july: "Juli",
        august: "August",
        september: "September",
        october: "Oktober",
        november: "November",
        december: "Dezember",
        
        // Summary Cards
        totalIncome: "Gesamteinnahmen",
        totalExpenses: "Gesamtausgaben",
        netResult: "Nettoergebnis",
        profitable: "Rentabel",
        loss: "Verlust",
        
        // Chart Section
        chartTitle: "Finanzübersicht",
        chartType: "Diagrammtyp",
        pieChart: "Kreisdiagramm",
        barChart: "Balkendiagramm",
        lineChart: "Liniendiagramm",
        filterBy: "Nach Kategorie filtern",
        allCategories: "Alle Kategorien",
        
        // Insights
        insightsTitle: "Automatische Erkenntnisse",
        noInsights: "Keine Erkenntnisse für diesen Monat verfügbar",
        
        // Transactions
        transactionsTitle: "Transaktionen",
        addTransaction: "Transaktion hinzufügen",
        searchPlaceholder: "Transaktionen suchen...",
        filterType: "Nach Typ filtern",
        allTypes: "Alle Typen",
        income: "Einnahmen",
        expense: "Ausgaben",
        noTransactions: "Keine Transaktionen gefunden",
        
        // Transaction Table
        date: "Datum",
        type: "Typ",
        title: "Titel",
        category: "Kategorie",
        amount: "Betrag",
        status: "Status",
        remarks: "Bemerkungen",
        actions: "Aktionen",
        
        // Status
        completed: "Abgeschlossen",
        pending: "Ausstehend",
        
        // Actions
        edit: "Bearbeiten",
        delete: "Löschen",
        
        // Notes
        notesTitle: "Monatliche Notizen",
        notesPlaceholder: "Notizen für diesen Monat hinzufügen...",
        saveNotes: "Notizen speichern",
        
        // Export
        exportPDF: "Als PDF exportieren",
        
        // Modal
        addTransactionTitle: "Transaktion hinzufügen",
        editTransactionTitle: "Transaktion bearbeiten",
        transactionTitle: "Titel",
        transactionType: "Typ",
        transactionAmount: "Betrag (MAD)",
        transactionCategory: "Kategorie",
        transactionDate: "Datum",
        transactionStatus: "Status",
        transactionRemarks: "Bemerkungen (Optional)",
        selectType: "Typ auswählen",
        selectCategory: "Kategorie auswählen",
        selectStatus: "Status auswählen",
        cancel: "Abbrechen",
        save: "Speichern",
        
        // Income Categories
        tuitionFees: "Studiengebühren",
        registrationFees: "Anmeldegebühren",
        examFees: "Prüfungsgebühren",
        donations: "Spenden",
        otherIncome: "Sonstige Einnahmen",
        
        // Expense Categories
        salaries: "Gehälter",
        rent: "Miete",
        utilities: "Nebenkosten",
        supplies: "Verbrauchsmaterialien",
        maintenance: "Wartung",
        transportation: "Transport",
        marketing: "Marketing",
        insurance: "Versicherung",
        taxes: "Steuern",
        otherExpenses: "Sonstige Ausgaben",
        
        // Yearly Overview
        yearlyTitle: "Jahresübersicht",
        totalAnnualIncome: "Gesamtjahreseinnahmen",
        totalAnnualExpenses: "Gesamtjahresausgaben",
        annualNetResult: "Jährliches Nettoergebnis",
        cashFlowTimeline: "Cashflow-Zeitachse",
        from: "Von",
        to: "Bis",
        reset: "Zurücksetzen",
        
        // Messages
        deleteConfirm: "Möchten Sie diese Transaktion wirklich löschen?",
        deleteSuccess: "Transaktion erfolgreich gelöscht",
        saveSuccess: "Transaktion erfolgreich gespeichert",
        notesSuccess: "Notizen erfolgreich gespeichert",
        error: "Ein Fehler ist aufgetreten",
        
        // Validation
        required: "Dieses Feld ist erforderlich",
        invalidAmount: "Bitte geben Sie einen gültigen Betrag ein",
        
        // Overlapping
        tabOverlapping: "Überlappung",
        unpaidServices: "Unbezahlte Dienste",
        paidServices: "Bezahlte Dienste",
        totalPending: "Gesamt Ausstehend",
        addUnpaidService: "Unbezahlten Dienst hinzufügen",
        editUnpaidService: "Unbezahlten Dienst bearbeiten",
        clientName: "Kundenname",
        phone: "Telefon",
        serviceType: "Diensttyp",
        dateRequested: "Anfragedatum",
        age: "Alter",
        description: "Beschreibung",
        descriptionPlaceholder: "Zusätzliche Details zum Dienst...",
        selectService: "Dienst auswählen",
        searchNamePhone: "Nach Name oder Telefon suchen...",
        allStatus: "Alle Status",
        unpaid: "Unbezahlt",
        paid: "Bezahlt",
        cancelled: "Storniert",
        markAsPaid: "Als bezahlt markieren",
        call: "Anrufen",
        cancelService: "Dienst stornieren",
        noServicesFound: "Keine Dienste gefunden",
        serviceAdded: "Dienst erfolgreich hinzugefügt",
        serviceUpdated: "Dienst erfolgreich aktualisiert",
        serviceDeleted: "Dienst erfolgreich gelöscht",
        serviceCancelled: "Dienst erfolgreich storniert",
        markedAsPaid: "Dienst als bezahlt markiert und Einnahme erfasst",
        confirmMarkPaid: "Diesen Dienst als bezahlt markieren? Dies erstellt eine Einnahmetransaktion.",
        confirmCancelService: "Diesen Dienst stornieren? Der Kunde wird nicht belastet.",
        confirmDeleteService: "Diesen Diensteintrag dauerhaft löschen?",
        loadingServices: "Dienste werden geladen...",
        
        // Receipt
        viewReceipt: "Beleg Anzeigen",
        downloadReceipt: "Beleg Herunterladen",
        uploadReceipt: "Beleg Hochladen",
        deleteReceipt: "Beleg Löschen",
        receipt: "Beleg",
        fileName: "Dateiname",
        uploadedBy: "Hochgeladen Von",
        uploadedAt: "Hochgeladen Am",
        loadingReceipt: "Beleg wird geladen...",
        dragDropReceipt: "Belegbild hier ablegen",
        orClickToSelect: "oder klicken zum Auswählen",
        receiptUploadNote: "Unterstützte Formate: JPEG, PNG, PDF. Max. Größe: 5MB. Bilder werden automatisch optimiert.",
        upload: "Hochladen",
        uploading: "Wird hochgeladen...",
        close: "Schließen",
        receiptUploaded: "Beleg erfolgreich hochgeladen",
        receiptDeleted: "Beleg erfolgreich gelöscht",
        receiptNotFound: "Kein Beleg gefunden",
        uploadFailed: "Hochladen fehlgeschlagen",
        downloadFailed: "Herunterladen fehlgeschlagen",
        loadReceiptFailed: "Beleg konnte nicht geladen werden",
        deleteFailed: "Löschen fehlgeschlagen",
        confirmDeleteReceipt: "Diesen Beleg löschen? Die Transaktion wird nicht gelöscht.",
        invalidFileType: "Ungültiger Dateityp. Nur JPEG, PNG und PDF sind erlaubt.",
        fileTooLarge: "Datei zu groß. Maximale Größe ist 5MB.",
        noFileSelected: "Keine Datei ausgewählt"
    }
};

// Current language
let currentLanguage = localStorage.getItem('cashRegisterLanguage') || 'de';

// Translate function
function translate(key) {
    return translations[currentLanguage][key] || translations['en'][key] || key;
}

// Update all translations on page
function updatePageTranslations() {
    // Update all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = translate(key);
        
        // Handle different element types
        if (element.tagName === 'OPTION') {
            element.textContent = translation;
        } else if (element.tagName === 'SPAN' || element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3' || element.tagName === 'H4') {
            element.textContent = translation;
        } else {
            element.textContent = translation;
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        element.placeholder = translate(key);
    });
    
    // Update month select options
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) {
        const months = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
        Array.from(monthSelect.options).forEach((option, index) => {
            option.textContent = translate(months[index]);
        });
    }
    
    // Update start/end month selects in yearly overview
    const startMonthSelect = document.getElementById('startMonthSelect');
    const endMonthSelect = document.getElementById('endMonthSelect');
    if (startMonthSelect && endMonthSelect) {
        const months = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
        [startMonthSelect, endMonthSelect].forEach(select => {
            Array.from(select.options).forEach((option, index) => {
                option.textContent = translate(months[index]);
            });
        });
    }
    
    // Update current language display
    const langMap = { en: 'EN', fr: 'FR', ar: 'AR', de: 'DE' };
    const currentLangEl = document.getElementById('currentLang');
    if (currentLangEl) {
        currentLangEl.textContent = langMap[currentLanguage];
    }
    
    // Update body direction for Arabic
    document.body.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    
    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage;
}

// Change language
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('cashRegisterLanguage', lang);
    updatePageTranslations();
    toggleLanguageDropdown();
    
    // Reload data to update dynamic content
    if (typeof loadMonthData === 'function') {
        loadMonthData();
    }
}

// Toggle language dropdown
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('langDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const langSelector = document.querySelector('.language-selector');
    if (langSelector && !langSelector.contains(event.target)) {
        document.getElementById('langDropdown')?.classList.remove('show');
    }
});

// Return to student management
function returnToStudentManagement() {
    window.location.href = '/student-management';
}

// Initialize translations immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        updatePageTranslations();
    });
} else {
    // DOM already loaded
    updatePageTranslations();
}

// Also update when the page becomes visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        updatePageTranslations();
    }
});
