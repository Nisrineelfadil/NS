// Appointments Management JavaScript
// Handles all appointment-related functionality

// Translation helper (uses global translations from admin-dashboard.js)
function t(key) {
    if (!window.translations || !window.currentLanguage) return key;
    const keys = key.split('.');
    let value = window.translations[window.currentLanguage]?.translations;
    for (const k of keys) {
        value = value?.[k];
    }
    return value || key;
}

let currentAppointments = [];
let currentFilters = {
    date: '',
    status: '',
    priority: '',
    search: ''
};

// Initialize appointments when tab is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for filters
    const dateFilter = document.getElementById('appointmentDateFilter');
    const statusFilter = document.getElementById('appointmentStatusFilter');
    const priorityFilter = document.getElementById('appointmentPriorityFilter');
    const searchFilter = document.getElementById('appointmentSearchFilter');

    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            currentFilters.date = dateFilter.value;
            loadAppointments();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentFilters.status = statusFilter.value;
            loadAppointments();
        });
    }

    if (priorityFilter) {
        priorityFilter.addEventListener('change', () => {
            currentFilters.priority = priorityFilter.value;
            loadAppointments();
        });
    }

    if (searchFilter) {
        // Debounce search input
        let searchTimeout;
        searchFilter.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = searchFilter.value;
                loadAppointments();
            }, 300);
        });
    }

    // Set up form submission
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentSubmit);
    }

    // Set default date to today
    if (dateFilter) {
        const today = new Date().toISOString().split('T')[0];
        dateFilter.value = today;
        currentFilters.date = today;
    }
});

// Load appointments with current filters
async function loadAppointments() {
    const loading = document.getElementById('appointmentsLoading');
    const tableContainer = document.getElementById('appointmentsTableContainer');
    const tableBody = document.getElementById('appointmentsTableBody');

    if (loading) loading.style.display = 'block';
    if (tableContainer) tableContainer.style.display = 'none';

    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            throw new Error('Not authenticated');
        }

        // Ensure date filter is set (required)
        if (!currentFilters.date) {
            const today = new Date().toISOString().split('T')[0];
            currentFilters.date = today;
            const dateFilter = document.getElementById('appointmentDateFilter');
            if (dateFilter) dateFilter.value = today;
        }

        // Build query string - date is always required
        const params = new URLSearchParams();
        params.append('date', currentFilters.date);
        if (currentFilters.status) params.append('status', currentFilters.status);
        if (currentFilters.priority) params.append('priority', currentFilters.priority);
        if (currentFilters.search) params.append('search', currentFilters.search);

        const response = await fetch(`/api/appointments?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load appointments');
        }

        const data = await response.json();
        currentAppointments = data.appointments || [];

        // Update table
        if (tableBody) {
            tableBody.innerHTML = '';

            if (currentAppointments.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-light);">
                            <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 10px; opacity: 0.5;"></i>
                            <p>${t('admin.appointments.no_appointments')}</p>
                        </td>
                    </tr>
                `;
            } else {
                currentAppointments.forEach(appointment => {
                    const row = createAppointmentRow(appointment);
                    tableBody.appendChild(row);
                });
            }
        }

        // Load statistics
        await loadAppointmentStats();

        if (loading) loading.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';

    } catch (error) {
        console.error('Error loading appointments:', error);
        if (loading) {
            loading.innerHTML = `
                <div style="color: var(--danger-color); text-align: center;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to load appointments: ${error.message}
                </div>
            `;
        }
    }
}

// Load appointment statistics
async function loadAppointmentStats() {
    try {
        const token = localStorage.getItem('adminToken');
        
        // Build query string with date filter
        const params = new URLSearchParams();
        if (currentFilters.date) {
            params.append('date', currentFilters.date);
        }
        
        const response = await fetch(`/api/appointments/stats?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        const stats = data.stats;

        // Update stat cards
        const todayEl = document.getElementById('todayAppointments');
        const pendingEl = document.getElementById('pendingAppointments');
        const completedEl = document.getElementById('completedAppointments');
        const totalEl = document.getElementById('totalAppointments');

        if (todayEl) todayEl.textContent = stats.today || 0;
        if (pendingEl) pendingEl.textContent = stats.pending || 0;
        if (completedEl) completedEl.textContent = stats.completed || 0;
        if (totalEl) totalEl.textContent = stats.total || 0;

    } catch (error) {
        console.error('Error loading appointment stats:', error);
    }
}

// Create appointment table row
function createAppointmentRow(appointment) {
    const row = document.createElement('tr');
    
    // Format date
    const date = new Date(appointment.appointmentDate);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // Status badge
    let statusClass = 'badge-pending';
    if (appointment.status === 'completed') statusClass = 'badge-success';
    if (appointment.status === 'cancelled') statusClass = 'badge-danger';

    // Priority badge
    let priorityClass = 'badge-info';
    let priorityIcon = 'fa-flag';
    if (appointment.priority === 'high') {
        priorityClass = 'badge-danger';
        priorityIcon = 'fa-exclamation-circle';
    } else if (appointment.priority === 'low') {
        priorityClass = 'badge-secondary';
    }

    row.innerHTML = `
        <td>${formattedDate}</td>
        <td><strong>${appointment.fullName}</strong></td>
        <td>${appointment.phoneNumber}</td>
        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${appointment.purpose}">
            ${appointment.purpose}
        </td>
        <td>
            <span class="badge ${priorityClass}">
                <i class="fas ${priorityIcon}"></i> ${t('admin.appointments.' + appointment.priority)}
            </span>
        </td>
        <td>
            <span class="badge ${statusClass}">
                ${t('admin.appointments.' + appointment.status)}
            </span>
        </td>
        <td>
            <div style="display: flex; gap: 5px;">
                ${appointment.status === 'pending' ? `
                    <button class="action-btn btn-success btn-sm" onclick="markAppointmentComplete('${appointment._id}')" title="${t('admin.appointments.mark_completed')}">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                <button class="action-btn btn-primary btn-sm" onclick="editAppointment('${appointment._id}')" title="${t('admin.appointments.edit')}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn btn-danger btn-sm" onclick="deleteAppointment('${appointment._id}')" title="${t('admin.appointments.delete')}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;

    return row;
}

// Open add appointment modal
function openAddAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    const form = document.getElementById('appointmentForm');
    const title = document.getElementById('appointmentModalTitle');
    const submitBtn = document.getElementById('appointmentSubmitBtn');

    if (form) form.reset();
    if (title) title.textContent = 'New Appointment';
    if (submitBtn) submitBtn.textContent = 'Save Appointment';
    
    // Set default date to today
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    document.getElementById('appointmentId').value = '';
    
    if (modal) modal.classList.add('active');
}

// Close appointment modal
function closeAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) modal.classList.remove('active');
}

// Handle appointment form submission
async function handleAppointmentSubmit(e) {
    e.preventDefault();

    const appointmentId = document.getElementById('appointmentId').value;
    const fullName = document.getElementById('appointmentFullName').value.trim();
    const phoneNumber = document.getElementById('appointmentPhone').value.trim();
    const purpose = document.getElementById('appointmentPurpose').value.trim();
    const appointmentDate = document.getElementById('appointmentDate').value;
    const priority = document.getElementById('appointmentPriority').value;

    if (!fullName || !phoneNumber || !purpose || !appointmentDate) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const token = localStorage.getItem('adminToken');
        const url = appointmentId 
            ? `/api/appointments/${appointmentId}` 
            : '/api/appointments';
        
        const method = appointmentId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                fullName,
                phoneNumber,
                purpose,
                appointmentDate,
                priority
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save appointment');
        }

        const data = await response.json();
        
        // Show success message
        alert(data.message || 'Appointment saved successfully!');
        
        // Close modal and reload appointments
        closeAppointmentModal();
        await loadAppointments();

    } catch (error) {
        console.error('Error saving appointment:', error);
        alert('Failed to save appointment: ' + error.message);
    }
}

// Edit appointment
async function editAppointment(appointmentId) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/appointments/${appointmentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load appointment');
        }

        const data = await response.json();
        const appointment = data.appointment;

        // Populate form
        document.getElementById('appointmentId').value = appointment._id;
        document.getElementById('appointmentFullName').value = appointment.fullName;
        document.getElementById('appointmentPhone').value = appointment.phoneNumber;
        document.getElementById('appointmentPurpose').value = appointment.purpose;
        document.getElementById('appointmentDate').value = appointment.appointmentDate.split('T')[0];
        document.getElementById('appointmentPriority').value = appointment.priority;

        // Update modal title
        const title = document.getElementById('appointmentModalTitle');
        const submitBtn = document.getElementById('appointmentSubmitBtn');
        if (title) title.textContent = 'Edit Appointment';
        if (submitBtn) submitBtn.textContent = 'Update Appointment';

        // Open modal
        const modal = document.getElementById('appointmentModal');
        if (modal) modal.classList.add('active');

    } catch (error) {
        console.error('Error loading appointment:', error);
        alert('Failed to load appointment: ' + error.message);
    }
}

// Mark appointment as completed
async function markAppointmentComplete(appointmentId) {
    if (!confirm('Mark this appointment as completed?')) {
        return;
    }

    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'completed' })
        });

        if (!response.ok) {
            throw new Error('Failed to update appointment status');
        }

        // Reload appointments
        await loadAppointments();

    } catch (error) {
        console.error('Error updating appointment:', error);
        alert('Failed to update appointment: ' + error.message);
    }
}

// Delete appointment
async function deleteAppointment(appointmentId) {
    if (!confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
        return;
    }

    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/appointments/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete appointment');
        }

        // Reload appointments
        await loadAppointments();

    } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Failed to delete appointment: ' + error.message);
    }
}

// Open PDF date picker modal
function openPdfDatePicker() {
    const modal = document.getElementById('pdfDatePickerModal');
    const dateInput = document.getElementById('pdfExportDate');
    
    // Set default to current filter date or today
    const currentFilter = document.getElementById('appointmentDateFilter');
    const defaultDate = currentFilter && currentFilter.value 
        ? currentFilter.value 
        : new Date().toISOString().split('T')[0];
    
    if (dateInput) {
        dateInput.value = defaultDate;
    }
    
    if (modal) modal.classList.add('active');
}

// Close PDF date picker modal
function closePdfDatePicker() {
    const modal = document.getElementById('pdfDatePickerModal');
    if (modal) modal.classList.remove('active');
}

// Confirm and download PDF with selected date
async function confirmPdfDownload() {
    const dateInput = document.getElementById('pdfExportDate');
    const date = dateInput ? dateInput.value : null;

    if (!date) {
        alert('Please select a date');
        return;
    }

    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/appointments/pdf/daily?date=${date}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }

        // Download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Appointments_${date}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Close the modal
        closePdfDatePicker();

    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF: ' + error.message);
    }
}

// Legacy function for backward compatibility
async function downloadDailyPDF() {
    openPdfDatePicker();
}

// Load appointments when appointments tab is activated
document.addEventListener('DOMContentLoaded', function() {
    const appointmentsMenuItem = document.querySelector('[data-tab="appointments"]');
    if (appointmentsMenuItem) {
        appointmentsMenuItem.addEventListener('click', function() {
            // Small delay to ensure tab is visible
            setTimeout(() => {
                loadAppointments();
            }, 100);
        });
    }
});
