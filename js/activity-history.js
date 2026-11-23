// ACT-01 — Director / development team: activity history screen ("Journal d'activité" tab).
// Answers: what did this secretary do today? who deleted this student? who changed this payment / attendance?
// All text is inserted with textContent (never as HTML). Read-only: entries cannot be changed or deleted.
(function () {
    'use strict';
    const API = window.location.origin;
    const L = {
        fr: { title: 'Historique d\'activité', who: 'Compte', role: 'Rôle', module: 'Domaine', action: 'Action', from: 'Du', to: 'Au', search: 'Élève, nom ou mot-clé', apply: 'Afficher', reset: 'Effacer les filtres', today: 'Aujourd\'hui', more: 'Afficher plus', none: 'Aucune activité pour ces filtres.', all: 'Tous', date: 'Date et heure', change: 'Changement', reason: 'Raison', record: 'Concerné', history: 'Tout l\'historique de cet élément', total: '{n} activité(s)', temp: 'accès temporaire', deleted: 'supprimé', created: 'créé',
              roles: { super_admin: 'Directrice', dev: 'Développeur', employee: 'Secrétaire', teacher: 'Professeur', student: 'Élève', public: 'Site public', system: 'Système' },
              modules: { students: 'Élèves', groups: 'Groupes', payments: 'Paiements', cash: 'Caisse', attendance: 'Présences', grades: 'Notes', registrations: 'Inscriptions', accounts: 'Comptes', settings: 'Réglages', seasons: 'Saisons', messages: 'Messages', services: 'Services', system: 'Autre' } },
        ar: { title: 'سجل النشاط', who: 'الحساب', role: 'الدور', module: 'المجال', action: 'الإجراء', from: 'من', to: 'إلى', search: 'التلميذ، الاسم أو كلمة', apply: 'عرض', reset: 'مسح الفلاتر', today: 'اليوم', more: 'عرض المزيد', none: 'لا يوجد نشاط لهذه الفلاتر.', all: 'الكل', date: 'التاريخ والساعة', change: 'التغيير', reason: 'السبب', record: 'المعني', history: 'كل سجل هذا العنصر', total: '{n} نشاط', temp: 'دخول مؤقت', deleted: 'محذوف', created: 'مُنشأ',
              roles: { super_admin: 'المديرة', dev: 'المطوّر', employee: 'السكرتيرة', teacher: 'الأستاذ', student: 'التلميذ', public: 'الموقع العام', system: 'النظام' },
              modules: { students: 'التلاميذ', groups: 'المجموعات', payments: 'الأداءات', cash: 'الصندوق', attendance: 'الحضور', grades: 'النقط', registrations: 'التسجيلات', accounts: 'الحسابات', settings: 'الإعدادات', seasons: 'المواسم', messages: 'الرسائل', services: 'الخدمات', system: 'أخرى' } },
        en: { title: 'Activity history', who: 'Account', role: 'Role', module: 'Area', action: 'Action', from: 'From', to: 'To', search: 'Student, name or keyword', apply: 'Show', reset: 'Clear filters', today: 'Today', more: 'Show more', none: 'No activity for these filters.', all: 'All', date: 'Date and time', change: 'Change', reason: 'Reason', record: 'Concerns', history: 'Full history of this item', total: '{n} activities', temp: 'temporary access', deleted: 'deleted', created: 'created',
              roles: { super_admin: 'Director', dev: 'Developer', employee: 'Secretary', teacher: 'Teacher', student: 'Student', public: 'Public website', system: 'System' },
              modules: { students: 'Students', groups: 'Groups', payments: 'Payments', cash: 'Cash register', attendance: 'Attendance', grades: 'Grades', registrations: 'Registrations', accounts: 'Accounts', settings: 'Settings', seasons: 'Seasons', messages: 'Messages', services: 'Services', system: 'Other' } },
        de: { title: 'Aktivitätsverlauf', who: 'Konto', role: 'Rolle', module: 'Bereich', action: 'Aktion', from: 'Von', to: 'Bis', search: 'Schüler, Name oder Stichwort', apply: 'Anzeigen', reset: 'Filter löschen', today: 'Heute', more: 'Mehr anzeigen', none: 'Keine Aktivität für diese Filter.', all: 'Alle', date: 'Datum und Uhrzeit', change: 'Änderung', reason: 'Grund', record: 'Betrifft', history: 'Gesamter Verlauf dieses Eintrags', total: '{n} Aktivität(en)', temp: 'vorübergehender Zugang', deleted: 'gelöscht', created: 'erstellt',
              roles: { super_admin: 'Direktorin', dev: 'Entwickler', employee: 'Sekretärin', teacher: 'Lehrer', student: 'Schüler', public: 'Öffentliche Website', system: 'System' },
              modules: { students: 'Schüler', groups: 'Gruppen', payments: 'Zahlungen', cash: 'Kasse', attendance: 'Anwesenheit', grades: 'Noten', registrations: 'Anmeldungen', accounts: 'Konten', settings: 'Einstellungen', seasons: 'Saisons', messages: 'Nachrichten', services: 'Dienste', system: 'Sonstiges' } }
    };
    // Readable action names (French + Arabic shown according to the language; English used otherwise)
    const ACTIONS = {
        'student.created': ['Élève créé', 'إنشاء تلميذ', 'Student created'], 'student.updated': ['Fiche élève modifiée', 'تعديل ملف التلميذ', 'Student updated'],
        'student.deleted': ['Élève supprimé', 'حذف تلميذ', 'Student deleted'], 'student.status_changed': ['Élève activé / désactivé', 'تغيير حالة التلميذ', 'Student status changed'],
        'student.group_changed': ['Élève changé de groupe', 'تغيير مجموعة التلميذ', 'Student moved to another group'], 'student.payment_details_changed': ['Paiement de l\'élève modifié', 'تعديل أداء التلميذ', 'Student payment details changed'],
        'payment.marked_paid': ['Paiement marqué payé', 'تسجيل الأداء', 'Payment marked as paid'], 'group.updated': ['Groupe modifié', 'تعديل مجموعة', 'Group updated'], 'group.deleted': ['Groupe supprimé', 'حذف مجموعة', 'Group deleted'],
        'subgroup.updated': ['Sous-groupe modifié', 'تعديل مجموعة فرعية', 'Subgroup updated'], 'subgroup.deleted': ['Sous-groupe supprimé', 'حذف مجموعة فرعية', 'Subgroup deleted'],
        'cash.created': ['Opération de caisse ajoutée', 'إضافة عملية صندوق', 'Cash entry added'], 'cash.updated': ['Opération de caisse modifiée', 'تعديل عملية صندوق', 'Cash entry changed'], 'cash.deleted': ['Opération de caisse supprimée', 'حذف عملية صندوق', 'Cash entry deleted'],
        'attendance.corrected': ['Présence corrigée', 'تصحيح الحضور', 'Attendance corrected'], 'attendance.absence_deleted': ['Absence supprimée', 'حذف غياب', 'Absence deleted'], 'attendance.bulk_deleted': ['Présences d\'un groupe supprimées', 'حذف حضور مجموعة', 'Group attendance deleted'],
        'attendance.manual_entered': ['Présence saisie manuellement', 'إدخال الحضور يدوياً', 'Manual attendance entered'], 'attendance.qr_session_opened': ['Séance QR ouverte', 'فتح حصة QR', 'QR session opened'], 'attendance.qr_session_cancelled': ['Séance QR annulée', 'إلغاء حصة QR', 'QR session cancelled'], 'attendance.scanned': ['Élève a scanné (présent)', 'التلميذ سجّل حضوره', 'Student scanned (present)'],
        'grade.created': ['Note ajoutée', 'إضافة نقطة', 'Grade added'], 'grade.updated': ['Note modifiée', 'تعديل نقطة', 'Grade changed'], 'grade.comment_changed': ['Commentaire de note modifié', 'تعديل ملاحظة النقطة', 'Grade comment changed'], 'grade.deleted': ['Note supprimée', 'حذف نقطة', 'Grade deleted'],
        'registration.received': ['Inscription en ligne reçue', 'استلام تسجيل عبر الإنترنت', 'Online registration received'], 'registration.approved': ['Inscription approuvée', 'قبول التسجيل', 'Registration approved'], 'registration.rejected': ['Inscription refusée', 'رفض التسجيل', 'Registration rejected'],
        'registration.deleted': ['Inscription supprimée', 'حذف التسجيل', 'Registration deleted'], 'registration.updated': ['Inscription modifiée', 'تعديل التسجيل', 'Registration changed'], 'registration.created_front_desk': ['Inscription au guichet', 'تسجيل في الشباك', 'Front-desk registration'],
        'account.login': ['Connexion', 'تسجيل الدخول', 'Login'], 'account.logout': ['Déconnexion', 'تسجيل الخروج', 'Logout'], 'account.temporary_access': ['Accès temporaire utilisé', 'استعمال الدخول المؤقت', 'Temporary access used'],
        'account.password_changed_after_recovery': ['Nouveau mot de passe choisi (récupération)', 'كلمة مرور جديدة (استرجاع)', 'New password set (recovery)'], 'account.2fa_enabled': ['2FA activée', 'تفعيل 2FA', '2FA turned on'], 'account.2fa_disabled': ['2FA désactivée', 'إلغاء 2FA', '2FA turned off'], 'account.2fa_email_changed': ['E-mail 2FA modifié', 'تغيير بريد 2FA', '2FA email changed'],
        'account.activation_changed': ['Compte activé / désactivé', 'تفعيل / تعطيل حساب', 'Account activated / deactivated'], 'account.deleted': ['Compte supprimé', 'حذف حساب', 'Account deleted'], 'account.password_set': ['Mot de passe d\'une secrétaire changé', 'تغيير كلمة مرور سكرتيرة', 'Secretary password set'],
        'teacher.updated': ['Professeur modifié', 'تعديل أستاذ', 'Teacher updated'], 'teacher.deleted': ['Professeur supprimé', 'حذف أستاذ', 'Teacher deleted'],
        'settings.changed': ['Réglages modifiés', 'تعديل الإعدادات', 'Settings changed'], 'season.updated': ['Saison modifiée', 'تعديل الموسم', 'Season updated'], 'season.deleted': ['Saison supprimée', 'حذف الموسم', 'Season deleted'], 'season.activated': ['Saison activée', 'تفعيل الموسم', 'Season activated'], 'season.archived': ['Saison archivée', 'أرشفة الموسم', 'Season archived']
    };
    const FIELDS = { status: 'Statut', paymentStatus: 'Statut paiement', paymentDate: 'Échéance', paymentAmount: 'Montant', paymentPlan: 'Formule', groupName: 'Groupe', branchSubgroupName: 'Sous-groupe', fullName: 'Nom', phoneNumber: 'Téléphone', parentPhone: 'Tél. parent', score: 'Note', maxScore: 'Sur', comments: 'Commentaire', amount: 'Montant', category: 'Catégorie', type: 'Type', description: 'Description', isActive: 'Actif', notes: 'Notes', name: 'Nom', schoolEmail: 'E-mail école', formation: 'Formation', filiere: 'Filière', reminderDaysBefore: 'Rappel (jours avant)', city: 'Ville', formationChoisie: 'Formation', group: 'Groupe', present: 'Présents', late: 'Retards', absent: 'Absents' };
    const lang = () => { const l = localStorage.getItem('adminLanguage') || 'de'; return L[l] ? l : 'fr'; };
    const t = k => (L[lang()] || L.fr)[k];
    const actionName = a => { const x = ACTIONS[a]; if (!x) return a; return lang() === 'fr' ? x[0] : lang() === 'ar' ? x[1] : x[2]; };
    const fmt = d => new Date(d).toLocaleString({ fr: 'fr-FR', ar: 'ar-MA', en: 'en-GB', de: 'de-DE' }[lang()], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const val = v => v === null || v === undefined || v === '' ? '—' : (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) ? new Date(v).toLocaleDateString('fr-FR') : Array.isArray(v) ? (v.length ? v.join(', ') : '—') : typeof v === 'object' ? JSON.stringify(v).slice(0, 80) : String(v);
    function h(tag, attrs, ...kids) {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs || {})) { if (v == null) continue; if (k === 'style') el.style.cssText = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v); }
        for (const c of kids.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
        return el;
    }
    const api = async path => { const r = await fetch(API + path, { headers: { Authorization: 'Bearer ' + localStorage.getItem('adminToken') } }); return r.json(); };

    const state = { page: 1, filters: {} };
    function changeText(e) {
        const b = e.before || {}, a = e.after || {};
        const keys = [...new Set([...Object.keys(b || {}), ...Object.keys(a || {})])].filter(k => k !== 'records');
        if (!keys.length) return e.details || '';
        if (!e.after && e.before) return keys.map(k => `${FIELDS[k] || k}: ${val(b[k])}`).join(' · ');
        if (!e.before && e.after) return keys.map(k => `${FIELDS[k] || k}: ${val(a[k])}`).join(' · ');
        return keys.map(k => `${FIELDS[k] || k}: ${val(b[k])} → ${val(a[k])}`).join(' · ');
    }

    async function load(reset) {
        if (reset) state.page = 1;
        const root = document.getElementById('activityHistoryRoot');
        const list = root.querySelector('#ahList'), info = root.querySelector('#ahInfo'), more = root.querySelector('#ahMore');
        const q = new URLSearchParams({ ...state.filters, page: state.page, limit: 50 });
        const d = await api('/api/audit?' + q.toString());
        if (!d.success) { info.textContent = d.message || 'Erreur'; return; }
        if (reset) list.replaceChildren();
        info.textContent = t('total').replace('{n}', d.total);
        if (!d.events.length && reset) list.append(h('tr', {}, h('td', { colspan: '6', style: 'padding:14px;color:#64748b;' }, t('none'))));
        for (const e of d.events) {
            const roleTxt = (t('roles')[e.actor.role] || e.actor.role || '') + (e.actor.temporaryAccess ? ` (${t('temp')})` : '');
            const deleted = /deleted/.test(e.action);
            list.append(h('tr', { style: deleted ? 'background:#fff1f2;' : '' },
                h('td', { style: 'white-space:nowrap;' }, fmt(e.at)),
                h('td', {}, h('strong', {}, e.actor.name || '—'), h('div', { style: 'font-size:12px;color:#64748b;' }, roleTxt)),
                h('td', {}, actionName(e.action), h('div', { style: 'font-size:12px;color:#64748b;' }, (t('modules')[e.module] || e.module))),
                h('td', {}, e.target && e.target.label ? e.target.label : '—', e.target && e.target.id ? h('div', {}, h('a', { href: '#', style: 'font-size:12px;', onclick: ev => { ev.preventDefault(); state.filters = { targetId: e.target.id }; syncInputs(); load(true); } }, t('history'))) : ''),
                h('td', { style: 'max-width:340px;' }, changeText(e)),
                h('td', { style: 'max-width:220px;' }, e.reason || '')));
        }
        more.style.display = state.page * 50 < d.total ? 'inline-block' : 'none';
    }

    let built = false;
    function syncInputs() {
        const root = document.getElementById('activityHistoryRoot'); if (!root) return;
        for (const [k, id] of [['actor', 'ahActor'], ['role', 'ahRole'], ['module', 'ahModule'], ['from', 'ahFrom'], ['to', 'ahTo'], ['q', 'ahQ']]) { const el = root.querySelector('#' + id); if (el) el.value = state.filters[k] || ''; }
    }
    async function build() {
        const root = document.getElementById('activityHistoryRoot'); if (!root) return;
        document.getElementById('ahTitle').textContent = t('title');
        root.dir = lang() === 'ar' ? 'rtl' : 'ltr';
        const sel = (id, label, options) => h('label', { style: 'display:flex;flex-direction:column;font-size:12px;font-weight:600;color:#334155;gap:4px;' }, label,
            h('select', { id, style: 'padding:8px;border:1px solid #cbd5e1;border-radius:8px;min-width:150px;' }, h('option', { value: '' }, t('all')), ...options.map(([v, txt]) => h('option', { value: v }, txt))));
        const inp = (id, label, type, ph) => h('label', { style: 'display:flex;flex-direction:column;font-size:12px;font-weight:600;color:#334155;gap:4px;' }, label, h('input', { id, type, placeholder: ph || '', style: 'padding:8px;border:1px solid #cbd5e1;border-radius:8px;' }));
        const actors = (await api('/api/audit/actors')).actors || [];
        const filters = h('div', { style: 'display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:12px;' },
            sel('ahActor', t('who'), actors.map(a => [a.id, `${a.name} (${t('roles')[a.role] || a.role})`])),
            sel('ahRole', t('role'), Object.entries(t('roles'))),
            sel('ahModule', t('module'), Object.entries(t('modules'))),
            inp('ahFrom', t('from'), 'date'), inp('ahTo', t('to'), 'date'), inp('ahQ', t('search'), 'text', 'ex. Ahmed'),
            h('button', { type: 'button', class: 'action-btn btn-primary', onclick: () => { readFilters(); load(true); } }, t('apply')),
            h('button', { type: 'button', class: 'action-btn', onclick: () => { const d = new Date().toISOString().slice(0, 10); state.filters = { ...state.filters, from: d, to: d }; syncInputs(); load(true); } }, t('today')),
            h('button', { type: 'button', class: 'action-btn', onclick: () => { state.filters = {}; syncInputs(); load(true); } }, t('reset')));
        const table = h('div', { style: 'overflow-x:auto;' }, h('table', { class: 'data-table' },
            h('thead', {}, h('tr', {}, ...[t('date'), t('who'), t('action'), t('record'), t('change'), t('reason')].map(x => h('th', {}, x)))),
            h('tbody', { id: 'ahList' })));
        root.replaceChildren(filters, h('div', { id: 'ahInfo', style: 'margin:6px 0;color:#475569;font-size:13px;' }), table,
            h('div', { style: 'text-align:center;margin-top:10px;' }, h('button', { id: 'ahMore', type: 'button', class: 'action-btn', style: 'display:none;', onclick: () => { state.page++; load(false); } }, t('more'))));
        built = true;
    }
    function readFilters() {
        const root = document.getElementById('activityHistoryRoot'); const f = {};
        for (const [k, id] of [['actor', 'ahActor'], ['role', 'ahRole'], ['module', 'ahModule'], ['from', 'ahFrom'], ['to', 'ahTo'], ['q', 'ahQ']]) { const v = root.querySelector('#' + id).value.trim(); if (v) f[k] = v; }
        state.filters = f;
    }
    async function open() { await build(); syncInputs(); await load(true); }
    window.ActivityHistory = { open, reload: () => load(true) };
})();
