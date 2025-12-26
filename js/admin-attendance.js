// Admin Attendance Module
const AdminAttendance = {
    currentPage: 1,
    limit: 20,
    filters: {},
    
    // Sessions pagination
    sessionsCurrentPage: 1,
    sessionsLimit: 5,
    allSessions: [],

    // Get token from localStorage
    getToken() {
        return localStorage.getItem('adminToken');
    },

    // Initialize
    async init() {
        console.log('🎯 Initializing Admin Attendance Module...');
        await this.loadFilters();
        await this.loadStats();
        await this.loadRecords();
        await this.loadSessions();
        this.setupEventListeners();
    },

    // Setup Event Listeners
    setupEventListeners() {
        // Filter changes
        document.getElementById('attendanceGroupFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('attendanceFormationFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('attendanceStatusFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('attendanceStartDate')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('attendanceEndDate')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('attendanceSearchInput')?.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.applyFilters(), 500);
        });
    },

    // Load Filters
    async loadFilters() {
        try {
            // Get active season first
            const seasonsResponse = await fetch('/api/seasons/current', {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });
            const activeSeason = await seasonsResponse.json();
            
            // Load groups filtered by active season
            const groupsResponse = await fetch(`/api/student-management/groups?season=${activeSeason._id}`, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });
            const groupsData = await groupsResponse.json();
            
            const groupFilter = document.getElementById('attendanceGroupFilter');
            if (groupFilter) {
                groupFilter.innerHTML = '<option value="">All Groups</option>';
                groupsData.groups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group._id;
                    option.textContent = group.name;
                    groupFilter.appendChild(option);
                });
            }

            // Load formations
            const formations = [
                'Allemand', 'Anglais', 'Français', 'Ausbildung',
                'Gériatrie', 'Aide soignant', 'Agent socio éducatif', 
                'Assistante sociale', 'Restauration', 'Cuisine', 
                'Informatique', 'Gestion hôtelière'
            ];

            const formationFilter = document.getElementById('attendanceFormationFilter');
            if (formationFilter) {
                formationFilter.innerHTML = '<option value="">All Formations</option>';
                formations.forEach(formation => {
                    const option = document.createElement('option');
                    option.value = formation;
                    option.textContent = formation;
                    formationFilter.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Error loading filters:', error);
        }
    },

    // Apply Filters
    applyFilters() {
        this.filters = {
            groupId: document.getElementById('attendanceGroupFilter')?.value || '',
            formation: document.getElementById('attendanceFormationFilter')?.value || '',
            status: document.getElementById('attendanceStatusFilter')?.value || '',
            startDate: document.getElementById('attendanceStartDate')?.value || '',
            endDate: document.getElementById('attendanceEndDate')?.value || '',
            search: document.getElementById('attendanceSearchInput')?.value || ''
        };
        this.currentPage = 1;
        this.loadRecords();
        this.loadStats();
    },

    // Load Stats
    async loadStats() {
        try {
            let url = '/api/attendance/admin/stats?';
            Object.keys(this.filters).forEach(key => {
                if (this.filters[key] && key !== 'search') {
                    url += `${key}=${this.filters[key]}&`;
                }
            });

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('Failed to load stats');

            const data = await response.json();
            this.displayStats(data.overall);

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    // Display Stats
    displayStats(stats) {
        const statsContainer = document.getElementById('attendanceStatsContainer');
        if (!statsContainer) return;

        const attendanceRate = stats.total > 0 
            ? ((stats.present + stats.late) / stats.total * 100).toFixed(1)
            : 0;

        statsContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 25px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px;">
                            <i class="fas fa-clipboard-list" style="font-size: 2rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">${t('totalRecords')}</div>
                            <div style="font-size: 2.2rem; font-weight: 700;">${stats.total}</div>
                        </div>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.9rem;">${t('allAttendanceSessions')}</div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 25px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px;">
                            <i class="fas fa-check-circle" style="font-size: 2rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">${t('present')}</div>
                            <div style="font-size: 2.2rem; font-weight: 700;">${stats.present}</div>
                        </div>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.9rem;">${stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}% ${t('ofTotalRecords')}</div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; padding: 25px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px;">
                            <i class="fas fa-clock" style="font-size: 2rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">${t('late')}</div>
                            <div style="font-size: 2.2rem; font-weight: 700;">${stats.late}</div>
                        </div>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.9rem;">${stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}% ${t('ofTotalRecords')}</div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; padding: 25px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px;">
                            <i class="fas fa-times-circle" style="font-size: 2rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">${t('absent')}</div>
                            <div style="font-size: 2.2rem; font-weight: 700;">${stats.absent}</div>
                        </div>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.9rem;">${stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}% ${t('ofTotalRecords')}</div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 25px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px;">
                            <i class="fas fa-chart-line" style="font-size: 2rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">${t('attendanceRate')}</div>
                            <div style="font-size: 2.2rem; font-weight: 700;">${attendanceRate}%</div>
                        </div>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.9rem;">${t('presentLateCombined')}</div>
                </div>
            </div>
        `;
    },

    // Load Records
    async loadRecords() {
        try {
            let url = `/api/attendance/admin/records?page=${this.currentPage}&limit=${this.limit}&`;
            Object.keys(this.filters).forEach(key => {
                if (this.filters[key]) {
                    url += `${key}=${encodeURIComponent(this.filters[key])}&`;
                }
            });

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('Failed to load records');

            const data = await response.json();
            this.displayRecords(data.records, data.pagination);

        } catch (error) {
            console.error('Error loading records:', error);
            this.displayRecords([], { total: 0, pages: 0 });
        }
    },

    // Display Records
    displayRecords(records, pagination) {
        const container = document.getElementById('attendanceRecordsContainer');
        if (!container) return;

        // Records are now filtered server-side, no need for client-side filtering

        if (records.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; color: var(--primary-color); opacity: 0.3; margin-bottom: 15px;"></i>
                    <p>No attendance records found</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="overflow-x: auto; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
                    <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.95rem;">
                        <thead>
                            <tr style="background: linear-gradient(135deg, #FFCC00 0%, #FF9500 100%);">
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap; border-top-left-radius: 12px;">
                                    <i class="fas fa-calendar" style="margin-right: 8px;"></i>${t('date')}
                                </th>
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap;">
                                    <i class="fas fa-user" style="margin-right: 8px;"></i>${t('student')}
                                </th>
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap;">
                                    <i class="fas fa-users" style="margin-right: 8px;"></i>${t('group')}
                                </th>
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap;">
                                    <i class="fas fa-graduation-cap" style="margin-right: 8px;"></i>${t('formation')}
                                </th>
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap;">
                                    <i class="fas fa-chalkboard-teacher" style="margin-right: 8px;"></i>${t('teacher')}
                                </th>
                                <th style="padding: 16px; text-align: center; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap;">
                                    <i class="fas fa-info-circle" style="margin-right: 8px;"></i>${t('status')}
                                </th>
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap; border-top-right-radius: 12px;">
                                    <i class="fas fa-clock" style="margin-right: 8px;"></i>${t('scanTime')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.map((record, index) => `
                                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#fafafa'}; transition: all 0.2s; cursor: pointer;" onmouseover="this.style.background='#fff8e1'; this.style.transform='scale(1.005)'" onmouseout="this.style.background='${index % 2 === 0 ? '#ffffff' : '#fafafa'}'; this.style.transform='scale(1)'">
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #374151; font-weight: 500;">${new Date(record.date).toLocaleDateString()}</td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #1f2937; font-weight: 600;">${record.studentName}</td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">${record.groupName}</td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">${record.formation}</td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">${record.teacherName}</td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; text-align: center;">
                                        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 25px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; ${record.status === 'present' ? 'background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #065f46; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);' : record.status === 'late' ? 'background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #92400e; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);' : 'background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #991b1b; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);'}">
                                            ${record.status === 'present' ? `<i class="fas fa-check-circle"></i> ${t('present')}` : record.status === 'late' ? `<i class="fas fa-clock"></i> ${t('late')}` : `<i class="fas fa-times-circle"></i> ${t('absent')}`}
                                        </span>
                                    </td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #6b7280; font-family: 'Courier New', monospace;">${record.deviceInfo === 'Admin Manual Entry' ? '<span style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #1e40af; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;"><i class="fas fa-hand-paper" style="margin-right: 4px;"></i>Manual</span>' : (record.scanTime ? new Date(record.scanTime).toLocaleTimeString() : '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Update pagination
        this.displayPagination(pagination);
    },

    // Display Pagination
    displayPagination(pagination) {
        const paginationContainer = document.getElementById('attendancePagination');
        if (!paginationContainer) return;

        if (pagination.pages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <button onclick="AdminAttendance.goToPage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-angle-double-left"></i>
            </button>
            <button onclick="AdminAttendance.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-angle-left"></i>
            </button>
        `;

        // Show page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(pagination.pages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button onclick="AdminAttendance.goToPage(${i})" ${i === this.currentPage ? 'class="active"' : ''}>
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
            <button onclick="AdminAttendance.goToPage(${this.currentPage + 1})" ${this.currentPage === pagination.pages ? 'disabled' : ''}>
                <i class="fas fa-angle-right"></i>
            </button>
            <button onclick="AdminAttendance.goToPage(${pagination.pages})" ${this.currentPage === pagination.pages ? 'disabled' : ''}>
                <i class="fas fa-angle-double-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    },

    // Go to Page
    goToPage(page) {
        this.currentPage = page;
        this.loadRecords();
    },

    // Clear All Filtered Presences (DELETE records)
    async clearAllFilteredPresences() {
        // Build filter description for confirmation
        let filterDesc = 'ALL presence records';
        const activeFilters = [];
        
        if (this.filters.groupId) {
            const groupSelect = document.getElementById('attendanceGroupFilter');
            const groupName = groupSelect.options[groupSelect.selectedIndex].text;
            activeFilters.push(`Group: ${groupName}`);
        }
        if (this.filters.formation) {
            activeFilters.push(`Formation: ${this.filters.formation}`);
        }
        if (this.filters.startDate || this.filters.endDate) {
            const dateRange = [];
            if (this.filters.startDate) dateRange.push(`from ${this.filters.startDate}`);
            if (this.filters.endDate) dateRange.push(`to ${this.filters.endDate}`);
            activeFilters.push(`Date: ${dateRange.join(' ')}`);
        }
        if (this.filters.search) {
            activeFilters.push(`Search: "${this.filters.search}"`);
        }
        
        if (activeFilters.length > 0) {
            filterDesc = `presence records matching:\n${activeFilters.map(f => '  • ' + f).join('\n')}`;
        }
        
        const confirmed = confirm(
            `⚠️ DELETE ALL PRESENCE RECORDS?\n\n` +
            `This will permanently delete ${filterDesc}\n\n` +
            `The table will show "No records" after deletion.\n\n` +
            `This action cannot be undone!\n\n` +
            `Are you absolutely sure?`
        );
        
        if (!confirmed) return;
        
        try {
            // Build query parameters - only delete PRESENT records
            let url = '/api/attendance/admin/clear-presences?status=present&';
            Object.keys(this.filters).forEach(key => {
                if (this.filters[key] && key !== 'search') {
                    url += `${key}=${encodeURIComponent(this.filters[key])}&`;
                }
            });
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to clear presences');
            }
            
            const data = await response.json();
            alert(`✅ Success!\n\n${data.deletedCount} presence record(s) have been permanently deleted.`);
            
            // Reload data
            await this.loadStats();
            await this.loadRecords();
            
        } catch (error) {
            console.error('Error clearing presences:', error);
            alert(`❌ Error: ${error.message}`);
        }
    },

    // Clear All Filtered Absences (DELETE records)
    async clearAllFilteredAbsences() {
        // Build filter description for confirmation
        let filterDesc = 'ALL absence records';
        const activeFilters = [];
        
        if (this.filters.groupId) {
            const groupSelect = document.getElementById('attendanceGroupFilter');
            const groupName = groupSelect.options[groupSelect.selectedIndex].text;
            activeFilters.push(`Group: ${groupName}`);
        }
        if (this.filters.formation) {
            activeFilters.push(`Formation: ${this.filters.formation}`);
        }
        if (this.filters.startDate || this.filters.endDate) {
            const dateRange = [];
            if (this.filters.startDate) dateRange.push(`from ${this.filters.startDate}`);
            if (this.filters.endDate) dateRange.push(`to ${this.filters.endDate}`);
            activeFilters.push(`Date: ${dateRange.join(' ')}`);
        }
        if (this.filters.search) {
            activeFilters.push(`Search: "${this.filters.search}"`);
        }
        
        if (activeFilters.length > 0) {
            filterDesc = `absence records matching:\n${activeFilters.map(f => '  • ' + f).join('\n')}`;
        }
        
        const confirmed = confirm(
            `⚠️ DELETE ALL ABSENCE RECORDS?\n\n` +
            `This will permanently delete ${filterDesc}\n\n` +
            `The table will show "No records" after deletion.\n\n` +
            `This action cannot be undone!\n\n` +
            `Are you absolutely sure?`
        );
        
        if (!confirmed) return;
        
        try {
            // Build query parameters - only delete ABSENT records
            let url = '/api/attendance/admin/clear-absences?status=absent&';
            Object.keys(this.filters).forEach(key => {
                if (this.filters[key] && key !== 'search') {
                    url += `${key}=${encodeURIComponent(this.filters[key])}&`;
                }
            });
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to clear absences');
            }
            
            const data = await response.json();
            alert(`✅ Success!\n\n${data.deletedCount} absence record(s) have been permanently deleted.`);
            
            // Reload data
            await this.loadStats();
            await this.loadRecords();
            
        } catch (error) {
            console.error('Error clearing absences:', error);
            alert(`❌ Error: ${error.message}`);
        }
    },

    // Load Sessions
    async loadSessions() {
        try {
            // Load all sessions (we'll paginate client-side for better UX)
            const response = await fetch(`/api/attendance/admin/sessions?limit=100`, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('Failed to load sessions');

            const data = await response.json();
            this.allSessions = data.sessions || [];
            this.sessionsCurrentPage = 1;
            this.displaySessions();

        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    },

    // Display Sessions with pagination
    displaySessions() {
        const sessionsContainer = document.getElementById('recentSessionsContainer');
        if (!sessionsContainer) return;

        const sessions = this.allSessions;
        
        if (sessions.length === 0) {
            sessionsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>${t('noRecentSessions')}</p>
                </div>
            `;
            // Clear pagination
            const paginationContainer = document.getElementById('sessionsPagination');
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        // Calculate pagination
        const totalPages = Math.ceil(sessions.length / this.sessionsLimit);
        const startIndex = (this.sessionsCurrentPage - 1) * this.sessionsLimit;
        const endIndex = startIndex + this.sessionsLimit;
        const paginatedSessions = sessions.slice(startIndex, endIndex);

        sessionsContainer.innerHTML = paginatedSessions.map(session => {
            const attendanceRate = session.totalStudents > 0 
                ? ((session.presentCount + session.lateCount) / session.totalStudents * 100).toFixed(1)
                : 0;

            return `
                <div class="session-card">
                    <div class="session-header">
                        <h4>${session.groupName} - ${session.formation}</h4>
                        <span class="badge badge-${session.status === 'active' ? 'success' : session.status === 'expired' ? 'warning' : 'secondary'}">
                            ${session.status}
                        </span>
                    </div>
                    <div class="session-info">
                        <p><i class="fas fa-user"></i> ${session.teacherName}</p>
                        <p><i class="fas fa-calendar"></i> ${new Date(session.date).toLocaleDateString()}</p>
                        <p><i class="fas fa-clock"></i> ${new Date(session.classStartTime).toLocaleTimeString()}</p>
                    </div>
                    <div class="session-stats">
                        <div class="stat-mini">
                            <span class="value" style="color: #10b981;">${session.presentCount}</span>
                            <span class="label">Present</span>
                        </div>
                        <div class="stat-mini">
                            <span class="value" style="color: #f59e0b;">${session.lateCount}</span>
                            <span class="label">Late</span>
                        </div>
                        <div class="stat-mini">
                            <span class="value" style="color: #ef4444;">${session.absentCount}</span>
                            <span class="label">Absent</span>
                        </div>
                        <div class="stat-mini">
                            <span class="value" style="color: #3b82f6;">${attendanceRate}%</span>
                            <span class="label">Rate</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Display pagination
        this.displaySessionsPagination(totalPages);
    },

    // Display Sessions Pagination (matching payment reminders style)
    displaySessionsPagination(totalPages) {
        const paginationContainer = document.getElementById('sessionsPagination');
        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="sessions-pagination" style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; padding: 15px;">';

        // Previous button
        paginationHTML += `
            <button onclick="AdminAttendance.goToSessionsPage(${this.sessionsCurrentPage - 1})" 
                    ${this.sessionsCurrentPage === 1 ? 'disabled' : ''} 
                    style="display: flex; align-items: center; gap: 5px; padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: ${this.sessionsCurrentPage === 1 ? 'not-allowed' : 'pointer'}; color: ${this.sessionsCurrentPage === 1 ? '#9ca3af' : '#374151'}; font-weight: 500; transition: all 0.2s;">
                <i class="fas fa-chevron-left" style="font-size: 12px;"></i> Previous
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.sessionsCurrentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page + ellipsis
        if (startPage > 1) {
            paginationHTML += `
                <button onclick="AdminAttendance.goToSessionsPage(1)" 
                        style="min-width: 40px; height: 40px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; color: #374151; font-weight: 500;">
                    1
                </button>
            `;
            if (startPage > 2) {
                paginationHTML += '<span style="color: #9ca3af; padding: 0 5px;">...</span>';
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.sessionsCurrentPage;
            paginationHTML += `
                <button onclick="AdminAttendance.goToSessionsPage(${i})" 
                        style="min-width: 40px; height: 40px; border: ${isActive ? 'none' : '1px solid #e5e7eb'}; background: ${isActive ? 'linear-gradient(135deg, #FFCC00 0%, #FF9500 100%)' : 'white'}; border-radius: 8px; cursor: pointer; color: ${isActive ? '#1f2937' : '#374151'}; font-weight: ${isActive ? '700' : '500'}; box-shadow: ${isActive ? '0 2px 8px rgba(255, 149, 0, 0.3)' : 'none'};">
                    ${i}
                </button>
            `;
        }

        // Last page + ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span style="color: #9ca3af; padding: 0 5px;">...</span>';
            }
            paginationHTML += `
                <button onclick="AdminAttendance.goToSessionsPage(${totalPages})" 
                        style="min-width: 40px; height: 40px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; color: #374151; font-weight: 500;">
                    ${totalPages}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button onclick="AdminAttendance.goToSessionsPage(${this.sessionsCurrentPage + 1})" 
                    ${this.sessionsCurrentPage === totalPages ? 'disabled' : ''} 
                    style="display: flex; align-items: center; gap: 5px; padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: ${this.sessionsCurrentPage === totalPages ? 'not-allowed' : 'pointer'}; color: ${this.sessionsCurrentPage === totalPages ? '#9ca3af' : '#374151'}; font-weight: 500; transition: all 0.2s;">
                Next <i class="fas fa-chevron-right" style="font-size: 12px;"></i>
            </button>
        `;

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    },

    // Go to Sessions Page
    goToSessionsPage(page) {
        const totalPages = Math.ceil(this.allSessions.length / this.sessionsLimit);
        if (page < 1 || page > totalPages) return;
        this.sessionsCurrentPage = page;
        this.displaySessions();
    },

    // Export to Excel
    async exportToExcel() {
        try {
            // Show loading notification
            const loadingNotif = document.createElement('div');
            loadingNotif.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #667eea; color: white; padding: 15px 25px; border-radius: 10px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
            loadingNotif.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>Generating Excel report...';
            document.body.appendChild(loadingNotif);

            let url = '/api/attendance/admin/records?limit=10000&';
            Object.keys(this.filters).forEach(key => {
                if (this.filters[key] && key !== 'search') {
                    url += `${key}=${this.filters[key]}&`;
                }
            });

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('Failed to export data');

            const data = await response.json();
            
            // Group records by status
            const presentRecords = data.records.filter(r => r.status === 'present');
            const lateRecords = data.records.filter(r => r.status === 'late');
            const absentRecords = data.records.filter(r => r.status === 'absent');

            // Create workbook using ExcelJS from CDN
            const ExcelJS = window.ExcelJS;
            if (!ExcelJS) {
                throw new Error('ExcelJS library not loaded');
            }

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Nisrine School';
            workbook.created = new Date();

            // Summary Sheet
            const summarySheet = workbook.addWorksheet('Summary', {
                views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
            });

            summarySheet.columns = [
                { header: 'Metric', key: 'metric', width: 30 },
                { header: 'Value', key: 'value', width: 20 }
            ];

            // Style summary header
            summarySheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF667eea' } };
            summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
            summarySheet.getRow(1).height = 25;

            // Add summary data
            const attendanceRate = data.records.length > 0 ? ((presentRecords.length + lateRecords.length) / data.records.length * 100).toFixed(1) : 0;
            summarySheet.addRow({ metric: 'Total Records', value: data.records.length });
            summarySheet.addRow({ metric: 'Present', value: presentRecords.length });
            summarySheet.addRow({ metric: 'Late', value: lateRecords.length });
            summarySheet.addRow({ metric: 'Absent', value: absentRecords.length });
            summarySheet.addRow({ metric: 'Attendance Rate', value: `${attendanceRate}%` });

            // Helper function to create status sheet
            const createStatusSheet = (sheetName, records, color) => {
                const sheet = workbook.addWorksheet(sheetName, {
                    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
                });

                sheet.columns = [
                    { header: 'Date', key: 'date', width: 15 },
                    { header: 'Student Name', key: 'studentName', width: 25 },
                    { header: 'Email', key: 'studentEmail', width: 30 },
                    { header: 'Group', key: 'groupName', width: 20 },
                    { header: 'Formation', key: 'formation', width: 20 },
                    { header: 'Teacher', key: 'teacherName', width: 25 },
                    { header: 'Scan Time', key: 'scanTime', width: 15 }
                ];

                // Style header
                sheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
                sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
                sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
                sheet.getRow(1).height = 25;

                // Add data
                records.forEach((record, index) => {
                    const row = sheet.addRow({
                        date: new Date(record.date).toLocaleDateString(),
                        studentName: record.studentName,
                        studentEmail: record.studentEmail,
                        groupName: record.groupName,
                        formation: record.formation,
                        teacherName: record.teacherName,
                        scanTime: record.scanTime ? new Date(record.scanTime).toLocaleTimeString() : '-'
                    });

                    // Alternate row colors
                    if (index % 2 === 0) {
                        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                    }
                });

                // Add borders
                sheet.eachRow((row, rowNumber) => {
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                        };
                    });
                });
            };

            // Create sheets for each status
            createStatusSheet('✅ Present', presentRecords, 'FF10b981');
            createStatusSheet('⏰ Late', lateRecords, 'FFf59e0b');
            createStatusSheet('❌ Absent', absentRecords, 'FFef4444');

            // Generate Excel file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url2 = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url2;
            a.download = `Attendance-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url2);

            // Remove loading notification
            document.body.removeChild(loadingNotif);

            // Show success notification
            showNotification('Excel report downloaded successfully! 📊', 'success');

        } catch (error) {
            console.error('Error exporting:', error);
            showNotification('Failed to generate Excel report', 'error');
        }
    }
};

// ==================== MANUAL ATTENDANCE FUNCTIONS ====================

// Store data for manual attendance
let manualAttendanceData = {
    teachers: [],
    groups: [],
    students: [],
    selectedTeacher: null,
    selectedGroup: null,
    selectedFormation: null
};

// Open Manual Attendance Modal
async function openManualAttendanceModal() {
    const modal = document.getElementById('manualAttendanceModal');
    modal.style.display = 'flex';
    
    // Reset to step 1
    document.getElementById('manualAttendanceStep1').style.display = 'block';
    document.getElementById('manualAttendanceStep2').style.display = 'none';
    
    // Set default date to today
    document.getElementById('manualDateSelect').value = new Date().toISOString().split('T')[0];
    
    // Load teachers
    await loadTeachersForManualAttendance();
    
    // Load groups (filtered by active season)
    await loadGroupsForManualAttendance();
}

// Close Manual Attendance Modal
function closeManualAttendanceModal() {
    document.getElementById('manualAttendanceModal').style.display = 'none';
    
    // Reset form
    document.getElementById('manualTeacherSelect').value = '';
    document.getElementById('manualGroupSelect').value = '';
    document.getElementById('manualFormationSelect').innerHTML = '<option value="">-- Select a Formation --</option>';
    document.getElementById('manualDateSelect').value = '';
    document.getElementById('manualStartTime').value = '09:00';
    document.getElementById('manualEndTime').value = '11:00';
    document.getElementById('manualStudentsList').innerHTML = '';
    
    // Reset data
    manualAttendanceData.students = [];
    manualAttendanceData.selectedTeacher = null;
    manualAttendanceData.selectedGroup = null;
    manualAttendanceData.selectedFormation = null;
}

// Load teachers for dropdown
async function loadTeachersForManualAttendance() {
    try {
        const response = await fetch('/api/attendance/admin/teachers', {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!response.ok) throw new Error('Failed to load teachers');
        
        const data = await response.json();
        manualAttendanceData.teachers = data.teachers || [];
        
        const select = document.getElementById('manualTeacherSelect');
        select.innerHTML = '<option value="">-- Select a Teacher --</option>';
        
        manualAttendanceData.teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher._id;
            option.textContent = `${teacher.fullName} (${teacher.formations.join(', ')})`;
            option.dataset.formations = JSON.stringify(teacher.formations);
            option.dataset.groups = JSON.stringify(teacher.groups);
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading teachers:', error);
        showNotification('Failed to load teachers', 'error');
    }
}

// Load groups for dropdown (filtered by active season)
async function loadGroupsForManualAttendance() {
    try {
        // Get active season first
        const seasonsResponse = await fetch('/api/seasons/current', {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        const activeSeason = await seasonsResponse.json();
        
        // Load groups filtered by active season
        const groupsResponse = await fetch(`/api/student-management/groups?season=${activeSeason._id}`, {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        const groupsData = await groupsResponse.json();
        
        manualAttendanceData.groups = groupsData.groups || [];
        
        const select = document.getElementById('manualGroupSelect');
        select.innerHTML = '<option value="">-- Select a Group --</option>';
        
        manualAttendanceData.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group._id;
            option.textContent = group.name;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading groups:', error);
        showNotification('Failed to load groups', 'error');
    }
}

// When teacher is selected, update formations and groups dropdowns
function onManualTeacherChange() {
    const teacherSelect = document.getElementById('manualTeacherSelect');
    const selectedOption = teacherSelect.options[teacherSelect.selectedIndex];
    
    if (!selectedOption.value) {
        document.getElementById('manualFormationSelect').innerHTML = '<option value="">-- Select a Formation --</option>';
        document.getElementById('manualGroupSelect').innerHTML = '<option value="">-- Select a Group --</option>';
        return;
    }
    
    // Update formations dropdown based on teacher's formations
    const formations = JSON.parse(selectedOption.dataset.formations || '[]');
    const formationSelect = document.getElementById('manualFormationSelect');
    formationSelect.innerHTML = '<option value="">-- Select a Formation --</option>';
    
    formations.forEach(formation => {
        const option = document.createElement('option');
        option.value = formation;
        option.textContent = formation;
        formationSelect.appendChild(option);
    });
    
    // Update groups dropdown based on teacher's assigned groups
    const teacherGroupIds = JSON.parse(selectedOption.dataset.groups || '[]');
    const groupSelect = document.getElementById('manualGroupSelect');
    groupSelect.innerHTML = '<option value="">-- Select a Group --</option>';
    
    // Filter groups to only show teacher's assigned groups
    const teacherGroups = manualAttendanceData.groups.filter(group => 
        teacherGroupIds.includes(group._id)
    );
    
    teacherGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group._id;
        option.textContent = group.name;
        groupSelect.appendChild(option);
    });
    
    manualAttendanceData.selectedTeacher = manualAttendanceData.teachers.find(t => t._id === selectedOption.value);
}

// When group is selected
function onManualGroupChange() {
    const groupSelect = document.getElementById('manualGroupSelect');
    manualAttendanceData.selectedGroup = manualAttendanceData.groups.find(g => g._id === groupSelect.value);
}

// Load students for manual attendance marking
async function loadStudentsForManualAttendance() {
    const teacherId = document.getElementById('manualTeacherSelect').value;
    const groupId = document.getElementById('manualGroupSelect').value;
    const formation = document.getElementById('manualFormationSelect').value;
    const date = document.getElementById('manualDateSelect').value;
    
    // Validation
    if (!teacherId) {
        showNotification('Please select a teacher', 'warning');
        return;
    }
    if (!groupId) {
        showNotification('Please select a group', 'warning');
        return;
    }
    if (!formation) {
        showNotification('Please select a formation', 'warning');
        return;
    }
    if (!date) {
        showNotification('Please select a date', 'warning');
        return;
    }
    
    try {
        // Show loading
        const loadBtn = document.querySelector('#manualAttendanceStep1 button[onclick="loadStudentsForManualAttendance()"]');
        const originalText = loadBtn ? loadBtn.innerHTML : '';
        if (loadBtn) {
            loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            loadBtn.disabled = true;
        }
        
        // Fetch students for this group and formation
        const response = await fetch(`/api/attendance/admin/group-students/${groupId}?formation=${encodeURIComponent(formation)}`, {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!response.ok) throw new Error('Failed to load students');
        
        const data = await response.json();
        manualAttendanceData.students = data.students || [];
        manualAttendanceData.selectedFormation = formation;
        
        if (manualAttendanceData.students.length === 0) {
            showNotification('No students found for this group and formation', 'warning');
            if (loadBtn) {
                loadBtn.innerHTML = originalText;
                loadBtn.disabled = false;
            }
            return;
        }
        
        // Show step 2
        document.getElementById('manualAttendanceStep1').style.display = 'none';
        document.getElementById('manualAttendanceStep2').style.display = 'block';
        
        // Display session summary
        const teacherName = document.getElementById('manualTeacherSelect').options[document.getElementById('manualTeacherSelect').selectedIndex].textContent.split(' (')[0];
        const groupName = document.getElementById('manualGroupSelect').options[document.getElementById('manualGroupSelect').selectedIndex].textContent;
        
        document.getElementById('manualSessionSummary').innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 3px;"><i class="fas fa-chalkboard-teacher"></i> Teacher</div>
                    <div style="font-weight: 600; color: #1f2937;">${teacherName}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 3px;"><i class="fas fa-users"></i> Group</div>
                    <div style="font-weight: 600; color: #1f2937;">${groupName}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 3px;"><i class="fas fa-graduation-cap"></i> Formation</div>
                    <div style="font-weight: 600; color: #1f2937;">${formation}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 3px;"><i class="fas fa-calendar"></i> Date</div>
                    <div style="font-weight: 600; color: #1f2937;">${new Date(date).toLocaleDateString()}</div>
                </div>
            </div>
        `;
        
        // Display students list
        displayManualStudentsList();
        
        // Reset button
        if (loadBtn) {
            loadBtn.innerHTML = originalText;
            loadBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error loading students:', error);
        showNotification('Failed to load students: ' + error.message, 'error');
        
        const loadBtn = document.querySelector('#manualAttendanceStep1 button[onclick="loadStudentsForManualAttendance()"]');
        if (loadBtn) {
            loadBtn.innerHTML = 'Load Students <i class="fas fa-arrow-right"></i>';
            loadBtn.disabled = false;
        }
    }
}

// Display students list with attendance options
function displayManualStudentsList() {
    const container = document.getElementById('manualStudentsList');
    
    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
                    <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">#</th>
                    <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Student Name</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Status</th>
                </tr>
            </thead>
            <tbody>
                ${manualAttendanceData.students.map((student, index) => `
                    <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#fafafa'};" data-student-id="${student._id}">
                        <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">${index + 1}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; font-weight: 500; color: #1f2937;">${student.fullName}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; text-align: center;">
                            <div style="display: flex; gap: 8px; justify-content: center;">
                                <button type="button" class="attendance-btn present-btn" data-student="${student._id}" data-status="present" onclick="setStudentStatus('${student._id}', 'present')" style="padding: 6px 12px; border: 2px solid #10b981; background: white; color: #10b981; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                    <i class="fas fa-check"></i> Present
                                </button>
                                <button type="button" class="attendance-btn late-btn" data-student="${student._id}" data-status="late" onclick="setStudentStatus('${student._id}', 'late')" style="padding: 6px 12px; border: 2px solid #f59e0b; background: white; color: #f59e0b; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                    <i class="fas fa-clock"></i> Late
                                </button>
                                <button type="button" class="attendance-btn absent-btn" data-student="${student._id}" data-status="absent" onclick="setStudentStatus('${student._id}', 'absent')" style="padding: 6px 12px; border: 2px solid #ef4444; background: white; color: #ef4444; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                    <i class="fas fa-times"></i> Absent
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Initialize all students as "not selected" (will need to select status)
    manualAttendanceData.students.forEach(student => {
        student.status = null;
    });
    
    updateManualAttendanceSummary();
}

// Set individual student status
function setStudentStatus(studentId, status) {
    // Update data
    const student = manualAttendanceData.students.find(s => s._id === studentId);
    if (student) {
        student.status = status;
    }
    
    // Update UI - reset all buttons for this student
    const row = document.querySelector(`tr[data-student-id="${studentId}"]`);
    if (row) {
        const buttons = row.querySelectorAll('.attendance-btn');
        buttons.forEach(btn => {
            const btnStatus = btn.dataset.status;
            if (btnStatus === 'present') {
                btn.style.background = status === 'present' ? '#10b981' : 'white';
                btn.style.color = status === 'present' ? 'white' : '#10b981';
            } else if (btnStatus === 'late') {
                btn.style.background = status === 'late' ? '#f59e0b' : 'white';
                btn.style.color = status === 'late' ? 'white' : '#f59e0b';
            } else if (btnStatus === 'absent') {
                btn.style.background = status === 'absent' ? '#ef4444' : 'white';
                btn.style.color = status === 'absent' ? 'white' : '#ef4444';
            }
        });
    }
    
    updateManualAttendanceSummary();
}

// Mark all students with a specific status
function markAllAs(status) {
    manualAttendanceData.students.forEach(student => {
        setStudentStatus(student._id, status);
    });
}

// Update attendance summary counts
function updateManualAttendanceSummary() {
    const presentCount = manualAttendanceData.students.filter(s => s.status === 'present').length;
    const lateCount = manualAttendanceData.students.filter(s => s.status === 'late').length;
    const absentCount = manualAttendanceData.students.filter(s => s.status === 'absent').length;
    const totalCount = manualAttendanceData.students.length;
    
    document.getElementById('manualPresentCount').textContent = presentCount;
    document.getElementById('manualLateCount').textContent = lateCount;
    document.getElementById('manualAbsentCount').textContent = absentCount;
    document.getElementById('manualTotalCount').textContent = totalCount;
}

// Go back to step 1
function goBackToStep1() {
    document.getElementById('manualAttendanceStep1').style.display = 'block';
    document.getElementById('manualAttendanceStep2').style.display = 'none';
}

// Submit manual attendance
async function submitManualAttendance() {
    // Validate all students have a status
    const unselectedStudents = manualAttendanceData.students.filter(s => !s.status);
    if (unselectedStudents.length > 0) {
        showNotification(`Please mark attendance for all students. ${unselectedStudents.length} student(s) not marked.`, 'warning');
        return;
    }
    
    const teacherId = document.getElementById('manualTeacherSelect').value;
    const groupId = document.getElementById('manualGroupSelect').value;
    const formation = document.getElementById('manualFormationSelect').value;
    const date = document.getElementById('manualDateSelect').value;
    const startTime = document.getElementById('manualStartTime').value;
    const endTime = document.getElementById('manualEndTime').value;
    
    // Build attendance records
    const attendanceRecords = manualAttendanceData.students.map(student => ({
        studentId: student._id,
        status: student.status
    }));
    
    // Build class times
    const classStartTime = startTime ? `${date}T${startTime}:00` : null;
    const classEndTime = endTime ? `${date}T${endTime}:00` : null;
    
    try {
        // Show loading
        const submitBtn = document.querySelector('#manualAttendanceStep2 button[onclick="submitManualAttendance()"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;
        }
        
        const response = await fetch('/api/attendance/admin/manual-attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AdminAttendance.getToken()}`
            },
            body: JSON.stringify({
                teacherId,
                groupId,
                formation,
                date,
                classStartTime,
                classEndTime,
                attendanceRecords
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save attendance');
        }
        
        const data = await response.json();
        
        // Success!
        showNotification(`✅ Manual attendance saved successfully!\n${data.session.presentCount} present, ${data.session.lateCount} late, ${data.session.absentCount} absent`, 'success');
        
        // Close modal and refresh data
        closeManualAttendanceModal();
        
        // Refresh attendance records and sessions
        await AdminAttendance.loadRecords();
        await AdminAttendance.loadStats();
        await AdminAttendance.loadSessions();
        
    } catch (error) {
        console.error('Error saving manual attendance:', error);
        showNotification('Failed to save attendance: ' + error.message, 'error');
        
        const submitBtn = document.querySelector('#manualAttendanceStep2 button[onclick="submitManualAttendance()"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Attendance';
            submitBtn.disabled = false;
        }
    }
}

// Make it globally accessible
window.AdminAttendance = AdminAttendance;

// Global initialization function
function initializeAttendance() {
    AdminAttendance.init();
}

// Global functions for HTML onclick handlers
function loadAttendanceRecords() {
    AdminAttendance.loadRecords();
}

function exportAttendanceToExcel() {
    AdminAttendance.exportToExcel();
}

function clearAttendanceFilters() {
    // Clear all filter inputs
    document.getElementById('attendanceGroupFilter').value = '';
    document.getElementById('attendanceFormationFilter').value = '';
    document.getElementById('attendanceStatusFilter').value = '';
    document.getElementById('attendanceStartDate').value = '';
    document.getElementById('attendanceEndDate').value = '';
    document.getElementById('attendanceSearchInput').value = '';
    
    // Reset filters and reload
    AdminAttendance.filters = {};
    AdminAttendance.currentPage = 1;
    AdminAttendance.loadRecords();
    AdminAttendance.loadStats();
    
    // Show notification
    showNotification('All filters cleared! 🔄', 'success');
}

function clearRecentSessions() {
    AdminAttendance.loadSessions();
    showNotification('Sessions refreshed! ♻️', 'success');
}

function clearAllPresences() {
    // Open the new Edit Presences modal instead of the old confirm dialog
    openEditPresencesModal();
}

function clearAllAbsences() {
    // Open the new Clear Absences modal instead of the old confirm dialog
    openClearAbsencesModal();
}

// ==================== CLEAR ABSENCES MODAL FUNCTIONS ====================

let clearAbsencesCurrentGroupId = null;
let clearAbsencesStudentsData = [];

// Open the Clear Absences modal
async function openClearAbsencesModal() {
    const modal = document.getElementById('clearAbsencesModal');
    modal.style.display = 'flex';
    
    // Reset state
    clearAbsencesCurrentGroupId = null;
    clearAbsencesStudentsData = [];
    
    // Show step 1, hide step 2
    document.getElementById('clearAbsencesStep1').style.display = 'block';
    document.getElementById('clearAbsencesStep2').style.display = 'none';
    document.getElementById('clearAbsencesBackBtn').style.display = 'none';
    
    // Load groups from active season
    await loadClearAbsencesGroups();
}

// Close the Clear Absences modal
function closeClearAbsencesModal() {
    document.getElementById('clearAbsencesModal').style.display = 'none';
    clearAbsencesCurrentGroupId = null;
    clearAbsencesStudentsData = [];
}

// Load groups from active season for the dropdown
async function loadClearAbsencesGroups() {
    const groupSelect = document.getElementById('clearAbsencesGroupSelect');
    groupSelect.innerHTML = '<option value="">-- Select a group --</option>';
    
    try {
        // Get active season first
        const seasonsResponse = await fetch('/api/seasons/current', {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!seasonsResponse.ok) {
            console.error('Failed to fetch active season:', seasonsResponse.status);
            groupSelect.innerHTML = '<option value="">Error loading season</option>';
            return;
        }
        
        const activeSeason = await seasonsResponse.json();
        console.log('Active season:', activeSeason);
        
        if (!activeSeason || !activeSeason._id) {
            groupSelect.innerHTML = '<option value="">No active season found</option>';
            return;
        }
        
        // Load groups filtered by active season
        const groupsResponse = await fetch(`/api/student-management/groups?season=${activeSeason._id}`, {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!groupsResponse.ok) {
            console.error('Failed to fetch groups:', groupsResponse.status);
            groupSelect.innerHTML = '<option value="">Error loading groups</option>';
            return;
        }
        
        const groupsData = await groupsResponse.json();
        console.log('Groups data:', groupsData);
        
        if (groupsData.groups && groupsData.groups.length > 0) {
            // Build options HTML
            let optionsHTML = '<option value="">-- Select a group --</option>';
            groupsData.groups.forEach(group => {
                optionsHTML += `<option value="${group._id}">${group.name}</option>`;
            });
            groupSelect.innerHTML = optionsHTML;
            console.log(`Loaded ${groupsData.groups.length} groups`);
        } else {
            groupSelect.innerHTML = '<option value="">No groups in active season</option>';
        }
    } catch (error) {
        console.error('Error loading groups for clear absences:', error);
        groupSelect.innerHTML = '<option value="">Error loading groups</option>';
    }
}

// Load students with absences for the selected group
async function loadStudentsWithAbsences() {
    const groupId = document.getElementById('clearAbsencesGroupSelect').value;
    
    if (!groupId) {
        document.getElementById('clearAbsencesStep2').style.display = 'none';
        document.getElementById('clearAbsencesStep1').style.display = 'block';
        document.getElementById('clearAbsencesBackBtn').style.display = 'none';
        return;
    }
    
    clearAbsencesCurrentGroupId = groupId;
    
    // Show step 2
    document.getElementById('clearAbsencesStep1').style.display = 'none';
    document.getElementById('clearAbsencesStep2').style.display = 'block';
    document.getElementById('clearAbsencesBackBtn').style.display = 'inline-flex';
    
    // Show loading
    document.getElementById('clearAbsencesLoading').style.display = 'block';
    document.getElementById('clearAbsencesEmpty').style.display = 'none';
    document.getElementById('clearAbsencesStudentsList').innerHTML = '';
    
    try {
        const response = await fetch(`/api/attendance/admin/students-with-absences?groupId=${groupId}`, {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load students with absences');
        }
        
        const data = await response.json();
        clearAbsencesStudentsData = data.students || [];
        
        // Hide loading
        document.getElementById('clearAbsencesLoading').style.display = 'none';
        
        // Update total badge
        const totalAbsences = data.totalAbsences || 0;
        document.getElementById('clearAbsencesTotalBadge').innerHTML = 
            `<i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i>${totalAbsences} total absence${totalAbsences !== 1 ? 's' : ''}`;
        
        if (clearAbsencesStudentsData.length === 0) {
            // Show empty state
            document.getElementById('clearAbsencesEmpty').style.display = 'block';
        } else {
            // Render students list
            renderClearAbsencesStudentsList();
        }
    } catch (error) {
        console.error('Error loading students with absences:', error);
        document.getElementById('clearAbsencesLoading').style.display = 'none';
        document.getElementById('clearAbsencesStudentsList').innerHTML = `
            <div style="text-align: center; padding: 60px 40px; background: white; border-radius: 12px; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p style="font-size: 1.1rem; margin: 0;">Error loading students with absences</p>
            </div>
        `;
    }
}

// Render the students list with absences
function renderClearAbsencesStudentsList() {
    const container = document.getElementById('clearAbsencesStudentsList');
    
    if (clearAbsencesStudentsData.length === 0) {
        container.innerHTML = '';
        document.getElementById('clearAbsencesEmpty').style.display = 'block';
        return;
    }
    
    document.getElementById('clearAbsencesEmpty').style.display = 'none';
    
    container.innerHTML = clearAbsencesStudentsData.map((student, index) => `
        <div class="clear-absence-student-card" style="background: white; border: 2px solid #e5e7eb; border-radius: 16px; padding: 20px; margin-bottom: 16px; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; flex-wrap: wrap;">
                <!-- Student Info -->
                <div style="display: flex; align-items: center; gap: 15px; flex: 1; min-width: 250px;">
                    <div style="width: 55px; height: 55px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.3rem; flex-shrink: 0; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                        ${student.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: #1f2937; font-size: 1.1rem; margin-bottom: 4px;">${student.studentName}</div>
                        <div style="font-size: 0.9rem; color: #6b7280;">${student.studentEmail}</div>
                    </div>
                </div>
                
                <!-- Actions -->
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); color: #dc2626; padding: 10px 18px; border-radius: 25px; font-weight: 700; font-size: 1rem; border: 2px solid #fecaca; white-space: nowrap;">
                        <i class="fas fa-times-circle" style="margin-right: 6px;"></i>
                        ${student.absenceCount} ${student.absenceCount === 1 ? 'absence' : 'absences'}
                    </div>
                    <button onclick="deleteStudentAbsences('${student.studentId}', '${student.studentName.replace(/'/g, "\\'")}')" 
                            style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25); white-space: nowrap;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(239, 68, 68, 0.4)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.25)'"
                            title="Clear all absences for ${student.studentName}">
                        <i class="fas fa-trash-alt"></i>
                        Clear All
                    </button>
                </div>
            </div>
            
            <!-- Expandable absences list -->
            <div id="absencesList_${index}" style="display: none; margin-top: 20px; padding-top: 20px; border-top: 2px dashed #e5e7eb;">
                <div style="font-size: 0.95rem; color: #374151; margin-bottom: 12px; font-weight: 600;">
                    <i class="fas fa-calendar-times" style="margin-right: 8px; color: #ef4444;"></i>
                    Absence Records:
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${student.absences.map(absence => `
                        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%); padding: 10px 16px; border-radius: 10px; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 10px; border: 2px solid #fecaca; transition: all 0.2s;">
                            <span style="color: #991b1b; font-weight: 600;">${new Date(absence.date).toLocaleDateString()}</span>
                            <span style="color: #d1d5db;">•</span>
                            <span style="color: #dc2626; font-weight: 500;">${absence.formation}</span>
                            <button onclick="deleteSingleAbsence('${student.studentId}', '${absence._id}', '${student.studentName.replace(/'/g, "\\'")}')" 
                                    style="background: #dc2626; color: white; border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 0.75rem; display: inline-flex; align-items: center; justify-content: center; margin-left: 4px; transition: all 0.2s;"
                                    onmouseover="this.style.background='#b91c1c'; this.style.transform='scale(1.1)'"
                                    onmouseout="this.style.background='#dc2626'; this.style.transform='scale(1)'"
                                    title="Delete this absence">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Toggle Button -->
            <button onclick="toggleAbsencesList(${index})" 
                    style="background: #f3f4f6; border: 2px solid #e5e7eb; color: #4b5563; cursor: pointer; font-size: 0.9rem; margin-top: 15px; padding: 8px 16px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; font-weight: 500; transition: all 0.2s;"
                    onmouseover="this.style.background='#e5e7eb'"
                    onmouseout="this.style.background='#f3f4f6'"
                    id="toggleBtn_${index}">
                <i class="fas fa-chevron-down" id="toggleIcon_${index}"></i>
                Show Details
            </button>
        </div>
    `).join('');
}

// Toggle absences list visibility
function toggleAbsencesList(index) {
    const list = document.getElementById(`absencesList_${index}`);
    const btn = document.getElementById(`toggleBtn_${index}`);
    
    if (list.style.display === 'none') {
        list.style.display = 'block';
        btn.innerHTML = `<i class="fas fa-chevron-up" id="toggleIcon_${index}"></i> Hide Details`;
    } else {
        list.style.display = 'none';
        btn.innerHTML = `<i class="fas fa-chevron-down" id="toggleIcon_${index}"></i> Show Details`;
    }
}

// Delete all absences for a student
async function deleteStudentAbsences(studentId, studentName) {
    const confirmed = confirm(
        `⚠️ Delete all absences for ${studentName}?\n\n` +
        `This will reset their absence count to 0.\n` +
        `The student will see the updated count in their app.\n\n` +
        `This action cannot be undone!`
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/api/attendance/admin/student-absences/${studentId}?groupId=${clearAbsencesCurrentGroupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete absences');
        }
        
        const data = await response.json();
        
        // Show success notification
        showNotification(`✅ ${data.deletedCount} absence(s) deleted for ${studentName}`, 'success');
        
        // Reload the students list
        await loadStudentsWithAbsences();
        
        // Reload attendance records in the background
        AdminAttendance.loadStats();
        AdminAttendance.loadRecords();
        
    } catch (error) {
        console.error('Error deleting student absences:', error);
        showNotification(`❌ Error deleting absences: ${error.message}`, 'error');
    }
}

// Delete a single absence record
async function deleteSingleAbsence(studentId, absenceId, studentName) {
    const confirmed = confirm(
        `Delete this absence record for ${studentName}?\n\n` +
        `The student will see the updated count in their app.`
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/api/attendance/admin/student-absences/${studentId}?absenceIds=${absenceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete absence');
        }
        
        // Show success notification
        showNotification(`✅ Absence deleted for ${studentName}`, 'success');
        
        // Reload the students list
        await loadStudentsWithAbsences();
        
        // Reload attendance records in the background
        AdminAttendance.loadStats();
        AdminAttendance.loadRecords();
        
    } catch (error) {
        console.error('Error deleting single absence:', error);
        showNotification(`❌ Error deleting absence: ${error.message}`, 'error');
    }
}

// Go back to step 1 in the Clear Absences modal
function goBackToClearAbsencesStep1() {
    document.getElementById('clearAbsencesStep1').style.display = 'block';
    document.getElementById('clearAbsencesStep2').style.display = 'none';
    document.getElementById('clearAbsencesBackBtn').style.display = 'none';
    document.getElementById('clearAbsencesGroupSelect').value = '';
    clearAbsencesCurrentGroupId = null;
}

// ==================== EDIT PRESENCES MODAL ====================

// State for Edit Presences modal
let editPresencesCurrentGroupId = null;
let editPresencesStudentsData = [];

// Replace the clearPresences function to open the modal
function clearPresences() {
    openEditPresencesModal();
}

// Open the Edit Presences modal
async function openEditPresencesModal() {
    const modal = document.getElementById('editPresencesModal');
    modal.style.display = 'flex';
    
    // Reset state
    editPresencesCurrentGroupId = null;
    editPresencesStudentsData = [];
    
    // Show step 1, hide step 2
    document.getElementById('editPresencesStep1').style.display = 'block';
    document.getElementById('editPresencesStep2').style.display = 'none';
    document.getElementById('editPresencesBackBtn').style.display = 'none';
    
    // Load groups from active season
    await loadEditPresencesGroups();
}

// Close the Edit Presences modal
function closeEditPresencesModal() {
    document.getElementById('editPresencesModal').style.display = 'none';
    editPresencesCurrentGroupId = null;
    editPresencesStudentsData = [];
}

// Load groups from active season for the dropdown
async function loadEditPresencesGroups() {
    const groupSelect = document.getElementById('editPresencesGroupSelect');
    groupSelect.innerHTML = '<option value="">-- Select a group --</option>';
    
    try {
        // Get active season first
        const seasonsResponse = await fetch('/api/seasons/current', {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!seasonsResponse.ok) {
            console.error('Failed to fetch active season:', seasonsResponse.status);
            groupSelect.innerHTML = '<option value="">Error loading season</option>';
            return;
        }
        
        const activeSeason = await seasonsResponse.json();
        
        if (!activeSeason || !activeSeason._id) {
            groupSelect.innerHTML = '<option value="">No active season found</option>';
            return;
        }
        
        // Load groups filtered by active season
        const groupsResponse = await fetch(`/api/student-management/groups?season=${activeSeason._id}`, {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!groupsResponse.ok) {
            console.error('Failed to fetch groups:', groupsResponse.status);
            groupSelect.innerHTML = '<option value="">Error loading groups</option>';
            return;
        }
        
        const groupsData = await groupsResponse.json();
        
        if (groupsData.groups && groupsData.groups.length > 0) {
            let optionsHTML = '<option value="">-- Select a group --</option>';
            groupsData.groups.forEach(group => {
                optionsHTML += `<option value="${group._id}">${group.name}</option>`;
            });
            groupSelect.innerHTML = optionsHTML;
        } else {
            groupSelect.innerHTML = '<option value="">No groups in active season</option>';
        }
    } catch (error) {
        console.error('Error loading groups for edit presences:', error);
        groupSelect.innerHTML = '<option value="">Error loading groups</option>';
    }
}

// Load students with presences for the selected group
async function loadStudentsWithPresences() {
    const groupId = document.getElementById('editPresencesGroupSelect').value;
    
    if (!groupId) {
        document.getElementById('editPresencesStep2').style.display = 'none';
        document.getElementById('editPresencesStep1').style.display = 'block';
        document.getElementById('editPresencesBackBtn').style.display = 'none';
        return;
    }
    
    editPresencesCurrentGroupId = groupId;
    
    // Show step 2
    document.getElementById('editPresencesStep1').style.display = 'none';
    document.getElementById('editPresencesStep2').style.display = 'block';
    document.getElementById('editPresencesBackBtn').style.display = 'inline-flex';
    
    // Show loading
    document.getElementById('editPresencesLoading').style.display = 'block';
    document.getElementById('editPresencesEmpty').style.display = 'none';
    document.getElementById('editPresencesStudentsList').innerHTML = '';
    
    try {
        const response = await fetch(`/api/attendance/admin/students-with-presences?groupId=${groupId}`, {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load students with presences');
        }
        
        const data = await response.json();
        editPresencesStudentsData = data.students || [];
        
        // Hide loading
        document.getElementById('editPresencesLoading').style.display = 'none';
        
        // Update badges
        document.getElementById('editPresencesPresentBadge').innerHTML = 
            `<i class="fas fa-check-circle" style="margin-right: 6px;"></i>${data.totalPresent || 0} present`;
        document.getElementById('editPresencesLateBadge').innerHTML = 
            `<i class="fas fa-clock" style="margin-right: 6px;"></i>${data.totalLate || 0} late`;
        
        if (editPresencesStudentsData.length === 0) {
            document.getElementById('editPresencesEmpty').style.display = 'block';
        } else {
            renderEditPresencesStudentsList();
        }
    } catch (error) {
        console.error('Error loading students with presences:', error);
        document.getElementById('editPresencesLoading').style.display = 'none';
        document.getElementById('editPresencesStudentsList').innerHTML = `
            <div style="text-align: center; padding: 60px 40px; background: white; border-radius: 12px; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p style="font-size: 1.1rem; margin: 0;">Error loading students with attendance records</p>
            </div>
        `;
    }
}

// Render the students list with presences
function renderEditPresencesStudentsList() {
    const container = document.getElementById('editPresencesStudentsList');
    
    if (editPresencesStudentsData.length === 0) {
        container.innerHTML = '';
        document.getElementById('editPresencesEmpty').style.display = 'block';
        return;
    }
    
    document.getElementById('editPresencesEmpty').style.display = 'none';
    
    container.innerHTML = editPresencesStudentsData.map((student, index) => `
        <div class="edit-presence-student-card" style="background: white; border: 2px solid #e5e7eb; border-radius: 16px; padding: 20px; margin-bottom: 16px; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; flex-wrap: wrap;">
                <!-- Student Info -->
                <div style="display: flex; align-items: center; gap: 15px; flex: 1; min-width: 250px;">
                    <div style="width: 55px; height: 55px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.3rem; flex-shrink: 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        ${student.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: #1f2937; font-size: 1.1rem; margin-bottom: 4px;">${student.studentName}</div>
                        <div style="font-size: 0.9rem; color: #6b7280;">${student.studentEmail}</div>
                    </div>
                </div>
                
                <!-- Stats -->
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); color: #059669; padding: 8px 14px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; border: 2px solid #bbf7d0; white-space: nowrap;">
                        <i class="fas fa-check" style="margin-right: 4px;"></i>${student.presentCount} present
                    </div>
                    <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); color: #d97706; padding: 8px 14px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; border: 2px solid #fde68a; white-space: nowrap;">
                        <i class="fas fa-clock" style="margin-right: 4px;"></i>${student.lateCount} late
                    </div>
                </div>
            </div>
            
            <!-- Expandable records list -->
            <div id="presencesList_${index}" style="display: none; margin-top: 20px; padding-top: 20px; border-top: 2px dashed #e5e7eb;">
                <div style="font-size: 0.95rem; color: #374151; margin-bottom: 12px; font-weight: 600;">
                    <i class="fas fa-calendar-check" style="margin-right: 8px; color: #10b981;"></i>
                    Attendance Records:
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${student.records.map(record => `
                        <div style="background: ${record.status === 'present' ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'}; padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; gap: 15px; border: 2px solid ${record.status === 'present' ? '#bbf7d0' : '#fde68a'}; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                                <span style="color: #374151; font-weight: 600;">${new Date(record.date).toLocaleDateString()}</span>
                                <span style="color: #9ca3af;">•</span>
                                <span style="color: #6b7280;">${record.formation}</span>
                                <span style="background: ${record.status === 'present' ? '#10b981' : '#f59e0b'}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">
                                    ${record.status}
                                </span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                ${record.status === 'present' ? `
                                    <button onclick="updateRecordStatus('${record._id}', 'late', '${student.studentName.replace(/'/g, "\\'")}')" 
                                            style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;"
                                            onmouseover="this.style.transform='translateY(-2px)'"
                                            onmouseout="this.style.transform='translateY(0)'"
                                            title="Change to Late">
                                        <i class="fas fa-clock"></i> Mark Late
                                    </button>
                                ` : `
                                    <button onclick="updateRecordStatus('${record._id}', 'present', '${student.studentName.replace(/'/g, "\\'")}')" 
                                            style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;"
                                            onmouseover="this.style.transform='translateY(-2px)'"
                                            onmouseout="this.style.transform='translateY(0)'"
                                            title="Change to Present">
                                        <i class="fas fa-check"></i> Mark Present
                                    </button>
                                `}
                                <button onclick="updateRecordStatus('${record._id}', 'absent', '${student.studentName.replace(/'/g, "\\'")}')" 
                                        style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;"
                                        onmouseover="this.style.transform='translateY(-2px)'"
                                        onmouseout="this.style.transform='translateY(0)'"
                                        title="Change to Absent">
                                    <i class="fas fa-times"></i> Mark Absent
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Toggle Button -->
            <button onclick="togglePresencesList(${index})" 
                    style="background: #f3f4f6; border: 2px solid #e5e7eb; color: #4b5563; cursor: pointer; font-size: 0.9rem; margin-top: 15px; padding: 8px 16px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; font-weight: 500; transition: all 0.2s;"
                    onmouseover="this.style.background='#e5e7eb'"
                    onmouseout="this.style.background='#f3f4f6'"
                    id="togglePresenceBtn_${index}">
                <i class="fas fa-chevron-down" id="togglePresenceIcon_${index}"></i>
                Show Records (${student.totalCount})
            </button>
        </div>
    `).join('');
}

// Toggle presences list visibility
function togglePresencesList(index) {
    const list = document.getElementById(`presencesList_${index}`);
    const btn = document.getElementById(`togglePresenceBtn_${index}`);
    const student = editPresencesStudentsData[index];
    
    if (list.style.display === 'none') {
        list.style.display = 'block';
        btn.innerHTML = `<i class="fas fa-chevron-up" id="togglePresenceIcon_${index}"></i> Hide Records`;
    } else {
        list.style.display = 'none';
        btn.innerHTML = `<i class="fas fa-chevron-down" id="togglePresenceIcon_${index}"></i> Show Records (${student.totalCount})`;
    }
}

// Update a single attendance record status
async function updateRecordStatus(recordId, newStatus, studentName) {
    const statusLabels = { present: 'Present', late: 'Late', absent: 'Absent' };
    
    const confirmed = confirm(
        `Change attendance status to "${statusLabels[newStatus]}" for ${studentName}?\n\n` +
        `The student will see the updated status in their app.`
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/api/attendance/admin/update-status/${recordId}`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${AdminAttendance.getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newStatus })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update status');
        }
        
        const data = await response.json();
        
        showNotification(`✅ Status updated to ${statusLabels[newStatus]} for ${studentName}`, 'success');
        
        // Reload the students list
        await loadStudentsWithPresences();
        
        // Reload attendance records in the background
        AdminAttendance.loadStats();
        AdminAttendance.loadRecords();
        
    } catch (error) {
        console.error('Error updating attendance status:', error);
        showNotification(`❌ Error updating status: ${error.message}`, 'error');
    }
}

// Go back to step 1 in the Edit Presences modal
function goBackToEditPresencesStep1() {
    document.getElementById('editPresencesStep1').style.display = 'block';
    document.getElementById('editPresencesStep2').style.display = 'none';
    document.getElementById('editPresencesBackBtn').style.display = 'none';
    document.getElementById('editPresencesGroupSelect').value = '';
    editPresencesCurrentGroupId = null;
}

// Export Modal Functions
async function showExportModal() {
    const modal = document.getElementById('exportAttendanceModal');
    modal.style.display = 'flex';
    
    // Populate year dropdown (current year ± 5 years)
    const yearSelect = document.getElementById('exportYearSelect');
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '<option value="">Year</option>';
    for (let year = currentYear - 2; year <= currentYear + 3; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
    
    // Load seasons first
    try {
        const response = await fetch('/api/attendance/admin/seasons', {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        const data = await response.json();
        
        const seasonSelect = document.getElementById('exportSeasonSelect');
        seasonSelect.innerHTML = '<option value="">-- Select a Season --</option>';
        
        let activeSeasonId = null;
        if (data.seasons && data.seasons.length > 0) {
            data.seasons.forEach(season => {
                const option = document.createElement('option');
                option.value = season._id; // Use season ID for filtering
                option.textContent = `${season.name} (${season.status})`;
                
                // Pre-select active season
                if (season.status === 'active') {
                    option.selected = true;
                    activeSeasonId = season._id;
                }
                
                seasonSelect.appendChild(option);
            });
        }
        
        // Add event listener to reload groups when season changes
        seasonSelect.addEventListener('change', async () => {
            await loadExportGroups(seasonSelect.value);
        });
        
        // Load groups for active season initially
        if (activeSeasonId) {
            await loadExportGroups(activeSeasonId);
        }
    } catch (error) {
        console.error('Error loading seasons:', error);
    }
    
    // Hide warning initially
    document.getElementById('exportWarning').style.display = 'none';
}

// Load groups filtered by season for export modal
async function loadExportGroups(seasonId) {
    try {
        if (!seasonId) {
            // No season selected, clear groups
            const groupSelect = document.getElementById('exportGroupSelect');
            groupSelect.innerHTML = '<option value="">-- Select a Season First --</option>';
            return;
        }
        
        // Fetch groups filtered by season
        const response = await fetch(`/api/student-management/groups?season=${seasonId}`, {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        const data = await response.json();
        
        const groupSelect = document.getElementById('exportGroupSelect');
        groupSelect.innerHTML = '<option value="">-- Select a Group --</option>';
        
        if (data.groups && data.groups.length > 0) {
            data.groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group._id;
                option.textContent = group.name;
                groupSelect.appendChild(option);
            });
        } else {
            groupSelect.innerHTML = '<option value="">No groups in this season</option>';
        }
    } catch (error) {
        console.error('Error loading export groups:', error);
        const groupSelect = document.getElementById('exportGroupSelect');
        groupSelect.innerHTML = '<option value="">Error loading groups</option>';
    }
}

function closeExportModal() {
    document.getElementById('exportAttendanceModal').style.display = 'none';
    // Clear selections
    document.getElementById('exportGroupSelect').value = '';
    document.getElementById('exportSeasonSelect').value = '';
    document.getElementById('exportMonthSelect').value = '';
    document.getElementById('exportYearSelect').value = '';
    document.getElementById('exportWarning').style.display = 'none';
}

async function executeExport(format = 'excel') {
    const groupId = document.getElementById('exportGroupSelect').value;
    const season = document.getElementById('exportSeasonSelect').value;
    const monthNum = document.getElementById('exportMonthSelect').value;
    const year = document.getElementById('exportYearSelect').value;
    
    const warningDiv = document.getElementById('exportWarning');
    const warningText = document.getElementById('exportWarningText');
    
    // Validation
    if (!groupId) {
        warningText.textContent = 'Please select a group before exporting.';
        warningDiv.style.display = 'block';
        return;
    }
    
    if (!season) {
        warningText.textContent = 'Please select a season before exporting.';
        warningDiv.style.display = 'block';
        return;
    }
    
    if (!monthNum) {
        warningText.textContent = 'Please select a month before exporting.';
        warningDiv.style.display = 'block';
        return;
    }
    
    if (!year) {
        warningText.textContent = 'Please select a year before exporting.';
        warningDiv.style.display = 'block';
        return;
    }
    
    // Hide warning
    warningDiv.style.display = 'none';
    
    // Show loading notification
    const loadingNotif = document.createElement('div');
    loadingNotif.id = 'exportLoadingNotif';
    loadingNotif.style.cssText = 'position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 25px; border-radius: 10px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
    loadingNotif.innerHTML = `<i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>Generating ${format.toUpperCase()} report...`;
    document.body.appendChild(loadingNotif);
    
    try {
        // Format month as YYYY-MM
        const monthFormatted = `${year}-${monthNum.padStart(2, '0')}`;
        
        // Build URL with query parameters
        const url = `/api/attendance/export/monthly?groupId=${groupId}&season=${encodeURIComponent(season)}&month=${monthFormatted}&format=${format}`;
        
        // Fetch the file
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to export attendance');
        }
        
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `Rapport-Presence-${monthFormatted}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        
        // Download the file
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        // Remove loading notification
        document.body.removeChild(loadingNotif);
        
        // Close modal
        closeExportModal();
        
        // Show success notification
        showNotification(`${format.toUpperCase()} report downloaded successfully! 📊`, 'success');
        
    } catch (error) {
        console.error('Error exporting attendance:', error);
        
        // Remove loading notification
        const notif = document.getElementById('exportLoadingNotif');
        if (notif) document.body.removeChild(notif);
        
        // Show error
        warningText.textContent = error.message || 'Failed to export attendance. Please try again.';
        warningDiv.style.display = 'block';
        warningDiv.style.background = '#fee2e2';
        warningDiv.style.borderColor = '#ef4444';
        warningText.style.color = '#991b1b';
    }
}
