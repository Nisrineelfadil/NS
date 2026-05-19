/**
 * Generate Student Registration Guide PDF
 * 
 * Creates a multi-language PDF guide (FR/DE/AR/EN) with screenshots
 * showing admins how to register students in the Nisrine School system.
 * 
 * Usage: node scripts/generate-student-guide.js
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ─── Paths ───────────────────────────────────────────────────────────────────

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'Students_Data_2025-2026', 'guide-screenshots');
const OUTPUT_DIR = path.join(__dirname, '..', 'Documents');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'Guide_Inscription_Etudiants_Nisrine_School.pdf');
const ARIAL_FONT = 'C:\\Windows\\Fonts\\arial.ttf';
const ARIAL_BOLD = 'C:\\Windows\\Fonts\\arialbd.ttf';
const ARIAL_ITALIC = 'C:\\Windows\\Fonts\\ariali.ttf';

// ─── Screenshot files ────────────────────────────────────────────────────────

const SCREENSHOTS = {
    login: path.join(SCREENSHOTS_DIR, '01-login.png'),
    dashboard: path.join(SCREENSHOTS_DIR, '02-dashboard.png'),
    studentMenu: path.join(SCREENSHOTS_DIR, '03-student-menu.png'),
    addButton: path.join(SCREENSHOTS_DIR, '04-add-student-button.png'),
    formTop: path.join(SCREENSHOTS_DIR, '05-form-top.png'),
    photoCin: path.join(SCREENSHOTS_DIR, '06-Student Photo+CIN Card (ID Card).png'),
    academic: path.join(SCREENSHOTS_DIR, '07-Academic Information.png'),
    credentials: path.join(SCREENSHOTS_DIR, '08-Account Credentials+Pack+Payment Information.png'),
    buttons: path.join(SCREENSHOTS_DIR, '09-Create Student_Cancel_Reset Form.png'),
};

// ─── Colors ──────────────────────────────────────────────────────────────────

const COLORS = {
    primary: '#4A26AB',      // Purple (matches app header)
    secondary: '#F5A623',    // Orange/Gold (matches app accent)
    dark: '#1a1a2e',
    text: '#333333',
    lightText: '#666666',
    white: '#FFFFFF',
    lightBg: '#F8F9FA',
    success: '#28a745',
    info: '#17a2b8',
    warning: '#ffc107',
    frFlag: '#0055A4',
    deFlag: '#000000',
    arFlag: '#006233',
    enFlag: '#003078',
    stepBg: '#EDE7F6',
    tipBg: '#FFF3E0',
};

// ─── Content in 4 Languages ─────────────────────────────────────────────────

const CONTENT = {
    fr: {
        langLabel: 'FRANÇAIS',
        flagColor: COLORS.frFlag,
        title: 'Guide d\'Inscription des Étudiants',
        subtitle: 'Système de Gestion - Nisrine School',
        toc: 'Table des Matières',
        steps: [
            {
                title: 'Étape 1 : Connexion au Système',
                screenshot: 'login',
                instructions: [
                    'Ouvrez votre navigateur et allez sur : nisrineschool.com/admin',
                    'Entrez votre nom d\'utilisateur (Username) dans le premier champ.',
                    'Entrez votre mot de passe (Password) dans le deuxième champ.',
                    'Cliquez sur le bouton orange "Login" pour vous connecter.',
                ],
                tip: 'Si vous avez oublié vos identifiants, contactez le développeur ou le super administrateur.',
            },
            {
                title: 'Étape 2 : Tableau de Bord',
                screenshot: 'dashboard',
                instructions: [
                    'Après connexion, vous verrez le Tableau de bord avec les statistiques.',
                    'Dans le menu à gauche, section "MANAGEMENT", cliquez sur "Étudiants".',
                    'Cela vous amènera à la page de Gestion des Étudiants.',
                ],
                tip: null,
            },
            {
                title: 'Étape 3 : Page de Gestion des Étudiants',
                screenshot: 'studentMenu',
                instructions: [
                    'Vous voyez maintenant la page "Gestion des étudiants".',
                    'En haut à droite, vous trouverez le bouton orange "+ Ajouter un étudiant".',
                    'Cliquez dessus pour ouvrir le formulaire d\'inscription.',
                ],
                tip: null,
            },
            {
                title: 'Étape 4 : Cliquer sur "Ajouter un Étudiant"',
                screenshot: 'addButton',
                instructions: [
                    'Cliquez sur le bouton orange "+ Ajouter un étudiant" en haut à droite.',
                    'Un formulaire complet s\'ouvrira pour saisir les informations de l\'étudiant.',
                ],
                tip: null,
            },
            {
                title: 'Étape 5 : Informations Personnelles',
                screenshot: 'formTop',
                instructions: [
                    'Nom Complet * — Entrez le nom complet de l\'étudiant (obligatoire).',
                    'Date de Naissance * — Sélectionnez la date au format jj/mm/aaaa (obligatoire).',
                    'Email — Email personnel de l\'étudiant (optionnel).',
                    'School Email * — Généré automatiquement à partir du nom.',
                    'Phone Number * — Numéro de téléphone marocain (format : 06XXXXXXXX) (obligatoire).',
                    'Parent Phone * — Numéro du parent/tuteur (format : 06XXXXXXXX) (obligatoire).',
                    'Address — Adresse de l\'étudiant (optionnel).',
                    'CIN (ID Number) — Numéro de la carte d\'identité nationale (optionnel).',
                    'City / District — Ville ou quartier (optionnel).',
                    'Study Level — Sélectionnez le niveau d\'études dans le menu déroulant.',
                ],
                tip: 'Les champs marqués d\'un astérisque (*) sont obligatoires. Le numéro de téléphone doit commencer par 05, 06 ou 07 suivi de 8 chiffres.',
            },
            {
                title: 'Étape 6 : Photo & Carte CIN',
                screenshot: 'photoCin',
                instructions: [
                    'Student Photo — Cliquez sur la zone pour télécharger une photo (JPG ou PNG, max 5 Mo).',
                    'CIN Card (ID Card) — Téléchargez le recto et le verso de la CIN.',
                    'Si l\'étudiant n\'a pas sa CIN aujourd\'hui, cochez la case "Add now & add later".',
                    'Formats acceptés : JPEG, PNG, PDF (max 2 Mo par côté).',
                ],
                tip: 'La photo doit être claire et récente. Les images seront automatiquement optimisées.',
            },
            {
                title: 'Étape 7 : Informations Académiques',
                screenshot: 'academic',
                instructions: [
                    'Season * — Sélectionnez la saison active (ex : 2025-2026).',
                    'Group * — Sélectionnez le groupe de l\'étudiant.',
                    'Language Formation — Cochez la/les langue(s) choisie(s) :',
                    '    ☐ Allemand (German)  ☐ Anglais (English)',
                    '    ☐ Français (French)  ☐ Ausbildung',
                    'Branch/Subject (Filière) — Cochez si applicable :',
                    '    ☐ Gériatrie  ☐ Aide soignant  ☐ Agent socio éducatif',
                    '    ☐ Assistante sociale  ☐ Restauration  ☐ Cuisine',
                    '    ☐ Informatique  ☐ Gestion hôtelière',
                ],
                tip: 'Vous devez sélectionner au moins une langue OU une filière. L\'étudiant peut choisir uniquement une langue, uniquement une filière, ou les deux.',
            },
            {
                title: 'Étape 8 : Identifiants & Paiement',
                screenshot: 'credentials',
                instructions: [
                    'Email Password * — Cliquez sur "Generate" pour créer un mot de passe automatiquement.',
                    'Pack — Sélectionnez le plan de paiement :',
                    '    ● P.M (Mensuel)  ○ Trimestre  ○ P.Semestriel  ○ P.Annuel',
                    'Payment Date * — Sélectionnez la date du prochain paiement.',
                    'Payment Amount * — Entrez le montant en MAD.',
                    'Reminder Days Before — Nombre de jours avant la date pour envoyer un rappel (défaut : 7).',
                ],
                tip: 'Utilisez toujours le bouton "Generate" pour créer un mot de passe sécurisé. Le mot de passe sera visible sur la carte d\'étudiant.',
            },
            {
                title: 'Étape 9 : Enregistrer l\'Étudiant',
                screenshot: 'buttons',
                instructions: [
                    'Vérifiez toutes les informations dans le résumé à droite du formulaire.',
                    'Cliquez sur "Create Student" (bouton violet) pour enregistrer.',
                    'Cliquez sur "Cancel" pour annuler et fermer le formulaire.',
                    'Cliquez sur "Reset Form" (bouton rouge) pour effacer tous les champs.',
                ],
                tip: 'Vérifiez bien toutes les informations avant de cliquer sur "Create Student". Une fois créé, l\'étudiant apparaîtra dans la liste.',
            },
        ],
    },
    de: {
        langLabel: 'DEUTSCH',
        flagColor: COLORS.deFlag,
        title: 'Leitfaden zur Schülerregistrierung',
        subtitle: 'Verwaltungssystem - Nisrine School',
        toc: 'Inhaltsverzeichnis',
        steps: [
            {
                title: 'Schritt 1: Anmeldung im System',
                screenshot: 'login',
                instructions: [
                    'Öffnen Sie Ihren Browser und gehen Sie zu: nisrineschool.com/admin',
                    'Geben Sie Ihren Benutzernamen (Username) in das erste Feld ein.',
                    'Geben Sie Ihr Passwort (Password) in das zweite Feld ein.',
                    'Klicken Sie auf den orangefarbenen Button "Login", um sich anzumelden.',
                ],
                tip: 'Falls Sie Ihre Zugangsdaten vergessen haben, kontaktieren Sie den Entwickler oder den Super-Administrator.',
            },
            {
                title: 'Schritt 2: Dashboard',
                screenshot: 'dashboard',
                instructions: [
                    'Nach der Anmeldung sehen Sie das Dashboard mit den Statistiken.',
                    'Im linken Menü unter "MANAGEMENT" klicken Sie auf "Étudiants" (Schüler).',
                    'Dies führt Sie zur Schülerverwaltungsseite.',
                ],
                tip: null,
            },
            {
                title: 'Schritt 3: Schülerverwaltungsseite',
                screenshot: 'studentMenu',
                instructions: [
                    'Sie sehen jetzt die Seite "Gestion des étudiants" (Schülerverwaltung).',
                    'Oben rechts finden Sie den orangefarbenen Button "+ Ajouter un étudiant".',
                    'Klicken Sie darauf, um das Registrierungsformular zu öffnen.',
                ],
                tip: null,
            },
            {
                title: 'Schritt 4: "Schüler hinzufügen" anklicken',
                screenshot: 'addButton',
                instructions: [
                    'Klicken Sie auf den orangefarbenen Button "+ Ajouter un étudiant" oben rechts.',
                    'Ein vollständiges Formular öffnet sich zur Eingabe der Schülerdaten.',
                ],
                tip: null,
            },
            {
                title: 'Schritt 5: Persönliche Informationen',
                screenshot: 'formTop',
                instructions: [
                    'Full Name * — Geben Sie den vollständigen Namen des Schülers ein (Pflichtfeld).',
                    'Date of Birth * — Wählen Sie das Geburtsdatum im Format TT/MM/JJJJ (Pflichtfeld).',
                    'Email — Persönliche E-Mail des Schülers (optional).',
                    'School Email * — Wird automatisch aus dem Namen generiert.',
                    'Phone Number * — Marokkanische Telefonnummer (Format: 06XXXXXXXX) (Pflichtfeld).',
                    'Parent Phone * — Nummer des Elternteils (Format: 06XXXXXXXX) (Pflichtfeld).',
                    'Address — Adresse des Schülers (optional).',
                    'CIN (ID Number) — Personalausweisnummer (optional).',
                    'City / District — Stadt oder Stadtteil (optional).',
                    'Study Level — Wählen Sie das Bildungsniveau aus dem Dropdown.',
                ],
                tip: 'Felder mit Sternchen (*) sind Pflichtfelder. Die Telefonnummer muss mit 05, 06 oder 07 beginnen, gefolgt von 8 Ziffern.',
            },
            {
                title: 'Schritt 6: Foto & CIN-Karte',
                screenshot: 'photoCin',
                instructions: [
                    'Student Photo — Klicken Sie auf den Bereich, um ein Foto hochzuladen (JPG/PNG, max 5 MB).',
                    'CIN Card (ID Card) — Laden Sie Vorder- und Rückseite des Ausweises hoch.',
                    'Falls der Schüler seinen Ausweis nicht dabei hat: "Add now & add later" ankreuzen.',
                    'Unterstützte Formate: JPEG, PNG, PDF (max 2 MB pro Seite).',
                ],
                tip: 'Das Foto sollte klar und aktuell sein. Bilder werden automatisch optimiert.',
            },
            {
                title: 'Schritt 7: Akademische Informationen',
                screenshot: 'academic',
                instructions: [
                    'Season * — Wählen Sie die aktive Saison (z.B. 2025-2026).',
                    'Group * — Wählen Sie die Gruppe des Schülers.',
                    'Language Formation — Kreuzen Sie die gewählte(n) Sprache(n) an:',
                    '    ☐ Allemand (Deutsch)  ☐ Anglais (Englisch)',
                    '    ☐ Français (Französisch)  ☐ Ausbildung',
                    'Branch/Subject (Filière) — Falls zutreffend ankreuzen:',
                    '    ☐ Gériatrie  ☐ Aide soignant  ☐ Agent socio éducatif',
                    '    ☐ Assistante sociale  ☐ Restauration  ☐ Cuisine',
                    '    ☐ Informatique  ☐ Gestion hôtelière',
                ],
                tip: 'Mindestens eine Sprache ODER eine Fachrichtung muss ausgewählt werden. Der Schüler kann nur eine Sprache, nur eine Fachrichtung oder beides wählen.',
            },
            {
                title: 'Schritt 8: Zugangsdaten & Zahlung',
                screenshot: 'credentials',
                instructions: [
                    'Email Password * — Klicken Sie auf "Generate", um automatisch ein Passwort zu erstellen.',
                    'Pack — Wählen Sie den Zahlungsplan:',
                    '    ● P.M (Monatlich)  ○ Trimestre (Vierteljährlich)  ○ P.Semestriel  ○ P.Annuel (Jährlich)',
                    'Payment Date * — Wählen Sie das nächste Zahlungsdatum.',
                    'Payment Amount * — Geben Sie den Betrag in MAD ein.',
                    'Reminder Days Before — Anzahl der Tage vor dem Termin für eine Erinnerung (Standard: 7).',
                ],
                tip: 'Verwenden Sie immer den "Generate"-Button für ein sicheres Passwort. Das Passwort wird auf dem Schülerausweis angezeigt.',
            },
            {
                title: 'Schritt 9: Schüler Speichern',
                screenshot: 'buttons',
                instructions: [
                    'Überprüfen Sie alle Informationen in der Zusammenfassung rechts.',
                    'Klicken Sie auf "Create Student" (lila Button), um zu speichern.',
                    'Klicken Sie auf "Cancel", um abzubrechen und das Formular zu schließen.',
                    'Klicken Sie auf "Reset Form" (roter Button), um alle Felder zu leeren.',
                ],
                tip: 'Überprüfen Sie alle Daten sorgfältig, bevor Sie auf "Create Student" klicken. Nach der Erstellung erscheint der Schüler in der Liste.',
            },
        ],
    },
    ar: {
        langLabel: 'العربية',
        flagColor: COLORS.arFlag,
        title: 'دليل تسجيل الطلاب',
        subtitle: 'نظام الإدارة - مدرسة نسرين',
        toc: 'جدول المحتويات',
        steps: [
            {
                title: 'الخطوة 1: تسجيل الدخول إلى النظام',
                screenshot: 'login',
                instructions: [
                    'nisrineschool.com/admin : افتح المتصفح وانتقل إلى',
                    '.(Username) أدخل اسم المستخدم في الحقل الأول',
                    '.(Password) أدخل كلمة المرور في الحقل الثاني',
                    '.للدخول "Login" انقر على الزر البرتقالي',
                ],
                tip: '.إذا نسيت بيانات الدخول، تواصل مع المطور أو المسؤول الأعلى',
            },
            {
                title: 'الخطوة 2: لوحة التحكم',
                screenshot: 'dashboard',
                instructions: [
                    '.بعد تسجيل الدخول، سترى لوحة التحكم مع الإحصائيات',
                    '."Étudiants" انقر على ,"MANAGEMENT" في القائمة اليسرى، قسم',
                    '.سينقلك ذلك إلى صفحة إدارة الطلاب',
                ],
                tip: null,
            },
            {
                title: 'الخطوة 3: صفحة إدارة الطلاب',
                screenshot: 'studentMenu',
                instructions: [
                    '."Gestion des étudiants" سترى الآن صفحة',
                    '."Ajouter un étudiant +" في أعلى اليمين، ستجد الزر البرتقالي',
                    '.انقر عليه لفتح نموذج التسجيل',
                ],
                tip: null,
            },
            {
                title: 'الخطوة 4: النقر على "إضافة طالب"',
                screenshot: 'addButton',
                instructions: [
                    '.في أعلى اليمين "Ajouter un étudiant +" انقر على الزر البرتقالي',
                    '.سيُفتح نموذج كامل لإدخال بيانات الطالب',
                ],
                tip: null,
            },
            {
                title: 'الخطوة 5: المعلومات الشخصية',
                screenshot: 'formTop',
                instructions: [
                    '.(إجباري) أدخل الاسم الكامل للطالب — * Full Name',
                    '.(إجباري) jj/mm/aaaa اختر تاريخ الميلاد بصيغة — * Date of Birth',
                    '.(اختياري) البريد الشخصي للطالب — Email',
                    '.يُنشأ تلقائيًا من الاسم — * School Email',
                    '.(إجباري) (06XXXXXXXX :رقم الهاتف المغربي (صيغة — * Phone Number',
                    '.(إجباري) (06XXXXXXXX :رقم هاتف الوالد (صيغة — * Parent Phone',
                    '.(اختياري) عنوان الطالب — Address',
                    '.(اختياري) رقم بطاقة التعريف الوطنية — CIN',
                    '.(اختياري) المدينة أو الحي — City / District',
                    '.اختر المستوى الدراسي من القائمة — Study Level',
                ],
                tip: '.أرقام 8 أو 07 أو 06 أو 05 الحقول المميزة بنجمة (*) إجبارية. رقم الهاتف يجب أن يبدأ بـ',
            },
            {
                title: 'الخطوة 6: الصورة وبطاقة التعريف',
                screenshot: 'photoCin',
                instructions: [
                    '.(ميغا 5 حد أقصى ,JPG/PNG) انقر على المنطقة لرفع صورة — Student Photo',
                    '.قم برفع الوجه الأمامي والخلفي للبطاقة — CIN Card',
                    '."Add now & add later" إذا لم يكن لدى الطالب بطاقته اليوم، حدد خانة',
                    '.(ميغا لكل جانب 2 حد أقصى) PDF ,PNG ,JPEG :الصيغ المقبولة',
                ],
                tip: '.يجب أن تكون الصورة واضحة وحديثة. سيتم تحسين الصور تلقائيًا',
            },
            {
                title: 'الخطوة 7: المعلومات الأكاديمية',
                screenshot: 'academic',
                instructions: [
                    '.(2025-2026 :مثلاً) اختر الموسم النشط — * Season',
                    '.اختر مجموعة الطالب — * Group',
                    ':حدد اللغة/اللغات المختارة — Language Formation',
                    'Ausbildung ☐  (فرنسية) Français ☐  (إنجليزية) Anglais ☐  (ألمانية) Allemand ☐    ',
                    ':حدد إذا كان ذلك ينطبق — (الشعبة) Branch/Subject',
                    'Agent socio éducatif ☐  Aide soignant ☐  Gériatrie ☐    ',
                    'Cuisine ☐  Restauration ☐  Assistante sociale ☐    ',
                    'Gestion hôtelière ☐  Informatique ☐    ',
                ],
                tip: '.يجب اختيار لغة واحدة على الأقل أو شعبة واحدة. يمكن للطالب اختيار لغة فقط أو شعبة فقط أو كليهما',
            },
            {
                title: 'الخطوة 8: بيانات الحساب والدفع',
                screenshot: 'credentials',
                instructions: [
                    '.لإنشاء كلمة مرور تلقائيًا "Generate" انقر على — * Email Password',
                    ':اختر خطة الدفع — Pack',
                    '(سنوي) P.Annuel ○  (نصف سنوي) P.Semestriel ○  (ثلاثي) Trimestre ○  (شهري) P.M ●    ',
                    '.اختر تاريخ الدفع القادم — * Payment Date',
                    '.بالدرهم المغربي أدخل المبلغ — * Payment Amount',
                    '.(7 :الافتراضي) عدد أيام التذكير قبل الموعد — Reminder Days Before',
                ],
                tip: '.كلمة المرور ستظهر على بطاقة الطالب .لإنشاء كلمة مرور آمنة "Generate" استخدم دائمًا زر',
            },
            {
                title: 'الخطوة 9: حفظ الطالب',
                screenshot: 'buttons',
                instructions: [
                    '.تحقق من جميع المعلومات في الملخص على يمين النموذج',
                    '.للحفظ (الزر البنفسجي) "Create Student" انقر على',
                    '.للإلغاء وإغلاق النموذج "Cancel" انقر على',
                    '.لمسح جميع الحقول (الزر الأحمر) "Reset Form" انقر على',
                ],
                tip: '.بمجرد الإنشاء، سيظهر الطالب في القائمة ."Create Student" تحقق من جميع البيانات بعناية قبل النقر على',
            },
        ],
    },
    en: {
        langLabel: 'ENGLISH',
        flagColor: COLORS.enFlag,
        title: 'Student Registration Guide',
        subtitle: 'Management System - Nisrine School',
        toc: 'Table of Contents',
        steps: [
            {
                title: 'Step 1: Log into the System',
                screenshot: 'login',
                instructions: [
                    'Open your browser and go to: nisrineschool.com/admin',
                    'Enter your Username in the first field.',
                    'Enter your Password in the second field.',
                    'Click the orange "Login" button to sign in.',
                ],
                tip: 'If you forgot your credentials, contact the developer or super administrator.',
            },
            {
                title: 'Step 2: Dashboard',
                screenshot: 'dashboard',
                instructions: [
                    'After logging in, you will see the Dashboard with statistics.',
                    'In the left menu, under "MANAGEMENT", click on "Étudiants" (Students).',
                    'This will take you to the Student Management page.',
                ],
                tip: null,
            },
            {
                title: 'Step 3: Student Management Page',
                screenshot: 'studentMenu',
                instructions: [
                    'You now see the "Gestion des étudiants" (Student Management) page.',
                    'In the top right corner, you\'ll find the orange "+ Ajouter un étudiant" button.',
                    'Click on it to open the registration form.',
                ],
                tip: null,
            },
            {
                title: 'Step 4: Click "Add Student"',
                screenshot: 'addButton',
                instructions: [
                    'Click the orange "+ Ajouter un étudiant" button in the top right.',
                    'A complete form will open to enter the student\'s information.',
                ],
                tip: null,
            },
            {
                title: 'Step 5: Personal Information',
                screenshot: 'formTop',
                instructions: [
                    'Full Name * — Enter the student\'s full name (required).',
                    'Date of Birth * — Select the date in dd/mm/yyyy format (required).',
                    'Email — Student\'s personal email (optional).',
                    'School Email * — Automatically generated from the name.',
                    'Phone Number * — Moroccan phone number (format: 06XXXXXXXX) (required).',
                    'Parent Phone * — Parent/guardian number (format: 06XXXXXXXX) (required).',
                    'Address — Student\'s address (optional).',
                    'CIN (ID Number) — National ID card number (optional).',
                    'City / District — City or district (optional).',
                    'Study Level — Select education level from the dropdown.',
                ],
                tip: 'Fields marked with an asterisk (*) are required. Phone numbers must start with 05, 06, or 07 followed by 8 digits.',
            },
            {
                title: 'Step 6: Photo & CIN Card',
                screenshot: 'photoCin',
                instructions: [
                    'Student Photo — Click the area to upload a photo (JPG or PNG, max 5 MB).',
                    'CIN Card (ID Card) — Upload front and back sides of the ID card.',
                    'If the student doesn\'t have their ID today, check "Add now & add later".',
                    'Supported formats: JPEG, PNG, PDF (max 2 MB per side).',
                ],
                tip: 'The photo should be clear and recent. Images will be automatically optimized.',
            },
            {
                title: 'Step 7: Academic Information',
                screenshot: 'academic',
                instructions: [
                    'Season * — Select the active season (e.g. 2025-2026).',
                    'Group * — Select the student\'s group.',
                    'Language Formation — Check the chosen language(s):',
                    '    ☐ Allemand (German)  ☐ Anglais (English)',
                    '    ☐ Français (French)  ☐ Ausbildung',
                    'Branch/Subject (Filière) — Check if applicable:',
                    '    ☐ Gériatrie  ☐ Aide soignant  ☐ Agent socio éducatif',
                    '    ☐ Assistante sociale  ☐ Restauration  ☐ Cuisine',
                    '    ☐ Informatique  ☐ Gestion hôtelière',
                ],
                tip: 'You must select at least one language OR one branch/subject. The student can choose language only, branch only, or both.',
            },
            {
                title: 'Step 8: Credentials & Payment',
                screenshot: 'credentials',
                instructions: [
                    'Email Password * — Click "Generate" to auto-create a secure password.',
                    'Pack — Select the payment plan:',
                    '    ● P.M (Monthly)  ○ Trimestre (Quarterly)  ○ P.Semestriel  ○ P.Annuel (Yearly)',
                    'Payment Date * — Select the next payment due date.',
                    'Payment Amount * — Enter the amount in MAD.',
                    'Reminder Days Before — Days before due date to send a reminder (default: 7).',
                ],
                tip: 'Always use the "Generate" button for a secure password. The password will be visible on the student ID card.',
            },
            {
                title: 'Step 9: Save the Student',
                screenshot: 'buttons',
                instructions: [
                    'Review all information in the summary panel on the right side.',
                    'Click "Create Student" (purple button) to save.',
                    'Click "Cancel" to abort and close the form.',
                    'Click "Reset Form" (red button) to clear all fields.',
                ],
                tip: 'Double-check all data before clicking "Create Student". Once created, the student will appear in the list.',
            },
        ],
    },
};

// ─── PDF Generator ───────────────────────────────────────────────────────────

function generatePDF() {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Verify all screenshots exist
    for (const [key, filePath] of Object.entries(SCREENSHOTS)) {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Missing screenshot: ${key} -> ${filePath}`);
            process.exit(1);
        }
    }

    console.log('📄 Generating Student Registration Guide PDF...\n');

    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
        info: {
            Title: 'Guide d\'Inscription des Étudiants - Nisrine School',
            Author: 'Nisrine School',
            Subject: 'Student Registration Guide',
            Keywords: 'nisrine, school, student, registration, guide',
        },
    });

    const stream = fs.createWriteStream(OUTPUT_FILE);
    doc.pipe(stream);

    const PAGE_WIDTH = doc.page.width - 100; // 50 margin each side
    const arialFont = fs.existsSync(ARIAL_FONT) ? ARIAL_FONT : null;
    const arialBoldFont = fs.existsSync(ARIAL_BOLD) ? ARIAL_BOLD : null;

    // Register fonts
    if (arialFont) doc.registerFont('Arial', arialFont);
    if (arialBoldFont) doc.registerFont('ArialBold', arialBoldFont);
    const arialItalicFont = fs.existsSync(ARIAL_ITALIC) ? ARIAL_ITALIC : null;
    if (arialItalicFont) doc.registerFont('ArialItalic', arialItalicFont);

    // ─── Helper Functions ────────────────────────────────────────────────

    function setFont(bold = false, size = 12, italic = false) {
        if (italic && arialItalicFont) {
            doc.font('ArialItalic').fontSize(size);
        } else if (bold && arialBoldFont) {
            doc.font('ArialBold').fontSize(size);
        } else if (arialFont) {
            doc.font('Arial').fontSize(size);
        } else {
            doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size);
        }
    }

    // RTL helper: reverse word order so PDFKit renders Arabic text correctly
    function rtl(text) {
        if (!text || !/[\u0600-\u06FF]/.test(text)) return text;
        // Split into tokens preserving whitespace
        const tokens = text.split(/(\s+)/);
        // Reverse token order for RTL display
        tokens.reverse();
        // Swap mirrored brackets/parens for RTL
        let result = tokens.join('');
        result = result.replace(/[\(\)]/g, c => c === '(' ? ')' : '(');
        return result;
    }

    function checkSpace(needed) {
        if (doc.y + needed > doc.page.height - 60) {
            doc.addPage();
        }
    }

    function drawHorizontalLine(y, color = '#DDDDDD') {
        doc.save()
            .moveTo(50, y)
            .lineTo(doc.page.width - 50, y)
            .strokeColor(color)
            .lineWidth(1)
            .stroke()
            .restore();
    }

    function addImage(screenshotKey, maxWidth, maxHeight) {
        const imgPath = SCREENSHOTS[screenshotKey];
        if (!imgPath || !fs.existsSync(imgPath)) return;

        const imgWidth = Math.min(maxWidth || PAGE_WIDTH, PAGE_WIDTH);

        checkSpace(maxHeight || 300);

        try {
            // Add a light border/shadow effect
            const imgX = 50 + (PAGE_WIDTH - imgWidth) / 2;
            doc.save();
            doc.roundedRect(imgX - 2, doc.y - 2, imgWidth + 4, 4, 2)
                .fillColor('#E0E0E0')
                .fill();
            doc.restore();

            doc.image(imgPath, imgX, doc.y, {
                fit: [imgWidth, maxHeight || 350],
                align: 'center',
            });

            // Move Y past the image
            const imgInfo = doc.openImage(imgPath);
            const scale = Math.min(imgWidth / imgInfo.width, (maxHeight || 350) / imgInfo.height);
            const renderedHeight = imgInfo.height * scale;
            doc.y += renderedHeight + 15;
        } catch (err) {
            console.error(`  ⚠️ Could not embed image ${screenshotKey}: ${err.message}`);
        }
    }

    // ─── COVER PAGE ──────────────────────────────────────────────────────

    function drawCoverPage() {
        // Purple header bar
        doc.rect(0, 0, doc.page.width, 200).fill(COLORS.primary);

        // School name
        setFont(true, 36);
        doc.fillColor(COLORS.secondary);
        doc.text('NISRINE SCHOOL', 0, 70, { align: 'center', width: doc.page.width });

        // Created by (italic)
        setFont(false, 12, true);
        doc.fillColor(COLORS.white);
        doc.text('Created by Zayd Dahhaoui (Zigma_Media)', 0, 120, { align: 'center', width: doc.page.width });

        // Main title
        doc.y = 260;
        setFont(true, 28);
        doc.fillColor(COLORS.primary);
        doc.text('Guide d\'Inscription', 50, doc.y, { align: 'center', width: PAGE_WIDTH });
        doc.moveDown(0.3);
        doc.text('des Étudiants', 50, doc.y, { align: 'center', width: PAGE_WIDTH });

        // Decorative line
        doc.y += 20;
        doc.rect(doc.page.width / 2 - 60, doc.y, 120, 4).fill(COLORS.secondary);
        doc.y += 25;

        // 4 language labels — German flag inspired colors (Black-Red-Gold) + English original
        const langLabels = [
            { text: 'Français', bgColor: '#000000', textColor: '#FFFFFF' },
            { text: 'Deutsch', bgColor: '#DD0000', textColor: '#FFFFFF' },
            { text: 'العربية', bgColor: '#FFFFFF', textColor: '#1a1a2e', border: '#CCCCCC' },
            { text: 'English', bgColor: COLORS.enFlag, textColor: '#FFFFFF' },
        ];

        setFont(true, 16);
        const labelWidth = 110;
        const totalWidth = langLabels.length * labelWidth + (langLabels.length - 1) * 15;
        let startX = (doc.page.width - totalWidth) / 2;

        langLabels.forEach((lang, i) => {
            const x = startX + i * (labelWidth + 15);
            if (lang.border) {
                doc.roundedRect(x, doc.y, labelWidth, 35, 5).fillAndStroke(lang.bgColor, lang.border);
            } else {
                doc.roundedRect(x, doc.y, labelWidth, 35, 5).fill(lang.bgColor);
            }
            setFont(true, 13);
            doc.fillColor(lang.textColor);
            doc.text(lang.text, x, doc.y + 10, { width: labelWidth, align: 'center' });
        });

        doc.y += 80;

        // Description
        setFont(false, 12);
        doc.fillColor(COLORS.lightText);
        doc.text(
            'Ce guide explique étape par étape comment inscrire un nouvel étudiant dans le système de gestion de Nisrine School.',
            80, doc.y, { width: PAGE_WIDTH - 60, align: 'center' }
        );
        doc.moveDown(0.8);
        doc.text(
            'This guide explains step by step how to register a new student in the Nisrine School management system.',
            80, doc.y, { width: PAGE_WIDTH - 60, align: 'center' }
        );

        // Footer
        setFont(false, 10);
        doc.fillColor(COLORS.lightText);
        const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`Version 1.0 — ${dateStr}`, 50, doc.page.height - 80, { align: 'center', width: PAGE_WIDTH });

        // Orange bottom bar
        doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill(COLORS.secondary);
    }

    // ─── LANGUAGE SECTION ────────────────────────────────────────────────

    function drawLanguageSection(langKey) {
        const lang = CONTENT[langKey];
        const isArabic = langKey === 'ar';
        const textAlign = isArabic ? 'right' : 'left';

        // Section cover/title page
        doc.addPage();

        // Colored header bar
        const headerColor = lang.flagColor === '#000000' ? COLORS.primary : lang.flagColor;
        doc.rect(0, 0, doc.page.width, 90).fill(headerColor);

        setFont(true, 13);
        doc.fillColor(COLORS.white);
        doc.text(isArabic ? rtl(lang.langLabel) : lang.langLabel, 0, 20, { align: 'center', width: doc.page.width });

        setFont(true, 22);
        doc.text(isArabic ? rtl(lang.title) : lang.title, 0, 40, { align: 'center', width: doc.page.width });

        setFont(false, 11);
        doc.fillColor('rgba(255,255,255,0.85)');
        doc.text(isArabic ? rtl(lang.subtitle) : lang.subtitle, 0, 68, { align: 'center', width: doc.page.width });

        doc.y = 110;

        // Table of Contents (compact)
        setFont(true, 14);
        doc.fillColor(COLORS.dark);
        doc.text(isArabic ? rtl(lang.toc) : lang.toc, 50, doc.y, { align: textAlign, width: PAGE_WIDTH });
        doc.y += 5;
        drawHorizontalLine(doc.y);
        doc.y += 8;

        lang.steps.forEach((step) => {
            setFont(false, 10);
            doc.fillColor(COLORS.text);
            doc.text(isArabic ? rtl(step.title) : step.title, 60, doc.y, { align: textAlign, width: PAGE_WIDTH - 20 });
            doc.moveDown(0.15);
        });

        doc.y += 15;

        // ── Render all steps in continuous flow ──
        lang.steps.forEach((step, stepIndex) => {
            // Estimate space needed for step header + image
            const isSmallImage = step.screenshot === 'buttons' || step.screenshot === 'addButton';
            const imgMaxH = isSmallImage ? 60 : 190;
            const neededForHeader = 55 + imgMaxH;

            // Start new page if less than header+image space remains
            if (doc.y + neededForHeader > doc.page.height - 80) {
                doc.addPage();
                doc.y = 50;
            }

            // ── Step header ──
            // Colored left bar + number circle
            const stepY = doc.y;
            doc.roundedRect(50, stepY, 4, 30, 2).fill(COLORS.primary);
            doc.circle(68, stepY + 15, 12).fill(COLORS.primary);
            setFont(true, 12);
            doc.fillColor(COLORS.white);
            doc.text(`${stepIndex + 1}`, 58, stepY + 9, { width: 20, align: 'center' });

            // Step title
            setFont(true, 13);
            doc.fillColor(COLORS.dark);
            const titleX = isArabic ? 50 : 88;
            const titleW = isArabic ? PAGE_WIDTH - 45 : PAGE_WIDTH - 38;
            doc.text(isArabic ? rtl(step.title) : step.title, titleX, stepY + 7, { width: titleW, align: textAlign });

            doc.y = stepY + 38;

            // ── Screenshot ──
            addImage(step.screenshot, PAGE_WIDTH - 40, imgMaxH);

            // ── Instructions ──
            step.instructions.forEach((instruction) => {
                checkSpace(22);

                const isIndented = instruction.startsWith('    ');
                const displayText = isIndented ? instruction.trim() : instruction;

                const renderText = isArabic ? rtl(displayText) : displayText;

                if (!isIndented) {
                    setFont(false, 9.5);
                    doc.fillColor(COLORS.primary);
                    const bulletX = isArabic ? doc.page.width - 62 : 57;
                    doc.text('▸', bulletX, doc.y, { width: 12, continued: false });

                    setFont(false, 9.5);
                    doc.fillColor(COLORS.text);
                    const instrX = isArabic ? 50 : 68;
                    doc.text(renderText, instrX, doc.y - 12, {
                        width: PAGE_WIDTH - 25,
                        align: textAlign,
                        lineGap: 1,
                    });
                } else {
                    setFont(false, 9);
                    doc.fillColor(COLORS.lightText);
                    doc.text(renderText, 82, doc.y, {
                        width: PAGE_WIDTH - 50,
                        align: textAlign,
                        lineGap: 1,
                    });
                }
                doc.moveDown(0.05);
            });

            // ── Tip box ──
            if (step.tip) {
                checkSpace(50);
                doc.y += 6;

                const tipX = 55;
                const tipW = PAGE_WIDTH - 10;
                const tipPad = 8;

                const tipText = isArabic ? rtl(step.tip) : step.tip;
                setFont(false, 8.5);
                const tipTextH = doc.heightOfString(tipText, { width: tipW - tipPad * 2 - 18 });
                const tipBoxH = tipTextH + tipPad * 2;

                const boxY = doc.y;
                doc.roundedRect(tipX, boxY, tipW, tipBoxH, 4).fill(COLORS.tipBg);

                setFont(true, 10);
                doc.fillColor('#C87000');
                doc.text('!', tipX + tipPad, boxY + tipPad, { width: 12 });

                setFont(false, 8.5);
                doc.fillColor('#8B6914');
                doc.text(tipText, tipX + tipPad + 14, boxY + tipPad, {
                    width: tipW - tipPad * 2 - 18,
                    align: textAlign,
                    lineGap: 1,
                });

                doc.y = boxY + tipBoxH + 4;
            }

            // Separator between steps
            doc.y += 8;
            if (stepIndex < lang.steps.length - 1) {
                drawHorizontalLine(doc.y, '#E0E0E0');
                doc.y += 10;
            }
        });
    }

    // ─── BUILD PDF ───────────────────────────────────────────────────────

    console.log('  📝 Drawing cover page...');
    drawCoverPage();

    const languages = ['fr', 'de', 'ar', 'en'];
    languages.forEach(langKey => {
        console.log(`  📝 Drawing ${CONTENT[langKey].langLabel} section...`);
        drawLanguageSection(langKey);
    });

    // Add page numbers
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        setFont(false, 8);
        doc.fillColor(COLORS.lightText);
        doc.text(
            `${i + 1} / ${totalPages}`,
            50, doc.page.height - 25,
            { width: PAGE_WIDTH, align: 'center' }
        );
    }

    doc.end();

    stream.on('finish', () => {
        console.log(`\n✅ PDF generated successfully!`);
        console.log(`📁 Location: ${OUTPUT_FILE}`);
        console.log(`📄 Total pages: ${totalPages}`);
    });

    stream.on('error', (err) => {
        console.error('❌ Error writing PDF:', err);
    });
}

// ─── Run ─────────────────────────────────────────────────────────────────────

generatePDF();
