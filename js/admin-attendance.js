// Admin Attendance Module
const AdminAttendance = {
    currentPage: 1,
    limit: 20,
    filters: {},

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
            // Load groups
            const groupsResponse = await fetch('/api/student-management/groups', {
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
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">Total Records</div>
                            <div style="font-size: 2.2rem; font-weight: 700;">${stats.total}</div>
                        </div>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.9rem;">All attendance sessions</div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 25px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px;">
                            <i class="fas fa-check-circle" style="font-size: 2rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">Present</div>
                            <div style="font-size: 2.2rem; font-weight: 700;">${stats.present}</div>
                        </div>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.9rem;">${stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}% of total records</div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; padding: 25px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px;">
                            <i class="fas fa-clock" style="font-size: 2rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">Late</div>
                            <div style="font-size: 2.2rem; font-weight: 700;">${stats.late}</div>
                        </div>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.9rem;">${stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}% of total records</div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; padding: 25px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px;">
                            <i class="fas fa-times-circle" style="font-size: 2rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">Absent</div>
                            <div style="font-size: 2.2rem; font-weight: 700;">${stats.absent}</div>
                        </div>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.9rem;">${stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}% of total records</div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 25px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px;">
                            <i class="fas fa-chart-line" style="font-size: 2rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;">Attendance Rate</div>
                            <div style="font-size: 2.2rem; font-weight: 700;">${attendanceRate}%</div>
                        </div>
                    </div>
                    <div style="opacity: 0.9; font-size: 0.9rem;">Present + Late combined</div>
                </div>
            </div>
        `;
    },

    // Load Records
    async loadRecords() {
        try {
            let url = `/api/attendance/admin/records?page=${this.currentPage}&limit=${this.limit}&`;
            Object.keys(this.filters).forEach(key => {
                if (this.filters[key] && key !== 'search') {
                    url += `${key}=${this.filters[key]}&`;
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

        // Filter by search if needed
        let filteredRecords = records;
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filteredRecords = records.filter(r => 
                r.studentName.toLowerCase().includes(search) ||
                r.studentEmail.toLowerCase().includes(search) ||
                r.groupName.toLowerCase().includes(search) ||
                r.teacherName.toLowerCase().includes(search)
            );
        }

        if (filteredRecords.length === 0) {
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
                                    <i class="fas fa-calendar" style="margin-right: 8px;"></i>Date
                                </th>
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap;">
                                    <i class="fas fa-user" style="margin-right: 8px;"></i>Student
                                </th>
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap;">
                                    <i class="fas fa-users" style="margin-right: 8px;"></i>Group
                                </th>
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap;">
                                    <i class="fas fa-graduation-cap" style="margin-right: 8px;"></i>Formation
                                </th>
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap;">
                                    <i class="fas fa-chalkboard-teacher" style="margin-right: 8px;"></i>Teacher
                                </th>
                                <th style="padding: 16px; text-align: center; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap;">
                                    <i class="fas fa-info-circle" style="margin-right: 8px;"></i>Status
                                </th>
                                <th style="padding: 16px; text-align: left; font-weight: 700; color: #1f2937; border-bottom: 3px solid #FF9500; white-space: nowrap; border-top-right-radius: 12px;">
                                    <i class="fas fa-clock" style="margin-right: 8px;"></i>Scan Time
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredRecords.map((record, index) => `
                                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#fafafa'}; transition: all 0.2s; cursor: pointer;" onmouseover="this.style.background='#fff8e1'; this.style.transform='scale(1.005)'" onmouseout="this.style.background='${index % 2 === 0 ? '#ffffff' : '#fafafa'}'; this.style.transform='scale(1)'">
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #374151; font-weight: 500;">${new Date(record.date).toLocaleDateString()}</td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #1f2937; font-weight: 600;">${record.studentName}</td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">${record.groupName}</td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">${record.formation}</td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">${record.teacherName}</td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; text-align: center;">
                                        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 25px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; ${record.status === 'present' ? 'background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #065f46; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);' : record.status === 'late' ? 'background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #92400e; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);' : 'background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #991b1b; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);'}">
                                            ${record.status === 'present' ? '<i class="fas fa-check-circle"></i> Present' : record.status === 'late' ? '<i class="fas fa-clock"></i> Late' : '<i class="fas fa-times-circle"></i> Absent'}
                                        </span>
                                    </td>
                                    <td style="padding: 16px; border-bottom: 1px solid #f0f0f0; color: #6b7280; font-family: 'Courier New', monospace;">${record.scanTime ? new Date(record.scanTime).toLocaleTimeString() : '-'}</td>
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
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`/api/attendance/admin/sessions?startDate=${today}&limit=10`, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('Failed to load sessions');

            const data = await response.json();
            this.displaySessions(data.sessions);

        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    },

    // Display Sessions
    displaySessions(sessions) {
        const sessionsContainer = document.getElementById('recentSessionsContainer');
        if (!sessionsContainer) return;

        if (sessions.length === 0) {
            sessionsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No recent sessions</p>
                </div>
            `;
            return;
        }

        sessionsContainer.innerHTML = sessions.map(session => {
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
    AdminAttendance.clearAllFilteredPresences();
}

function clearAllAbsences() {
    AdminAttendance.clearAllFilteredAbsences();
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
    
    // Load groups
    try {
        const response = await fetch('/api/student-management/groups', {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        const data = await response.json();
        
        const groupSelect = document.getElementById('exportGroupSelect');
        groupSelect.innerHTML = '<option value="">-- Select a Group --</option>';
        data.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group._id;
            option.textContent = group.name;
            groupSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading groups:', error);
    }
    
    // Load seasons
    try {
        const response = await fetch('/api/attendance/admin/seasons', {
            headers: { 'Authorization': `Bearer ${AdminAttendance.getToken()}` }
        });
        const data = await response.json();
        
        const seasonSelect = document.getElementById('exportSeasonSelect');
        seasonSelect.innerHTML = '<option value="">-- Select a Season --</option>';
        if (data.seasons && data.seasons.length > 0) {
            data.seasons.forEach(season => {
                const option = document.createElement('option');
                option.value = season.name; // Use season name (e.g., "2025-2026")
                option.textContent = `${season.name} (${season.status})`;
                seasonSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading seasons:', error);
    }
    
    // Hide warning initially
    document.getElementById('exportWarning').style.display = 'none';
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
