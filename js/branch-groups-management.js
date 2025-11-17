// ============================================
// BRANCH GROUPS MANAGEMENT - AUTO-CREATION SYSTEM
// ============================================

// Use IIFE to avoid global scope pollution
(function() {
    const API_BASE = '/api/branch-groups';
    let authToken = localStorage.getItem('adminToken');
    let allBranchGroups = [];
    let pendingStudents = [];

    // Initialize only when on the correct page
    function initBranchManagement() {
        // Check if branch management elements exist
        if (!document.getElementById('branchGroupsOverview')) {
            return; // Not on the branch management page
        }
        
        if (!authToken) {
            window.location.href = '/admin';
            return;
        }
        
        loadBranchGroups();
        loadPendingAssignments();
    }

    // Refresh function for manual reload
    window.refreshBranchManagement = async function() {
        const refreshBtn = event.target.closest('button');
        const icon = refreshBtn.querySelector('i');
        
        // Add spinning animation
        icon.classList.add('fa-spin');
        refreshBtn.disabled = true;
        
        try {
            await Promise.all([
                loadBranchGroups(),
                loadPendingAssignments()
            ]);
            showNotification('Branch management refreshed successfully', 'success');
        } catch (error) {
            showNotification('Failed to refresh branch management', 'error');
        } finally {
            // Remove spinning animation
            icon.classList.remove('fa-spin');
            refreshBtn.disabled = false;
        }
    };

    // ==================== LOAD DATA ====================

    async function loadBranchGroups() {
    try {
        // Check if container exists before loading
        if (!document.getElementById('branchGroupsOverview')) {
            return; // Not on the correct page
        }
        
        const response = await fetch(API_BASE, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin';
            return;
        }
        
        const data = await response.json();
        allBranchGroups = data;
        renderBranchGroups();
    } catch (error) {
        console.error('Error loading branch groups:', error);
        // Only show notification if we're on the right page
        if (document.getElementById('branchGroupsOverview')) {
            showNotification('Failed to load branch groups', 'error');
        }
    }
}

    async function loadPendingAssignments() {
    try {
        // Check if container exists before loading
        if (!document.getElementById('pendingBranchStudents')) {
            return; // Not on the correct page
        }
        
        const response = await fetch(`${API_BASE}/pending-assignments/list`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load pending assignments');
        
        pendingStudents = await response.json();
        renderPendingAssignments();
    } catch (error) {
        // Only log error if we're on the right page
        if (document.getElementById('pendingBranchStudents')) {
            console.error('Error loading pending assignments:', error);
        }
    }
}

    // ==================== RENDER UI ====================

    function renderBranchGroups() {
    const container = document.getElementById('branchGroupsContainer');
    
    // Safety check
    if (!container) return;
    
    if (!allBranchGroups || allBranchGroups.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-light);">
                <i class="fas fa-layer-group" style="font-size: 4rem; opacity: 0.3; margin-bottom: 20px;"></i>
                <p style="font-size: 1.1rem;">No branch groups found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allBranchGroups.map(branch => `
        <div class="branch-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;">
            <div style="display: flex; align-items: start; gap: 15px;">
                <div style="font-size: 2.5rem;">${branch.icon || '🎓'}</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 5px 0; color: #1e293b; font-size: 1.2rem;">${branch.displayName}</h3>
                    <div style="display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #4f46e5; border-radius: 12px; font-size: 0.85rem; font-weight: 600; margin-bottom: 10px;">
                        ${branch.formation}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.9rem; margin-top: 8px;">
                        <i class="fas fa-layer-group"></i>
                        <span><strong>${branch.subgroupCount || 0}</strong> subgroups</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button onclick="manageBranchSubgroups('${branch._id}')" class="btn btn-primary" style="flex: 1;">
                    <i class="fas fa-cog"></i> Manage
                </button>
                <button onclick="createSubgroup('${branch._id}')" class="btn btn-success" style="flex: 1;">
                    <i class="fas fa-plus"></i> Create Group
                </button>
            </div>
        </div>
    `).join('');
}

    function renderPendingAssignments() {
    const container = document.getElementById('pendingBranchStudents');
    
    // Safety check
    if (!container) return;
    
    if (!pendingStudents || pendingStudents.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-light);">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; opacity: 0.5; margin-bottom: 15px;"></i>
                <p>All students are assigned to subgroups!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                <i class="fas fa-exclamation-circle" style="color: #f59e0b; font-size: 1.2rem;"></i>
                <h3 style="margin: 0; color: #92400e; font-size: 1.1rem;">Pending Branch Assignments</h3>
            </div>
            <p style="margin: 5px 0 0 0; color: #92400e; font-size: 0.9rem;">
                Students who selected a subject but haven't been assigned to a subgroup yet
            </p>
        </div>
        ${pendingStudents.map(student => renderPendingStudentCard(student)).join('')}
    `;
}

    function renderPendingStudentCard(student) {
    const selectedSubjects = student.filiere.join(', ');
    
    return `
        <div class="pending-student-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 15px;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: 600;">
                    ${student.fullName.charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #1e293b; font-size: 1.1rem;">${student.fullName}</h4>
                    <div style="display: inline-block; padding: 4px 10px; background: #fef3c7; color: #92400e; border-radius: 12px; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px;">
                        <i class="fas fa-clock"></i> PENDING
                    </div>
                    <div style="font-size: 0.9rem; color: #64748b; margin-top: 5px;">
                        <strong>Language Group:</strong> ${student.group?.name || 'N/A'}
                    </div>
                    <div style="font-size: 0.9rem; color: #64748b;">
                        <strong>Selected Subject:</strong> ${selectedSubjects}
                    </div>
                </div>
                <button onclick="assignStudentToSubgroup('${student._id}', '${student.filiere[0]}')" class="btn btn-warning" style="padding: 12px 24px;">
                    <i class="fas fa-check"></i> Assign to Subgroup
                </button>
            </div>
        </div>
    `;
}

    // ==================== MANAGE SUBGROUPS ====================

    async function manageBranchSubgroups(branchId) {
    try {
        // Load subgroups for this branch
        const response = await fetch(`${API_BASE}/${branchId}/subgroups`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load subgroups');
        
        const subgroups = await response.json();
        const branch = allBranchGroups.find(b => b._id === branchId);
        
        // Create management modal
        const modal = createModal(`Manage ${branch.displayName} Subgroups`, `
            <div style="margin-bottom: 20px;">
                <button onclick="createSubgroup('${branchId}')" class="btn btn-success" style="width: 100%;">
                    <i class="fas fa-plus"></i> Create New Subgroup
                </button>
            </div>
            
            <div id="subgroupsList">
                ${subgroups.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: var(--text-light);">
                        <i class="fas fa-layer-group" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>
                        <p>No subgroups yet. Create the first one!</p>
                    </div>
                ` : subgroups.map(sg => `
                    <div class="subgroup-item" style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid ${getStatusColor(sg.studentCount, sg.maxStudents)};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 1rem;">${sg.name}</h4>
                                <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #64748b;">
                                    <span><i class="fas fa-users"></i> ${sg.studentCount || 0} / ${sg.maxStudents} students</span>
                                    <span><i class="fas fa-calendar"></i> ${new Date(sg.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="editSubgroup('${branchId}', '${sg._id}')" class="btn btn-small btn-secondary" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${sg.studentCount === 0 ? `
                                    <button onclick="deleteSubgroup('${branchId}', '${sg._id}')" class="btn btn-small btn-danger" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `);
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error managing subgroups:', error);
        showNotification('Failed to load subgroups', 'error');
    }
}

    function getStatusColor(current, max) {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return '#ef4444'; // Red - Full
    if (percentage >= 70) return '#f59e0b'; // Yellow - Nearly full
    return '#10b981'; // Green - Active
}

    // ==================== CREATE SUBGROUP ====================

    async function createSubgroup(branchId) {
    const branch = allBranchGroups.find(b => b._id === branchId);
    
    const modal = createModal(`Create New Subgroup for ${branch.displayName}`, `
        <form onsubmit="submitCreateSubgroup(event, '${branchId}')">
            <div class="form-group">
                <label>Subgroup Name</label>
                <input type="text" name="name" placeholder="Leave empty for auto-naming (e.g., IT GROUP 1)" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                <small style="color: var(--text-light); margin-top: 5px; display: block;">
                    If left empty, system will auto-generate: "${branch.displayName} GROUP X"
                </small>
            </div>
            
            <div class="form-group">
                <label>Max Students</label>
                <input type="number" name="maxStudents" value="30" min="1" required style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;">
                    <i class="fas fa-check"></i> Create Subgroup
                </button>
                <button type="button" onclick="closeModal()" class="btn btn-secondary" style="flex: 1;">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </form>
    `);
    
    modal.classList.add('active');
}

    async function submitCreateSubgroup(event, branchId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`${API_BASE}/${branchId}/subgroups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name: formData.get('name') || null,
                maxStudents: parseInt(formData.get('maxStudents'))
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create subgroup');
        }
        
        const result = await response.json();
        showNotification(result.message || 'Subgroup created successfully!', 'success');
        closeModal();
        await loadBranchGroups();
    } catch (error) {
        console.error('Error creating subgroup:', error);
        showNotification(error.message, 'error');
    }
}

    // ==================== EDIT SUBGROUP ====================

    async function editSubgroup(branchId, subgroupId) {
    try {
        const response = await fetch(`${API_BASE}/${branchId}/subgroups`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load subgroup');
        
        const subgroups = await response.json();
        const subgroup = subgroups.find(sg => sg._id === subgroupId);
        
        if (!subgroup) throw new Error('Subgroup not found');
        
        const modal = createModal('Edit Subgroup', `
            <form onsubmit="submitEditSubgroup(event, '${branchId}', '${subgroupId}')">
                <div class="form-group">
                    <label>Subgroup Name *</label>
                    <input type="text" name="name" value="${subgroup.name}" required style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                </div>
                
                <div class="form-group">
                    <label>Max Students *</label>
                    <input type="number" name="maxStudents" value="${subgroup.maxStudents}" min="1" required style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                </div>
                
                <div class="form-group">
                    <label>Status *</label>
                    <select name="status" required style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                        <option value="active" ${subgroup.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${subgroup.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="archived" ${subgroup.status === 'archived' ? 'selected' : ''}>Archived</option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button type="button" onclick="closeModal()" class="btn btn-secondary" style="flex: 1;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </form>
        `);
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading subgroup:', error);
        showNotification('Failed to load subgroup', 'error');
    }
}

    async function submitEditSubgroup(event, branchId, subgroupId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`${API_BASE}/${branchId}/subgroups/${subgroupId}`, {
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
        closeModal();
        await loadBranchGroups();
    } catch (error) {
        console.error('Error updating subgroup:', error);
        showNotification(error.message, 'error');
    }
}

    // ==================== DELETE SUBGROUP ====================

    async function deleteSubgroup(branchId, subgroupId) {
    if (!confirm('Are you sure you want to delete this subgroup? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${branchId}/subgroups/${subgroupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete subgroup');
        }
        
        showNotification('Subgroup deleted successfully!', 'success');
        closeModal();
        await loadBranchGroups();
    } catch (error) {
        console.error('Error deleting subgroup:', error);
        showNotification(error.message, 'error');
    }
}

    // ==================== ASSIGN STUDENT TO SUBGROUP ====================

    async function assignStudentToSubgroup(studentId, filiere) {
    try {
        // Find the branch group for this filiere
        const branchGroup = allBranchGroups.find(bg => bg.formation === filiere);
        if (!branchGroup) {
            throw new Error('Branch group not found for this subject');
        }
        
        // Load existing subgroups
        const response = await fetch(`${API_BASE}/${branchGroup._id}/subgroups`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load subgroups');
        
        const subgroups = await response.json();
        
        // If no subgroups exist, auto-create and assign
        if (subgroups.length === 0) {
            await autoAssignStudent(branchGroup._id, studentId);
            return;
        }
        
        // Show selection modal
        const modal = createModal('Select Subgroup', `
            <p style="margin-bottom: 20px; color: #64748b;">Choose a subgroup for this student:</p>
            <div style="max-height: 400px; overflow-y: auto;">
                ${subgroups.map(sg => `
                    <div onclick="confirmAssignment('${branchGroup._id}', '${studentId}', '${sg._id}')" 
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
                            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${getStatusColor(sg.studentCount, sg.maxStudents)};"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button onclick="closeModal()" class="btn btn-secondary" style="width: 100%; margin-top: 15px;">
                <i class="fas fa-times"></i> Cancel
            </button>
        `);
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error assigning student:', error);
        showNotification(error.message, 'error');
    }
}

    async function autoAssignStudent(branchId, studentId) {
    try {
        const response = await fetch(`${API_BASE}/${branchId}/assign-student`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ studentId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to assign student');
        }
        
        const result = await response.json();
        showNotification(`✅ Student assigned to ${result.subgroup.name}!`, 'success');
        await loadPendingAssignments();
        await loadBranchGroups();
    } catch (error) {
        console.error('Error auto-assigning student:', error);
        showNotification(error.message, 'error');
    }
}

    async function confirmAssignment(branchId, studentId, subgroupId) {
    try {
        const response = await fetch(`${API_BASE}/${branchId}/assign-student`, {
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
        
        const result = await response.json();
        showNotification(`✅ Student assigned to ${result.subgroup.name}!`, 'success');
        closeModal();
        await loadPendingAssignments();
        await loadBranchGroups();
    } catch (error) {
        console.error('Error assigning student:', error);
        showNotification(error.message, 'error');
    }
}

    // ==================== UTILITY FUNCTIONS ====================

    function createModal(title, content) {
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h2 style="margin: 0; color: #1e293b; font-size: 1.3rem;">${title}</h2>
                <button onclick="closeModal()" class="modal-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

    function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

    function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    // Define vibrant colors for clear visibility
    const colors = {
        success: { bg: '#10b981', icon: '✓', shadow: 'rgba(16, 185, 129, 0.4)' },
        error: { bg: '#ef4444', icon: '✕', shadow: 'rgba(239, 68, 68, 0.4)' },
        info: { bg: '#3b82f6', icon: 'ℹ', shadow: 'rgba(59, 130, 246, 0.4)' },
        warning: { bg: '#f59e0b', icon: '⚠', shadow: 'rgba(245, 158, 11, 0.4)' }
    };
    
    const style = colors[type] || colors.info;
    
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${style.bg};
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px ${style.shadow};
        z-index: 10000;
        font-size: 15px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
        min-width: 300px;
    `;
    
    notification.innerHTML = `
        <span style="font-size: 20px; font-weight: bold;">${style.icon}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

    // Make functions globally available
    window.manageBranchSubgroups = manageBranchSubgroups;
    window.createSubgroup = createSubgroup;
    window.submitCreateSubgroup = submitCreateSubgroup;
    window.editSubgroup = editSubgroup;
    window.submitEditSubgroup = submitEditSubgroup;
    window.deleteSubgroup = deleteSubgroup;
    window.assignStudentToSubgroup = assignStudentToSubgroup;
    window.confirmAssignment = confirmAssignment;
    window.closeModal = closeModal;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBranchManagement);
    } else {
        initBranchManagement();
    }

})(); // Close IIFE
