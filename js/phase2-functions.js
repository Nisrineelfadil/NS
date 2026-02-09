// ============================================
// PHASE 2.2: Season-Specific Drill-Down Management
// ============================================

// Helper function to validate photo path
function isValidPhotoPath(photoPath) {
    if (!photoPath) return false;
    if (photoPath.includes('undefined') || photoPath.includes('null')) return false;
    return true;
}

// Track current season for drill-down
let currentSeasonId = null;
let currentSeasonData = null;

// Switch between Language Groups and Branch Groups view
window.switchGroupView = function(view) {
    const languageToggle = document.getElementById('languageToggle');
    const branchToggle = document.getElementById('branchToggle');
    const toggleSlider = document.getElementById('toggleSlider');
    const languageView = document.getElementById('languageGroupsView');
    const branchView = document.getElementById('branchGroupsView');

    if (view === 'language') {
        // Update toggle buttons
        languageToggle.classList.add('active');
        branchToggle.classList.remove('active');
        toggleSlider.classList.remove('branch');

        // Switch views
        languageView.classList.add('active');
        branchView.classList.remove('active');

        // Load language groups if not already loaded
        loadLanguageGroups();
    } else {
        // Update toggle buttons
        branchToggle.classList.add('active');
        languageToggle.classList.remove('active');
        toggleSlider.classList.add('branch');

        // Switch views
        branchView.classList.add('active');
        languageView.classList.remove('active');

        // Load branch groups if not already loaded
        loadBranchGroups();
    }
}

// Load Seasons
async function loadSeasons() {
    try {
        const response = await fetch('/api/seasons', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load seasons');
        
        const data = await response.json();
        // Handle both array response and object with seasons property
        const seasons = Array.isArray(data) ? data : (data.seasons || []);
        displaySeasons(seasons);
    } catch (error) {
        console.error('Error loading seasons:', error);
        showNotification('Failed to load seasons', 'error');
    }
}

// Display Seasons
function displaySeasons(seasons) {
    const grid = document.getElementById('seasonsGrid');
    if (!grid) return;

    if (seasons.length === 0) {
        grid.innerHTML = `<p style="text-align: center; color: #64748b; padding: 40px;">${t('noRecentSessions')}</p>`;
        return;
    }

    grid.innerHTML = seasons.map(season => `
        <div class="card" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0 0 5px 0; color: #1e293b;">
                        <i class="fas fa-calendar-alt" style="color: #667eea;"></i>
                        ${season.name}
                    </h3>
                    <span class="badge ${season.status === 'active' ? 'badge-success' : 'badge-secondary'}" style="font-size: 0.75rem;">
                        ${t(season.status)}
                    </span>
                </div>
                <div class="dropdown" style="position: relative;">
                    <button class="btn btn-sm" onclick="toggleSeasonMenu('${season._id}')" style="padding: 5px 10px;">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div id="seasonMenu-${season._id}" class="dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 180px; z-index: 1000;">
                        <a href="#" onclick="manageSeasonGroups('${season._id}'); return false;" style="display: block; padding: 10px 15px; color: #667eea; text-decoration: none; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                            <i class="fas fa-layer-group"></i> ${t('manageGroups')}
                        </a>
                        <a href="#" onclick="editSeason('${season._id}'); return false;" style="display: block; padding: 10px 15px; color: #1e293b; text-decoration: none;">
                            <i class="fas fa-edit"></i> ${t('editSeason')}
                        </a>
                        ${season.status !== 'active' ? `
                        <a href="#" onclick="activateSeason('${season._id}'); return false;" style="display: block; padding: 10px 15px; color: #059669; text-decoration: none;">
                            <i class="fas fa-check-circle"></i> ${t('activate')}
                        </a>
                        ` : ''}
                        ${season.status !== 'archived' ? `
                        <a href="#" onclick="archiveSeason('${season._id}'); return false;" style="display: block; padding: 10px 15px; color: #f59e0b; text-decoration: none;">
                            <i class="fas fa-archive"></i> ${t('archiveToCloud')}
                        </a>
                        ` : ''}
                        <a href="#" onclick="deleteSeason('${season._id}', '${season.name}', ${season.groupCount || 0}, '${season.status}'); return false;" style="display: block; padding: 10px 15px; color: #dc2626; text-decoration: none; border-top: 1px solid #fee2e2;">
                            <i class="fas fa-trash"></i> ${t('delete')}
                        </a>
                    </div>
                </div>
            </div>
            <div style="color: #64748b; font-size: 0.9rem;">
                <p style="margin: 5px 0;">
                    <i class="fas fa-calendar-day"></i>
                    <strong>${t('start')}:</strong> ${new Date(season.startDate).toLocaleDateString()}
                </p>
                <p style="margin: 5px 0;">
                    <i class="fas fa-calendar-check"></i>
                    <strong>${t('end')}:</strong> ${new Date(season.endDate).toLocaleDateString()}
                </p>
                <p style="margin: 5px 0;">
                    <i class="fas fa-layer-group"></i>
                    <strong>${t('groups')}:</strong> ${season.groupCount || 0}
                </p>
                ${season.description ? `<p style="margin: 10px 0 0 0; font-style: italic;">${season.description}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Toggle Season Menu
function toggleSeasonMenu(seasonId) {
    // Close all other menus
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== `seasonMenu-${seasonId}`) {
            menu.style.display = 'none';
        }
    });
    
    const menu = document.getElementById(`seasonMenu-${seasonId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Close menus when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

// Open Add Season Modal
window.openAddSeasonModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'seasonModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2><i class="fas fa-calendar-plus"></i> ${t('createSeason')}</h2>
                <button class="close-modal" onclick="closeSeasonModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="seasonForm" onsubmit="createSeason(event)">
                    <div class="form-group">
                        <label for="seasonName">${t('name')} *</label>
                        <input type="text" id="seasonName" placeholder="e.g., 2025-2026" pattern="\\d{4}-\\d{4}" required>
                        <small style="color: #64748b;">Format: YYYY-YYYY</small>
                    </div>
                    <div class="form-group">
                        <label for="seasonStartDate">${t('startDate')} *</label>
                        <input type="date" id="seasonStartDate" required>
                    </div>
                    <div class="form-group">
                        <label for="seasonEndDate">${t('endDate')} *</label>
                        <input type="date" id="seasonEndDate" required>
                    </div>
                    <div class="form-group">
                        <label for="seasonDescription">${t('description')} (${t('optional')})</label>
                        <textarea id="seasonDescription" rows="3" placeholder="Add notes about this academic year..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="seasonStatus">${t('status')}</label>
                        <select id="seasonStatus">
                            <option value="upcoming">${t('upcoming')}</option>
                            <option value="active">${t('active')}</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeSeasonModal()">${t('cancel')}</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-plus"></i> ${t('createSeason')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
};

// Close Season Modal
window.closeSeasonModal = function() {
    const modal = document.getElementById('seasonModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
};

// Create Season
window.createSeason = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('seasonName').value.trim();
    const startDate = document.getElementById('seasonStartDate').value;
    const endDate = document.getElementById('seasonEndDate').value;
    const description = document.getElementById('seasonDescription').value.trim();
    const status = document.getElementById('seasonStatus').value;
    
    try {
        const response = await fetch('/api/seasons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                startDate,
                endDate,
                description,
                status
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create season');
        }
        
        showNotification('Season created successfully!', 'success');
        closeSeasonModal();
        loadSeasons();
    } catch (error) {
        console.error('Error creating season:', error);
        showNotification(error.message, 'error');
    }
};

// Edit Season
async function editSeason(seasonId) {
    try {
        // Fetch season data
        const response = await fetch(`/api/seasons/${seasonId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load season');
        
        const seasonData = await response.json();
        const season = seasonData.groups ? seasonData : seasonData; // Handle both response formats
        
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'editSeasonModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-edit"></i> ${t('editSeason')}</h2>
                    <button class="close-modal" onclick="closeEditSeasonModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editSeasonForm" onsubmit="updateSeason(event, '${seasonId}')">
                        <div class="form-group">
                            <label for="editSeasonName">${t('name')} *</label>
                            <input type="text" id="editSeasonName" value="${season.name}" pattern="\\d{4}-\\d{4}" required>
                        </div>
                        <div class="form-group">
                            <label for="editSeasonStartDate">${t('startDate')} *</label>
                            <input type="date" id="editSeasonStartDate" value="${season.startDate.split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="editSeasonEndDate">${t('endDate')} *</label>
                            <input type="date" id="editSeasonEndDate" value="${season.endDate.split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="editSeasonDescription">${t('description')}</label>
                            <textarea id="editSeasonDescription" rows="3">${season.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="editSeasonStatus">${t('status')}</label>
                            <select id="editSeasonStatus">
                                <option value="upcoming" ${season.status === 'upcoming' ? 'selected' : ''}>${t('upcoming')}</option>
                                <option value="active" ${season.status === 'active' ? 'selected' : ''}>${t('active')}</option>
                                <option value="archived" ${season.status === 'archived' ? 'selected' : ''}>${t('archived')}</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeEditSeasonModal()">${t('cancel')}</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> ${t('save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    } catch (error) {
        console.error('Error loading season for edit:', error);
        showNotification('Failed to load season data', 'error');
    }
}

// Close Edit Season Modal
window.closeEditSeasonModal = function() {
    const modal = document.getElementById('editSeasonModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
};

// Update Season
window.updateSeason = async function(event, seasonId) {
    event.preventDefault();
    
    const name = document.getElementById('editSeasonName').value.trim();
    const startDate = document.getElementById('editSeasonStartDate').value;
    const endDate = document.getElementById('editSeasonEndDate').value;
    const description = document.getElementById('editSeasonDescription').value.trim();
    const status = document.getElementById('editSeasonStatus').value;
    
    try {
        const response = await fetch(`/api/seasons/${seasonId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                startDate,
                endDate,
                description,
                status
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update season');
        }
        
        showNotification('Season updated successfully!', 'success');
        closeEditSeasonModal();
        loadSeasons();
    } catch (error) {
        console.error('Error updating season:', error);
        showNotification(error.message, 'error');
    }
};

// Activate Season
async function activateSeason(seasonId) {
    if (!confirm('Activate this season? This will archive all other seasons.')) return;
    
    try {
        const response = await fetch(`/api/seasons/${seasonId}/activate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to activate season');
        
        showNotification('Season activated successfully!', 'success');
        loadSeasons();
    } catch (error) {
        console.error('Error activating season:', error);
        showNotification('Failed to activate season', 'error');
    }
}

// Archive Season - Open carry-over student selection modal
async function archiveSeason(seasonId) {
    try {
        showNotification('Chargement des données de la saison...', 'info');
        
        const response = await fetch(`/api/season-archive/${seasonId}/prepare`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Échec du chargement');
        }

        const data = await response.json();
        showArchiveModal(data);
    } catch (error) {
        console.error('Erreur préparation archive:', error);
        showNotification(error.message, 'error');
    }
}

// Show Archive Modal with carry-over student selection
function showArchiveModal(data) {
    const existingModal = document.getElementById('archiveSeasonModal');
    if (existingModal) existingModal.remove();

    const { season, students, stats } = data;
    const totalGroups = (stats.totalLanguageGroups || 0) + (stats.totalBranchSubgroups || 0);

    const modal = document.createElement('div');
    modal.id = 'archiveSeasonModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 860px; max-height: 92vh; border-radius: 20px; overflow: hidden; border: none; box-shadow: 0 25px 60px rgba(0,0,0,0.2);">
            <!-- Header -->
            <div style="background: white; padding: 24px 28px 20px; border-bottom: 1px solid #f1f5f9; position: relative;">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd);"></div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="width: 46px; height: 46px; background: linear-gradient(135deg, #7c3aed, #a78bfa); border-radius: 14px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-box-archive" style="color: white; font-size: 1.2em;"></i>
                        </div>
                        <div>
                            <h2 style="margin: 0; font-size: 1.2rem; color: #1e293b; font-weight: 700;">Archiver la saison ${season.name}</h2>
                            <p style="margin: 2px 0 0; font-size: 0.82rem; color: #94a3b8;">Sauvegarder et nettoyer les données</p>
                        </div>
                    </div>
                    <button onclick="document.getElementById('archiveSeasonModal').remove()" style="width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div style="overflow-y: auto; max-height: calc(92vh - 170px); padding: 24px 28px;">
                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                    <div style="background: #f5f3ff; border-radius: 12px; padding: 14px; text-align: center;">
                        <div style="font-size: 1.6rem; font-weight: 800; color: #7c3aed;">${stats.totalStudents}</div>
                        <div style="font-size: 0.78rem; color: #6d28d9; font-weight: 500;">Étudiants</div>
                    </div>
                    <div style="background: #f0fdf4; border-radius: 12px; padding: 14px; text-align: center;">
                        <div style="font-size: 1.6rem; font-weight: 800; color: #059669;">${stats.totalGrades}</div>
                        <div style="font-size: 0.78rem; color: #047857; font-weight: 500;">Notes</div>
                    </div>
                    <div style="background: #fffbeb; border-radius: 12px; padding: 14px; text-align: center;">
                        <div style="font-size: 1.6rem; font-weight: 800; color: #d97706;">${totalGroups}</div>
                        <div style="font-size: 0.78rem; color: #b45309; font-weight: 500;">Groupes</div>
                    </div>
                </div>

                <!-- Info Banner -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: flex-start; gap: 12px;">
                        <div style="width: 32px; height: 32px; background: #dbeafe; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                            <i class="fas fa-info-circle" style="color: #2563eb; font-size: 0.9em;"></i>
                        </div>
                        <div style="font-size: 0.84rem; color: #475569; line-height: 1.6;">
                            <strong style="color: #1e293b;">Ce qui va se passer :</strong>
                            <div style="margin-top: 6px;">
                                <span style="display: inline-flex; align-items: center; gap: 4px; margin-right: 12px;"><i class="fas fa-cloud-upload-alt" style="color: #7c3aed;"></i> Sauvegarde sur Mega.nz</span>
                                <span style="display: inline-flex; align-items: center; gap: 4px; margin-right: 12px;"><i class="fas fa-broom" style="color: #d97706;"></i> Nettoyage de la base</span>
                                <span style="display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-user-shield" style="color: #059669;"></i> Conservation des étudiants sélectionnés</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Student Selection -->
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
                    <div style="padding: 16px 20px; background: #fafbfc; border-bottom: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <h3 style="margin: 0; font-size: 0.95rem; color: #1e293b; font-weight: 700;">
                                    <i class="fas fa-user-check" style="color: #059669;"></i> Sélectionner les étudiants à conserver
                                </h3>
                                <p style="margin: 4px 0 0; font-size: 0.78rem; color: #94a3b8;" id="archiveSelectedCount">0 sélectionné(s) sur ${students.length}</p>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button onclick="archiveSelectAll(true)" style="padding: 6px 12px; background: #f0fdf4; color: #059669; border: 1px solid #bbf7d0; border-radius: 8px; cursor: pointer; font-size: 0.78rem; font-weight: 600;" onmouseover="this.style.background='#dcfce7'" onmouseout="this.style.background='#f0fdf4'">
                                    <i class="fas fa-check-double"></i> Tous
                                </button>
                                <button onclick="archiveSelectAll(false)" style="padding: 6px 12px; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 0.78rem; font-weight: 600;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                                    <i class="fas fa-times"></i> Aucun
                                </button>
                            </div>
                        </div>
                        <div style="margin-top: 12px;">
                            <input type="text" id="archiveStudentSearch" placeholder="Rechercher un étudiant..." 
                                oninput="filterArchiveStudents(this.value)"
                                style="width: 100%; padding: 9px 14px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border 0.2s;"
                                onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#d1d5db'">
                        </div>
                    </div>

                    <div id="archiveStudentList" style="max-height: 280px; overflow-y: auto;">
                        ${students.map((s, i) => `
                            <label class="archive-student-item" style="display: flex; align-items: center; gap: 12px; padding: 11px 20px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.15s; ${i % 2 === 0 ? 'background:#fafbfc;' : 'background:white;'}"
                                onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='${i % 2 === 0 ? '#fafbfc' : 'white'}'">
                                <input type="checkbox" class="archive-student-checkbox" value="${s._id}" onchange="updateArchiveSelectedCount()" style="width: 16px; height: 16px; accent-color: #7c3aed;">
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 600; color: #1e293b; font-size: 0.88rem;">${s.fullName}</div>
                                    <div style="font-size: 0.76rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${(s.formation || []).join(', ')}${s.filiere && s.filiere.length > 0 ? ' · ' + s.filiere.join(', ') : ''}
                                    </div>
                                </div>
                                <div style="font-size: 0.72rem; color: #c4b5fd; background: #f5f3ff; padding: 2px 8px; border-radius: 5px; white-space: nowrap;">
                                    ${s.groupName || '-'}
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding: 16px 28px; border-top: 1px solid #f1f5f9; background: white; display: flex; justify-content: space-between; align-items: center;">
                <button onclick="document.getElementById('archiveSeasonModal').remove()" style="padding: 10px 20px; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.88rem;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                    <i class="fas fa-times"></i> Annuler
                </button>
                <button onclick="executeArchive('${season._id}')" class="archive-execute-btn" style="padding: 10px 24px; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.88rem; box-shadow: 0 2px 8px rgba(124,58,237,0.3); transition: all 0.2s;" onmouseover="this.style.boxShadow='0 4px 16px rgba(124,58,237,0.4)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(124,58,237,0.3)'">
                    <i class="fas fa-box-archive"></i> Archiver et Nettoyer
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Select/Deselect all students in archive modal
window.archiveSelectAll = function(selectAll) {
    document.querySelectorAll('.archive-student-checkbox').forEach(cb => {
        const item = cb.closest('.archive-student-item');
        if (item && item.style.display !== 'none') {
            cb.checked = selectAll;
        }
    });
    updateArchiveSelectedCount();
};

// Filter students in archive modal
window.filterArchiveStudents = function(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.archive-student-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
    });
};

// Update selected count
window.updateArchiveSelectedCount = function() {
    const checked = document.querySelectorAll('.archive-student-checkbox:checked').length;
    const total = document.querySelectorAll('.archive-student-checkbox').length;
    const el = document.getElementById('archiveSelectedCount');
    if (el) el.textContent = `${checked} sélectionné(s) sur ${total}`;
};

// Execute the actual archive
window.executeArchive = async function(seasonId) {
    const checkboxes = document.querySelectorAll('.archive-student-checkbox:checked');
    const carryOverStudentIds = Array.from(checkboxes).map(cb => cb.value);
    const totalStudents = document.querySelectorAll('.archive-student-checkbox').length;
    const toDelete = totalStudents - carryOverStudentIds.length;

    const confirmed = confirm(
        `Confirmer l'archivage :\n\n` +
        `• ${carryOverStudentIds.length} étudiant(s) conservé(s) pour la prochaine saison\n` +
        `• ${toDelete} étudiant(s) seront archivés et supprimés de la base\n` +
        `• Toutes les données seront sauvegardées sur Mega.nz\n\n` +
        `Cette action est IRRÉVERSIBLE. Continuer ?`
    );

    if (!confirmed) return;

    // Show progress
    const btn = document.querySelector('#archiveSeasonModal .modal-footer .btn:last-child');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Archivage en cours...';
    }

    try {
        const response = await fetch(`/api/season-archive/${seasonId}/archive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ carryOverStudentIds })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Échec de l\'archivage');
        }

        const result = await response.json();

        // Close modal
        document.getElementById('archiveSeasonModal')?.remove();

        // Show success
        showNotification(
            `Saison archivée avec succès ! Taille: ${result.archiveSize}. ` +
            `${result.purged.students} étudiants supprimés, ${result.carryOver.students} conservés.`,
            'success'
        );

        // Reload seasons
        loadSeasons();
    } catch (error) {
        console.error('Erreur archivage:', error);
        showNotification(error.message, 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-archive"></i> Archiver et Nettoyer';
        }
    }
};

// Delete Season - show centered modal with multilingual warning
async function deleteSeason(seasonId, seasonName, groupCount, status) {
    // Close dropdown
    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');

    const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
    const isArchived = status === 'archived';
    const hasData = groupCount > 0;

    // Multilingual warning texts
    const msgs = {
        de: {
            title: 'Saison löschen',
            safeTitle: 'Archivierte Saison löschen',
            safeMsg: 'Diese Saison wurde bereits archiviert. Alle Daten sind sicher auf Mega.nz gespeichert. Es wird nur die Saisonkarte entfernt.',
            dangerTitle: '⚠️ ACHTUNG — Nicht archivierte Saison',
            dangerMsg: 'Diese Saison wurde <strong>NICHT archiviert</strong>. Wenn Sie sie löschen, werden <strong>ALLE Daten unwiderruflich gelöscht</strong>:',
            items: ['Alle Schüler und ihre Daten', 'Alle Noten', 'Alle Anwesenheitsdaten', 'Alle Zahlungshistorien', 'Alle Gruppen', 'Alle Nachrichten'],
            recommend: 'Wir empfehlen dringend, zuerst zu archivieren!',
            emptyMsg: 'Diese Saison hat keine Gruppen oder Schülerdaten. Es wird nur die Saisonkarte entfernt.',
            confirmLabel: 'Endgültig löschen',
            cancelLabel: 'Abbrechen',
            typePlaceholder: 'Saisonname eingeben zum Bestätigen'
        },
        en: {
            title: 'Delete Season',
            safeTitle: 'Delete Archived Season',
            safeMsg: 'This season has already been archived. All data is safely stored on Mega.nz. Only the season card will be removed.',
            dangerTitle: '⚠️ WARNING — Non-Archived Season',
            dangerMsg: 'This season has <strong>NOT been archived</strong>. Deleting it will <strong>permanently erase ALL data</strong>:',
            items: ['All students and their data', 'All grades', 'All attendance records', 'All payment history', 'All groups', 'All messages'],
            recommend: 'We strongly recommend archiving first!',
            emptyMsg: 'This season has no groups or student data. Only the season card will be removed.',
            confirmLabel: 'Delete permanently',
            cancelLabel: 'Cancel',
            typePlaceholder: 'Type season name to confirm'
        },
        fr: {
            title: 'Supprimer la saison',
            safeTitle: 'Supprimer la saison archivée',
            safeMsg: 'Cette saison a déjà été archivée. Toutes les données sont sauvegardées sur Mega.nz. Seule la carte de la saison sera supprimée.',
            dangerTitle: '⚠️ ATTENTION — Saison non archivée',
            dangerMsg: 'Cette saison n\'a <strong>PAS été archivée</strong>. La supprimer effacera <strong>TOUTES les données de manière irréversible</strong> :',
            items: ['Tous les étudiants et leurs données', 'Toutes les notes', 'Toutes les données de présence', 'Tout l\'historique des paiements', 'Tous les groupes', 'Tous les messages'],
            recommend: 'Nous recommandons fortement d\'archiver d\'abord !',
            emptyMsg: 'Cette saison n\'a pas de groupes ou de données étudiants. Seule la carte de la saison sera supprimée.',
            confirmLabel: 'Supprimer définitivement',
            cancelLabel: 'Annuler',
            typePlaceholder: 'Tapez le nom de la saison pour confirmer'
        },
        ar: {
            title: 'حذف الموسم',
            safeTitle: 'حذف الموسم المؤرشف',
            safeMsg: 'تم أرشفة هذا الموسم بالفعل. جميع البيانات محفوظة بأمان على Mega.nz. سيتم حذف بطاقة الموسم فقط.',
            dangerTitle: '⚠️ تحذير — موسم غير مؤرشف',
            dangerMsg: 'هذا الموسم <strong>لم يتم أرشفته</strong>. حذفه سيؤدي إلى <strong>محو جميع البيانات نهائياً</strong>:',
            items: ['جميع الطلاب وبياناتهم', 'جميع الدرجات', 'جميع سجلات الحضور', 'جميع سجلات الدفع', 'جميع المجموعات', 'جميع الرسائل'],
            recommend: 'ننصح بشدة بالأرشفة أولاً!',
            emptyMsg: 'هذا الموسم ليس به مجموعات أو بيانات طلاب. سيتم حذف بطاقة الموسم فقط.',
            confirmLabel: 'حذف نهائياً',
            cancelLabel: 'إلغاء',
            typePlaceholder: 'اكتب اسم الموسم للتأكيد'
        }
    };
    const m = msgs[lang] || msgs.fr;
    const isRtl = lang === 'ar';

    // Determine scenario
    let headerBg, headerIcon, bodyContent;
    if (isArchived || !hasData) {
        // Safe delete — just removing the card
        headerBg = 'linear-gradient(135deg, #f59e0b, #d97706)';
        headerIcon = 'fa-box-archive';
        bodyContent = `
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;background:#fef3c7;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-info-circle" style="color:#d97706;"></i>
                    </div>
                    <p style="margin:0;font-size:0.88rem;color:#92400e;line-height:1.5;">${isArchived ? m.safeMsg : m.emptyMsg}</p>
                </div>
            </div>`;
    } else {
        // DANGER — non-archived with data
        headerBg = 'linear-gradient(135deg, #dc2626, #b91c1c)';
        headerIcon = 'fa-exclamation-triangle';
        bodyContent = `
            <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="display:flex;align-items:flex-start;gap:10px;">
                    <div style="width:36px;height:36px;background:#fee2e2;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
                        <i class="fas fa-skull-crossbones" style="color:#dc2626;"></i>
                    </div>
                    <div>
                        <p style="margin:0 0 8px;font-size:0.88rem;color:#991b1b;line-height:1.5;">${m.dangerMsg}</p>
                        <ul style="margin:0;padding-left:18px;color:#991b1b;font-size:0.82rem;line-height:1.8;">
                            ${m.items.map(i => `<li>${i}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin-bottom:16px;text-align:center;">
                <strong style="color:#92400e;font-size:0.88rem;"><i class="fas fa-lightbulb"></i> ${m.recommend}</strong>
            </div>
            <div style="margin-bottom:8px;">
                <label style="font-size:0.82rem;color:#64748b;display:block;margin-bottom:6px;">${m.typePlaceholder}: <strong>${seasonName}</strong></label>
                <input type="text" id="deleteSeasonConfirmInput" placeholder="${seasonName}" style="width:100%;padding:10px 14px;border:2px solid #fca5a5;border-radius:10px;font-size:0.9rem;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor='#dc2626'" onblur="this.style.borderColor='#fca5a5'" oninput="document.getElementById('deleteSeasonConfirmBtn').disabled = this.value !== '${seasonName}'">
            </div>`;
    }

    const needsTyping = !isArchived && hasData;
    const modal = document.createElement('div');
    modal.id = 'deleteSeasonModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;animation:fadeIn 0.2s;';
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;max-width:520px;width:90%;box-shadow:0 25px 60px rgba(0,0,0,0.25);overflow:hidden;${isRtl ? 'direction:rtl;' : ''}" onclick="event.stopPropagation()">
            <div style="background:${headerBg};padding:20px 24px;display:flex;align-items:center;gap:14px;">
                <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas ${headerIcon}" style="color:white;font-size:1.2em;"></i>
                </div>
                <div>
                    <h3 style="margin:0;color:white;font-size:1.1rem;font-weight:700;">${!isArchived && hasData ? m.dangerTitle : (isArchived ? m.safeTitle : m.title)}</h3>
                    <p style="margin:3px 0 0;color:rgba(255,255,255,0.85);font-size:0.82rem;">${seasonName}</p>
                </div>
            </div>
            <div style="padding:20px 24px;">
                ${bodyContent}
            </div>
            <div style="padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;gap:10px;">
                <button onclick="document.getElementById('deleteSeasonModal').remove()" style="padding:10px 20px;background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;font-weight:600;font-size:0.88rem;">${m.cancelLabel}</button>
                <button id="deleteSeasonConfirmBtn" onclick="executeDeleteSeason('${seasonId}', ${hasData})" ${needsTyping ? 'disabled' : ''} style="padding:10px 20px;background:${needsTyping ? '#fca5a5' : '#dc2626'};color:white;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.88rem;opacity:${needsTyping ? '0.5' : '1'};transition:all 0.2s;">
                    <i class="fas fa-trash"></i> ${m.confirmLabel}
                </button>
            </div>
        </div>`;

    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
}

// Execute the actual season deletion
window.executeDeleteSeason = async function(seasonId, forceNeeded) {
    const btn = document.getElementById('deleteSeasonConfirmBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

    try {
        const url = forceNeeded ? `/api/seasons/${seasonId}?force=true` : `/api/seasons/${seasonId}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete season');
        }

        document.getElementById('deleteSeasonModal')?.remove();
        showNotification(t('successDeleted') || 'Saison supprimée avec succès !', 'success');
        loadSeasons();
    } catch (error) {
        console.error('Error deleting season:', error);
        showNotification(error.message, 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash"></i> ' + (t('delete') || 'Delete'); }
    }
};

// Archive to Mega Cloud - Season Backup System
window.archiveToMegaCloud = async function(seasonId) {
    try {
        // Get season name for confirmation
        const seasonCard = document.querySelector(`[data-season-id="${seasonId}"]`);
        const seasonName = seasonCard?.querySelector('h3')?.textContent?.trim() || 'this season';
        
        // Confirm backup
        const confirmed = confirm(
            `📦 Create Complete Season Backup\n\n` +
            `Season: ${seasonName}\n\n` +
            `This will:\n` +
            `✅ Extract all student data (payments, grades, attendance)\n` +
            `✅ Organize files in structured folders\n` +
            `✅ Compress to ZIP file\n` +
            `✅ Upload to MEGA cloud storage\n\n` +
            `This may take 5-10 minutes for ${document.getElementById('totalStudentsCount')?.textContent || '161'} students.\n\n` +
            `Continue?`
        );
        
        if (!confirmed) return;
        
        // Show progress modal
        showBackupProgressModal(seasonName);
        
        // Start backup
        const response = await fetch('/api/season-backup/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                seasonId: seasonId,
                uploadToCloud: true,
                keepLocalCopy: false
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to start backup');
        }
        
        // Store backup ID for tracking
        window.currentBackupId = data.backupId;
        
        updateBackupProgress({
            percent: 5,
            message: 'Backup started successfully...',
            phase: 'initialization'
        });
        
        // Poll for status updates (fallback if Socket.IO not available)
        if (!window.socket || !window.socket.connected) {
            pollBackupStatus(data.backupId);
        }
        
    } catch (error) {
        console.error('Error starting backup:', error);
        hideBackupProgressModal();
        alert('❌ Failed to start backup:\n\n' + error.message);
    }
};

// Show backup progress modal
function showBackupProgressModal(seasonName) {
    // Remove existing modal if any
    const existingModal = document.getElementById('backupProgressModal');
    if (existingModal) existingModal.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'backupProgressModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        ">
            <h3 style="margin: 0 0 20px 0; color: #1e293b; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5em;">📦</span>
                Creating Season Backup
            </h3>
            
            <div style="margin-bottom: 15px;">
                <strong>Season:</strong> ${seasonName}
            </div>
            
            <div style="
                background: #f1f5f9;
                border-radius: 8px;
                height: 30px;
                overflow: hidden;
                margin-bottom: 15px;
            ">
                <div id="backupProgressBar" style="
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    height: 100%;
                    width: 0%;
                    transition: width 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 0.85rem;
                ">
                    <span id="backupProgressPercent">0%</span>
                </div>
            </div>
            
            <div id="backupProgressMessage" style="
                color: #64748b;
                font-size: 0.95rem;
                margin-bottom: 10px;
            ">
                Initializing backup...
            </div>
            
            <div id="backupProgressDetails" style="
                color: #94a3b8;
                font-size: 0.85rem;
                min-height: 20px;
            "></div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="cancelBackup()" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                ">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Update backup progress
function updateBackupProgress(data) {
    const progressBar = document.getElementById('backupProgressBar');
    const progressPercent = document.getElementById('backupProgressPercent');
    const message = document.getElementById('backupProgressMessage');
    const details = document.getElementById('backupProgressDetails');
    
    if (progressBar) {
        progressBar.style.width = data.percent + '%';
    }
    
    if (progressPercent) {
        progressPercent.textContent = data.percent + '%';
    }
    
    if (message) {
        const phaseEmojis = {
            initialization: '🔧',
            extraction: '📊',
            metadata: '📝',
            compression: '🗜️',
            upload: '☁️',
            cleanup: '🧹',
            complete: '✅',
            error: '❌'
        };
        
        const emoji = phaseEmojis[data.phase] || '⏳';
        message.textContent = `${emoji} ${data.message}`;
    }
    
    if (details && data.currentStudent && data.totalStudents) {
        details.textContent = `Processed ${data.currentStudent} of ${data.totalStudents} students`;
    }
}

// Hide backup progress modal
function hideBackupProgressModal() {
    const modal = document.getElementById('backupProgressModal');
    if (modal) modal.remove();
}

// Cancel backup
window.cancelBackup = function() {
    if (confirm('Are you sure you want to cancel the backup?')) {
        hideBackupProgressModal();
        window.currentBackupId = null;
    }
};

// Poll backup status (fallback if Socket.IO not available)
async function pollBackupStatus(backupId) {
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    let attempts = 0;
    
    const interval = setInterval(async () => {
        attempts++;
        
        if (attempts > maxAttempts) {
            clearInterval(interval);
            hideBackupProgressModal();
            alert('⚠️ Backup is taking longer than expected.\n\nPlease check the backup history later.');
            return;
        }
        
        try {
            const response = await fetch(`/api/season-backup/status/${backupId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.backup) {
                const backup = data.backup;
                
                if (backup.status === 'completed') {
                    clearInterval(interval);
                    updateBackupProgress({
                        percent: 100,
                        message: 'Backup completed successfully!',
                        phase: 'complete'
                    });
                    
                    setTimeout(() => {
                        hideBackupProgressModal();
                        alert(
                            `✅ Backup Completed Successfully!\n\n` +
                            `Students: ${backup.stats.totalStudents}\n` +
                            `Files: ${backup.stats.totalFiles}\n` +
                            `Size: ${backup.stats.totalSizeMB} MB\n` +
                            `Duration: ${backup.duration}s\n\n` +
                            (backup.megaUpload?.success ? 
                                `☁️ Uploaded to MEGA cloud storage` : 
                                `⚠️ Cloud upload failed (local backup created)`)
                        );
                    }, 1500);
                    
                } else if (backup.status === 'failed') {
                    clearInterval(interval);
                    hideBackupProgressModal();
                    alert('❌ Backup failed:\n\n' + (backup.error?.message || 'Unknown error'));
                }
            }
            
        } catch (error) {
            console.error('Error polling backup status:', error);
        }
    }, 5000); // Poll every 5 seconds
}

// Listen for Socket.IO backup events (if available)
if (window.socket) {
    window.socket.on('backup:progress', (data) => {
        if (data.backupId === window.currentBackupId) {
            updateBackupProgress(data);
        }
    });
    
    window.socket.on('backup:complete', (data) => {
        if (data.backupId === window.currentBackupId) {
            updateBackupProgress({
                percent: 100,
                message: 'Backup completed successfully!',
                phase: 'complete'
            });
            
            setTimeout(() => {
                hideBackupProgressModal();
                alert(
                    `✅ Backup Completed Successfully!\n\n` +
                    `Students: ${data.result.stats.totalStudents}\n` +
                    `Files: ${data.result.stats.totalFiles}\n` +
                    `Size: ${data.result.stats.totalSizeMB} MB\n` +
                    `Duration: ${data.result.duration}s\n\n` +
                    (data.result.uploadResult?.success ? 
                        `☁️ Uploaded to MEGA cloud storage` : 
                        `⚠️ Cloud upload failed (local backup created)`)
                );
            }, 1500);
        }
    });
    
    window.socket.on('backup:error', (data) => {
        if (data.backupId === window.currentBackupId) {
            hideBackupProgressModal();
            alert('❌ Backup failed:\n\n' + data.error);
        }
    });
}

// ============================================
// Branch Groups Management
// ============================================

// Load Branch Groups
async function loadBranchGroups() {
    try {
        const response = await fetch('/api/branch-groups', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load branch groups');
        
        const branchGroups = await response.json();
        displayBranchGroups(branchGroups);
    } catch (error) {
        console.error('Error loading branch groups:', error);
        showNotification('Failed to load branch groups', 'error');
    }
}

// Display Branch Groups
function displayBranchGroups(branchGroups) {
    const grid = document.getElementById('branchGroupsGrid');
    if (!grid) return;

    if (branchGroups.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No branch groups found.</p>';
        return;
    }

    grid.innerHTML = branchGroups.map(bg => `
        <div class="card" style="padding: 20px; border-left: 4px solid ${bg.color || '#667eea'};">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0 0 5px 0; color: #1e293b;">
                        <span style="font-size: 1.5em; margin-right: 8px;">${bg.icon || '🎓'}</span>
                        ${bg.displayName}
                    </h3>
                    <span class="badge ${bg.type === 'default' ? 'badge-primary' : 'badge-secondary'}" style="font-size: 0.75rem;">
                        ${bg.type.toUpperCase()}
                    </span>
                    <span class="badge ${bg.status === 'active' ? 'badge-success' : 'badge-secondary'}" style="font-size: 0.75rem; margin-left: 5px;">
                        ${bg.status.toUpperCase()}
                    </span>
                </div>
                ${bg.type === 'custom' ? `
                <div class="dropdown" style="position: relative;">
                    <button class="btn btn-sm" onclick="toggleBranchGroupMenu('${bg._id}')" style="padding: 5px 10px;">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div id="branchGroupMenu-${bg._id}" class="dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 150px; z-index: 1000;">
                        <a href="#" onclick="editBranchGroup('${bg._id}'); return false;" style="display: block; padding: 10px 15px; color: #1e293b; text-decoration: none;">
                            <i class="fas fa-edit"></i> Edit
                        </a>
                        ${bg.subgroupCount === 0 ? `
                        <a href="#" onclick="deleteBranchGroup('${bg._id}'); return false;" style="display: block; padding: 10px 15px; color: #dc2626; text-decoration: none;">
                            <i class="fas fa-trash"></i> Delete
                        </a>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
            <div style="color: #64748b; font-size: 0.9rem;">
                <p style="margin: 5px 0;">
                    <i class="fas fa-graduation-cap"></i>
                    <strong>Formation:</strong> ${bg.formation}
                </p>
                <p style="margin: 5px 0;">
                    <i class="fas fa-layer-group"></i>
                    <strong>Subgroups:</strong> ${bg.subgroupCount || 0}
                </p>
                ${bg.description ? `<p style="margin: 10px 0 0 0; font-style: italic;">${bg.description}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Toggle Branch Group Menu
function toggleBranchGroupMenu(bgId) {
    // Close all other menus
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== `branchGroupMenu-${bgId}`) {
            menu.style.display = 'none';
        }
    });
    
    const menu = document.getElementById(`branchGroupMenu-${bgId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Open Add Branch Group Modal
window.openAddBranchGroupModal = function() {
    showNotification('Branch group creation modal - Coming soon!', 'info');
    // TODO: Implement modal
};

// Edit Branch Group
function editBranchGroup(bgId) {
    showNotification('Edit branch group - Coming soon!', 'info');
    // TODO: Implement edit
}

// Delete Branch Group
async function deleteBranchGroup(bgId) {
    if (!confirm('Delete this branch group? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`/api/branch-groups/${bgId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete branch group');
        }
        
        showNotification('Branch group deleted successfully!', 'success');
        loadBranchGroups();
    } catch (error) {
        console.error('Error deleting branch group:', error);
        showNotification(error.message, 'error');
    }
}

// ============================================
// Language Groups Management
// ============================================

// Load Language Groups
async function loadLanguageGroups() {
    try {
        const response = await fetch(`${API_BASE}/groups`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load language groups');
        
        const groups = await response.json();
        displayLanguageGroups(groups);
    } catch (error) {
        console.error('Error loading language groups:', error);
        showNotification('Failed to load language groups', 'error');
    }
}

// Display Language Groups
function displayLanguageGroups(groups) {
    const grid = document.getElementById('languageGroupsGrid');
    if (!grid) return;

    // Filter for language groups only
    const languageGroups = groups.filter(g => 
        g.groupType === 'language' || 
        ['Allemand', 'Anglais', 'Français', 'Ausbildung', 'Mixed'].includes(g.formation)
    );

    if (languageGroups.length === 0) {
        grid.innerHTML = `<p style="text-align: center; color: #64748b; padding: 40px;">${t('noStudentsFound')}</p>`;
        return;
    }

    // Use the existing displayGroups function or create cards
    grid.innerHTML = languageGroups.map(group => `
        <div class="group-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0 0 5px 0; color: #1e293b; font-size: 1.2rem;">
                        ${group.name}
                    </h3>
                    <span class="badge badge-primary" style="font-size: 0.75rem;">
                        ${group.formation}
                    </span>
                    ${group.seasonName ? `<span class="badge badge-secondary" style="font-size: 0.75rem; margin-left: 5px;">${group.seasonName}</span>` : ''}
                </div>
                <span class="badge ${group.status === 'active' ? 'badge-success' : 'badge-secondary'}">
                    ${t(group.status)}
                </span>
            </div>
            <div style="color: #64748b; font-size: 0.9rem;">
                <p style="margin: 5px 0;">
                    <i class="fas fa-users"></i>
                    <strong>${t('students')}:</strong> ${group.currentStudentCount || 0}/${group.maxStudents}
                </p>
                ${group.description ? `<p style="margin: 10px 0 0 0; font-style: italic;">${group.description}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// ============================================
// Season Drill-Down Navigation
// ============================================

// Track all season groups for filtering
let allSeasonGroups = [];
let currentFilter = 'all';

// Manage Groups for a specific season (drill-down)
window.manageSeasonGroups = async function(seasonId) {
    try {
        // Fetch season details
        const response = await fetch(`/api/seasons/${seasonId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load season details');
        
        const seasonData = await response.json();
        currentSeasonId = seasonId;
        currentSeasonData = seasonData;
        
        // Emit event for legacy system to sync
        document.dispatchEvent(new CustomEvent('seasonSelected', {
            detail: {
                seasonId: seasonId,
                seasonName: seasonData.name
            }
        }));

        // Update season header
        document.getElementById('currentSeasonName').textContent = seasonData.name;
        document.getElementById('currentSeasonDates').textContent = 
            `${new Date(seasonData.startDate).toLocaleDateString()} - ${new Date(seasonData.endDate).toLocaleDateString()}`;

        // Switch views
        document.getElementById('seasonsListView').classList.remove('active');
        document.getElementById('seasonGroupsView').classList.add('active');

        // Load language groups by default
        await loadSeasonLanguageGroups(seasonId);
        
        // Reset to language tab
        switchSeasonTab('language');
        
        // Re-translate data-i18n attributes in the newly visible view
        if (typeof translatePage === 'function') translatePage();
        
    } catch (error) {
        console.error('Error managing season groups:', error);
        showNotification('Failed to load season details', 'error');
    }
};

// Back to seasons list
window.backToSeasonsList = function() {
    currentSeasonId = null;
    currentSeasonData = null;

    // Switch views
    document.getElementById('seasonGroupsView').classList.remove('active');
    document.getElementById('seasonsListView').classList.add('active');

    // Reload seasons list
    loadSeasons();
    loadBranchGroups();
};

// Switch between Language Groups and Branch Management tabs
window.switchSeasonTab = function(tab) {
    const languageTab = document.getElementById('seasonLanguageTab');
    const branchTab = document.getElementById('seasonBranchTab');
    const slider = document.getElementById('seasonToggleSlider');
    const languageContent = document.getElementById('languageGroupsTab');
    const branchContent = document.getElementById('branchManagementTab');

    if (tab === 'language') {
        // Update tabs
        languageTab.classList.add('active');
        branchTab.classList.remove('active');
        slider.classList.remove('branch');

        // Switch content
        languageContent.classList.add('active');
        branchContent.classList.remove('active');

        // Load language groups
        if (currentSeasonId) {
            loadSeasonLanguageGroups(currentSeasonId);
        }
    } else {
        // Update tabs
        branchTab.classList.add('active');
        languageTab.classList.remove('active');
        slider.classList.add('branch');

        // Switch content
        branchContent.classList.add('active');
        languageContent.classList.remove('active');

        // Load branch management data
        if (currentSeasonId) {
            loadBranchManagement(currentSeasonId);
        }
    }
};

// Load language groups for specific season
async function loadSeasonLanguageGroups(seasonId) {
    try {
        const response = await fetch(`${API_BASE}/groups?season=${seasonId}&groupType=language`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load season groups');
        
        const data = await response.json();
        // Handle both array response and object with groups property
        const groups = Array.isArray(data) ? data : (data.groups || []);
        displaySeasonLanguageGroups(groups);
    } catch (error) {
        console.error('Error loading season language groups:', error);
        showNotification('Failed to load groups', 'error');
    }
}

// Display season-specific language groups
function displaySeasonLanguageGroups(groups) {
    const grid = document.getElementById('seasonLanguageGroupsGrid');
    if (!grid) return;

    if (groups.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #64748b;">
                <i class="fas fa-users" style="font-size: 3em; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3 style="margin: 0 0 10px 0;">${t('noGroupsInSeason')}</h3>
                <p style="margin: 0;"></p>
            </div>
        `;
        return;
    }

    grid.innerHTML = groups.map(group => `
        <div class="group-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="font-size: 1.5em;">🗣️</span>
                        <h3 style="margin: 0; color: #1e293b; font-size: 1.2rem;">
                            ${group.name}
                        </h3>
                    </div>
                    <span class="badge badge-primary" style="font-size: 0.75rem;">
                        ${group.formation}
                    </span>
                </div>
                <span class="badge ${group.status === 'active' ? 'badge-success' : 'badge-secondary'}">
                    ${t(group.status).toUpperCase()}
                </span>
            </div>
            <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 15px;">
                <p style="margin: 5px 0;">
                    <i class="fas fa-users"></i>
                    <strong>${t('students')}:</strong> ${group.currentStudentCount || 0}/${group.maxStudents || 30}
                </p>
                ${group.description ? `<p style="margin: 10px 0 0 0; font-style: italic;">${group.description}</p>` : ''}
            </div>
            
            <!-- Action Buttons -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                <button onclick="viewLanguageGroupDetails('${group._id}', '${group.name}')" class="btn btn-small" style="background: #f59e0b; color: white;" title="${t('view')}">
                    <i class="fas fa-eye"></i> ${t('view')}
                </button>
                <button onclick="messageLanguageGroup('${group._id}', '${group.name}')" class="btn btn-small" style="background: #3b82f6; color: white;" title="${t('message')}">
                    <i class="fas fa-paper-plane"></i> ${t('message')}
                </button>
                <button onclick='editLanguageGroup(${JSON.stringify(group)})' class="btn btn-small btn-secondary" title="${t('edit')}">
                    <i class="fas fa-edit"></i> ${t('edit')}
            </div>
        </div>
    `).join('');
}

// View language group details with students and top performers
window.viewLanguageGroupDetails = async function(groupId, groupName) {
    try {
        // Fetch students in this group
        const studentsResponse = await fetch(`/api/student-management/students?group=${groupId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!studentsResponse.ok) throw new Error('Failed to load students');
        
        const studentsData = await studentsResponse.json();
        const students = studentsData.students || studentsData;
        
        // Fetch grades for these students
        let studentsWithGrades = [];
        
        for (const student of students) {
            try {
                const gradesResponse = await fetch(`/api/grades/admin/students/${student._id}/grades`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                
                if (gradesResponse.ok) {
                    const gradesData = await gradesResponse.json();
                    studentsWithGrades.push({
                        ...student,
                        grades: gradesData.grades || [],
                        averageScore: gradesData.stats?.averageScore || 0
                    });
                } else {
                    studentsWithGrades.push({
                        ...student,
                        grades: [],
                        averageScore: 0
                    });
                }
            } catch (error) {
                console.error(`Error fetching grades for ${student.fullName}:`, error);
                studentsWithGrades.push({
                    ...student,
                    grades: [],
                    averageScore: 0
                });
            }
        }
        
        // Sort by average score for top performers
        const topPerformers = [...studentsWithGrades]
            .filter(s => s.averageScore > 0)
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 3);
        
        // Create modal (same as subgroup details)
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'languageGroupDetailsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
                <div class="modal-header">
                    <h2 style="margin: 0; color: #1e293b;">
                        <i class="fas fa-users"></i> ${groupName}
                    </h2>
                    <button onclick="this.closest('.modal').remove()" class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="overflow-y: auto; max-height: calc(90vh - 150px);">
                    <!-- Tabs -->
                    <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
                        <button onclick="switchLanguageGroupTab('students')" id="lang-tab-students" class="language-group-tab active" style="padding: 12px 24px; border: none; background: none; cursor: pointer; border-bottom: 3px solid #667eea; color: #667eea; font-weight: 600;">
                            <i class="fas fa-list"></i> ${t('students')} (${students.length})
                        </button>
                        <button onclick="switchLanguageGroupTab('top3')" id="lang-tab-top3" class="language-group-tab" style="padding: 12px 24px; border: none; background: none; cursor: pointer; border-bottom: 3px solid transparent; color: #64748b; font-weight: 600;">
                            <i class="fas fa-trophy"></i> Top 3
                        </button>
                    </div>
                    
                    <!-- Students List Tab -->
                    <div id="lang-content-students" class="language-group-tab-content">
                        ${students.length === 0 ? `
                            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                                <i class="fas fa-users" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>
                                <p>${t('noGroupsInSeason')}</p>
                            </div>
                        ` : `
                            <div style="display: grid; gap: 15px;">
                                ${studentsWithGrades.map((student, index) => `
                                    <div style="background: #f8fafc; border-radius: 8px; padding: 15px; border-left: 4px solid #f59e0b;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div style="flex: 1;">
                                                <h4 style="margin: 0 0 8px 0; color: #1e293b;">${index + 1}. ${student.fullName}</h4>
                                                <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #64748b; flex-wrap: wrap;">
                                                    <span><i class="fas fa-envelope"></i> ${student.schoolEmail}</span>
                                                    ${student.phones && student.phones.length > 0 ? `<span><i class="fas fa-phone"></i> ${student.phones[0]}</span>` : ''}
                                                    ${student.averageScore > 0 ? `<span><i class="fas fa-chart-line"></i> ${student.averageScore.toFixed(1)}%</span>` : ''}
                                                </div>
                                            </div>
                                            <button onclick="viewStudentProfile('${student._id}')" class="btn btn-small btn-primary">
                                                <i class="fas fa-user"></i> ${t('view')}
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    
                    <!-- Top 3 Tab -->
                    <div id="lang-content-top3" class="language-group-tab-content" style="display: none;">
                        ${topPerformers.length === 0 ? `
                            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                                <i class="fas fa-trophy" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>
                                <p>-</p>
                            </div>
                        ` : `
                            <div style="display: grid; gap: 20px;">
                                ${topPerformers.map((student, index) => {
                                    const medals = ['🥇', '🥈', '🥉'];
                                    const colors = ['#fbbf24', '#94a3b8', '#cd7f32'];
                                    return `
                                        <div style="background: linear-gradient(135deg, ${colors[index]}15 0%, ${colors[index]}05 100%); border-radius: 12px; padding: 20px; border: 2px solid ${colors[index]};">
                                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                                <div style="font-size: 3rem;">${medals[index]}</div>
                                                <div style="flex: 1;">
                                                    <h3 style="margin: 0 0 5px 0; color: #1e293b;">${student.fullName}</h3>
                                                    <div style="font-size: 0.9rem; color: #64748b;">
                                                        <i class="fas fa-envelope"></i> ${student.schoolEmail}
                                                    </div>
                                                </div>
                                                <div style="text-align: center;">
                                                    <div style="font-size: 2rem; font-weight: bold; color: ${colors[index]};">${student.averageScore.toFixed(1)}%</div>
                                                    <div style="font-size: 0.8rem; color: #64748b;">${t('academicSummary')}</div>
                                                </div>
                                            </div>
                                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 15px;">
                                                <div style="background: white; padding: 10px; border-radius: 6px;">
                                                    <div style="font-size: 0.8rem; color: #64748b;">${t('studentGrades')}</div>
                                                    <div style="font-size: 1.2rem; font-weight: 600; color: #1e293b;">${student.grades.length}</div>
                                                </div>
                                                <div style="background: white; padding: 10px; border-radius: 6px;">
                                                    <div style="font-size: 0.8rem; color: #64748b;">#</div>
                                                    <div style="font-size: 1.2rem; font-weight: 600; color: #1e293b;">#${index + 1}</div>
                                                </div>
                                            </div>
                                            <button onclick="viewStudentProfile('${student._id}')" class="btn btn-primary" style="width: 100%; margin-top: 15px;">
                                                <i class="fas fa-user"></i> ${t('view')}
                                            </button>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error viewing language group details:', error);
        showNotification('Failed to load group details', 'error');
    }
};

// Switch tabs in language group details modal
window.switchLanguageGroupTab = function(tabName) {
    // Update tab buttons
    document.querySelectorAll('.language-group-tab').forEach(tab => {
        tab.style.borderBottomColor = 'transparent';
        tab.style.color = '#64748b';
    });
    
    const activeTab = document.getElementById(`lang-tab-${tabName}`);
    if (activeTab) {
        activeTab.style.borderBottomColor = '#667eea';
        activeTab.style.color = '#667eea';
    }
    
    // Update content
    document.querySelectorAll('.language-group-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const activeContent = document.getElementById(`lang-content-${tabName}`);
    if (activeContent) {
        activeContent.style.display = 'block';
    }
};

// Message language group
window.messageLanguageGroup = async function(groupId, groupName) {
    try {
        // Fetch students in this group
        const studentsResponse = await fetch(`/api/student-management/students?group=${groupId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!studentsResponse.ok) throw new Error('Failed to load students');
        
        const studentsData = await studentsResponse.json();
        const students = studentsData.students || studentsData;
        
        if (students.length === 0) {
            showNotification('No students in this group to message', 'warning');
            return;
        }
        
        // Create message modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 style="margin: 0; color: #1e293b;">
                        <i class="fas fa-paper-plane"></i> ${t('sendMessage')} - ${groupName}
                    </h2>
                    <button onclick="this.closest('.modal').remove()" class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form onsubmit="sendLanguageGroupMessage(event, '${groupId}', '${groupName}')">
                        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                            <div style="color: #0369a1; font-weight: 600; margin-bottom: 5px;">
                                <i class="fas fa-info-circle"></i> ${t('recipient')}
                            </div>
                            <div style="color: #0c4a6e;">
                                <strong>${students.length} ${t('students')}</strong> - ${groupName}
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>${t('messageTitle')} *</label>
                            <input type="text" name="subject" required style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                        </div>
                        
                        <div class="form-group">
                            <label>${t('messageContent')} *</label>
                            <textarea name="message" required rows="6" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; resize: vertical;"></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <i class="fas fa-paper-plane"></i> ${t('sendMessage')}
                            </button>
                            <button type="button" onclick="this.closest('.modal').remove()" class="btn btn-secondary" style="flex: 1;">
                                <i class="fas fa-times"></i> ${t('cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error loading students for message:', error);
        showNotification('Failed to load students', 'error');
    }
};

// Send message to language group
window.sendLanguageGroupMessage = async function(event, groupId, groupName) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    try {
        // Send message via API using the apiRequest helper from student-management.js
        const data = await apiRequest(`/groups/${groupId}/send-message`, {
            method: 'POST',
            body: JSON.stringify({
                type: 'info',
                title: subject,
                message: message
            })
        });
        
        if (data && data.success) {
            showNotification(`✅ Message sent to ${data.data.studentCount} student(s) in ${groupName}`, 'success');
            // Close modal
            event.target.closest('.modal').remove();
        } else {
            showNotification(data?.message || 'Failed to send message', 'error');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification(error.message || 'Failed to send message', 'error');
    }
};

// Edit language group
window.editLanguageGroup = function(groupData) {
    // If groupData is a string (old format), fetch from API
    if (typeof groupData === 'string') {
        if (typeof editGroup === 'function') {
            editGroup(groupData);
        } else {
            showNotification('Edit group function not available', 'error');
        }
        return;
    }
    
    // New optimized path: use the group data directly (instant!)
    if (typeof editGroupWithData === 'function') {
        editGroupWithData(groupData);
    } else {
        showNotification('Edit group function not available', 'error');
        console.error('editGroupWithData function not found');
    }
};

// Load branch management data
async function loadBranchManagement(seasonId) {
    try {
        console.log('🔄 Loading branch management for season:', seasonId);
        
        // Load branch groups and pending students (filtered by season)
        const [branchGroupsResponse, studentsResponse] = await Promise.all([
            fetch(`/api/branch-groups?season=${seasonId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE}/students`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);

        const branchGroups = await branchGroupsResponse.json();
        const studentsData = await studentsResponse.json();
        
        // Handle both array response and object with students property
        const students = Array.isArray(studentsData) ? studentsData : (studentsData.students || []);

        console.log(`📊 Loaded ${branchGroups.length} branch groups for season ${seasonId}`);
        
        // Display branch groups overview
        displayBranchGroupsOverview(branchGroups);

        // Find pending students (those with filiere but no branch subgroup assigned)
        // IMPORTANT: Only show students from the CURRENT SEASON
        const pendingStudents = students.filter(s => {
            // Must have a filiere (subject selection)
            const hasFiliere = s.filiere && s.filiere.length > 0;
            
            // Must NOT have a branch subgroup assigned
            const noBranchSubgroup = !s.branchSubgroup || s.branchSubgroup === null || s.branchSubgroup === '';
            
            // Must be in the CURRENT SEASON (check if student's group belongs to this season)
            const inCurrentSeason = s.group && s.group.season && s.group.season.toString() === seasonId.toString();
            
            return hasFiliere && noBranchSubgroup && inCurrentSeason;
        });
        
        console.log(`👥 Found ${pendingStudents.length} pending students in season ${seasonId}`);
        displayPendingBranchStudents(pendingStudents);

    } catch (error) {
        console.error('Error loading branch management:', error);
        showNotification('Failed to load branch management data', 'error');
    }
}

// Display branch groups overview
function displayBranchGroupsOverview(branchGroups) {
    const container = document.getElementById('branchGroupsOverview');
    if (!container) return;

    // Map formation names to translation keys
    const formationKeyMap = {
        'Cuisine': 'cuisine',
        'Aide soignant': 'aideSoignant',
        'Restauration': 'restauration',
        'Gestion hôtelière': 'gestionHoteliere',
        'Informatique': 'informatique',
        'Gériatrie': 'geriatrie',
        'Agent socio éducatif': 'agentSocioEducatif',
        'Assistante sociale': 'assistanteSociale'
    };

    if (branchGroups.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #64748b; padding: 40px;">${t('noGroupsInSeason')}</p>`;
        return;
    }

    container.innerHTML = branchGroups.map(bg => {
        const translatedName = formationKeyMap[bg.formation] ? t(formationKeyMap[bg.formation]) : bg.displayName;
        return `
        <div class="card" style="padding: 15px; cursor: pointer; transition: all 0.3s ease;" onclick="viewBranchSubgroups('${bg._id}')">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                <span style="font-size: 2em;">${bg.icon || '🎓'}</span>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 4px 0; color: #1e293b; font-size: 1rem;">
                        ${translatedName}
                    </h4>
                    <span class="badge badge-secondary" style="font-size: 0.7rem;">
                        ${bg.formation}
                    </span>
                </div>
            </div>
            <div style="color: #64748b; font-size: 0.85rem;">
                <p style="margin: 0;">
                    <i class="fas fa-layer-group"></i>
                    <strong>${bg.subgroupCount || 0}</strong> ${t('subgroupsLabel')}
                </p>
            </div>
        </div>
    `}).join('');
}

// Display pending branch students
function displayPendingBranchStudents(students) {
    const container = document.getElementById('pendingBranchStudents');
    if (!container) return;

    if (students.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <i class="fas fa-check-circle" style="font-size: 2.5em; margin-bottom: 15px; color: #10b981;"></i>
                <p style="margin: 0;">${t('pendingBranchAssignmentsDesc')}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
            ${students.map(student => `
                <div class="card" style="padding: 15px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                        ${isValidPhotoPath(student.photoPath) ? 
                            `<img src="${student.photoPath}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;">` :
                            `<div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1.2rem;">${student.fullName ? student.fullName.charAt(0).toUpperCase() : '?'}</div>`
                        }
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 4px 0; color: #1e293b; font-size: 0.95rem;">
                                ${student.fullName}
                            </h4>
                            <span class="badge badge-warning" style="font-size: 0.7rem;">
                                <i class="fas fa-clock"></i> ${t('pending')}
                            </span>
                        </div>
                    </div>
                    <div style="color: #64748b; font-size: 0.85rem;">
                        <p style="margin: 5px 0;">
                            <strong>${t('languageGroupLabel')}:</strong> ${student.group?.name || '-'}
                        </p>
                        <p style="margin: 5px 0;">
                            <strong>${t('filiere')}:</strong> ${student.filiere.join(', ')}
                        </p>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="assignToBranchSubgroup('${student._id}')" style="width: 100%; margin-top: 10px;">
                        <i class="fas fa-check"></i> ${t('save')}
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Placeholder for branch subgroup modal
window.openAddBranchSubgroupModal = function() {
    showNotification('Branch subgroup creation - Coming soon!', 'info');
};

// ============================================
// Unified Groups View (Language + Branch)
// ============================================

// Load all groups for a season (unified view)
async function loadSeasonUnifiedGroups(seasonId) {
    try {
        // Fetch both language groups and branch groups for this season
        const [languageResponse, branchResponse] = await Promise.all([
            fetch(`${API_BASE}/groups?season=${seasonId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/branch-groups`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);

        const languageGroups = await languageResponse.json();
        const branchGroups = await branchResponse.json();

        // Combine and mark types
        allSeasonGroups = [
            ...languageGroups.map(g => ({ ...g, groupCategory: 'language' })),
            ...branchGroups.map(g => ({ ...g, groupCategory: 'branch' }))
        ];

        displayUnifiedGroups(allSeasonGroups);
    } catch (error) {
        console.error('Error loading unified groups:', error);
        showNotification('Failed to load groups', 'error');
    }
}

// Display unified groups (language + branch)
function displayUnifiedGroups(groups) {
    const grid = document.getElementById('seasonUnifiedGroupsGrid');
    if (!grid) return;

    if (groups.length === 0) {
        grid.innerHTML = `<p style="text-align: center; color: #64748b; padding: 40px;">${t('noGroupsInSeason')}</p>`;
        return;
    }

    grid.innerHTML = groups.map(group => {
        const isLanguage = group.groupCategory === 'language';
        const icon = isLanguage ? '🗣️' : (group.icon || '🎓');
        const borderColor = isLanguage ? '#f59e0b' : '#667eea';
        const categoryBadge = isLanguage ? t('language') : t('branch');
        const categoryColor = isLanguage ? '#f59e0b' : '#667eea';

        return `
            <div class="group-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid ${borderColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <span style="font-size: 1.8em;">${icon}</span>
                            <div>
                                <h3 style="margin: 0; color: #1e293b; font-size: 1.2rem;">
                                    ${group.name || group.displayName}
                                </h3>
                                <span class="badge" style="font-size: 0.7rem; background: ${categoryColor}; color: white; margin-top: 4px;">
                                    ${categoryBadge}
                                </span>
                            </div>
                        </div>
                        <span class="badge badge-primary" style="font-size: 0.75rem;">
                            ${group.formation}
                        </span>
                    </div>
                    <span class="badge ${group.status === 'active' ? 'badge-success' : 'badge-secondary'}">
                        ${t(group.status)}
                    </span>
                </div>
                <div style="color: #64748b; font-size: 0.9rem;">
                    ${isLanguage ? `
                        <p style="margin: 5px 0;">
                            <i class="fas fa-users"></i>
                            <strong>${t('students')}:</strong> ${group.currentStudentCount || 0}/${group.maxStudents || 30}
                        </p>
                    ` : `
                        <p style="margin: 5px 0;">
                            <i class="fas fa-layer-group"></i>
                            <strong>${t('subgroupsLabel')}:</strong> ${group.subgroupCount || 0}
                        </p>
                    `}
                    ${group.description ? `<p style="margin: 10px 0 0 0; font-style: italic;">${group.description}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Filter season groups
window.filterSeasonGroups = function(filter) {
    currentFilter = filter;

    // Update filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`).classList.add('active');

    // Filter groups
    let filteredGroups = allSeasonGroups;
    if (filter === 'language') {
        filteredGroups = allSeasonGroups.filter(g => g.groupCategory === 'language');
    } else if (filter === 'branch') {
        filteredGroups = allSeasonGroups.filter(g => g.groupCategory === 'branch');
    }

    displayUnifiedGroups(filteredGroups);
};

// Create language group modal
window.openCreateLanguageGroupModal = function() {
    if (!currentSeasonId) {
        showNotification('Please select a season first', 'warning');
        return;
    }
    
    const modal = createModal(t('createLanguageGroup'), `
        <form onsubmit="createLanguageGroup(event)">
            <div class="form-group">
                <label>${t('groupName')} *</label>
                <input type="text" name="name" required placeholder="e.g., Group A, Group B">
            </div>
            <div class="form-group">
                <label>${t('formation')} *</label>
                <select name="formation" required>
                    <option value="">${t('selectFormation')}</option>
                    <option value="Allemand">Allemand (German)</option>
                    <option value="Anglais">Anglais (English)</option>
                    <option value="Français">Français (French)</option>
                    <option value="Ausbildung">Ausbildung</option>
                    <option value="Mixed">Mixed Languages</option>
                </select>
            </div>
            <div class="form-group">
                <label>${t('maxStudents')} *</label>
                <input type="number" name="maxStudents" required min="1" value="30">
            </div>
            <div class="form-group">
                <label>${t('description')}</label>
                <textarea name="description" rows="3" placeholder="${t('optional')}"></textarea>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn"><i class="fas fa-save"></i> ${t('create')}</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button>
            </div>
        </form>
    `);
    document.body.appendChild(modal);
    modal.classList.add('active');
};

// Create language group
window.createLanguageGroup = async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        formation: formData.get('formation'),
        maxStudents: parseInt(formData.get('maxStudents')),
        description: formData.get('description') || '',
        groupType: 'language',
        season: currentSeasonId,
        seasonName: currentSeasonData.name
    };
    
    try {
        const response = await fetch('/api/student-management/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create group');
        }
        
        const result = await response.json();
        showNotification('Language group created successfully!', 'success');
        closeModal();
        
        // Reload the groups for current season
        await loadSeasonLanguageGroups(currentSeasonId);
        
    } catch (error) {
        console.error('Error creating language group:', error);
        showNotification(error.message || 'Failed to create language group', 'error');
    }
};

// View branch subgroups
window.viewBranchSubgroups = async function(branchGroupId) {
    try {
        // Ensure we have a current season
        if (!currentSeasonId) {
            showNotification('Please select a season first', 'warning');
            return;
        }
        
        // Load branch group details
        const branchResponse = await fetch(`/api/branch-groups/${branchGroupId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!branchResponse.ok) throw new Error('Failed to load branch group');
        
        const branchData = await branchResponse.json();
        
        // Load subgroups filtered by current season
        const subgroupsResponse = await fetch(`/api/branch-groups/${branchGroupId}/subgroups?season=${currentSeasonId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!subgroupsResponse.ok) throw new Error('Failed to load subgroups');
        
        const subgroups = await subgroupsResponse.json();
        
        // Create management modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'branchSubgroupsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh;">
                <div class="modal-header">
                    <h2 style="margin: 0; color: #1e293b;">
                        <i class="fas fa-layer-group"></i> ${branchData.displayName} - ${t('subgroupsLabel')}
                    </h2>
                    <button onclick="this.closest('.modal').remove()" class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="overflow-y: auto; max-height: calc(90vh - 150px);">
                    <!-- Create Button -->
                    <div style="margin-bottom: 20px;">
                        <button onclick="createBranchSubgroup('${branchGroupId}', '${branchData.displayName}')" class="btn btn-success" style="width: 100%;">
                            <i class="fas fa-plus"></i> ${t('create')}
                        </button>
                    </div>
                    
                    <!-- Subgroups List -->
                    <div id="subgroupsList">
                        ${subgroups.length === 0 ? `
                            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                                <i class="fas fa-layer-group" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>
                                <p>${t('noGroupsInSeason')}</p>
                            </div>
                        ` : subgroups.map(sg => {
                            const percentage = (sg.studentCount / sg.maxStudents) * 100;
                            const statusColor = percentage >= 90 ? '#ef4444' : percentage >= 70 ? '#f59e0b' : '#10b981';
                            
                            return `
                                <div class="subgroup-item" style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid ${statusColor};">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div style="flex: 1;">
                                            <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 1rem;">${sg.name}</h4>
                                            <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #64748b;">
                                                <span><i class="fas fa-users"></i> ${sg.studentCount || 0} / ${sg.maxStudents} ${t('students')}</span>
                                                <span><i class="fas fa-calendar"></i> ${new Date(sg.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                            <button onclick="viewSubgroupDetails('${sg._id}', '${sg.name}')" class="btn btn-small" style="background: #f59e0b; color: white;" title="${t('view')}">
                                                <i class="fas fa-eye"></i> ${t('view')}
                                            </button>
                                            <button onclick="messageSubgroup('${sg._id}', '${sg.name}')" class="btn btn-small" style="background: #3b82f6; color: white;" title="${t('message')}">
                                                <i class="fas fa-paper-plane"></i> ${t('message')}
                                            </button>
                                            <button onclick="editBranchSubgroup('${branchGroupId}', '${sg._id}')" class="btn btn-small btn-secondary" title="${t('edit')}">
                                                <i class="fas fa-edit"></i> ${t('edit')}
                                            </button>
                                            <button onclick="deleteBranchSubgroup('${branchGroupId}', '${sg._id}', ${sg.studentCount})" class="btn btn-small btn-danger" title="${t('delete')}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error viewing branch subgroups:', error);
        showNotification(error.message || 'Failed to load subgroups', 'error');
    }
};

// Create branch subgroup
window.createBranchSubgroup = function(branchGroupId, branchDisplayName) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2 style="margin: 0; color: #1e293b;">
                    <i class="fas fa-plus"></i> ${t('create')}
                </h2>
                <button onclick="this.closest('.modal').remove()" class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="submitCreateBranchSubgroup(event, '${branchGroupId}')">
                    <div class="form-group">
                        <label>${t('groupName')}</label>
                        <input type="text" name="name" placeholder="Leave empty for auto-naming (e.g., ${branchDisplayName} GROUP 1)" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                        <small style="color: #64748b; margin-top: 5px; display: block;">
                            If left empty, system will auto-generate: "${branchDisplayName} GROUP X"
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label>${t('maxStudents')} *</label>
                        <input type="number" name="maxStudents" value="30" min="1" required style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-check"></i> ${t('create')}
                        </button>
                        <button type="button" onclick="this.closest('.modal').remove()" class="btn btn-secondary" style="flex: 1;">
                            <i class="fas fa-times"></i> ${t('cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// Submit create branch subgroup
window.submitCreateBranchSubgroup = async function(event, branchGroupId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        // Ensure we have current season data
        if (!currentSeasonId || !currentSeasonData) {
            throw new Error('No active season selected');
        }
        
        const response = await fetch(`/api/branch-groups/${branchGroupId}/subgroups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name: formData.get('name') || null,
                maxStudents: parseInt(formData.get('maxStudents')),
                season: currentSeasonId,
                seasonName: currentSeasonData.name
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create subgroup');
        }
        
        const result = await response.json();
        showNotification(result.message || 'Subgroup created successfully!', 'success');
        
        // Close create modal
        event.target.closest('.modal').remove();
        
        // Refresh the main subgroups modal
        const mainModal = document.getElementById('branchSubgroupsModal');
        if (mainModal) {
            mainModal.remove();
            await viewBranchSubgroups(branchGroupId);
        }
        
    } catch (error) {
        console.error('Error creating subgroup:', error);
        showNotification(error.message, 'error');
    }
};

// Edit branch subgroup
window.editBranchSubgroup = async function(branchGroupId, subgroupId) {
    try {
        // Ensure we have current season
        if (!currentSeasonId) {
            showNotification('Please select a season first', 'warning');
            return;
        }
        
        const response = await fetch(`/api/branch-groups/${branchGroupId}/subgroups?season=${currentSeasonId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load subgroup');
        
        const subgroups = await response.json();
        const subgroup = subgroups.find(sg => sg._id === subgroupId);
        
        if (!subgroup) throw new Error('Subgroup not found');
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 style="margin: 0; color: #1e293b;">
                        <i class="fas fa-edit"></i> ${t('editGroup')}
                    </h2>
                    <button onclick="this.closest('.modal').remove()" class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form onsubmit="submitEditBranchSubgroup(event, '${branchGroupId}', '${subgroupId}')">
                        <div class="form-group">
                            <label>${t('groupName')} *</label>
                            <input type="text" name="name" value="${subgroup.name}" required style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                        </div>
                        
                        <div class="form-group">
                            <label>${t('maxStudents')} *</label>
                            <input type="number" name="maxStudents" value="${subgroup.maxStudents}" min="1" required style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                        </div>
                        
                        <div class="form-group">
                            <label>${t('status')} *</label>
                            <select name="status" required style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                                <option value="active" ${subgroup.status === 'active' ? 'selected' : ''}>${t('active')}</option>
                                <option value="inactive" ${subgroup.status === 'inactive' ? 'selected' : ''}>${t('inactive')}</option>
                                <option value="archived" ${subgroup.status === 'archived' ? 'selected' : ''}>${t('archived')}</option>
                            </select>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <i class="fas fa-save"></i> ${t('save')}
                            </button>
                            <button type="button" onclick="this.closest('.modal').remove()" class="btn btn-secondary" style="flex: 1;">
                                <i class="fas fa-times"></i> ${t('cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error loading subgroup:', error);
        showNotification('Failed to load subgroup', 'error');
    }
};

// Submit edit branch subgroup
window.submitEditBranchSubgroup = async function(event, branchGroupId, subgroupId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`/api/branch-groups/${branchGroupId}/subgroups/${subgroupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name: formData.get('name'),
                maxStudents: parseInt(formData.get('maxStudents')),
                status: formData.get('status')
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update subgroup');
        }
        
        const result = await response.json();
        showNotification(result.message || 'Subgroup updated successfully!', 'success');
        
        // Close edit modal
        event.target.closest('.modal').remove();
        
        // Refresh the main subgroups modal
        const mainModal = document.getElementById('branchSubgroupsModal');
        if (mainModal) {
            mainModal.remove();
            await viewBranchSubgroups(branchGroupId);
        }
        
    } catch (error) {
        console.error('Error updating subgroup:', error);
        showNotification(error.message, 'error');
    }
};

// Delete branch subgroup
window.deleteBranchSubgroup = async function(branchGroupId, subgroupId, studentCount = 0) {
    // Show different warnings based on student count
    let confirmMessage;
    
    if (studentCount > 0) {
        confirmMessage = `⚠️ WARNING: This subgroup has ${studentCount} student${studentCount > 1 ? 's' : ''}!\n\n` +
                        `Deleting this subgroup will:\n` +
                        `• Remove the subgroup assignment from ${studentCount} student${studentCount > 1 ? 's' : ''}\n` +
                        `• Students will need to be reassigned to another subgroup\n` +
                        `• This action CANNOT be undone\n\n` +
                        `Are you absolutely sure you want to delete this subgroup?`;
    } else {
        confirmMessage = 'Are you sure you want to delete this subgroup? This action cannot be undone.';
    }
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Extra confirmation for groups with students
    if (studentCount > 0) {
        const finalConfirm = prompt(
            `Type "DELETE" (in capital letters) to confirm deletion of this subgroup with ${studentCount} student${studentCount > 1 ? 's' : ''}:`
        );
        
        if (finalConfirm !== 'DELETE') {
            showNotification('Deletion cancelled', 'info');
            return;
        }
    }
    
    try {
        const response = await fetch(`/api/branch-groups/${branchGroupId}/subgroups/${subgroupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete subgroup');
        }
        
        const result = await response.json();
        
        if (result.studentsUnassigned > 0) {
            showNotification(
                `✅ Subgroup deleted! ${result.studentsUnassigned} student${result.studentsUnassigned > 1 ? 's' : ''} unassigned and moved to pending list.`,
                'success'
            );
        } else {
            showNotification('✅ Subgroup deleted successfully!', 'success');
        }
        
        // Refresh the main subgroups modal
        const mainModal = document.getElementById('branchSubgroupsModal');
        if (mainModal) {
            mainModal.remove();
            await viewBranchSubgroups(branchGroupId);
        }
        
    } catch (error) {
        console.error('Error deleting subgroup:', error);
        showNotification(error.message, 'error');
    }
};

// View subgroup details with students and top performers
window.viewSubgroupDetails = async function(subgroupId, subgroupName) {
    try {
        // Fetch students in this subgroup
        const studentsResponse = await fetch(`/api/student-management/students?branchSubgroup=${subgroupId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!studentsResponse.ok) throw new Error('Failed to load students');
        
        const studentsData = await studentsResponse.json();
        const students = studentsData.students || studentsData;
        
        // Fetch grades for these students
        let studentsWithGrades = [];
        
        for (const student of students) {
            try {
                const gradesResponse = await fetch(`/api/grades/admin/students/${student._id}/grades`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                
                if (gradesResponse.ok) {
                    const gradesData = await gradesResponse.json();
                    studentsWithGrades.push({
                        ...student,
                        grades: gradesData.grades || [],
                        averageScore: gradesData.stats?.averageScore || 0
                    });
                } else {
                    studentsWithGrades.push({
                        ...student,
                        grades: [],
                        averageScore: 0
                    });
                }
            } catch (error) {
                console.error(`Error fetching grades for ${student.fullName}:`, error);
                studentsWithGrades.push({
                    ...student,
                    grades: [],
                    averageScore: 0
                });
            }
        }
        
        // Sort by average score for top performers
        const topPerformers = [...studentsWithGrades]
            .filter(s => s.averageScore > 0)
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 3);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'subgroupDetailsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
                <div class="modal-header">
                    <h2 style="margin: 0; color: #1e293b;">
                        <i class="fas fa-users"></i> ${subgroupName}
                    </h2>
                    <button onclick="this.closest('.modal').remove()" class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="overflow-y: auto; max-height: calc(90vh - 150px);">
                    <!-- Tabs -->
                    <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
                        <button onclick="switchSubgroupTab('students')" id="tab-students" class="subgroup-tab active" style="padding: 12px 24px; border: none; background: none; cursor: pointer; border-bottom: 3px solid #667eea; color: #667eea; font-weight: 600;">
                            <i class="fas fa-list"></i> ${t('students')} (${students.length})
                        </button>
                        <button onclick="switchSubgroupTab('top3')" id="tab-top3" class="subgroup-tab" style="padding: 12px 24px; border: none; background: none; cursor: pointer; border-bottom: 3px solid transparent; color: #64748b; font-weight: 600;">
                            <i class="fas fa-trophy"></i> Top 3
                        </button>
                    </div>
                    
                    <!-- Students List Tab -->
                    <div id="content-students" class="subgroup-tab-content">
                        ${students.length === 0 ? `
                            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                                <i class="fas fa-users" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>
                                <p>${t('noGroupsInSeason')}</p>
                            </div>
                        ` : `
                            <div style="display: grid; gap: 15px;">
                                ${studentsWithGrades.map((student, index) => `
                                    <div style="background: #f8fafc; border-radius: 8px; padding: 15px; border-left: 4px solid #667eea;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div style="flex: 1;">
                                                <h4 style="margin: 0 0 8px 0; color: #1e293b;">${index + 1}. ${student.fullName}</h4>
                                                <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #64748b; flex-wrap: wrap;">
                                                    <span><i class="fas fa-envelope"></i> ${student.schoolEmail}</span>
                                                    ${student.phones && student.phones.length > 0 ? `<span><i class="fas fa-phone"></i> ${student.phones[0]}</span>` : ''}
                                                    ${student.averageScore > 0 ? `<span><i class="fas fa-chart-line"></i> ${student.averageScore.toFixed(1)}%</span>` : ''}
                                                </div>
                                            </div>
                                            <div style="display: flex; gap: 8px;">
                                                <button onclick="viewStudentProfile('${student._id}')" class="btn btn-small btn-primary">
                                                    <i class="fas fa-user"></i> ${t('view')}
                                                </button>
                                                <button onclick="unassignStudentFromSubgroup('${student._id}', '${subgroupId}', '${subgroupName}')" class="btn btn-small btn-danger" title="${t('delete')}">
                                                    <i class="fas fa-user-minus"></i> ${t('delete')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    
                    <!-- Top 3 Tab -->
                    <div id="content-top3" class="subgroup-tab-content" style="display: none;">
                        ${topPerformers.length === 0 ? `
                            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                                <i class="fas fa-trophy" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>
                                <p>-</p>
                            </div>
                        ` : `
                            <div style="display: grid; gap: 20px;">
                                ${topPerformers.map((student, index) => {
                                    const medals = ['🥇', '🥈', '🥉'];
                                    const colors = ['#fbbf24', '#94a3b8', '#cd7f32'];
                                    return `
                                        <div style="background: linear-gradient(135deg, ${colors[index]}15 0%, ${colors[index]}05 100%); border-radius: 12px; padding: 20px; border: 2px solid ${colors[index]};">
                                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                                <div style="font-size: 3rem;">${medals[index]}</div>
                                                <div style="flex: 1;">
                                                    <h3 style="margin: 0 0 5px 0; color: #1e293b;">${student.fullName}</h3>
                                                    <div style="font-size: 0.9rem; color: #64748b;">
                                                        <i class="fas fa-envelope"></i> ${student.schoolEmail}
                                                    </div>
                                                </div>
                                                <div style="text-align: center;">
                                                    <div style="font-size: 2rem; font-weight: bold; color: ${colors[index]};">${student.averageScore.toFixed(1)}%</div>
                                                    <div style="font-size: 0.8rem; color: #64748b;">${t('academicSummary')}</div>
                                                </div>
                                            </div>
                                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 15px;">
                                                <div style="background: white; padding: 10px; border-radius: 6px;">
                                                    <div style="font-size: 0.8rem; color: #64748b;">${t('studentGrades')}</div>
                                                    <div style="font-size: 1.2rem; font-weight: 600; color: #1e293b;">${student.grades.length}</div>
                                                </div>
                                                <div style="background: white; padding: 10px; border-radius: 6px;">
                                                    <div style="font-size: 0.8rem; color: #64748b;">#</div>
                                                    <div style="font-size: 1.2rem; font-weight: 600; color: #1e293b;">#${index + 1}</div>
                                                </div>
                                            </div>
                                            <button onclick="viewStudentProfile('${student._id}')" class="btn btn-primary" style="width: 100%; margin-top: 15px;">
                                                <i class="fas fa-user"></i> ${t('view')}
                                            </button>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error viewing subgroup details:', error);
        showNotification('Failed to load subgroup details', 'error');
    }
};

// Switch tabs in subgroup details modal
window.switchSubgroupTab = function(tabName) {
    // Update tab buttons
    document.querySelectorAll('.subgroup-tab').forEach(tab => {
        tab.style.borderBottomColor = 'transparent';
        tab.style.color = '#64748b';
    });
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.style.borderBottomColor = '#667eea';
        activeTab.style.color = '#667eea';
    }
    
    // Update content
    document.querySelectorAll('.subgroup-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const activeContent = document.getElementById(`content-${tabName}`);
    if (activeContent) {
        activeContent.style.display = 'block';
    }
};

// Message subgroup
window.messageSubgroup = async function(subgroupId, subgroupName) {
    try {
        // Fetch students in this subgroup
        const studentsResponse = await fetch(`/api/student-management/students?branchSubgroup=${subgroupId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!studentsResponse.ok) throw new Error('Failed to load students');
        
        const studentsData = await studentsResponse.json();
        const students = studentsData.students || studentsData;
        
        if (students.length === 0) {
            showNotification('No students in this subgroup to message', 'warning');
            return;
        }
        
        // Create message modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 style="margin: 0; color: #1e293b;">
                        <i class="fas fa-paper-plane"></i> ${t('sendMessage')} - ${subgroupName}
                    </h2>
                    <button onclick="this.closest('.modal').remove()" class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form onsubmit="sendSubgroupMessage(event, '${subgroupId}', '${subgroupName}')">
                        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                            <div style="color: #0369a1; font-weight: 600; margin-bottom: 5px;">
                                <i class="fas fa-info-circle"></i> ${t('recipient')}
                            </div>
                            <div style="color: #0c4a6e;">
                                <strong>${students.length} ${t('students')}</strong> - ${subgroupName}
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>${t('messageTitle')} *</label>
                            <input type="text" name="subject" required style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                        </div>
                        
                        <div class="form-group">
                            <label>${t('messageContent')} *</label>
                            <textarea name="message" required rows="6" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; resize: vertical;"></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <i class="fas fa-paper-plane"></i> ${t('sendMessage')}
                            </button>
                            <button type="button" onclick="this.closest('.modal').remove()" class="btn btn-secondary" style="flex: 1;">
                                <i class="fas fa-times"></i> ${t('cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error loading students for message:', error);
        showNotification('Failed to load students', 'error');
    }
};

// Send message to subgroup
window.sendSubgroupMessage = async function(event, subgroupId, subgroupName) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    try {
        // Send message via API using the apiRequest helper from student-management.js
        const data = await apiRequest(`/groups/${subgroupId}/send-message`, {
            method: 'POST',
            body: JSON.stringify({
                type: 'info',
                title: subject,
                message: message
            })
        });
        
        if (data && data.success) {
            showNotification(`✅ Message sent to ${data.data.studentCount} student(s) in ${subgroupName}`, 'success');
            // Close modal
            event.target.closest('.modal').remove();
        } else {
            showNotification(data?.message || 'Failed to send message', 'error');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification(error.message || 'Failed to send message', 'error');
    }
};

// Unassign student from subgroup
window.unassignStudentFromSubgroup = async function(studentId, subgroupId, subgroupName) {
    if (!confirm(`Remove this student from ${subgroupName}?\n\nThey will be moved back to the pending assignments list.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/student-management/students/${studentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                branchSubgroup: null,
                branchSubgroupName: null
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to unassign student');
        }
        
        showNotification('✅ Student unassigned and moved to pending list', 'success');
        
        // Close the modal
        const modal = document.getElementById('subgroupDetailsModal');
        if (modal) {
            modal.remove();
        }
        
        // Reload the branch management view to refresh pending list
        const currentSeasonId = document.querySelector('[data-season-id]')?.getAttribute('data-season-id');
        if (currentSeasonId) {
            await loadBranchManagement(currentSeasonId);
        } else {
            // Fallback: reload students list
            await loadStudents();
        }
        
    } catch (error) {
        console.error('Error unassigning student:', error);
        showNotification(error.message, 'error');
    }
};

// Assign student to branch subgroup
window.assignToBranchSubgroup = async function(studentId) {
    try {
        console.log('🔍 Starting assignment for student:', studentId);
        
        // Get student data to find their filiere
        const studentResponse = await fetch(`/api/student-management/students/${studentId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!studentResponse.ok) throw new Error('Failed to load student data');
        
        const studentData = await studentResponse.json();
        const student = studentData.student || studentData;
        
        console.log('📝 Student data:', {
            name: student.fullName,
            filiere: student.filiere,
            filiereType: typeof student.filiere,
            isArray: Array.isArray(student.filiere)
        });
        
        // Check if student has filiere selected
        if (!student.filiere || student.filiere.length === 0) {
            showNotification('❌ Student has no branch selected', 'warning');
            return;
        }
        
        // Get the first filiere (branch) - you can modify this to handle multiple
        const filiere = student.filiere[0];
        console.log('🎯 Target filiere:', filiere);
        
        // Load all branch groups
        const branchGroupsResponse = await fetch('/api/branch-groups', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!branchGroupsResponse.ok) throw new Error('Failed to load branch groups');
        
        const branchGroups = await branchGroupsResponse.json();
        console.log('📚 Available branch groups:', branchGroups.map(bg => ({
            name: bg.displayName,
            formation: bg.formation,
            id: bg._id
        })));
        
        // Find the branch group for this filiere
        const branchGroup = branchGroups.find(bg => bg.formation === filiere);
        
        if (!branchGroup) {
            console.error('❌ MISMATCH DETECTED!');
            console.error('Student filiere:', filiere);
            console.error('Available formations:', branchGroups.map(bg => bg.formation));
            showNotification(`❌ No branch group found for "${filiere}". Available: ${branchGroups.map(bg => bg.formation).join(', ')}`, 'error');
            return;
        }
        
        console.log('✅ Found branch group:', {
            id: branchGroup._id,
            name: branchGroup.displayName,
            formation: branchGroup.formation
        });
        console.log('🔗 Full branch group object:', branchGroup);
        
        // Load existing subgroups for this branch (filtered by current season)
        console.log('📡 Fetching subgroups from:', `/api/branch-groups/${branchGroup._id}/subgroups`);
        
        // Ensure we have current season
        if (!currentSeasonId) {
            throw new Error('No active season selected. Please select a season first.');
        }
        
        const subgroupsResponse = await fetch(`/api/branch-groups/${branchGroup._id}/subgroups?season=${currentSeasonId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log('📡 Subgroups response status:', subgroupsResponse.status);
        
        if (!subgroupsResponse.ok) {
            console.error('❌ Subgroups API failed!');
            console.error('   Status:', subgroupsResponse.status);
            console.error('   Branch ID used:', branchGroup._id);
            console.error('   Branch object:', branchGroup);
            
            // Try to get error details
            try {
                const errorData = await subgroupsResponse.json();
                console.error('   Error response:', errorData);
            } catch (e) {
                console.error('   Could not parse error response');
            }
            
            throw new Error(`Failed to load subgroups (Status: ${subgroupsResponse.status}). The branch group ID might be invalid.`);
        }
        
        const subgroups = await subgroupsResponse.json();
        
        // If no subgroups exist, auto-create first one and assign
        if (subgroups.length === 0) {
            showNotification(`Creating ${branchGroup.displayName} GROUP 1...`, 'info');
            
            const assignResponse = await fetch(`/api/branch-groups/${branchGroup._id}/assign-student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ studentId })
            });
            
            if (!assignResponse.ok) {
                const error = await assignResponse.json();
                throw new Error(error.error || 'Failed to assign student');
            }
            
            const result = await assignResponse.json();
            showNotification(`✅ Student assigned to ${result.subgroup.name}!`, 'success');
            
            // Reload pending students
            if (typeof loadPendingBranchStudents === 'function') {
                await loadPendingBranchStudents();
            }
            return;
        }
        
        // Show selection modal if multiple subgroups exist
        showSubgroupSelectionModal(branchGroup, subgroups, studentId, student.fullName);
        
    } catch (error) {
        console.error('Error assigning student to subgroup:', error);
        showNotification(error.message || 'Failed to assign student', 'error');
    }
};

// Show subgroup selection modal
function showSubgroupSelectionModal(branchGroup, subgroups, studentId, studentName) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2 style="margin: 0; color: #1e293b;">
                    <i class="fas fa-layer-group"></i> Select Subgroup for ${studentName}
                </h2>
                <button onclick="this.closest('.modal').remove()" class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 20px; color: #64748b;">
                    Choose a ${branchGroup.displayName} subgroup:
                </p>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${subgroups.map(sg => {
                        const percentage = (sg.studentCount / sg.maxStudents) * 100;
                        const statusColor = percentage >= 90 ? '#ef4444' : percentage >= 70 ? '#f59e0b' : '#10b981';
                        
                        return `
                            <div onclick="assignToSpecificSubgroup('${branchGroup._id}', '${studentId}', '${sg._id}', '${sg.name}')" 
                                 style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;"
                                 onmouseover="this.style.borderColor='#667eea'; this.style.background='#eef2ff';"
                                 onmouseout="this.style.borderColor='transparent'; this.style.background='#f8fafc';">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <h4 style="margin: 0 0 5px 0; color: #1e293b;">${sg.name}</h4>
                                        <span style="font-size: 0.9rem; color: #64748b;">
                                            <i class="fas fa-users"></i> ${sg.studentCount || 0} / ${sg.maxStudents} students
                                        </span>
                                    </div>
                                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${statusColor};"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button onclick="this.closest('.modal').remove()" class="btn btn-secondary" style="width: 100%; margin-top: 15px;">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Assign to specific subgroup
window.assignToSpecificSubgroup = async function(branchId, studentId, subgroupId, subgroupName) {
    try {
        const response = await fetch(`/api/branch-groups/${branchId}/assign-student`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ studentId, subgroupId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to assign student');
        }
        
        showNotification(`✅ Student assigned to ${subgroupName}!`, 'success');
        
        // Close modal
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        
        // Reload pending students
        if (typeof loadPendingBranchStudents === 'function') {
            await loadPendingBranchStudents();
        }
        
    } catch (error) {
        console.error('Error assigning student:', error);
        showNotification(error.message || 'Failed to assign student', 'error');
    }
};

// Quick create group from main view
window.quickCreateGroup = async function() {
    try {
        // Get active season
        const response = await fetch('/api/seasons/current', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            showNotification('Please create an active season first', 'warning');
            return;
        }

        const activeSeason = await response.json();
        
        // Set current season and drill down
        currentSeasonId = activeSeason._id;
        currentSeasonData = activeSeason;
        
        // Emit event for legacy system to sync
        document.dispatchEvent(new CustomEvent('seasonSelected', {
            detail: {
                seasonId: activeSeason._id,
                seasonName: activeSeason.name
            }
        }));
        
        // Update season header
        document.getElementById('currentSeasonName').textContent = activeSeason.name;
        document.getElementById('currentSeasonDates').textContent = 
            `${new Date(activeSeason.startDate).toLocaleDateString()} - ${new Date(activeSeason.endDate).toLocaleDateString()}`;

        // Switch to season view
        document.getElementById('seasonsListView').classList.remove('active');
        document.getElementById('seasonGroupsView').classList.add('active');

        // Load language groups
        await loadSeasonLanguageGroups(activeSeason._id);
        switchSeasonTab('language');

        // Show notification
        showNotification(`Switched to ${activeSeason.name} - Click "Create Language Group" to add a group`, 'success');
        
    } catch (error) {
        console.error('Error in quick create:', error);
        showNotification('Failed to access active season', 'error');
    }
};
