// ============================================
// Season Archive Viewer — v2.0
// Professional read-only viewer for archived data
// ============================================

let currentArchiveData = null;
let currentArchiveName = null;

// ============================================
// HELPERS
// ============================================
function _esc(str) { return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
function _fmtDate(d) {
    if (!d) return '-';
    const locales = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR', ar: 'ar-MA' };
    const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
    return new Date(d).toLocaleDateString(locales[lang] || 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function _id(obj) { return obj?._id?.toString?.() || obj?._id || obj?.toString?.() || ''; }

// ============================================
// LOAD ARCHIVE LIST
// ============================================
async function loadArchivedSeasonsList() {
    const grid = document.getElementById('archivesGrid');
    if (!grid) return;

    const listView = document.getElementById('archivesListView');
    const viewerView = document.getElementById('archiveViewerView');
    if (listView) listView.style.display = 'block';
    if (viewerView) viewerView.style.display = 'none';

    grid.innerHTML = `<div style="text-align:center;padding:60px;color:#64748b;grid-column:1/-1;">
        <i class="fas fa-spinner fa-spin" style="font-size:2.5em;margin-bottom:15px;color:#7c3aed;"></i>
        <p style="font-size:1rem;">${t('archiveLoadingMega')}</p>
    </div>`;

    try {
        const response = await fetch('/api/season-archive/list', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error(t('archiveLoadFailed'));
        const data = await response.json();
        const archives = data.archives || [];

        if (archives.length === 0) {
            grid.innerHTML = `<div style="text-align:center;padding:80px 20px;grid-column:1/-1;">
                <div style="width:80px;height:80px;margin:0 auto 20px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-archive" style="font-size:2em;color:#94a3b8;"></i>
                </div>
                <h3 style="margin:0 0 8px;color:#1e293b;">${t('archiveNoArchives')}</h3>
                <p style="margin:0;color:#64748b;max-width:400px;margin:0 auto;">${t('archiveNoArchivesDesc')}</p>
            </div>`;
            return;
        }

        grid.innerHTML = archives.map(archive => {
            const seasonName = archive.name.replace('.json', '');
            const locales = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR', ar: 'ar-MA' };
            const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
            const dateStr = archive.modified ? new Date(archive.modified).toLocaleDateString(locales[lang] || 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            return `
            <div style="background:white;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.04);cursor:pointer;transition:all 0.25s ease;border:1px solid #e2e8f0;position:relative;overflow:hidden;"
                onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 25px rgba(124,58,237,0.15)';this.style.borderColor='#c4b5fd'"
                onmouseout="this.style.transform='';this.style.boxShadow='0 1px 3px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.04)';this.style.borderColor='#e2e8f0'"
                onclick="openArchiveViewer('${_esc(seasonName)}')">
                <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#7c3aed,#a78bfa);"></div>
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
                    <div style="width:52px;height:52px;background:linear-gradient(135deg,#7c3aed,#a78bfa);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-box-archive" style="color:white;font-size:1.3em;"></i>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <h3 style="margin:0;color:#1e293b;font-size:1.15rem;font-weight:700;">${seasonName}</h3>
                        <span style="font-size:0.8rem;color:#94a3b8;">${archive.sizeFormatted || ''}</span>
                    </div>
                    <button onclick="event.stopPropagation();deleteArchiveSeason('${_esc(seasonName)}')" title="${t('archiveDeleteArchive')}"
                        style="width:34px;height:34px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;"
                        onmouseover="this.style.background='#fee2e2';this.style.borderColor='#f87171'" onmouseout="this.style.background='#fef2f2';this.style.borderColor='#fca5a5'">
                        <i class="fas fa-trash" style="color:#dc2626;font-size:0.8em;"></i>
                    </button>
                </div>
                ${dateStr ? `<div style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:#94a3b8;margin-bottom:16px;">
                    <i class="fas fa-calendar-check"></i> ${dateStr}
                </div>` : ''}
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="background:#f5f3ff;color:#7c3aed;padding:6px 14px;border-radius:8px;font-size:0.8rem;font-weight:600;">
                        <i class="fas fa-eye"></i> ${t('archiveView')}
                    </span>
                    <i class="fas fa-chevron-right" style="color:#c4b5fd;"></i>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Erreur chargement archives:', error);
        grid.innerHTML = `<div style="text-align:center;padding:60px;color:#dc2626;grid-column:1/-1;">
            <i class="fas fa-exclamation-triangle" style="font-size:2em;margin-bottom:15px;"></i>
            <p>${t('archiveLoadError')}</p>
            <p style="font-size:0.85rem;color:#64748b;">${error.message}</p>
            <button onclick="loadArchivedSeasonsList()" class="btn" style="margin-top:15px;background:#7c3aed;color:white;border:none;padding:8px 20px;border-radius:8px;cursor:pointer;">
                <i class="fas fa-redo"></i> ${t('archiveRetry')}
            </button>
        </div>`;
    }
}

// ============================================
// OPEN ARCHIVE VIEWER
// ============================================
async function openArchiveViewer(seasonName) {
    const listView = document.getElementById('archivesListView');
    const viewerView = document.getElementById('archiveViewerView');
    const title = document.getElementById('archiveViewerTitle');

    if (title) title.innerHTML = `<i class="fas fa-box-archive"></i> ${seasonName}`;
    if (listView) listView.style.display = 'none';
    if (viewerView) viewerView.style.display = 'block';

    // Show loading in first tab
    document.getElementById('archiveStudentsContent').innerHTML = `
        <div style="text-align:center;padding:60px;">
            <div style="width:60px;height:60px;margin:0 auto 20px;border:4px solid #e2e8f0;border-top-color:#7c3aed;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
            <p style="color:#64748b;font-size:1rem;">${t('archiveDownloadingMega')}</p>
            <p style="color:#94a3b8;font-size:0.85rem;">${t('archiveDownloadWait')}</p>
        </div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;

    try {
        showNotification(t('archiveLoading'), 'info');
        const response = await fetch(`/api/season-archive/${encodeURIComponent(seasonName)}/view`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error(t('archiveLoadFailed'));

        currentArchiveData = await response.json();
        currentArchiveName = seasonName;

        renderArchiveStudents();
        renderArchiveGrades();
        renderArchiveGroups();
        renderArchivePayments();
        renderArchiveAttendance();
        switchArchiveTab('students');

        showNotification(`${t('archiveLoaded')}: "${seasonName}"`, 'success');
    } catch (error) {
        console.error('Erreur chargement archive:', error);
        showNotification(error.message, 'error');
        document.getElementById('archiveStudentsContent').innerHTML = `
            <div style="text-align:center;padding:50px;color:#dc2626;">
                <i class="fas fa-exclamation-triangle" style="font-size:2.5em;margin-bottom:15px;"></i>
                <h3>${t('archiveLoadImpossible')}</h3>
                <p style="color:#64748b;">${error.message}</p>
            </div>`;
    }
}

// ============================================
// CLOSE / DOWNLOAD / TAB SWITCH
// ============================================
window.closeArchiveViewer = function() {
    currentArchiveData = null;
    currentArchiveName = null;
    document.getElementById('archivesListView').style.display = 'block';
    document.getElementById('archiveViewerView').style.display = 'none';
};

window.downloadCurrentArchive = async function() {
    if (!currentArchiveName) return;
    try {
        showNotification(t('archiveDownloadPrep'), 'info');
        const response = await fetch(`/api/season-archive/${encodeURIComponent(currentArchiveName)}/download`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error(t('archiveDownloadFailed'));
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentArchiveName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification(t('archiveDownloadDone'), 'success');
    } catch (err) {
        showNotification('Erreur: ' + err.message, 'error');
    }
};

window.switchArchiveTab = function(tabName) {
    document.querySelectorAll('.archive-tab').forEach(btn => {
        const isActive = btn.dataset.tab === tabName;
        btn.style.color = isActive ? '#7c3aed' : '#64748b';
        btn.style.borderBottomColor = isActive ? '#7c3aed' : 'transparent';
        btn.style.background = isActive ? '#f5f3ff' : 'transparent';
    });
    document.querySelectorAll('.archive-tab-content').forEach(c => c.style.display = 'none');
    const tabId = 'archiveTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
    const tabEl = document.getElementById(tabId);
    if (tabEl) tabEl.style.display = 'block';
};

// ============================================
// RENDER: STUDENTS
// ============================================
function renderArchiveStudents() {
    const container = document.getElementById('archiveStudentsContent');
    if (!container || !currentArchiveData) return;
    const students = currentArchiveData.students || [];

    if (!students.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;"><i class="fas fa-users" style="font-size:2em;opacity:0.3;margin-bottom:10px;"></i><p>' + t('archiveNoStudents') + '</p></div>';
        return;
    }

    const carryCount = students.filter(s => s.wasCarryOver).length;
    container.innerHTML = `
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
            <div style="background:#f5f3ff;padding:8px 16px;border-radius:8px;font-size:0.85rem;">
                <strong style="color:#7c3aed;">${students.length}</strong> <span style="color:#64748b;">${t('archiveStudentsLabel')}</span>
            </div>
            ${carryCount > 0 ? `<div style="background:#f0fdf4;padding:8px 16px;border-radius:8px;font-size:0.85rem;">
                <strong style="color:#059669;">${carryCount}</strong> <span style="color:#64748b;">${t('archiveKeptLabel')}</span>
            </div>` : ''}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
            <thead>
                <tr style="background:#f8fafc;">
                    <th style="padding:12px 10px;text-align:left;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;">${t('archiveNameCol')}</th>
                    <th style="padding:12px 10px;text-align:left;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;">${t('archiveEmailCol')}</th>
                    <th style="padding:12px 10px;text-align:left;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;">${t('archiveFormationCol')}</th>
                    <th style="padding:12px 10px;text-align:left;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;">${t('archiveGroupCol')}</th>
                    <th style="padding:12px 10px;text-align:center;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;">${t('archiveStatusCol')}</th>
                </tr>
            </thead>
            <tbody>
                ${students.map((s, i) => `
                    <tr class="archive-student-row" style="border-bottom:1px solid #f1f5f9;${i % 2 === 0 ? 'background:#fafbfc;' : ''}">
                        <td style="padding:10px;font-weight:600;color:#1e293b;">${s.fullName || ''}</td>
                        <td style="padding:10px;color:#64748b;font-size:0.82rem;">${s.schoolEmail || ''}</td>
                        <td style="padding:10px;">${(s.formation || []).join(', ')}</td>
                        <td style="padding:10px;color:#475569;">${s.groupName || s.branchSubgroupName || '-'}</td>
                        <td style="padding:10px;text-align:center;">
                            ${s.wasCarryOver
                                ? '<span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:6px;font-size:0.75rem;font-weight:600;">' + t('archiveStatusKept') + '</span>'
                                : '<span style="background:#f1f5f9;color:#64748b;padding:3px 10px;border-radius:6px;font-size:0.75rem;font-weight:600;">' + t('archiveStatusArchived') + '</span>'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

// ============================================
// RENDER: GRADES
// ============================================
function renderArchiveGrades() {
    const container = document.getElementById('archiveGradesContent');
    if (!container || !currentArchiveData) return;
    const grades = currentArchiveData.grades || [];
    const students = currentArchiveData.students || [];
    const sMap = {};
    students.forEach(s => { sMap[_id(s)] = s.fullName; });

    if (!grades.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;"><i class="fas fa-chart-bar" style="font-size:2em;opacity:0.3;margin-bottom:10px;"></i><p>' + t('archiveNoGrades') + '</p></div>';
        return;
    }

    // Group grades by student
    const gradesByStudent = {};
    grades.forEach(g => {
        const sid = g.student ? (typeof g.student === 'object' ? (g.student._id || g.student) : g.student) : 'unknown';
        const key = String(sid);
        if (!gradesByStudent[key]) {
            gradesByStudent[key] = { name: g.studentName || sMap[key] || t('archiveUnknown'), grades: [] };
        }
        gradesByStudent[key].grades.push(g);
    });
    const studentGrades = Object.entries(gradesByStudent).sort((a, b) => a[1].name.localeCompare(b[1].name));

    // Compute overall stats
    const totalAvg = grades.length > 0 ? (grades.reduce((s, g) => s + (g.score / (g.maxScore || 100)) * 100, 0) / grades.length) : 0;
    const uniqueFormations = [...new Set(grades.map(g => g.formation).filter(Boolean))];

    let html = '';

    // Summary stats
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">
        <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);padding:16px;border-radius:12px;border:1px solid #c4b5fd;">
            <div style="font-size:0.78rem;color:#6d28d9;font-weight:600;margin-bottom:4px;"><i class="fas fa-user-graduate"></i> ${t('archiveTabStudents')}</div>
            <div style="font-size:1.4rem;font-weight:800;color:#7c3aed;">${studentGrades.length}</div>
        </div>
        <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);padding:16px;border-radius:12px;border:1px solid #bbf7d0;">
            <div style="font-size:0.78rem;color:#166534;font-weight:600;margin-bottom:4px;"><i class="fas fa-file-alt"></i> ${t('archiveTotalGrades')}</div>
            <div style="font-size:1.4rem;font-weight:800;color:#059669;">${grades.length}</div>
        </div>
        <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);padding:16px;border-radius:12px;border:1px solid #fde68a;">
            <div style="font-size:0.78rem;color:#92400e;font-weight:600;margin-bottom:4px;"><i class="fas fa-chart-line"></i> ${t('archiveOverallAvg')}</div>
            <div style="font-size:1.4rem;font-weight:800;color:${totalAvg >= 70 ? '#059669' : totalAvg >= 50 ? '#d97706' : '#dc2626'};">${totalAvg.toFixed(1)}%</div>
        </div>
    </div>`;

    // Search bar
    html += `<div style="margin-bottom:16px;">
        <input type="text" id="archiveGradeSearch" placeholder="${t('archiveSearchStudent')}" oninput="filterArchiveGradeCards(this.value)"
            style="width:100%;padding:10px 16px;border:1px solid #d1d5db;border-radius:10px;font-size:0.9rem;outline:none;transition:border 0.2s;"
            onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#d1d5db'">
    </div>`;

    // Student cards heading
    html += `<h3 style="margin:0 0 14px;color:#1e293b;font-size:0.95rem;font-weight:700;"><i class="fas fa-chart-bar" style="color:#7c3aed;"></i> ${t('archiveGradesByStudent')}</h3>`;

    // Student cards grid
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">';
    studentGrades.forEach(([sid, data], idx) => {
        const sg = data.grades;
        const avg = sg.length > 0 ? (sg.reduce((s, g) => s + (g.score / (g.maxScore || 100)) * 100, 0) / sg.length) : 0;
        const avgColor = avg >= 70 ? '#059669' : avg >= 50 ? '#d97706' : '#dc2626';
        const avgBg = avg >= 70 ? '#f0fdf4' : avg >= 50 ? '#fffbeb' : '#fef2f2';

        // Group grades by formation for this student
        const byFormation = {};
        sg.forEach(g => {
            const f = g.formation || t('archiveOther');
            if (!byFormation[f]) byFormation[f] = [];
            byFormation[f].push(g);
        });

        const cardId = `grade_card_${idx}`;

        html += `<div class="archive-grade-card" data-name="${_esc(data.name.toLowerCase())}" style="background:white;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.06)'" onmouseout="this.style.boxShadow='none'">
            <div onclick="toggleGradeDetail('${cardId}')" style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;cursor:pointer;user-select:none;">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;color:#1e293b;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(data.name)}</div>
                    <div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;">${sg.length} ${sg.length > 1 ? t('archiveGrades') : t('archiveGrade')} · ${Object.keys(byFormation).join(', ')}</div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="background:${avgBg};color:${avgColor};padding:4px 12px;border-radius:8px;font-weight:800;font-size:0.88rem;">${avg.toFixed(0)}%</div>
                    <i id="${cardId}_icon" class="fas fa-chevron-down" style="color:#94a3b8;font-size:0.75rem;transition:transform 0.2s;"></i>
                </div>
            </div>
            <div id="${cardId}" style="display:none;border-top:1px solid #f1f5f9;">`;

        // Determine if formation is language or branch
        const langFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];

        Object.entries(byFormation).forEach(([formation, fGrades]) => {
            const fAvg = fGrades.length > 0 ? (fGrades.reduce((s, g) => s + (g.score / (g.maxScore || 100)) * 100, 0) / fGrades.length) : 0;
            const fColor = fAvg >= 70 ? '#059669' : fAvg >= 50 ? '#d97706' : '#dc2626';
            const isLanguage = langFormations.includes(formation);

            html += `<div style="padding:12px 16px 8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="font-weight:700;color:#1e293b;font-size:0.88rem;"><i class="fas ${isLanguage ? 'fa-language' : 'fa-graduation-cap'}" style="color:#a78bfa;margin-right:6px;"></i>${_esc(formation)}</span>
                    <span style="font-size:0.75rem;color:${fColor};font-weight:700;">${t('archiveAvg')}: ${fAvg.toFixed(1)}%</span>
                </div>`;

            if (isLanguage) {
                // ===== LANGUAGE: Group by level (A1 → A2 → B1 → B2) =====
                const levelOrder = ['A1', 'A2', 'B1', 'B2'];
                const byLevel = {};
                fGrades.forEach(g => {
                    const lvl = g.languageLevel || t('archiveOther');
                    if (!byLevel[lvl]) byLevel[lvl] = [];
                    byLevel[lvl].push(g);
                });

                // Sort levels in proper order
                const sortedLevels = Object.keys(byLevel).sort((a, b) => {
                    const ia = levelOrder.indexOf(a), ib = levelOrder.indexOf(b);
                    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                });

                sortedLevels.forEach(level => {
                    const lvlGrades = byLevel[level];
                    const lvlAvg = lvlGrades.length > 0 ? (lvlGrades.reduce((s, g) => s + (g.score / (g.maxScore || 100)) * 100, 0) / lvlGrades.length) : 0;
                    const lvlColor = lvlAvg >= 70 ? '#059669' : lvlAvg >= 50 ? '#d97706' : '#dc2626';
                    const levelColors = { 'A1': '#3b82f6', 'A2': '#6366f1', 'B1': '#8b5cf6', 'B2': '#7c3aed' };
                    const lvlBadgeColor = levelColors[level] || '#64748b';

                    html += `<div style="margin-bottom:10px;background:#fafbfc;border-radius:10px;padding:10px 12px;border:1px solid #f1f5f9;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <span style="background:${lvlBadgeColor};color:white;padding:2px 10px;border-radius:6px;font-weight:700;font-size:0.78rem;">${_esc(level)}</span>
                            <span style="font-size:0.72rem;color:${lvlColor};font-weight:600;">${lvlAvg.toFixed(0)}% · ${lvlGrades.length} ${lvlGrades.length > 1 ? t('archiveGrades') : t('archiveGrade')}</span>
                        </div>`;

                    // Sort by testType (miniTest before finalExam), then testNumber, then examType
                    lvlGrades.sort((a, b) => {
                        if (a.testType !== b.testType) return a.testType === 'miniTest' ? -1 : 1;
                        if (a.testNumber !== b.testNumber) return (a.testNumber || 0) - (b.testNumber || 0);
                        return (a.examType || '').localeCompare(b.examType || '');
                    });

                    lvlGrades.forEach((g, gi) => {
                        const pct = g.score / (g.maxScore || 100);
                        const scoreColor = pct >= 0.7 ? '#059669' : pct >= 0.5 ? '#d97706' : '#dc2626';
                        const scoreBg = pct >= 0.7 ? '#f0fdf4' : pct >= 0.5 ? '#fffbeb' : '#fef2f2';
                        let label = g.examType || '-';
                        if (g.testType === 'miniTest' && g.testNumber) label = `${t('archiveMiniTest')} ${g.testNumber} — ${label}`;
                        else if (g.testType === 'finalExam') label = `${t('archiveFinalExam')} — ${label}`;

                        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;${gi < lvlGrades.length - 1 ? 'border-bottom:1px solid #eef2f7;' : ''}">
                            <div style="min-width:0;flex:1;">
                                <span style="font-size:0.8rem;color:#1e293b;font-weight:500;">${_esc(label)}</span>
                                <span style="font-size:0.7rem;color:#b0b8c4;margin-left:6px;">${_fmtDate(g.examDate)}</span>
                            </div>
                            <span style="background:${scoreBg};color:${scoreColor};padding:2px 10px;border-radius:6px;font-weight:700;font-size:0.8rem;white-space:nowrap;">${g.score}/${g.maxScore || 100}</span>
                        </div>`;
                    });

                    html += '</div>';
                });
            } else {
                // ===== BRANCH: Group by semester → exam number =====
                const bySemester = {};
                fGrades.forEach(g => {
                    const sem = g.semester || t('archiveOther');
                    if (!bySemester[sem]) bySemester[sem] = [];
                    bySemester[sem].push(g);
                });

                const semOrder = ['Semester 1', 'Semester 2'];
                const sortedSems = Object.keys(bySemester).sort((a, b) => {
                    const ia = semOrder.indexOf(a), ib = semOrder.indexOf(b);
                    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                });

                sortedSems.forEach(sem => {
                    const semGrades = bySemester[sem];
                    const semAvg = semGrades.length > 0 ? (semGrades.reduce((s, g) => s + (g.score / (g.maxScore || 100)) * 100, 0) / semGrades.length) : 0;
                    const semColor = semAvg >= 70 ? '#059669' : semAvg >= 50 ? '#d97706' : '#dc2626';
                    const semLabel = sem === 'Semester 1' ? t('archiveSemester1') : sem === 'Semester 2' ? t('archiveSemester2') : sem;

                    html += `<div style="margin-bottom:10px;background:#fafbfc;border-radius:10px;padding:10px 12px;border:1px solid #f1f5f9;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <span style="background:#0891b2;color:white;padding:2px 10px;border-radius:6px;font-weight:700;font-size:0.78rem;">${_esc(semLabel)}</span>
                            <span style="font-size:0.72rem;color:${semColor};font-weight:600;">${semAvg.toFixed(0)}% · ${semGrades.length} ${semGrades.length > 1 ? t('archiveGrades') : t('archiveGrade')}</span>
                        </div>`;

                    // Group by examNumber within semester
                    const byExam = {};
                    semGrades.forEach(g => {
                        const en = g.examNumber || 1;
                        if (!byExam[en]) byExam[en] = [];
                        byExam[en].push(g);
                    });

                    Object.keys(byExam).sort((a, b) => Number(a) - Number(b)).forEach(examNum => {
                        const exGrades = byExam[examNum];
                        html += `<div style="margin-bottom:4px;padding-left:4px;">
                            <div style="font-size:0.76rem;color:#6366f1;font-weight:700;margin-bottom:4px;padding-top:4px;${Number(examNum) > 1 ? 'border-top:1px solid #eef2f7;' : ''}">
                                <i class="fas fa-pen-alt" style="font-size:0.7rem;"></i> ${t('archiveExam')} ${examNum}
                            </div>`;

                        exGrades.forEach((g, gi) => {
                            const pct = g.score / (g.maxScore || 100);
                            const scoreColor = pct >= 0.7 ? '#059669' : pct >= 0.5 ? '#d97706' : '#dc2626';
                            const scoreBg = pct >= 0.7 ? '#f0fdf4' : pct >= 0.5 ? '#fffbeb' : '#fef2f2';

                            html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;${gi < exGrades.length - 1 ? 'border-bottom:1px solid #f5f7fa;' : ''}">
                                <div style="min-width:0;flex:1;">
                                    <span style="font-size:0.8rem;color:#1e293b;font-weight:500;">${_esc(g.examType || '-')}</span>
                                    <span style="font-size:0.7rem;color:#b0b8c4;margin-left:6px;">${_fmtDate(g.examDate)}</span>
                                </div>
                                <span style="background:${scoreBg};color:${scoreColor};padding:2px 10px;border-radius:6px;font-weight:700;font-size:0.8rem;white-space:nowrap;">${g.score}/${g.maxScore || 100}</span>
                            </div>`;
                        });

                        html += '</div>';
                    });

                    html += '</div>';
                });
            }

            html += '</div>';
        });

        html += `</div></div>`;
    });
    html += '</div>';

    container.innerHTML = html;
}

// ============================================
// RENDER: GROUPS (kept similar, cleaner)
// ============================================
function renderArchiveGroups() {
    const container = document.getElementById('archiveGroupsContent');
    if (!container || !currentArchiveData) return;

    const languageGroups = currentArchiveData.languageGroups || [];
    const branchGroups = currentArchiveData.branchGroups || [];
    const branchSubgroups = currentArchiveData.branchSubgroups || [];
    const students = currentArchiveData.students || [];

    const byGroup = {}, byBranch = {};
    students.forEach(s => {
        const gId = _id(s.group); if (gId) { (byGroup[gId] = byGroup[gId] || []).push(s); }
        const bId = _id(s.branchSubgroup); if (bId) { (byBranch[bId] = byBranch[bId] || []).push(s); }
    });

    let html = '';

    if (languageGroups.length > 0) {
        html += `<h3 style="margin:0 0 16px;color:#1e293b;font-size:1.05rem;"><i class="fas fa-language" style="color:#f59e0b;"></i> ${t('archiveLanguageGroups')} (${languageGroups.length})</h3>`;
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:30px;">';
        languageGroups.forEach(g => {
            const gs = byGroup[_id(g)] || [];
            html += `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <strong style="color:#92400e;">${g.name}</strong>
                    <span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:6px;font-size:0.75rem;">${g.formation}</span>
                </div>
                <p style="margin:0;font-size:0.85rem;color:#64748b;"><i class="fas fa-users"></i> ${gs.length} ${t('archiveStudentCount')}</p>
                ${gs.length > 0 ? `<div style="margin-top:8px;font-size:0.78rem;color:#94a3b8;max-height:70px;overflow-y:auto;line-height:1.5;">${gs.map(s => s.fullName).join(' · ')}</div>` : ''}
            </div>`;
        });
        html += '</div>';
    }

    if (branchGroups.length > 0) {
        html += `<h3 style="margin:0 0 16px;color:#1e293b;font-size:1.05rem;"><i class="fas fa-code-branch" style="color:#3b82f6;"></i> ${t('archiveBranchesSubgroups')}</h3>`;
        branchGroups.forEach(bg => {
            const subs = branchSubgroups.filter(s => _id(s.branchGroup) === _id(bg));
            html += `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                    <span style="font-size:1.3em;">${bg.icon || '🎓'}</span>
                    <strong style="color:#0369a1;font-size:1.05rem;">${bg.displayName || bg.name}</strong>
                    <span style="background:#e0f2fe;color:#0369a1;padding:3px 10px;border-radius:6px;font-size:0.75rem;">${bg.formation}</span>
                </div>
                ${subs.length > 0 ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;">
                    ${subs.map(sub => {
                        const ss = byBranch[_id(sub)] || [];
                        return `<div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
                            <strong style="color:#1e293b;font-size:0.88rem;">${sub.name}</strong>
                            <p style="margin:5px 0 0;font-size:0.8rem;color:#64748b;"><i class="fas fa-users"></i> ${ss.length} ${t('archiveStudentCount')}</p>
                            ${ss.length > 0 ? `<div style="margin-top:6px;font-size:0.75rem;color:#94a3b8;max-height:55px;overflow-y:auto;line-height:1.4;">${ss.map(s => s.fullName).join(' · ')}</div>` : ''}
                        </div>`;
                    }).join('')}
                </div>` : '<p style="margin:0;font-size:0.85rem;color:#64748b;">' + t('archiveNoSubgroups') + '</p>'}
            </div>`;
        });
    }

    if (!html) html = '<div style="text-align:center;padding:40px;color:#64748b;"><i class="fas fa-layer-group" style="font-size:2em;opacity:0.3;margin-bottom:10px;"></i><p>' + t('archiveNoGroups') + '</p></div>';
    container.innerHTML = html;
}

// ============================================
// RENDER: PAYMENTS — Student cards + expandable
// ============================================
function renderArchivePayments() {
    const container = document.getElementById('archivePaymentsContent');
    if (!container || !currentArchiveData) return;

    const paymentHistory = currentArchiveData.paymentHistory || [];
    const cashTransactions = currentArchiveData.cashTransactions || [];
    const students = currentArchiveData.students || [];
    const sMap = {};
    students.forEach(s => { sMap[_id(s)] = s; });

    // Group payments by student
    const paymentsByStudent = {};
    paymentHistory.forEach(p => {
        const sid = _id(p.student);
        if (!paymentsByStudent[sid]) paymentsByStudent[sid] = { name: p.studentName || sMap[sid]?.fullName || t('archiveUnknown'), payments: [], total: 0 };
        paymentsByStudent[sid].payments.push(p);
        paymentsByStudent[sid].total += (p.amount || 0);
    });
    const studentPayments = Object.entries(paymentsByStudent).sort((a, b) => a[1].name.localeCompare(b[1].name));

    let html = '';

    // Summary stats
    const totalPaid = paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalIncome = cashTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = cashTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const isSuperAdmin = currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'dev');

    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px;">
        <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);padding:16px;border-radius:12px;border:1px solid #bbf7d0;">
            <div style="font-size:0.78rem;color:#166534;font-weight:600;margin-bottom:4px;"><i class="fas fa-money-bill-wave"></i> ${t('archiveStudentPayments')}</div>
            <div style="font-size:1.4rem;font-weight:800;color:#059669;">${totalPaid.toLocaleString()} MAD</div>
            <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">${studentPayments.length} ${t('archiveStudentsLabel')} · ${paymentHistory.length} ${t('archiveTransactions')}</div>
        </div>
        ${isSuperAdmin && cashTransactions.length > 0 ? `
        <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);padding:16px;border-radius:12px;border:1px solid #bfdbfe;">
            <div style="font-size:0.78rem;color:#1e40af;font-weight:600;margin-bottom:4px;"><i class="fas fa-cash-register"></i> ${t('archiveCashIncome')}</div>
            <div style="font-size:1.4rem;font-weight:800;color:#2563eb;">${totalIncome.toLocaleString()} MAD</div>
        </div>` : ''}
    </div>`;

    // Search bar
    if (studentPayments.length > 0) {
        html += `<div style="margin-bottom:16px;">
            <input type="text" id="archivePaymentSearch" placeholder="${t('archiveSearchStudent')}" oninput="filterArchivePaymentCards(this.value)"
                style="width:100%;padding:10px 16px;border:1px solid #d1d5db;border-radius:10px;font-size:0.9rem;outline:none;transition:border 0.2s;"
                onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#d1d5db'">
        </div>`;

        // Student payment cards
        html += `<h3 style="margin:0 0 14px;color:#1e293b;font-size:1rem;"><i class="fas fa-users" style="color:#059669;"></i> ${t('archivePaymentsByStudent')}</h3>`;
        html += `<div id="archivePaymentCards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;">`;
        studentPayments.forEach(([sid, data]) => {
            html += `<div class="archive-payment-card" data-name="${_esc(data.name.toLowerCase())}" style="background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;transition:box-shadow 0.2s;">
                <div onclick="toggleArchivePaymentDetail('pay_${sid}')" style="padding:16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;" 
                    onmouseover="this.parentElement.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'" onmouseout="this.parentElement.style.boxShadow='none'">
                    <div>
                        <div style="font-weight:700;color:#1e293b;font-size:0.92rem;">${data.name}</div>
                        <div style="font-size:0.78rem;color:#64748b;margin-top:2px;">${data.payments.length} ${t('archivePaymentCount')}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:800;color:#059669;font-size:1.1rem;">${data.total.toLocaleString()} MAD</div>
                        <i class="fas fa-chevron-down" id="pay_${sid}_icon" style="color:#94a3b8;font-size:0.75rem;transition:transform 0.2s;"></i>
                    </div>
                </div>
                <div id="pay_${sid}" style="display:none;padding:0 16px 16px;border-top:1px solid #f1f5f9;">
                    <table style="width:100%;border-collapse:collapse;font-size:0.82rem;margin-top:10px;">
                        <thead><tr style="color:#64748b;">
                            <th style="padding:6px;text-align:left;">${t('archiveDateCol')}</th>
                            <th style="padding:6px;text-align:right;">${t('archiveAmountCol')}</th>
                            <th style="padding:6px;text-align:left;">${t('archiveByCol')}</th>
                        </tr></thead>
                        <tbody>
                            ${data.payments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)).map(p => `
                                <tr style="border-top:1px solid #f8fafc;">
                                    <td style="padding:6px;">${_fmtDate(p.paymentDate)}</td>
                                    <td style="padding:6px;text-align:right;font-weight:700;color:#059669;">${p.amount} MAD</td>
                                    <td style="padding:6px;color:#94a3b8;">${p.markedByName || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        });
        html += '</div>';
    }

    // Cash Transactions section (super admin only)
    if (isSuperAdmin && cashTransactions.length > 0) {
        html += `<h3 style="margin:30px 0 14px;color:#1e293b;font-size:1rem;"><i class="fas fa-cash-register" style="color:#6366f1;"></i> ${t('archiveCashTransactions')} (${cashTransactions.length})</h3>`;
        html += `<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
            <thead><tr style="background:#f8fafc;">
                <th style="padding:10px;text-align:left;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;">${t('archiveTitleCol')}</th>
                <th style="padding:10px;text-align:left;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;">${t('archiveCategoryCol')}</th>
                <th style="padding:10px;text-align:center;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;">${t('archiveTypeCol')}</th>
                <th style="padding:10px;text-align:right;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;">${t('archiveAmountCol')}</th>
                <th style="padding:10px;text-align:left;color:#475569;font-weight:600;border-bottom:2px solid #e2e8f0;">${t('archiveDateCol')}</th>
            </tr></thead>
            <tbody>
                ${cashTransactions.map((tx, i) => `
                    <tr style="border-bottom:1px solid #f1f5f9;${i % 2 === 0 ? 'background:#fafbfc;' : ''}">
                        <td style="padding:10px;font-weight:600;">${tx.title || ''}</td>
                        <td style="padding:10px;">${tx.category || ''}</td>
                        <td style="padding:10px;text-align:center;">
                            <span style="background:${tx.type === 'income' ? '#dcfce7' : '#fef2f2'};color:${tx.type === 'income' ? '#166534' : '#991b1b'};padding:3px 10px;border-radius:6px;font-size:0.75rem;font-weight:600;">
                                ${tx.type === 'income' ? t('archiveIncome') : t('archiveExpense')}
                            </span>
                        </td>
                        <td style="padding:10px;text-align:right;font-weight:700;color:${tx.type === 'income' ? '#059669' : '#dc2626'};">${tx.amount} MAD</td>
                        <td style="padding:10px;color:#64748b;">${_fmtDate(tx.date)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    }

    if (!html) html = '<div style="text-align:center;padding:40px;color:#64748b;"><i class="fas fa-money-bill-wave" style="font-size:2em;opacity:0.3;margin-bottom:10px;"></i><p>' + t('archiveNoPayments') + '</p></div>';
    container.innerHTML = html;
}

// ============================================
// RENDER: ATTENDANCE — Group tabs + student cards
// ============================================
function renderArchiveAttendance() {
    const container = document.getElementById('archiveAttendanceContent');
    if (!container || !currentArchiveData) return;

    const sessions = currentArchiveData.attendanceSessions || [];
    const records = currentArchiveData.attendanceRecords || [];
    const students = currentArchiveData.students || [];

    if (!sessions.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;"><i class="fas fa-clipboard-check" style="font-size:2em;opacity:0.3;margin-bottom:10px;"></i><p>' + t('archiveNoAttendance') + '</p></div>';
        return;
    }

    // Build student name map
    const sMap = {};
    students.forEach(s => { sMap[_id(s)] = s.fullName; });

    // Group sessions by groupId/groupName
    const groupsMap = {};
    sessions.forEach(s => {
        const gid = _id(s.groupId) || 'unknown';
        if (!groupsMap[gid]) groupsMap[gid] = { name: s.groupName || t('archiveUnknownGroup'), formation: s.formation || '', sessions: [] };
        groupsMap[gid].sessions.push(s);
    });

    // Map records to sessions
    const recordsBySession = {};
    records.forEach(r => {
        const sid = _id(r.session) || _id(r.sessionId);
        (recordsBySession[sid] = recordsBySession[sid] || []).push(r);
    });

    // Summary
    const totalPresent = records.filter(r => r.status === 'present' || r.status === 'onTime').length;
    const totalLate = records.filter(r => r.status === 'late').length;
    const totalAbsent = records.filter(r => r.status === 'absent').length;
    const groups = Object.entries(groupsMap);

    let html = '';

    // Stats bar
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
        <div style="background:#f0fdf4;padding:14px;border-radius:10px;border:1px solid #bbf7d0;text-align:center;">
            <div style="font-size:1.3rem;font-weight:800;color:#059669;">${totalPresent}</div>
            <div style="font-size:0.78rem;color:#166534;">${t('archivePresent')}</div>
        </div>
        <div style="background:#fffbeb;padding:14px;border-radius:10px;border:1px solid #fde68a;text-align:center;">
            <div style="font-size:1.3rem;font-weight:800;color:#d97706;">${totalLate}</div>
            <div style="font-size:0.78rem;color:#92400e;">${t('archiveLate')}</div>
        </div>
        <div style="background:#fef2f2;padding:14px;border-radius:10px;border:1px solid #fca5a5;text-align:center;">
            <div style="font-size:1.3rem;font-weight:800;color:#dc2626;">${totalAbsent}</div>
            <div style="font-size:0.78rem;color:#991b1b;">${t('archiveAbsent')}</div>
        </div>
        <div style="background:#f5f3ff;padding:14px;border-radius:10px;border:1px solid #c4b5fd;text-align:center;">
            <div style="font-size:1.3rem;font-weight:800;color:#7c3aed;">${sessions.length}</div>
            <div style="font-size:0.78rem;color:#5b21b6;">${t('archiveSessions')}</div>
        </div>
    </div>`;

    // Search
    html += `<div style="margin-bottom:16px;">
        <input type="text" id="archiveAttendanceSearch" placeholder="${t('archiveSearchStudent')}" oninput="filterArchiveAttendanceCards(this.value)"
            style="width:100%;padding:10px 16px;border:1px solid #d1d5db;border-radius:10px;font-size:0.9rem;outline:none;"
            onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#d1d5db'">
    </div>`;

    // Group tabs
    html += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">`;
    groups.forEach(([gid, gData], idx) => {
        html += `<button onclick="showArchiveAttendanceGroup('${gid}')" class="att-group-tab" data-gid="${gid}"
            style="padding:8px 16px;border:1px solid ${idx === 0 ? '#7c3aed' : '#e2e8f0'};border-radius:10px;cursor:pointer;font-size:0.85rem;font-weight:600;
            background:${idx === 0 ? '#f5f3ff' : 'white'};color:${idx === 0 ? '#7c3aed' : '#64748b'};transition:all 0.2s;">
            <i class="fas fa-users" style="margin-right:4px;"></i>${gData.name}
            <span style="background:${idx === 0 ? '#7c3aed' : '#e2e8f0'};color:${idx === 0 ? 'white' : '#64748b'};padding:2px 8px;border-radius:6px;font-size:0.7rem;margin-left:6px;">${gData.sessions.length}</span>
        </button>`;
    });
    html += `</div>`;

    // Group content panels
    groups.forEach(([gid, gData], idx) => {
        // Collect all student attendance for this group
        const studentAtt = {};
        gData.sessions.forEach(session => {
            const sRecords = recordsBySession[_id(session)] || [];
            sRecords.forEach(r => {
                const stId = _id(r.studentId);
                if (!studentAtt[stId]) studentAtt[stId] = { name: r.studentName || sMap[stId] || t('archiveUnknown'), present: [], late: [], absent: [] };
                const date = session.date || r.date;
                if (r.status === 'present' || r.status === 'onTime') studentAtt[stId].present.push(date);
                else if (r.status === 'late') studentAtt[stId].late.push(date);
                else if (r.status === 'absent') studentAtt[stId].absent.push(date);
            });
        });

        const studentEntries = Object.entries(studentAtt).sort((a, b) => a[1].name.localeCompare(b[1].name));

        html += `<div class="att-group-panel" data-gid="${gid}" style="display:${idx === 0 ? 'block' : 'none'};">`;

        if (!studentEntries.length) {
            html += '<p style="color:#64748b;text-align:center;padding:20px;">' + t('archiveNoRecords') + '</p>';
        } else {
            html += `<div id="attCards_${gid}" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px;">`;
            studentEntries.forEach(([stId, att]) => {
                const total = att.present.length + att.late.length + att.absent.length;
                const presRate = total > 0 ? Math.round((att.present.length / total) * 100) : 0;
                html += `<div class="archive-att-card" data-name="${_esc(att.name.toLowerCase())}" style="background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                    <div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-weight:700;color:#1e293b;font-size:0.9rem;">${att.name}</div>
                            <div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;">${t('archiveRate')}: ${presRate}% · ${total} ${t('archiveSessions').toLowerCase()}</div>
                        </div>
                    </div>
                    <div style="display:flex;border-top:1px solid #f1f5f9;">
                        <button onclick="toggleAttDetail('att_${gid}_${stId}_p')" style="flex:1;padding:10px;border:none;background:#f0fdf4;cursor:pointer;text-align:center;transition:background 0.2s;" onmouseover="this.style.background='#dcfce7'" onmouseout="this.style.background='#f0fdf4'">
                            <div style="font-weight:800;color:#059669;font-size:1rem;">${att.present.length}</div>
                            <div style="font-size:0.7rem;color:#166534;">${t('archivePresent')}</div>
                        </button>
                        <button onclick="toggleAttDetail('att_${gid}_${stId}_l')" style="flex:1;padding:10px;border:none;border-left:1px solid #f1f5f9;border-right:1px solid #f1f5f9;background:#fffbeb;cursor:pointer;text-align:center;transition:background 0.2s;" onmouseover="this.style.background='#fef3c7'" onmouseout="this.style.background='#fffbeb'">
                            <div style="font-weight:800;color:#d97706;font-size:1rem;">${att.late.length}</div>
                            <div style="font-size:0.7rem;color:#92400e;">${t('archiveLate')}</div>
                        </button>
                        <button onclick="toggleAttDetail('att_${gid}_${stId}_a')" style="flex:1;padding:10px;border:none;background:#fef2f2;cursor:pointer;text-align:center;transition:background 0.2s;" onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fef2f2'">
                            <div style="font-weight:800;color:#dc2626;font-size:1rem;">${att.absent.length}</div>
                            <div style="font-size:0.7rem;color:#991b1b;">${t('archiveAbsent')}</div>
                        </button>
                    </div>
                    ${_renderAttDates(`att_${gid}_${stId}_p`, att.present, '#059669', t('archivePresenceDates'))}
                    ${_renderAttDates(`att_${gid}_${stId}_l`, att.late, '#d97706', t('archiveLateDates'))}
                    ${_renderAttDates(`att_${gid}_${stId}_a`, att.absent, '#dc2626', t('archiveAbsenceDates'))}
                </div>`;
            });
            html += '</div>';
        }
        html += '</div>';
    });

    container.innerHTML = html;
}

function _renderAttDates(id, dates, color, label) {
    if (!dates.length) return `<div id="${id}" style="display:none;padding:10px 16px;border-top:1px solid #f1f5f9;background:#fafbfc;"><p style="margin:0;color:#94a3b8;font-size:0.82rem;">${t('archiveNoDate')}</p></div>`;
    const sorted = [...dates].sort((a, b) => new Date(a) - new Date(b));
    return `<div id="${id}" style="display:none;padding:10px 16px;border-top:1px solid #f1f5f9;background:#fafbfc;">
        <div style="font-size:0.78rem;font-weight:600;color:${color};margin-bottom:6px;">${label} (${dates.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${sorted.map(d => `<span style="background:white;border:1px solid #e2e8f0;padding:2px 8px;border-radius:5px;font-size:0.75rem;color:#475569;">${_fmtDate(d)}</span>`).join('')}
        </div>
    </div>`;
}

// ============================================
// INTERACTIVE FUNCTIONS
// ============================================
window.toggleArchivePaymentDetail = function(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(id + '_icon');
    if (el) {
        const show = el.style.display === 'none';
        el.style.display = show ? 'block' : 'none';
        if (icon) icon.style.transform = show ? 'rotate(180deg)' : '';
    }
};

window.toggleAttDetail = function(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.showArchiveAttendanceGroup = function(gid) {
    document.querySelectorAll('.att-group-tab').forEach(btn => {
        const isActive = btn.dataset.gid === gid;
        btn.style.background = isActive ? '#f5f3ff' : 'white';
        btn.style.color = isActive ? '#7c3aed' : '#64748b';
        btn.style.borderColor = isActive ? '#7c3aed' : '#e2e8f0';
        const badge = btn.querySelector('span');
        if (badge) { badge.style.background = isActive ? '#7c3aed' : '#e2e8f0'; badge.style.color = isActive ? 'white' : '#64748b'; }
    });
    document.querySelectorAll('.att-group-panel').forEach(p => {
        p.style.display = p.dataset.gid === gid ? 'block' : 'none';
    });
};

window.filterArchiveViewerStudents = function(q) {
    q = q.toLowerCase();
    document.querySelectorAll('.archive-student-row').forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
};
window.filterArchiveViewerGrades = function(q) {
    q = q.toLowerCase();
    document.querySelectorAll('.archive-grade-card').forEach(c => { c.style.display = c.dataset.name.includes(q) ? '' : 'none'; });
};
window.filterArchiveGradeCards = function(q) {
    q = q.toLowerCase();
    document.querySelectorAll('.archive-grade-card').forEach(c => { c.style.display = c.dataset.name.includes(q) ? '' : 'none'; });
};
window.toggleGradeDetail = function(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(id + '_icon');
    if (el) {
        const show = el.style.display === 'none';
        el.style.display = show ? 'block' : 'none';
        if (icon) icon.style.transform = show ? 'rotate(180deg)' : '';
    }
};
window.filterArchivePaymentCards = function(q) {
    q = q.toLowerCase();
    document.querySelectorAll('.archive-payment-card').forEach(c => { c.style.display = c.dataset.name.includes(q) ? '' : 'none'; });
};
window.filterArchiveAttendanceCards = function(q) {
    q = q.toLowerCase();
    document.querySelectorAll('.archive-att-card').forEach(c => { c.style.display = c.dataset.name.includes(q) ? '' : 'none'; });
};

// ============================================
// DELETE ARCHIVE FROM MEGA.NZ
// ============================================
window.deleteArchiveSeason = function(seasonName) {
    const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
    const msgs = {
        de: {
            title: 'Archiv löschen',
            warning: 'Sind Sie sicher, dass Sie die Archivdatei für <strong>' + seasonName + '</strong> dauerhaft von Mega.nz löschen möchten?',
            detail: 'Diese Aktion kann nicht rückgängig gemacht werden. Alle archivierten Daten (Schüler, Noten, Anwesenheit, Zahlungen) gehen verloren.',
            confirm: 'Endgültig löschen',
            cancel: 'Abbrechen'
        },
        en: {
            title: 'Delete Archive',
            warning: 'Are you sure you want to permanently delete the archive file for <strong>' + seasonName + '</strong> from Mega.nz?',
            detail: 'This action cannot be undone. All archived data (students, grades, attendance, payments) will be permanently lost.',
            confirm: 'Delete permanently',
            cancel: 'Cancel'
        },
        fr: {
            title: 'Supprimer l\'archive',
            warning: 'Êtes-vous sûr de vouloir supprimer définitivement l\'archive de <strong>' + seasonName + '</strong> depuis Mega.nz ?',
            detail: 'Cette action est irréversible. Toutes les données archivées (étudiants, notes, présences, paiements) seront perdues.',
            confirm: 'Supprimer définitivement',
            cancel: 'Annuler'
        },
        ar: {
            title: 'حذف الأرشيف',
            warning: 'هل أنت متأكد من حذف ملف أرشيف <strong>' + seasonName + '</strong> نهائياً من Mega.nz؟',
            detail: 'لا يمكن التراجع عن هذا الإجراء. سيتم فقدان جميع البيانات المؤرشفة (الطلاب، الدرجات، الحضور، المدفوعات) نهائياً.',
            confirm: 'حذف نهائياً',
            cancel: 'إلغاء'
        }
    };
    const m = msgs[lang] || msgs.fr;
    const isRtl = lang === 'ar';

    const modal = document.createElement('div');
    modal.id = 'deleteArchiveModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;max-width:480px;width:90%;box-shadow:0 25px 60px rgba(0,0,0,0.25);overflow:hidden;${isRtl ? 'direction:rtl;' : ''}" onclick="event.stopPropagation()">
            <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:20px 24px;display:flex;align-items:center;gap:14px;">
                <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-exclamation-triangle" style="color:white;font-size:1.2em;"></i>
                </div>
                <div>
                    <h3 style="margin:0;color:white;font-size:1.1rem;font-weight:700;">${m.title}</h3>
                    <p style="margin:3px 0 0;color:rgba(255,255,255,0.85);font-size:0.82rem;">${seasonName}</p>
                </div>
            </div>
            <div style="padding:20px 24px;">
                <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:16px;margin-bottom:12px;">
                    <p style="margin:0 0 8px;font-size:0.88rem;color:#991b1b;line-height:1.5;">${m.warning}</p>
                    <p style="margin:0;font-size:0.82rem;color:#b91c1c;">${m.detail}</p>
                </div>
            </div>
            <div style="padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;gap:10px;">
                <button onclick="document.getElementById('deleteArchiveModal').remove()" style="padding:10px 20px;background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;font-weight:600;font-size:0.88rem;">${m.cancel}</button>
                <button id="deleteArchiveConfirmBtn" onclick="executeDeleteArchive('${_esc(seasonName)}')" style="padding:10px 20px;background:#dc2626;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.88rem;">
                    <i class="fas fa-trash"></i> ${m.confirm}
                </button>
            </div>
        </div>`;
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
};

window.executeDeleteArchive = async function(seasonName) {
    const btn = document.getElementById('deleteArchiveConfirmBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

    try {
        const response = await fetch(`/api/season-archive/${encodeURIComponent(seasonName)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to delete archive');
        }

        document.getElementById('deleteArchiveModal')?.remove();
        showNotification(`${t('archiveDeleted')}: "${seasonName}"`, 'success');
        loadArchivedSeasonsList();
    } catch (error) {
        console.error('Error deleting archive:', error);
        showNotification(error.message, 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash"></i> Supprimer'; }
    }
};
