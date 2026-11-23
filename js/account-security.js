// Account security UI for admin.html:
//  - "Forgot password?" → email code → temporary access (permanent password never changed or shown)
//  - Dashboard banners: temporary access, repeated temporary access, 2FA reminder (stays until 2FA is on)
//  - Director: security alerts (temporary logins, repeated use, developer recovery) + history
//  - Director: protected factory reset (preview → verified backup → identity → typed confirmation)
// All server text is inserted with textContent (never innerHTML).
(function () {
    'use strict';
    const API = window.location.origin;

    // ---------------------------------------------------------------- texts (fr / ar / en; other languages → fr)
    const T = {
        fr: {
            forgot: 'Mot de passe oublié ?',
            recTitle: 'Mot de passe oublié',
            recIntro: 'Nous allons envoyer un code à l\'adresse e-mail de récupération enregistrée dans les réglages 2FA de votre compte. Votre mot de passe ne sera pas modifié.',
            login: 'Votre identifiant de connexion (nom d\'utilisateur ou e-mail de connexion)',
            recEmail: 'Votre e-mail de récupération (e-mail 2FA)',
            sendCode: 'Envoyer le code', back: 'Retour à la connexion', sending: 'Envoi en cours…',
            codeSentTo: 'Un code à 6 chiffres a été envoyé à', checkSpam: 'Vous ne le trouvez pas ? Regardez dans les spams.',
            codeLabel: 'Code reçu par e-mail', validate: 'Valider le code', resend: 'Renvoyer un code', resendIn: 'Renvoyer un code dans {s} s',
            codeValid: 'Le code est valable {m} minutes et ne sert qu\'une seule fois.',
            NO_RECOVERY_EMAIL: 'Aucun e-mail de récupération n\'est enregistré pour ce compte. Veuillez contacter la Directrice.',
            EMAIL_MISMATCH: 'Cette adresse n\'est pas l\'e-mail de récupération enregistré pour ce compte.',
            ACCOUNT_NOT_FOUND: 'Aucun compte ne correspond à cet identifiant.',
            ACCOUNT_DISABLED: 'Ce compte est désactivé. Veuillez contacter la Directrice.',
            MISSING_FIELDS: 'Veuillez remplir les deux champs.',
            WRONG_CODE: 'Code incorrect. Il vous reste {n} essai(s).',
            TOO_MANY_ATTEMPTS: 'Trop de codes incorrects. Demandez un nouveau code.',
            CODE_EXPIRED: 'Ce code a expiré. Demandez un nouveau code.',
            CODE_USED: 'Ce code a déjà été utilisé. Demandez un nouveau code.',
            CODE_REPLACED: 'Ce code n\'est plus valable : utilisez le dernier code reçu.',
            EMAIL_FAILED: 'L\'e-mail n\'a pas pu être envoyé. Réessayez plus tard ou contactez la Directrice.',
            TOO_MANY: 'Trop de tentatives. Patientez puis réessayez.',
            WAIT: 'Patientez {s} secondes avant de demander un nouveau code.',
            generic: 'Une erreur est survenue. Réessayez.', codeFormat: 'Le code contient 6 chiffres.',
            tmpExpired: 'Votre accès temporaire a expiré. Connectez-vous avec votre mot de passe ou demandez un nouveau code.',
            tmpTitle: 'Accès temporaire',
            tmpMsg: 'Vous utilisez un accès temporaire. Votre mot de passe permanent n\'a pas changé. Veuillez contacter la Directrice pour obtenir votre mot de passe habituel.',
            tmpMsgOwner: 'Vous utilisez un accès temporaire. Votre mot de passe permanent n\'a pas changé. Vous pouvez choisir un nouveau mot de passe ci-dessous.',
            tmpUntil: 'Cet accès se termine à {t}.',
            newPwBtn: 'Choisir un nouveau mot de passe', newPw: 'Nouveau mot de passe (8 caractères minimum)', newPw2: 'Répétez le nouveau mot de passe',
            savePw: 'Enregistrer', pwMismatch: 'Les deux mots de passe ne sont pas identiques.', pwSaved: 'Nouveau mot de passe enregistré. Vous allez être déconnecté(e) : reconnectez-vous avec ce mot de passe.',
            repTitle: 'Accès temporaire utilisé plusieurs fois',
            repMsg: 'Vous vous êtes connecté(e) {n} fois avec un code temporaire au cours des {d} derniers jours ({dates}). Demandez votre mot de passe à la Directrice pour vous connecter normalement.',
            tfaTitle: 'Protégez votre compte : activez la vérification en deux étapes (2FA)',
            tfaText1: 'Avec la 2FA, après votre mot de passe, un code est envoyé sur votre e-mail personnel. Même si quelqu\'un connaît votre mot de passe, il ne peut pas entrer sans ce code.',
            tfaText2: 'Cet e-mail sert aussi à retrouver l\'accès à votre compte si vous oubliez votre mot de passe (bouton « Mot de passe oublié ? »).',
            tfaBtn: 'Activer la 2FA maintenant',
            alertsPill: 'Alertes sécurité', alertsTitle: 'Alertes de sécurité', alertsNone: 'Aucune nouvelle alerte.',
            seen: 'Marquer comme vu', seenAll: 'Tout marquer comme vu', history: 'Historique des accès temporaires', hideHistory: 'Masquer l\'historique',
            colPerson: 'Personne', colAccount: 'Compte', colCount: 'Accès temporaires ({d} jours)', colDates: 'Dates',
            allEvents: 'Toutes les alertes (200 dernières)', repeatedTag: 'RÉPÉTÉ',
            role_employee: 'Secrétaire', role_super_admin: 'Directrice', role_dev: 'Développeur',
            ev_temporary_access: '{role} {name} (compte : {acc}) s\'est connecté(e) avec un ACCÈS TEMPORAIRE au lieu de son mot de passe — {date}.',
            ev_temporary_access_dev: 'Le compte développeur {name} (compte : {acc}) a utilisé la récupération d\'accès (accès temporaire) — {date}.',
            ev_temporary_access_repeated: 'ACCÈS TEMPORAIRE RÉPÉTÉ : {role} {name} (compte : {acc}) a utilisé l\'accès temporaire {n} fois en {d} jours : {dates}. Pensez à lui redonner son mot de passe.',
            fr_title: 'Réinitialisation complète (Directrice uniquement)',
            fr_intro: 'Cette action supprime définitivement les données de l\'école. Elle se fait en 4 étapes. Rien n\'est supprimé avant la dernière étape.',
            fr_s1: 'Étape 1 — Voir ce qui sera supprimé', fr_show: 'Afficher la liste', fr_kept: 'Conservé :', fr_total: 'Total des éléments supprimés',
            fr_cloud: 'Supprimer aussi les fichiers du stockage cloud (photos, CIN, reçus, certificats, PDF). Ces fichiers NE sont PAS dans la sauvegarde.',
            fr_s2: 'Étape 2 — Créer et vérifier une sauvegarde', fr_backup: 'Créer la sauvegarde', fr_backupOk: 'Sauvegarde créée et vérifiée ({size}).', fr_download: 'Télécharger la sauvegarde',
            fr_backupAge: 'La sauvegarde doit avoir moins de {m} minutes au moment de la réinitialisation.',
            fr_s3: 'Étape 3 — Confirmer votre identité', fr_pw: 'Votre mot de passe', fr_check: 'Vérifier', fr_codeSent: 'Un code a été envoyé à votre e-mail 2FA. Saisissez-le à l\'étape 4.',
            fr_s4: 'Étape 4 — Confirmation finale', fr_code: 'Code reçu par e-mail', fr_type: 'Tapez exactement : {p}', fr_understand: 'Je comprends que cette action est définitive.',
            fr_go: 'SUPPRIMER DÉFINITIVEMENT LES DONNÉES', fr_last: 'Dernière confirmation : toutes les données listées à l\'étape 1 vont être supprimées. Continuer ?',
            fr_done: 'Réinitialisation terminée. Sauvegarde conservée : {f}', fr_running: 'Suppression en cours… ne fermez pas la page.',
            fr_needPrev: 'Terminez d\'abord l\'étape précédente.'
        },
        ar: {
            forgot: 'نسيت كلمة المرور؟',
            recTitle: 'نسيت كلمة المرور',
            recIntro: 'سنرسل رمزاً إلى البريد الإلكتروني للاسترجاع المسجّل في إعدادات التحقق بخطوتين (2FA) لحسابك. لن يتم تغيير كلمة المرور الخاصة بك.',
            login: 'اسم المستخدم أو بريد تسجيل الدخول',
            recEmail: 'بريد الاسترجاع (بريد 2FA)',
            sendCode: 'إرسال الرمز', back: 'العودة إلى تسجيل الدخول', sending: 'جارٍ الإرسال…',
            codeSentTo: 'تم إرسال رمز من 6 أرقام إلى', checkSpam: 'لم تجده؟ تحقق من مجلد الرسائل غير المرغوب فيها.',
            codeLabel: 'الرمز المستلم بالبريد', validate: 'تأكيد الرمز', resend: 'إعادة إرسال الرمز', resendIn: 'إعادة الإرسال بعد {s} ث',
            codeValid: 'الرمز صالح لمدة {m} دقائق ويُستخدم مرة واحدة فقط.',
            NO_RECOVERY_EMAIL: 'لا يوجد بريد استرجاع مسجّل لهذا الحساب. يرجى الاتصال بالمديرة.',
            EMAIL_MISMATCH: 'هذا البريد ليس بريد الاسترجاع المسجّل لهذا الحساب.',
            ACCOUNT_NOT_FOUND: 'لا يوجد حساب بهذا المعرّف.',
            ACCOUNT_DISABLED: 'هذا الحساب معطّل. يرجى الاتصال بالمديرة.',
            MISSING_FIELDS: 'يرجى ملء الحقلين.',
            WRONG_CODE: 'رمز غير صحيح. تبقّى لك {n} محاولة.',
            TOO_MANY_ATTEMPTS: 'محاولات خاطئة كثيرة. اطلب رمزاً جديداً.',
            CODE_EXPIRED: 'انتهت صلاحية هذا الرمز. اطلب رمزاً جديداً.',
            CODE_USED: 'تم استخدام هذا الرمز من قبل. اطلب رمزاً جديداً.',
            CODE_REPLACED: 'هذا الرمز لم يعد صالحاً: استخدم آخر رمز وصلك.',
            EMAIL_FAILED: 'تعذّر إرسال البريد. حاول لاحقاً أو اتصل بالمديرة.',
            TOO_MANY: 'محاولات كثيرة. انتظر ثم حاول مرة أخرى.',
            WAIT: 'انتظر {s} ثانية قبل طلب رمز جديد.',
            generic: 'حدث خطأ. حاول مرة أخرى.', codeFormat: 'الرمز يتكون من 6 أرقام.',
            tmpExpired: 'انتهى الدخول المؤقت. سجّل الدخول بكلمة المرور أو اطلب رمزاً جديداً.',
            tmpTitle: 'دخول مؤقت',
            tmpMsg: 'أنت تستخدم دخولاً مؤقتاً. لم تتغير كلمة المرور الدائمة. يرجى الاتصال بالمديرة للحصول على كلمة المرور المعتادة.',
            tmpMsgOwner: 'أنت تستخدم دخولاً مؤقتاً. لم تتغير كلمة المرور الدائمة. يمكنك اختيار كلمة مرور جديدة أدناه.',
            tmpUntil: 'ينتهي هذا الدخول على الساعة {t}.',
            newPwBtn: 'اختيار كلمة مرور جديدة', newPw: 'كلمة المرور الجديدة (8 أحرف على الأقل)', newPw2: 'أعد كتابة كلمة المرور الجديدة',
            savePw: 'حفظ', pwMismatch: 'كلمتا المرور غير متطابقتين.', pwSaved: 'تم حفظ كلمة المرور الجديدة. سيتم تسجيل خروجك: سجّل الدخول بها.',
            repTitle: 'استخدام متكرر للدخول المؤقت',
            repMsg: 'لقد دخلت {n} مرات برمز مؤقت خلال آخر {d} يوماً ({dates}). اطلب كلمة المرور من المديرة لتسجيل الدخول بشكل عادي.',
            tfaTitle: 'احمِ حسابك: فعّل التحقق بخطوتين (2FA)',
            tfaText1: 'مع 2FA، بعد كلمة المرور يُرسل رمز إلى بريدك الشخصي. حتى لو عرف شخص كلمة المرور، لا يستطيع الدخول بدون هذا الرمز.',
            tfaText2: 'هذا البريد يُستخدم أيضاً لاسترجاع الدخول إلى حسابك إذا نسيت كلمة المرور (زر «نسيت كلمة المرور؟»).',
            tfaBtn: 'تفعيل 2FA الآن',
            alertsPill: 'تنبيهات الأمان', alertsTitle: 'تنبيهات الأمان', alertsNone: 'لا توجد تنبيهات جديدة.',
            seen: 'تمت المشاهدة', seenAll: 'تعليم الكل كمقروء', history: 'سجل الدخول المؤقت', hideHistory: 'إخفاء السجل',
            colPerson: 'الشخص', colAccount: 'الحساب', colCount: 'مرات الدخول المؤقت ({d} يوماً)', colDates: 'التواريخ',
            allEvents: 'كل التنبيهات (آخر 200)', repeatedTag: 'متكرر',
            role_employee: 'السكرتيرة', role_super_admin: 'المديرة', role_dev: 'المطوّر',
            ev_temporary_access: '{role} {name} (الحساب: {acc}) دخل(ت) بـ«دخول مؤقت» بدلاً من كلمة المرور — {date}.',
            ev_temporary_access_dev: 'حساب المطوّر {name} (الحساب: {acc}) استخدم استرجاع الدخول (دخول مؤقت) — {date}.',
            ev_temporary_access_repeated: 'دخول مؤقت متكرر: {role} {name} (الحساب: {acc}) استخدم الدخول المؤقت {n} مرات خلال {d} يوماً: {dates}. يُرجى إعطاؤه كلمة المرور.',
            fr_title: 'إعادة التعيين الكاملة (المديرة فقط)',
            fr_intro: 'هذا الإجراء يحذف بيانات المدرسة نهائياً. يتم على 4 مراحل. لا يُحذف شيء قبل المرحلة الأخيرة.',
            fr_s1: 'المرحلة 1 — ما الذي سيُحذف', fr_show: 'عرض القائمة', fr_kept: 'سيتم الاحتفاظ بـ:', fr_total: 'مجموع العناصر المحذوفة',
            fr_cloud: 'حذف ملفات التخزين السحابي أيضاً (صور، بطاقات، وصولات، شهادات، PDF). هذه الملفات ليست ضمن النسخة الاحتياطية.',
            fr_s2: 'المرحلة 2 — إنشاء نسخة احتياطية والتحقق منها', fr_backup: 'إنشاء النسخة الاحتياطية', fr_backupOk: 'تم إنشاء النسخة الاحتياطية والتحقق منها ({size}).', fr_download: 'تحميل النسخة الاحتياطية',
            fr_backupAge: 'يجب أن يكون عمر النسخة أقل من {m} دقيقة عند التنفيذ.',
            fr_s3: 'المرحلة 3 — تأكيد هويتك', fr_pw: 'كلمة المرور', fr_check: 'تحقق', fr_codeSent: 'تم إرسال رمز إلى بريد 2FA. أدخله في المرحلة 4.',
            fr_s4: 'المرحلة 4 — التأكيد النهائي', fr_code: 'الرمز المستلم بالبريد', fr_type: 'اكتب بالضبط: {p}', fr_understand: 'أفهم أن هذا الإجراء نهائي.',
            fr_go: 'حذف البيانات نهائياً', fr_last: 'تأكيد أخير: سيتم حذف كل البيانات المذكورة في المرحلة 1. متابعة؟',
            fr_done: 'تمت إعادة التعيين. النسخة الاحتياطية محفوظة: {f}', fr_running: 'جارٍ الحذف… لا تغلق الصفحة.',
            fr_needPrev: 'أكمل المرحلة السابقة أولاً.'
        },
        en: {
            forgot: 'Forgot password?',
            recTitle: 'Forgot password',
            recIntro: 'We will send a code to the recovery email registered in your account\'s 2FA settings. Your password will not be changed.',
            login: 'Your login (username or login email)',
            recEmail: 'Your recovery email (2FA email)',
            sendCode: 'Send the code', back: 'Back to login', sending: 'Sending…',
            codeSentTo: 'A 6-digit code was sent to', checkSpam: 'Can\'t find it? Check your spam folder.',
            codeLabel: 'Code received by email', validate: 'Confirm the code', resend: 'Send a new code', resendIn: 'New code in {s} s',
            codeValid: 'The code is valid for {m} minutes and can be used only once.',
            NO_RECOVERY_EMAIL: 'No recovery email is registered for this account. Please contact the Director.',
            EMAIL_MISMATCH: 'This email address is not the recovery email registered for this account.',
            ACCOUNT_NOT_FOUND: 'No account matches this login.',
            ACCOUNT_DISABLED: 'This account is deactivated. Please contact the Director.',
            MISSING_FIELDS: 'Please fill in both fields.',
            WRONG_CODE: 'Wrong code. {n} attempt(s) left.',
            TOO_MANY_ATTEMPTS: 'Too many wrong codes. Ask for a new code.',
            CODE_EXPIRED: 'This code has expired. Ask for a new code.',
            CODE_USED: 'This code has already been used. Ask for a new code.',
            CODE_REPLACED: 'This code is no longer valid: use the most recent code.',
            EMAIL_FAILED: 'The email could not be sent. Try again later or contact the Director.',
            TOO_MANY: 'Too many attempts. Please wait and try again.',
            WAIT: 'Please wait {s} seconds before asking for a new code.',
            generic: 'Something went wrong. Please try again.', codeFormat: 'The code has 6 digits.',
            tmpExpired: 'Your temporary access has expired. Log in with your password or ask for a new code.',
            tmpTitle: 'Temporary access',
            tmpMsg: 'You are using temporary access. Your permanent password has not changed. Please contact the Director to obtain your normal password.',
            tmpMsgOwner: 'You are using temporary access. Your permanent password has not changed. You can choose a new password below.',
            tmpUntil: 'This access ends at {t}.',
            newPwBtn: 'Choose a new password', newPw: 'New password (at least 8 characters)', newPw2: 'Repeat the new password',
            savePw: 'Save', pwMismatch: 'The two passwords are different.', pwSaved: 'New password saved. You will be logged out: log in again with it.',
            repTitle: 'Temporary access used several times',
            repMsg: 'You logged in {n} times with a temporary code in the last {d} days ({dates}). Ask the Director for your password so you can log in normally.',
            tfaTitle: 'Protect your account: turn on two-step verification (2FA)',
            tfaText1: 'With 2FA, after your password a code is sent to your personal email. Even if someone knows your password, they cannot get in without that code.',
            tfaText2: 'This email is also used to get back into your account if you forget your password ("Forgot password?" button).',
            tfaBtn: 'Turn on 2FA now',
            alertsPill: 'Security alerts', alertsTitle: 'Security alerts', alertsNone: 'No new alerts.',
            seen: 'Mark as seen', seenAll: 'Mark all as seen', history: 'Temporary access history', hideHistory: 'Hide history',
            colPerson: 'Person', colAccount: 'Account', colCount: 'Temporary logins ({d} days)', colDates: 'Dates',
            allEvents: 'All alerts (last 200)', repeatedTag: 'REPEATED',
            role_employee: 'Secretary', role_super_admin: 'Director', role_dev: 'Developer',
            ev_temporary_access: '{role} {name} (account: {acc}) logged in with TEMPORARY ACCESS instead of the permanent password — {date}.',
            ev_temporary_access_dev: 'The developer account {name} (account: {acc}) used account recovery (temporary access) — {date}.',
            ev_temporary_access_repeated: 'REPEATED TEMPORARY ACCESS: {role} {name} (account: {acc}) used temporary access {n} times in {d} days: {dates}. Consider giving them their password.',
            fr_title: 'Factory reset (Director only)',
            fr_intro: 'This permanently deletes the school\'s data. It has 4 steps. Nothing is deleted before the last step.',
            fr_s1: 'Step 1 — See what will be deleted', fr_show: 'Show the list', fr_kept: 'Kept:', fr_total: 'Total items deleted',
            fr_cloud: 'Also delete the cloud storage files (photos, ID cards, receipts, certificates, PDFs). These files are NOT in the backup.',
            fr_s2: 'Step 2 — Create and verify a backup', fr_backup: 'Create the backup', fr_backupOk: 'Backup created and verified ({size}).', fr_download: 'Download the backup',
            fr_backupAge: 'The backup must be less than {m} minutes old when the reset runs.',
            fr_s3: 'Step 3 — Confirm your identity', fr_pw: 'Your password', fr_check: 'Check', fr_codeSent: 'A code was sent to your 2FA email. Enter it in step 4.',
            fr_s4: 'Step 4 — Final confirmation', fr_code: 'Code received by email', fr_type: 'Type exactly: {p}', fr_understand: 'I understand this action is permanent.',
            fr_go: 'PERMANENTLY DELETE THE DATA', fr_last: 'Last confirmation: all the data listed in step 1 will be deleted. Continue?',
            fr_done: 'Factory reset completed. Backup kept: {f}', fr_running: 'Deleting… do not close the page.',
            fr_needPrev: 'Finish the previous step first.'
        }
    };
    // merge js/account-security-i18n.js (German + server messages, collection names, kept items for every language)
    const X = window.AccountSecurityI18n || {};
    for (const l of Object.keys(X)) { T[l] = Object.assign(T[l] || {}, X[l]); for (const [k, v] of Object.entries(X[l].cols || {})) T[l]['col_' + k] = v; }
    // same language as the rest of the admin panel (admin-dashboard.js: adminLanguage, default 'de')
    // Login page (sign-in, "Mot de passe oublié ?", code screen): always French, like the app's own 2FA code screen.
    // After sign-in: same language as the rest of the admin panel (admin-dashboard.js: adminLanguage, default 'de').
    const onLoginPage = () => { const p = document.getElementById('loginPage'); return !!p && p.style.display !== 'none'; };
    const lang = () => { if (onLoginPage()) return 'fr'; const l = localStorage.getItem('adminLanguage') || 'de'; return T[l] ? l : 'fr'; };
    const t = (k, vars) => { let s = (T[lang()] && T[lang()][k]) || T.fr[k] || k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.split('{' + a + '}').join(b); return s; };
    const locale = () => ({ fr: 'fr-FR', ar: 'ar-MA', en: 'en-GB', de: 'de-DE' }[lang()]);
    const fmt = d => new Date(d).toLocaleString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const fmtTime = d => new Date(d).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

    // ---------------------------------------------------------------- tiny DOM helper (text only)
    function h(tag, attrs, ...kids) {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            if (v === null || v === undefined || v === false) continue;
            if (k === 'style') el.style.cssText = v;
            else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
            else el.setAttribute(k, v === true ? '' : v);
        }
        for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
        return el;
    }
    const btn = (label, onclick, style, attrs) => h('button', { type: 'button', onclick, style: 'padding:11px 18px;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;' + (style || ''), ...(attrs || {}) }, label);
    const input = (attrs) => h('input', { style: 'width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font-size:15px;box-sizing:border-box;', ...attrs });
    const label = (text, forId) => h('label', { for: forId, style: 'display:block;font-weight:600;margin:12px 0 6px;color:#334155;font-size:14px;' }, text);
    const msgBox = () => h('div', { role: 'alert', style: 'display:none;margin-top:12px;padding:12px;border-radius:8px;font-size:14px;line-height:1.4;' });
    function show(box, text, kind) {
        box.textContent = text; box.style.display = text ? 'block' : 'none';
        const c = { error: ['#fef2f2', '#991b1b', '#fca5a5'], ok: ['#f0fdf4', '#166534', '#86efac'], info: ['#eff6ff', '#1e40af', '#93c5fd'], warn: ['#fffbeb', '#92400e', '#fcd34d'] }[kind || 'info'];
        box.style.background = c[0]; box.style.color = c[1]; box.style.border = '1px solid ' + c[2];
    }
    async function api(path, opts = {}) {
        const headers = { 'Content-Type': 'application/json' };
        const tok = opts.token === false ? null : localStorage.getItem('adminToken');
        if (tok) headers.Authorization = 'Bearer ' + tok;
        const r = await fetch(API + path, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined, keepalive: !!opts.keepalive });
        let data = {}; try { data = await r.json(); } catch { /* non-JSON */ }
        return { status: r.status, ok: r.ok, data };
    }
    // server answer → text in the chosen language (falls back to the server message)
    function srvMsg(d) {
        d = d || {};
        if (d.temporaryAccess) return t('err_TEMPORARY_ACCESS');
        if (d.code && (T.fr['err_' + d.code])) return t('err_' + d.code, { n: d.attemptsLeft, m: d.minutes, p: fr.confirmationText });
        return d.message || t('generic');
    }
    function errorText(r) {
        const d = r.data || {};
        if (d.code === 'WRONG_CODE') return t('WRONG_CODE', { n: d.attemptsLeft });
        if (d.code === 'WAIT_BEFORE_RESEND') return t('WAIT', { s: d.waitSeconds });
        if (d.code === 'TOO_MANY_REQUESTS' || d.code === 'TOO_MANY_CODES' || r.status === 429) return t('TOO_MANY');
        if (d.code && T.fr[d.code]) return t(d.code);
        return d.message || t('generic');
    }

    // ================================================================ 1. FORGOT PASSWORD (login page)
    let rec = { token: null, timer: null };
    function openRecovery() {
        const panel = document.getElementById('recoveryPanel');
        if (!panel) return;
        document.getElementById('loginForm').style.display = 'none';
        const tf = document.getElementById('twoFactorForm'); if (tf) tf.style.display = 'none';
        panel.style.display = 'block';
        panel.dir = lang() === 'ar' ? 'rtl' : 'ltr';
        stepRequest(panel);
    }
    function closeRecovery() {
        clearInterval(rec.timer);
        const panel = document.getElementById('recoveryPanel');
        panel.style.display = 'none'; panel.replaceChildren();
        document.getElementById('loginForm').style.display = 'block';
    }
    function stepRequest(panel, prefill) {
        const loginVal = (prefill && prefill.login) || document.getElementById('username')?.value || '';
        const loginIn = input({ id: 'recLogin', type: 'text', value: loginVal, autocomplete: 'username' });
        const emailIn = input({ id: 'recEmail', type: 'email', value: (prefill && prefill.email) || '', autocomplete: 'email', placeholder: 'exemple@gmail.com' });
        const box = msgBox();
        const send = btn(t('sendCode'), async () => {
            show(box, '');
            if (!loginIn.value.trim() || !emailIn.value.trim()) return show(box, t('MISSING_FIELDS'), 'error');
            send.disabled = true; send.textContent = t('sending');
            const r = await api('/api/account-security/recovery/request', { method: 'POST', token: false, body: { login: loginIn.value.trim(), email: emailIn.value.trim() } }).catch(() => ({ status: 0, data: {} }));
            send.disabled = false; send.textContent = t('sendCode');
            if (!r.ok) return show(box, errorText(r), r.data.code === 'NO_RECOVERY_EMAIL' ? 'warn' : 'error');
            rec.token = r.data.recoveryToken;
            stepCode(panel, r.data, { login: loginIn.value.trim(), email: emailIn.value.trim() });
        }, 'width:100%;margin-top:16px;background:#c0392b;color:#fff;font-size:16px;', { id: 'recSendBtn' });
        panel.replaceChildren(
            h('div', { style: 'text-align:center;margin-bottom:10px;' }, h('i', { class: 'fas fa-key', style: 'font-size:36px;color:#c0392b;' })),
            h('h3', { style: 'text-align:center;margin:0 0 8px;color:#1e293b;' }, t('recTitle')),
            h('p', { style: 'font-size:14px;color:#475569;line-height:1.5;margin:0 0 4px;' }, t('recIntro')),
            label(t('login'), 'recLogin'), loginIn,
            label(t('recEmail'), 'recEmail'), emailIn,
            send, box,
            btn(t('back'), closeRecovery, 'width:100%;margin-top:10px;background:none;color:#475569;font-weight:600;')
        );
        emailIn.addEventListener('keypress', e => { if (e.key === 'Enter') send.click(); });
        (loginVal ? emailIn : loginIn).focus();
    }
    function stepCode(panel, info, prefill) {
        const codeIn = input({ id: 'recCode', type: 'text', inputmode: 'numeric', maxlength: '6', autocomplete: 'one-time-code', placeholder: '000000', style: 'width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;text-align:center;font-size:26px;letter-spacing:8px;font-weight:bold;' });
        const box = msgBox();
        const resend = btn(t('resend'), async () => {
            show(box, '');
            const r = await api('/api/account-security/recovery/request', { method: 'POST', token: false, body: prefill }).catch(() => ({ status: 0, data: {} }));
            if (!r.ok) return show(box, errorText(r), 'error');
            rec.token = r.data.recoveryToken; show(box, t('codeSentTo') + ' ' + r.data.maskedEmail, 'ok'); countdown(r.data.resendWaitSeconds || 60);
        }, 'background:none;color:#c0392b;padding:8px 0;', { id: 'recResendBtn' });
        function countdown(s) {
            clearInterval(rec.timer); resend.disabled = true; resend.style.opacity = '.5';
            const tick = () => { if (s <= 0) { clearInterval(rec.timer); resend.disabled = false; resend.style.opacity = '1'; resend.textContent = t('resend'); return; } resend.textContent = t('resendIn', { s }); s--; };
            tick(); rec.timer = setInterval(tick, 1000);
        }
        const ok = btn(t('validate'), async () => {
            show(box, '');
            const code = codeIn.value.replace(/\s/g, '');
            if (!/^\d{6}$/.test(code)) return show(box, t('codeFormat'), 'error');
            ok.disabled = true;
            const r = await api('/api/account-security/recovery/verify', { method: 'POST', token: false, body: { recoveryToken: rec.token, code } }).catch(() => ({ status: 0, data: {} }));
            ok.disabled = false;
            if (!r.ok) return show(box, errorText(r), 'error');
            clearInterval(rec.timer);
            const a = r.data.admin;
            localStorage.setItem('adminToken', r.data.token);
            localStorage.setItem('isSuperAdmin', String(a.role === 'super_admin' || a.role === 'dev'));
            localStorage.setItem('adminUsername', a.username);
            localStorage.setItem('adminRole', a.role);
            localStorage.setItem('adminEmail', a.email || '');
            localStorage.setItem('temporaryAccess', '1');
            location.reload();
        }, 'width:100%;margin-top:16px;background:#c0392b;color:#fff;font-size:16px;', { id: 'recVerifyBtn' });
        panel.replaceChildren(
            h('div', { style: 'text-align:center;margin-bottom:12px;' },
                h('i', { class: 'fas fa-envelope-open-text', style: 'font-size:36px;color:#c0392b;' }),
                h('p', { style: 'font-size:14px;color:#475569;margin:10px 0 2px;' }, t('codeSentTo') + ' ', h('strong', {}, info.maskedEmail)),
                h('p', { style: 'font-size:12px;color:#64748b;margin:0;' }, t('checkSpam')),
                h('p', { style: 'font-size:12px;color:#64748b;margin:4px 0 0;' }, t('codeValid', { m: info.expiresInMinutes }))),
            label(t('codeLabel'), 'recCode'), codeIn, ok, box,
            h('div', { style: 'display:flex;justify-content:space-between;margin-top:10px;' }, resend,
                btn(t('back'), () => stepRequest(panel, prefill), 'background:none;color:#475569;font-weight:600;padding:8px 0;'))
        );
        codeIn.addEventListener('keypress', e => { if (e.key === 'Enter') ok.click(); });
        codeIn.focus(); countdown(info.resendWaitSeconds || 60);
    }

    // ================================================================ 2. DASHBOARD BANNERS
    let dashState = { started: false, poll: null };
    function bannerArea() {
        let area = document.getElementById('securityBanners');
        if (!area) {
            area = h('div', { id: 'securityBanners', style: 'margin:0 0 18px;display:flex;flex-direction:column;gap:14px;' });
            const main = document.querySelector('.main-content'); const topbar = main?.querySelector('.topbar');
            if (topbar) topbar.after(area); else main?.prepend(area);
        }
        area.dir = lang() === 'ar' ? 'rtl' : 'ltr';
        return area;
    }
    const card = (bg, border, color, icon, title, ...body) => h('div', { style: `background:${bg};border:2px solid ${border};border-radius:12px;padding:18px 20px;color:${color};` },
        h('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:8px;' }, h('i', { class: 'fas ' + icon, style: 'font-size:22px;' }), h('strong', { style: 'font-size:17px;' }, title)),
        ...body);

    function logoutNow(message) {
        if (message) sessionStorage.setItem('loginNotice', message);
        ['adminToken', 'isSuperAdmin', 'adminUsername', 'adminRole', 'temporaryAccess'].forEach(k => localStorage.removeItem(k));
        location.reload();
    }

    async function onDashboard() {
        if (!localStorage.getItem('adminToken')) return;
        dashState.started = true;
        const r = await api('/api/account-security/me').catch(() => null);
        if (!r) return;
        if (r.status === 401) {
            if (localStorage.getItem('temporaryAccess') === '1' || r.data.temporaryAccessExpired) return logoutNow(t('tmpExpired'));
            return;
        }
        if (!r.ok) return;
        const me = r.data;
        if (me.temporaryAccess.active) localStorage.setItem('temporaryAccess', '1'); else localStorage.removeItem('temporaryAccess');
        const area = bannerArea(); area.replaceChildren();

        // a) temporary access
        if (me.temporaryAccess.active) {
            const owner = me.canSetNewPassword;
            const parts = [h('p', { style: 'margin:0 0 6px;font-size:15px;line-height:1.5;' }, owner ? t('tmpMsgOwner') : t('tmpMsg')),
                h('p', { style: 'margin:0;font-size:14px;font-weight:600;' }, t('tmpUntil', { t: fmtTime(me.temporaryAccess.expiresAt) }))];
            if (owner) {
                const form = h('div', { style: 'display:none;margin-top:12px;max-width:420px;' });
                const p1 = input({ id: 'tmpNewPw', type: 'password', autocomplete: 'new-password' }), p2 = input({ id: 'tmpNewPw2', type: 'password', autocomplete: 'new-password' });
                const box = msgBox();
                form.append(label(t('newPw'), 'tmpNewPw'), p1, label(t('newPw2'), 'tmpNewPw2'), p2,
                    btn(t('savePw'), async () => {
                        if (p1.value !== p2.value) return show(box, t('pwMismatch'), 'error');
                        const s = await api('/api/account-security/recovery/set-password', { method: 'POST', body: { newPassword: p1.value } });
                        if (!s.ok) return show(box, srvMsg(s.data), 'error');
                        show(box, t('pwSaved'), 'ok'); setTimeout(() => logoutNow(t('pwSaved')), 2500);
                    }, 'margin-top:12px;background:#b45309;color:#fff;'), box);
                parts.push(btn(t('newPwBtn'), () => { form.style.display = form.style.display === 'none' ? 'block' : 'none'; }, 'margin-top:12px;background:#b45309;color:#fff;', { id: 'tmpNewPwBtn' }), form);
            }
            area.append(card('#fff7ed', '#f97316', '#9a3412', 'fa-user-clock', t('tmpTitle'), ...parts));
            clearInterval(dashState.poll);
            dashState.poll = setInterval(async () => {
                const c = await api('/api/account-security/me').catch(() => null);
                if (c && c.status === 401) logoutNow(t('tmpExpired'));
            }, 60000);
        }
        // b) repeated temporary access (secretary)
        if (me.repeatedWarning) {
            area.append(card('#fef2f2', '#ef4444', '#991b1b', 'fa-triangle-exclamation', t('repTitle'),
                h('p', { style: 'margin:0;font-size:15px;line-height:1.5;' }, t('repMsg', { n: me.temporaryLogins.count, d: me.temporaryLogins.windowDays, dates: me.temporaryLogins.dates.map(fmt).join(', ') }))));
        }
        // c) 2FA reminder — stays until 2FA is enabled (not dismissible)
        if (!me.twoFactorEnabled) {
            area.append(card('#fefce8', '#eab308', '#713f12', 'fa-shield-halved', t('tfaTitle'),
                h('p', { style: 'margin:0 0 6px;font-size:15px;line-height:1.5;' }, t('tfaText1')),
                h('p', { style: 'margin:0 0 12px;font-size:15px;line-height:1.5;' }, t('tfaText2')),
                btn(t('tfaBtn'), go2FASettings, 'background:#ca8a04;color:#fff;font-size:15px;', { id: 'tfaReminderBtn' })));
        }
        // d) Director alerts
        if (me.role === 'super_admin') await renderAlerts();
        if (me.role === 'super_admin') renderFactoryReset();
    }
    function go2FASettings() {
        const item = document.getElementById('settingsMenuItem');
        if (item) item.click();
        setTimeout(() => { const el = document.getElementById('twoFactorStatus') || document.getElementById('twoFactorSetupEmail'); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); document.getElementById('twoFactorSetupEmail')?.focus(); }, 300);
    }

    // ================================================================ 3. DIRECTOR SECURITY ALERTS
    function eventSentence(e) {
        const role = t('role_' + e.adminRole);
        if (e.type === 'temporary_access_repeated') {
            const m = e.meta || {};
            return t('ev_temporary_access_repeated', { role, name: e.adminName, acc: e.accountLogin, n: m.count, d: m.windowDays, dates: (m.dates || []).map(fmt).join(', ') });
        }
        if (e.type === 'temporary_access') return t(e.adminRole === 'dev' ? 'ev_temporary_access_dev' : 'ev_temporary_access', { role, name: e.adminName, acc: e.accountLogin, date: fmt(e.createdAt) });
        return `${fmt(e.createdAt)} — ${e.adminName}: ${e.details}`;
    }
    async function renderAlerts() {
        const r = await api('/api/account-security/alerts').catch(() => null);
        if (!r || !r.ok) return;
        const d = r.data;
        // topbar pill (visible on every tab)
        let pill = document.getElementById('securityAlertsPill');
        if (!pill) {
            pill = h('button', { id: 'securityAlertsPill', type: 'button', class: 'topbar-btn', style: 'border:none;border-radius:20px;padding:8px 14px;font-weight:700;cursor:pointer;margin-inline-end:8px;',
                onclick: () => { document.querySelector('.menu-item[data-tab="dashboard"]')?.click(); setTimeout(() => document.getElementById('securityAlertsCard')?.scrollIntoView({ behavior: 'smooth' }), 200); } });
            document.querySelector('.topbar-right')?.prepend(pill);
        }
        pill.replaceChildren(h('i', { class: 'fas fa-user-shield' }), ' ' + t('alertsPill') + ' (' + d.unseenCount + ')');
        pill.style.background = d.unseenCount ? '#dc2626' : '#e2e8f0'; pill.style.color = d.unseenCount ? '#fff' : '#334155';

        const list = h('div', { style: 'display:flex;flex-direction:column;gap:8px;' });
        if (!d.unseen.length) list.append(h('p', { style: 'margin:0;color:#475569;' }, t('alertsNone')));
        for (const e of d.unseen) {
            const rep = e.type === 'temporary_access_repeated';
            list.append(h('div', { class: 'security-alert-item', style: `display:flex;gap:12px;align-items:flex-start;justify-content:space-between;background:${rep ? '#fee2e2' : '#fff'};border:1px solid ${rep ? '#f87171' : '#e2e8f0'};border-radius:8px;padding:10px 12px;` },
                h('div', { style: 'font-size:14px;line-height:1.45;color:#1e293b;' }, rep ? h('strong', { style: 'color:#b91c1c;' }, '[' + t('repeatedTag') + '] ') : '', eventSentence(e)),
                btn(t('seen'), async () => { await api('/api/account-security/alerts/' + e.id + '/seen', { method: 'POST' }); renderAlerts(); }, 'background:#e2e8f0;color:#1e293b;padding:6px 10px;font-size:12px;white-space:nowrap;')));
        }
        // history
        const hist = h('div', { style: 'display:none;margin-top:12px;' });
        const table = h('table', { style: 'width:100%;border-collapse:collapse;font-size:13px;background:#fff;' },
            h('tr', {}, ...[t('colPerson'), t('colAccount'), t('colCount', { d: d.settings.windowDays }), t('colDates')].map(x => h('th', { style: 'text-align:start;border-bottom:2px solid #e2e8f0;padding:6px;' }, x))),
            ...d.temporaryLoginsByAccount.map(a => h('tr', { style: a.repeated ? 'background:#fee2e2;' : '' },
                h('td', { style: 'padding:6px;border-bottom:1px solid #f1f5f9;' }, `${t('role_' + a.adminRole)} ${a.adminName}`),
                h('td', { style: 'padding:6px;border-bottom:1px solid #f1f5f9;' }, a.accountLogin),
                h('td', { style: 'padding:6px;border-bottom:1px solid #f1f5f9;font-weight:700;' }, String(a.count), a.repeated ? ' (' + t('repeatedTag') + ')' : ''),
                h('td', { style: 'padding:6px;border-bottom:1px solid #f1f5f9;' }, a.dates.map(fmt).join(', ')))));
        const all = h('ul', { style: 'margin:8px 0 0;padding-inline-start:18px;font-size:13px;color:#334155;' }, ...d.history.map(e => h('li', { style: 'margin:3px 0;' }, eventSentence(e))));
        hist.append(table, h('h4', { style: 'margin:14px 0 4px;' }, t('allEvents')), all);
        const toggle = btn(t('history'), () => { const o = hist.style.display === 'none'; hist.style.display = o ? 'block' : 'none'; toggle.textContent = o ? t('hideHistory') : t('history'); }, 'background:#334155;color:#fff;font-size:13px;padding:8px 12px;', { id: 'securityHistoryBtn' });

        const old = document.getElementById('securityAlertsCard');
        const box = h('div', { id: 'securityAlertsCard', class: 'section-card', dir: lang() === 'ar' ? 'rtl' : 'ltr', style: `margin-bottom:20px;border:2px solid ${d.unseenCount ? '#dc2626' : '#cbd5e1'};border-radius:12px;padding:18px 20px;background:${d.unseenCount ? '#fff5f5' : '#f8fafc'};` },
            h('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;' },
                h('h2', { style: 'margin:0;font-size:18px;color:' + (d.unseenCount ? '#b91c1c' : '#1e293b') + ';' }, h('i', { class: 'fas fa-user-shield' }), ` ${t('alertsTitle')} (${d.unseenCount})`),
                h('div', { style: 'display:flex;gap:8px;' }, d.unseenCount ? btn(t('seenAll'), async () => { await api('/api/account-security/alerts/seen-all', { method: 'POST' }); renderAlerts(); }, 'background:#dc2626;color:#fff;font-size:13px;padding:8px 12px;') : '', toggle)),
            list, hist);
        if (old) old.replaceWith(box); else document.getElementById('dashboardTab')?.prepend(box);
    }

    // ================================================================ 4. FACTORY RESET (Director)
    const fr = { backupId: null, ticket: null, codeRequired: false, confirmationText: 'SUPPRIMER TOUTES LES DONNEES' };
    function renderFactoryReset() {
        const body = document.getElementById('factoryResetBody');
        if (!body || body.dataset.ready) return;
        body.dataset.ready = '1';
        body.dir = lang() === 'ar' ? 'rtl' : 'ltr';
        const title = document.getElementById('factoryResetTitle'); if (title) title.textContent = t('fr_title');
        const step = (n, ttl, ...c) => h('div', { id: 'frStep' + n, style: 'border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin-top:14px;background:#fff;' }, h('h4', { style: 'margin:0 0 10px;color:#991b1b;' }, ttl), ...c);

        // step 1
        const s1box = h('div', {}), s1msg = msgBox();
        const cloud = h('input', { type: 'checkbox', id: 'frCloud' });
        const cloudRow = h('label', { for: 'frCloud', style: 'display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:14px;color:#7f1d1d;' }, cloud, t('fr_cloud'));
        const show1 = btn(t('fr_show'), async () => {
            const r = await api('/api/factory-reset/preview');
            if (!r.ok) return show(s1msg, srvMsg(r.data), 'error');
            fr.confirmationText = r.data.confirmationText;
            const rows = r.data.items.map(i => h('tr', {}, h('td', { style: 'padding:4px 6px;border-bottom:1px solid #f1f5f9;' }, t('col_' + i.name.replace(/[^A-Za-z]/g, ''))), h('td', { style: 'padding:4px 6px;border-bottom:1px solid #f1f5f9;font-family:monospace;color:#64748b;' }, i.name), h('td', { style: 'padding:4px 6px;border-bottom:1px solid #f1f5f9;text-align:end;font-weight:700;' }, String(i.count))));
            s1box.replaceChildren(
                h('table', { id: 'frPreviewTable', style: 'width:100%;border-collapse:collapse;font-size:13px;' }, ...rows, h('tr', {}, h('td', { style: 'padding:6px;font-weight:700;' }, t('fr_total')), h('td', {}), h('td', { style: 'padding:6px;text-align:end;font-weight:700;' }, String(r.data.total)))),
                h('p', { style: 'margin:10px 0 4px;font-weight:700;color:#166534;' }, t('fr_kept')), h('ul', { style: 'margin:0;padding-inline-start:18px;font-size:13px;color:#166534;' }, ...['kept1', 'kept2', 'kept3', 'kept4'].map(k => h('li', {}, t(k)))),
                h('p', { style: 'margin:10px 0 0;font-size:13px;color:#475569;' }, t('fr_cloudFolders') + ' ' + r.data.megaFolders.join(', ')), cloudRow);
        }, 'background:#fee2e2;color:#991b1b;', { id: 'frShowBtn' });

        // step 2
        const s2msg = msgBox(), s2extra = h('div', {});
        const mkBackup = btn(t('fr_backup'), async () => {
            mkBackup.disabled = true; show(s2msg, '…', 'info');
            const r = await api('/api/factory-reset/backup', { method: 'POST' });
            mkBackup.disabled = false;
            if (!r.ok || !r.data.backup?.verified) return show(s2msg, srvMsg(r.data), 'error');
            fr.backupId = r.data.backup.id; fr.ticket = null;
            show(s2msg, t('fr_backupOk', { size: (r.data.backup.sizeBytes / 1024).toFixed(1) + ' KB' }) + ' SHA-256: ' + r.data.backup.sha256.slice(0, 16) + '…', 'ok');
            s2extra.replaceChildren(btn(t('fr_download'), async () => {
                const res = await fetch(API + '/api/factory-reset/backup/' + fr.backupId + '/download', { headers: { Authorization: 'Bearer ' + localStorage.getItem('adminToken') } });
                const blob = await res.blob(); const a = h('a', { href: URL.createObjectURL(blob), download: r.data.backup.filename }); document.body.append(a); a.click(); a.remove();
            }, 'margin-top:8px;background:#334155;color:#fff;', { id: 'frDownloadBtn' }));
        }, 'background:#b91c1c;color:#fff;', { id: 'frBackupBtn' });

        // step 3
        const pw = input({ id: 'frPassword', type: 'password', autocomplete: 'current-password', style: 'width:100%;max-width:360px;padding:12px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;' });
        const s3msg = msgBox();
        const check = btn(t('fr_check'), async () => {
            if (!fr.backupId) return show(s3msg, t('fr_needPrev'), 'error');
            const r = await api('/api/factory-reset/verify-identity', { method: 'POST', body: { password: pw.value, backupId: fr.backupId } });
            if (!r.ok) return show(s3msg, srvMsg(r.data), 'error');
            fr.ticket = r.data.ticket; fr.codeRequired = r.data.codeRequired; pw.value = '';
            codeWrap.style.display = fr.codeRequired ? 'block' : 'none';
            show(s3msg, (fr.codeRequired ? t('fr_codeSent') : '') + (r.data.warningCode ? ' ' + t('warn_' + r.data.warningCode) : '') || 'OK', fr.codeRequired ? 'ok' : 'warn');
        }, 'margin-top:10px;background:#b91c1c;color:#fff;', { id: 'frCheckBtn' });

        // step 4
        const codeIn = input({ id: 'frCode', type: 'text', inputmode: 'numeric', maxlength: '6', style: 'width:100%;max-width:200px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:20px;letter-spacing:6px;text-align:center;' });
        const codeWrap = h('div', { style: 'display:none;' }, label(t('fr_code'), 'frCode'), codeIn);
        const phrase = input({ id: 'frPhrase', type: 'text', autocomplete: 'off', style: 'width:100%;padding:12px;border:2px solid #ef4444;border-radius:8px;font-family:monospace;font-size:15px;box-sizing:border-box;' });
        const understand = h('input', { type: 'checkbox', id: 'frUnderstand' });
        const s4msg = msgBox();
        const go = btn(t('fr_go'), async () => {
            if (!fr.ticket) return show(s4msg, t('fr_needPrev'), 'error');
            if (!confirm(t('fr_last'))) return;
            go.disabled = true; show(s4msg, t('fr_running'), 'warn');
            const r = await api('/api/factory-reset/execute', { method: 'POST', body: { ticket: fr.ticket, code: codeIn.value, confirmationText: phrase.value, includeCloudFiles: document.getElementById('frCloud')?.checked || false } });
            if (!r.ok) { go.disabled = false; return show(s4msg, srvMsg(r.data), 'error'); }
            fr.ticket = null;
            show(s4msg, t('fr_done', { f: r.data.backupFile }), 'ok');
        }, 'margin-top:14px;width:100%;padding:15px;background:#7f1d1d;color:#fff;font-size:16px;', { id: 'frExecuteBtn', disabled: true });
        const refresh = () => { const okPhrase = phrase.value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase() === fr.confirmationText; go.disabled = !(okPhrase && understand.checked); go.style.opacity = go.disabled ? '.45' : '1'; };
        phrase.addEventListener('input', refresh); understand.addEventListener('change', refresh); refresh();

        body.replaceChildren(
            h('p', { style: 'color:#991b1b;font-weight:600;margin:0;' }, t('fr_intro')),
            step(1, t('fr_s1'), show1, s1box, s1msg),
            step(2, t('fr_s2'), h('p', { style: 'margin:0 0 8px;font-size:13px;color:#475569;' }, t('fr_backupAge', { m: 30 })), mkBackup, s2msg, s2extra),
            step(3, t('fr_s3'), label(t('fr_pw'), 'frPassword'), pw, h('div', {}, check), s3msg),
            step(4, t('fr_s4'), codeWrap, label(t('fr_type', { p: fr.confirmationText }), 'frPhrase'), phrase,
                h('label', { for: 'frUnderstand', style: 'display:flex;gap:8px;align-items:center;margin-top:10px;font-weight:600;color:#7f1d1d;' }, understand, t('fr_understand')), go, s4msg)
        );
    }

    // ================================================================ wiring
    // CFG-03: visible badge when this is not the production site (local/development database)
    function showEnvironmentBadge() {
        fetch(API + '/api/health').then(r => r.json()).then(h => {
            if (h.environment === 'production' && h.database !== 'local') return;
            const b = h && h.database === 'local' ? 'LOCAL — base de développement' : 'HORS PRODUCTION';
            const el = document.createElement('div');
            el.id = 'envBadge';
            el.textContent = b;
            el.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:99999;background:#0f766e;color:#fff;font:700 12px Arial;padding:6px 10px;border-radius:6px;opacity:.9;pointer-events:none;';
            document.body.appendChild(el);
        }).catch(() => {});
    }

    function initLoginPage() {
        showEnvironmentBadge();
        const link = document.getElementById('forgotPasswordLink'); if (link) link.textContent = t('forgot');
        const notice = sessionStorage.getItem('loginNotice');
        if (notice) {
            sessionStorage.removeItem('loginNotice');
            const el = document.getElementById('loginError');
            if (el) { el.textContent = notice; el.style.display = 'block'; }
        }
        // a normal password login replaces any temporary access
        document.getElementById('loginForm')?.addEventListener('submit', () => localStorage.removeItem('temporaryAccess'), true);
        // logout closes a temporary session on the server too
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (localStorage.getItem('temporaryAccess') === '1') api('/api/account-security/logout', { method: 'POST', keepalive: true }).catch(() => {});
            localStorage.removeItem('temporaryAccess');
        }, true);
        // refresh the banners right after 2FA is turned on or off in Settings
        for (const fn of ['enable2FA', 'disable2FA']) {
            const orig = window[fn];
            if (typeof orig === 'function' && !orig.__wrapped) {
                const wrapped = async function (...args) { const out = await orig.apply(this, args); if (dashState.started) onDashboard(); return out; };
                wrapped.__wrapped = true; window[fn] = wrapped;
            }
        }
        // re-draw texts after a language change
        document.querySelectorAll('.language-option').forEach(o => o.addEventListener('click', () => setTimeout(() => {
            if (document.getElementById('forgotPasswordLink')) document.getElementById('forgotPasswordLink').textContent = t('forgot');
            if (dashState.started) { const b = document.getElementById('factoryResetBody'); if (b) delete b.dataset.ready; onDashboard(); }
        }, 300)));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLoginPage); else initLoginPage();

    window.AccountSecurity = { openRecovery, onDashboard, renderFactoryReset, renderAlerts };
})();
