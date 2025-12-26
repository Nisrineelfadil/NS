// Global Variables
let currentUser = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let currentChart = null;
let currentChartType = 'pie';
let yearlyChart = null;
let allTransactions = [];
let allCategories = [];

// Pagination state
const ITEMS_PER_PAGE = 8;
let transactionsPagination = { currentPage: 1, data: [] };
let overlappingPagination = { currentPage: 1, data: [] };

// Predefined Categories
const INCOME_CATEGORIES = [
    'Tuition Fees',
    'Registration Fees',
    'Late Fees',
    'Exam Fees',
    'Certificate Fees',
    'Other Income'
];

const EXPENSE_CATEGORIES = [
    'Salaries',
    'Teacher Payments',
    'Rent',
    'Utilities',
    'Supplies',
    'Equipment',
    'Marketing',
    'Maintenance',
    'Transportation',
    'Other Expenses'
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeTabs();
    initializeYearSelectors();
    initializeChartTypeButtons();
    loadCategories();
});

// Authentication
async function checkAuth() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        window.location.href = '/admin';
        return;
    }

    // Verify token and get user info from server
    try {
        const response = await fetch('/api/admin/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin';
            return;
        }
        
        // Store user info
        currentUser = {
            id: data.id,
            username: data.username,
            email: data.email,
            role: data.role
        };
        
        document.getElementById('userName').textContent = currentUser.username || 'Admin';

        // Show/hide tabs based on role
        if (currentUser.role === 'super_admin' || currentUser.role === 'superadmin' || currentUser.role === 'dev') {
            // Super admin sees everything: Dashboard, Transactions, Overlapping, Yearly Overview
            document.getElementById('yearlyTab').style.display = 'flex';
            document.getElementById('overlappingTab').style.display = 'flex';
            document.getElementById('exportSection').style.display = 'block';
            loadMonthData();
        } else {
            // Normal admin only sees: Transactions, Overlapping
            document.querySelector('[data-tab="dashboard"]').style.display = 'none';
            document.querySelector('[data-tab="yearly"]').style.display = 'none';
            document.getElementById('overlappingTab').style.display = 'flex';
            // Switch to transactions tab automatically
            switchTab('transactions');
        }
    } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('adminToken');
        window.location.href = '/admin';
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin';
}

// Tab Management
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });

    // Load data for the tab
    if (tabName === 'transactions') {
        loadTransactions();
    } else if (tabName === 'overlapping') {
        loadOverlappingServices();
    } else if (tabName === 'yearly') {
        loadYearlyData();
    }
}

// Year Selectors
function initializeYearSelectors() {
    const startYear = 2020;
    const endYear = currentYear + 1;
    
    const yearSelect = document.getElementById('yearSelect');
    const yearlyYearSelect = document.getElementById('yearlyYearSelect');
    
    for (let year = endYear; year >= startYear; year--) {
        const option1 = new Option(year, year);
        const option2 = new Option(year, year);
        yearSelect.add(option1);
        yearlyYearSelect.add(option2);
    }
    
    yearSelect.value = currentYear;
    yearlyYearSelect.value = currentYear;
    document.getElementById('monthSelect').value = currentMonth;
}

// Month Navigation
function changeMonth(delta) {
    currentMonth += delta;
    
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    
    document.getElementById('monthSelect').value = currentMonth;
    document.getElementById('yearSelect').value = currentYear;
    
    loadMonthData();
}

// Load Month Data
async function loadMonthData() {
    currentYear = parseInt(document.getElementById('yearSelect').value);
    currentMonth = parseInt(document.getElementById('monthSelect').value);
    
    try {
        // Load transactions
        const response = await fetch(
            `/api/cash-register/transactions?year=${currentYear}&month=${currentMonth}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            }
        );
        
        const data = await response.json();
        
        if (data.success) {
            allTransactions = data.transactions;
            
            // Load summary
            await loadMonthlySummary();
            
            // Load notes
            await loadMonthlyNotes();
            
            // Update chart
            updateChart();
            
            // Check if empty
            if (allTransactions.length === 0) {
                document.getElementById('emptyState').style.display = 'block';
                document.querySelector('.chart-container').style.display = 'none';
            } else {
                document.getElementById('emptyState').style.display = 'none';
                document.querySelector('.chart-container').style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error loading month data:', error);
        showNotification('Failed to load data', 'error');
    }
}

// Load Monthly Summary
async function loadMonthlySummary() {
    try {
        const response = await fetch(
            `/api/cash-register/summary/monthly?year=${currentYear}&month=${currentMonth}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            }
        );
        
        const data = await response.json();
        
        if (data.success) {
            const { summary, insights } = data;
            
            // Update summary cards
            document.getElementById('totalIncome').textContent = 
                `${summary.totalIncome.toFixed(2)} MAD`;
            document.getElementById('totalExpenses').textContent = 
                `${summary.totalExpenses.toFixed(2)} MAD`;
            
            const netResult = document.getElementById('netResult');
            netResult.textContent = `${summary.netResult >= 0 ? '+' : ''}${summary.netResult.toFixed(2)} MAD`;
            netResult.style.color = summary.isProfitable ? '#10b981' : '#ef4444';
            
            // Update top categories
            document.getElementById('topIncome').textContent = 
                summary.topIncomeSource 
                    ? `${summary.topIncomeSource.name} (${summary.topIncomeSource.amount.toFixed(2)} MAD)`
                    : 'No income recorded';
            
            document.getElementById('topExpense').textContent = 
                summary.topExpenseCategory 
                    ? `${summary.topExpenseCategory.name} (${summary.topExpenseCategory.amount.toFixed(2)} MAD)`
                    : 'No expenses recorded';
            
            // Update insights
            displayInsights(insights);
        }
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Display Insights
function displayInsights(insights) {
    const insightsList = document.getElementById('insightsList');
    
    if (!insights || insights.length === 0) {
        insightsList.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No insights available for this month.</p>';
        return;
    }
    
    insightsList.innerHTML = insights.map(insight => {
        const icon = insight.type === 'positive' ? '📈' : insight.type === 'negative' ? '📉' : '📊';
        return `
            <div class="insight-item ${insight.type}">
                <span style="font-size: 1.5rem;">${icon}</span>
                <span>${insight.message}</span>
            </div>
        `;
    }).join('');
}

// Chart Management
function initializeChartTypeButtons() {
    const chartTypeBtns = document.querySelectorAll('.chart-type-btn');
    chartTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chartTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentChartType = btn.dataset.type;
            updateChart();
        });
    });
}

function updateChart() {
    const filter = document.getElementById('chartFilter').value;
    
    let filteredTransactions = allTransactions;
    if (filter === 'income') {
        filteredTransactions = allTransactions.filter(t => t.type === 'income');
    } else if (filter === 'expense') {
        filteredTransactions = allTransactions.filter(t => t.type === 'expense');
    }
    
    if (filteredTransactions.length === 0) {
        if (currentChart) {
            currentChart.destroy();
            currentChart = null;
        }
        return;
    }
    
    // Group by category
    const categoryData = {};
    filteredTransactions.forEach(t => {
        if (!categoryData[t.category]) {
            categoryData[t.category] = { amount: 0, type: t.type };
        }
        categoryData[t.category].amount += t.amount;
    });
    
    const labels = Object.keys(categoryData);
    const amounts = Object.values(categoryData).map(d => d.amount);
    const colors = Object.values(categoryData).map(d => 
        d.type === 'income' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
    );
    
    const ctx = document.getElementById('mainChart');
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    const chartConfig = {
        type: currentChartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount (MAD)',
                data: amounts,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.toFixed(2)} MAD`;
                        }
                    }
                }
            },
            scales: currentChartType !== 'pie' ? {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            } : {}
        }
    };
    
    currentChart = new Chart(ctx, chartConfig);
}

// Monthly Notes
async function loadMonthlyNotes() {
    try {
        const response = await fetch(
            `/api/cash-register/notes/${currentYear}/${currentMonth}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            }
        );
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('monthlyNotes').value = data.note.note || '';
        }
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

async function saveNotes() {
    const note = document.getElementById('monthlyNotes').value;
    
    try {
        const response = await fetch('/api/cash-register/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                year: currentYear,
                month: currentMonth,
                note
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Notes saved successfully', 'success');
        } else {
            showNotification(data.message || 'Failed to save notes', 'error');
        }
    } catch (error) {
        console.error('Error saving notes:', error);
        showNotification('Failed to save notes', 'error');
    }
}

// Transactions Management
async function loadTransactions() {
    const year = currentYear;
    const month = currentMonth;
    const type = document.getElementById('typeFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    let url = `/api/cash-register/transactions?year=${year}&month=${month}`;
    if (type) url += `&type=${type}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (status) url += `&status=${status}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayTransactions(data.transactions);
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        showNotification('Failed to load transactions', 'error');
    }
}

function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    const paginationContainer = document.getElementById('transactionsPagination');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No transactions found</td></tr>';
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    // Store data and reset to page 1 if new data
    transactionsPagination.data = transactions;
    if (transactionsPagination.currentPage > Math.ceil(transactions.length / ITEMS_PER_PAGE)) {
        transactionsPagination.currentPage = 1;
    }
    
    renderTransactionsPage();
}

function renderTransactionsPage() {
    const tbody = document.getElementById('transactionsTableBody');
    const paginationContainer = document.getElementById('transactionsPagination');
    const transactions = transactionsPagination.data;
    const currentPage = transactionsPagination.currentPage;
    
    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = transactions.slice(startIndex, endIndex);
    
    tbody.innerHTML = pageData.map(t => {
        const typeIcon = t.type === 'income' ? '🟢' : '🔴';
        const statusClass = t.status === 'completed' ? 'completed' : 'pending';
        const hasReceipt = t.receiptImage && t.receiptImage.data;
        
        // Receipt action buttons
        const receiptButtons = hasReceipt ? `
            <button class="receipt-btn has-receipt" onclick="viewReceipt('${t._id}')" title="${translate('viewReceipt')}">
                <i class="fas fa-eye"></i>
            </button>
            <button class="receipt-btn" onclick="downloadReceipt('${t._id}')" title="${translate('downloadReceipt')}">
                <i class="fas fa-download"></i>
            </button>
        ` : `
            <button class="receipt-btn upload" onclick="openReceiptUpload('${t._id}')" title="${translate('uploadReceipt')}">
                <i class="fas fa-upload"></i>
            </button>
        `;
        
        return `
            <tr>
                <td>${new Date(t.date).toLocaleDateString()}</td>
                <td>
                    <span class="type-badge ${t.type}">
                        ${typeIcon} ${t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                    </span>
                </td>
                <td>${t.title}</td>
                <td>${t.category}</td>
                <td><strong>${t.amount.toFixed(2)} MAD</strong></td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${t.status === 'completed' ? '✓' : '⏳'} ${t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                </td>
                <td>${t.remarks || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button onclick="editTransaction('${t._id}')" title="${translate('edit')}">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${receiptButtons}
                        <button class="delete-btn" onclick="deleteTransaction('${t._id}')" title="${translate('delete')}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Render pagination
    if (paginationContainer && totalPages > 1) {
        paginationContainer.innerHTML = createPaginationHTML('transactions', currentPage, totalPages, transactions.length);
    } else if (paginationContainer) {
        paginationContainer.innerHTML = '';
    }
}

// Change transactions page
window.changeTransactionsPage = function(newPage) {
    const totalPages = Math.ceil(transactionsPagination.data.length / ITEMS_PER_PAGE);
    if (newPage < 1 || newPage > totalPages) return;
    transactionsPagination.currentPage = newPage;
    renderTransactionsPage();
}

// Categories
async function loadCategories() {
    try {
        const response = await fetch('/api/cash-register/categories', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allCategories = data.categories;
            updateCategoryFilter();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function updateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    allCategories.forEach(cat => {
        const option = new Option(cat, cat);
        categoryFilter.add(option);
    });
}

function updateCategoryOptions() {
    const type = document.getElementById('transactionType').value;
    const categorySelect = document.getElementById('transactionCategory');
    
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    
    categories.forEach(cat => {
        const option = new Option(cat, cat);
        categorySelect.add(option);
    });
    
    // Add custom option
    const customOption = new Option('+ Add Custom Category', 'custom');
    categorySelect.add(customOption);
    
    categorySelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            const customCategory = prompt('Enter custom category name:');
            if (customCategory) {
                const newOption = new Option(customCategory, customCategory);
                categorySelect.insertBefore(newOption, categorySelect.lastChild);
                categorySelect.value = customCategory;
            } else {
                categorySelect.value = '';
            }
        }
    });
}

// Modal Management
function openAddModal() {
    document.getElementById('modalTitle').textContent = translate('addTransactionTitle');
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionId').value = '';
    document.getElementById('transactionDate').valueAsDate = new Date();
    document.getElementById('transactionModal').classList.add('active');
}

async function editTransaction(id) {
    try {
        const response = await fetch(`/api/cash-register/transactions/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const t = data.transaction;
            
            document.getElementById('modalTitle').textContent = translate('editTransactionTitle');
            document.getElementById('transactionId').value = t._id;
            document.getElementById('transactionTitle').value = t.title;
            document.getElementById('transactionType').value = t.type;
            updateCategoryOptions();
            document.getElementById('transactionCategory').value = t.category;
            document.getElementById('transactionAmount').value = t.amount;
            document.getElementById('transactionDate').valueAsDate = new Date(t.date);
            document.getElementById('transactionStatus').value = t.status;
            document.getElementById('transactionRemarks').value = t.remarks || '';
            
            document.getElementById('transactionModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading transaction:', error);
        showNotification('Failed to load transaction', 'error');
    }
}

function closeModal() {
    document.getElementById('transactionModal').classList.remove('active');
}

async function saveTransaction(event) {
    event.preventDefault();
    
    const id = document.getElementById('transactionId').value;
    const formData = {
        title: document.getElementById('transactionTitle').value,
        type: document.getElementById('transactionType').value,
        category: document.getElementById('transactionCategory').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        date: document.getElementById('transactionDate').value,
        status: document.getElementById('transactionStatus').value,
        remarks: document.getElementById('transactionRemarks').value
    };
    
    try {
        const url = id 
            ? `/api/cash-register/transactions/${id}`
            : '/api/cash-register/transactions';
        
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(
                id ? 'Transaction updated successfully' : 'Transaction added successfully',
                'success'
            );
            closeModal();
            loadMonthData();
            loadTransactions();
        } else {
            showNotification(data.message || 'Failed to save transaction', 'error');
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        showNotification('Failed to save transaction', 'error');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/cash-register/transactions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Transaction deleted successfully', 'success');
            loadMonthData();
            loadTransactions();
        } else {
            showNotification(data.message || 'Failed to delete transaction', 'error');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showNotification('Failed to delete transaction', 'error');
    }
}

// Yearly Overview
async function loadYearlyData() {
    const year = parseInt(document.getElementById('yearlyYearSelect').value);
    const startMonth = parseInt(document.getElementById('startMonthSelect').value);
    const endMonth = parseInt(document.getElementById('endMonthSelect').value);
    
    // Validate month range
    if (startMonth > endMonth) {
        showNotification('Start month must be before or equal to end month', 'error');
        return;
    }
    
    try {
        const response = await fetch(
            `/api/cash-register/summary/yearly?year=${year}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            }
        );
        
        const data = await response.json();
        
        if (data.success) {
            // Filter overview by month range
            const filteredOverview = data.overview.filter(m => 
                m.month >= startMonth && m.month <= endMonth
            );
            displayYearlyOverview(filteredOverview, startMonth, endMonth);
        }
    } catch (error) {
        console.error('Error loading yearly data:', error);
        showNotification('Failed to load yearly data', 'error');
    }
}

function resetYearlyFilter() {
    document.getElementById('startMonthSelect').value = '1';
    document.getElementById('endMonthSelect').value = '12';
    loadYearlyData();
}

function displayYearlyOverview(overview, startMonth = 1, endMonth = 12) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Update titles to show selected range
    const rangeText = startMonth === 1 && endMonth === 12 
        ? translate('totalAnnualIncome').replace(' Income', '').replace(' Revenu', '').replace(' الدخل', '').replace('einnahmen', '')
        : `${monthNames[startMonth - 1]} - ${monthNames[endMonth - 1]}`;
    
    document.getElementById('incomeTitle').textContent = startMonth === 1 && endMonth === 12 
        ? translate('totalAnnualIncome') 
        : `${rangeText} ${translate('income')}`;
    document.getElementById('expensesTitle').textContent = startMonth === 1 && endMonth === 12 
        ? translate('totalAnnualExpenses') 
        : `${rangeText} ${translate('expense')}`;
    document.getElementById('netTitle').textContent = startMonth === 1 && endMonth === 12 
        ? translate('annualNetResult') 
        : `${rangeText} ${translate('netResult')}`;
    
    // Calculate totals for the selected range
    const totalIncome = overview.reduce((sum, m) => sum + m.totalIncome, 0);
    const totalExpenses = overview.reduce((sum, m) => sum + m.totalExpenses, 0);
    const netResult = totalIncome - totalExpenses;
    
    document.getElementById('yearlyIncome').textContent = `${totalIncome.toFixed(2)} MAD`;
    document.getElementById('yearlyExpenses').textContent = `${totalExpenses.toFixed(2)} MAD`;
    
    const yearlyNet = document.getElementById('yearlyNet');
    yearlyNet.textContent = `${netResult >= 0 ? '+' : ''}${netResult.toFixed(2)} MAD`;
    yearlyNet.style.color = netResult >= 0 ? '#10b981' : '#ef4444';
    
    // Update chart
    updateYearlyChart(overview);
    
    // Update timeline
    updateCashFlowTimeline(overview);
}

function updateYearlyChart(overview) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const labels = overview.map(m => monthNames[m.month - 1]);
    const incomeData = overview.map(m => m.totalIncome);
    const expenseData = overview.map(m => m.totalExpenses);
    const netData = overview.map(m => m.netResult);
    
    const ctx = document.getElementById('yearlyChart');
    
    if (yearlyChart) {
        yearlyChart.destroy();
    }
    
    yearlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Net Result',
                    data: netData,
                    borderColor: 'rgba(255, 204, 0, 1)',
                    backgroundColor: 'rgba(255, 204, 0, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

function updateCashFlowTimeline(overview) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const timeline = document.getElementById('cashFlowTimeline');
    
    timeline.innerHTML = overview.map((m, index) => {
        let trend = '';
        if (index > 0) {
            const prevNet = overview[index - 1].netResult;
            const currentNet = m.netResult;
            const change = ((currentNet - prevNet) / Math.abs(prevNet || 1)) * 100;
            
            if (Math.abs(change) > 5) {
                const arrow = change > 0 ? '↑' : '↓';
                const trendClass = change > 0 ? 'up' : 'down';
                trend = `<div class="trend ${trendClass}">${arrow} ${Math.abs(change).toFixed(1)}%</div>`;
            }
        }
        
        return `
            <div class="timeline-item">
                <h4>${monthNames[m.month - 1]}</h4>
                <div class="flow-income">🟢 +${m.totalIncome.toFixed(0)} MAD</div>
                <div class="flow-expense">🔴 -${m.totalExpenses.toFixed(0)} MAD</div>
                ${trend}
            </div>
        `;
    }).join('');
}

// PDF Export
async function exportPDF() {
    if (currentUser.role !== 'super_admin' && currentUser.role !== 'superadmin' && currentUser.role !== 'dev') {
        showNotification('Only super admin can export PDF', 'error');
        return;
    }
    
    try {
        const response = await fetch(
            `/api/cash-register/export/pdf?year=${currentYear}&month=${currentMonth}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            }
        );
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Cash_Register_${currentYear}_${currentMonth}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('PDF exported successfully', 'success');
        } else {
            showNotification('Failed to export PDF', 'error');
        }
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showNotification('Failed to export PDF', 'error');
    }
}

// Notifications
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

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==================== OVERLAPPING FUNCTIONS ====================

// Load overlapping services
async function loadOverlappingServices() {
    const status = document.getElementById('overlappingStatusFilter')?.value || 'unpaid';
    const search = document.getElementById('overlappingSearch')?.value || '';
    
    let url = `/api/overlapping?status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayOverlappingServices(data.services);
            loadOverlappingStats();
        }
    } catch (error) {
        console.error('Error loading overlapping services:', error);
        showNotification('Failed to load services', 'error');
    }
}

// Display overlapping services in table
function displayOverlappingServices(services) {
    const tbody = document.getElementById('overlappingTableBody');
    const paginationContainer = document.getElementById('overlappingPaginationContainer');
    
    if (!services || services.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="loading">${translate('noServicesFound')}</td></tr>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    // Store data and reset to page 1 if new data
    overlappingPagination.data = services;
    if (overlappingPagination.currentPage > Math.ceil(services.length / ITEMS_PER_PAGE)) {
        overlappingPagination.currentPage = 1;
    }
    
    renderOverlappingPage();
}

function renderOverlappingPage() {
    const tbody = document.getElementById('overlappingTableBody');
    const paginationContainer = document.getElementById('overlappingPaginationContainer');
    const services = overlappingPagination.data;
    const currentPage = overlappingPagination.currentPage;
    
    const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = services.slice(startIndex, endIndex);
    
    tbody.innerHTML = pageData.map(s => {
        const statusClass = s.status;
        const statusIcon = s.status === 'paid' ? '✓' : s.status === 'cancelled' ? '✕' : '⏳';
        
        // Age badge color based on category
        let ageBadgeClass = 'age-recent';
        if (s.ageCategory === 'very_old') ageBadgeClass = 'age-very-old';
        else if (s.ageCategory === 'old') ageBadgeClass = 'age-old';
        else if (s.ageCategory === 'moderate') ageBadgeClass = 'age-moderate';
        
        const ageText = s.ageDays === 1 ? '1 day' : `${s.ageDays} days`;
        
        // Action buttons based on status
        let actionButtons = '';
        if (s.status === 'unpaid') {
            actionButtons = `
                <button class="action-btn mark-paid-btn" onclick="markAsPaid('${s._id}')" title="${translate('markAsPaid')}">
                    <i class="fas fa-check"></i>
                </button>
                <button class="action-btn call-btn" onclick="callClient('${s.phone}')" title="${translate('call')}">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editOverlappingService('${s._id}')" title="${translate('edit')}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn cancel-btn" onclick="cancelService('${s._id}')" title="${translate('cancelService')}">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else {
            actionButtons = `
                <button class="action-btn delete-btn" onclick="deleteOverlappingService('${s._id}')" title="${translate('delete')}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        
        return `
            <tr class="${s.status !== 'unpaid' ? 'row-faded' : ''}">
                <td><strong>${s.clientName}</strong></td>
                <td>
                    <a href="tel:${s.phone}" class="phone-link">${s.phone}</a>
                </td>
                <td>${s.serviceType}</td>
                <td><strong>${s.amount.toFixed(2)} MAD</strong></td>
                <td>${new Date(s.dateRequested).toLocaleDateString()}</td>
                <td>
                    <span class="age-badge ${ageBadgeClass}">${ageText}</span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusIcon} ${translate(s.status)}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Render pagination
    if (paginationContainer && totalPages > 1) {
        paginationContainer.innerHTML = createPaginationHTML('overlapping', currentPage, totalPages, services.length);
    } else if (paginationContainer) {
        paginationContainer.innerHTML = '';
    }
}

// Change overlapping page
window.changeOverlappingPage = function(newPage) {
    const totalPages = Math.ceil(overlappingPagination.data.length / ITEMS_PER_PAGE);
    if (newPage < 1 || newPage > totalPages) return;
    overlappingPagination.currentPage = newPage;
    renderOverlappingPage();
}

// Load overlapping stats
async function loadOverlappingStats() {
    try {
        const response = await fetch('/api/overlapping/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const { stats } = data;
            
            document.getElementById('unpaidCount').textContent = stats.unpaid.count;
            document.getElementById('unpaidAmount').textContent = `${stats.unpaid.totalAmount.toFixed(2)} MAD`;
            
            document.getElementById('paidCount').textContent = stats.paid.count;
            document.getElementById('paidAmount').textContent = `${stats.paid.totalAmount.toFixed(2)} MAD`;
            
            document.getElementById('totalPendingAmount').textContent = `${stats.unpaid.totalAmount.toFixed(2)} MAD`;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Open overlapping modal for adding
function openOverlappingModal() {
    document.getElementById('overlappingModalTitle').textContent = translate('addUnpaidService');
    document.getElementById('overlappingForm').reset();
    document.getElementById('overlappingId').value = '';
    document.getElementById('serviceDate').valueAsDate = new Date();
    document.getElementById('overlappingModal').classList.add('active');
}

// Edit overlapping service
async function editOverlappingService(id) {
    try {
        const response = await fetch(`/api/overlapping/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const s = data.service;
            
            document.getElementById('overlappingModalTitle').textContent = translate('editUnpaidService');
            document.getElementById('overlappingId').value = s._id;
            document.getElementById('clientName').value = s.clientName;
            document.getElementById('clientPhone').value = s.phone;
            document.getElementById('serviceType').value = s.serviceType;
            document.getElementById('serviceAmount').value = s.amount;
            document.getElementById('serviceDate').valueAsDate = new Date(s.dateRequested);
            document.getElementById('serviceDescription').value = s.description || '';
            
            document.getElementById('overlappingModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading service:', error);
        showNotification('Failed to load service', 'error');
    }
}

// Close overlapping modal
function closeOverlappingModal() {
    document.getElementById('overlappingModal').classList.remove('active');
}

// Save overlapping service
async function saveOverlappingService(event) {
    event.preventDefault();
    
    const id = document.getElementById('overlappingId').value;
    const formData = {
        clientName: document.getElementById('clientName').value,
        phone: document.getElementById('clientPhone').value,
        serviceType: document.getElementById('serviceType').value,
        amount: parseFloat(document.getElementById('serviceAmount').value),
        dateRequested: document.getElementById('serviceDate').value,
        description: document.getElementById('serviceDescription').value
    };
    
    try {
        const url = id ? `/api/overlapping/${id}` : '/api/overlapping';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(
                id ? translate('serviceUpdated') : translate('serviceAdded'),
                'success'
            );
            closeOverlappingModal();
            loadOverlappingServices();
        } else {
            showNotification(data.message || 'Failed to save service', 'error');
        }
    } catch (error) {
        console.error('Error saving service:', error);
        showNotification('Failed to save service', 'error');
    }
}

// Mark service as paid
async function markAsPaid(id) {
    if (!confirm(translate('confirmMarkPaid'))) {
        return;
    }
    
    try {
        const response = await fetch(`/api/overlapping/${id}/mark-paid`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(translate('markedAsPaid'), 'success');
            loadOverlappingServices();
        } else {
            showNotification(data.message || 'Failed to mark as paid', 'error');
        }
    } catch (error) {
        console.error('Error marking as paid:', error);
        showNotification('Failed to mark as paid', 'error');
    }
}

// Cancel service
async function cancelService(id) {
    if (!confirm(translate('confirmCancelService'))) {
        return;
    }
    
    try {
        const response = await fetch(`/api/overlapping/${id}/cancel`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(translate('serviceCancelled'), 'success');
            loadOverlappingServices();
        } else {
            showNotification(data.message || 'Failed to cancel service', 'error');
        }
    } catch (error) {
        console.error('Error cancelling service:', error);
        showNotification('Failed to cancel service', 'error');
    }
}

// Delete overlapping service
async function deleteOverlappingService(id) {
    if (!confirm(translate('confirmDeleteService'))) {
        return;
    }
    
    try {
        const response = await fetch(`/api/overlapping/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(translate('serviceDeleted'), 'success');
            loadOverlappingServices();
        } else {
            showNotification(data.message || 'Failed to delete service', 'error');
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        showNotification('Failed to delete service', 'error');
    }
}

// Call client (opens phone dialer)
function callClient(phone) {
    window.location.href = `tel:${phone}`;
}

// ==================== RECEIPT FUNCTIONS ====================

let currentReceiptTransactionId = null;
let selectedReceiptFile = null;

// Open receipt upload modal
function openReceiptUpload(transactionId) {
    currentReceiptTransactionId = transactionId;
    document.getElementById('receiptTransactionId').value = transactionId;
    document.getElementById('receiptUploadModal').classList.add('active');
    clearReceiptFile();
    initReceiptDropZone();
}

// Close receipt upload modal
function closeReceiptUploadModal() {
    document.getElementById('receiptUploadModal').classList.remove('active');
    currentReceiptTransactionId = null;
    selectedReceiptFile = null;
}

// Initialize drag and drop for receipt upload
function initReceiptDropZone() {
    const dropZone = document.getElementById('receiptDropZone');
    const fileInput = document.getElementById('receiptFileInput');
    
    // Click to select file
    dropZone.onclick = () => fileInput.click();
    
    // File input change
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            handleReceiptFile(e.target.files[0]);
        }
    };
    
    // Drag and drop events
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    };
    
    dropZone.ondragleave = () => {
        dropZone.classList.remove('dragover');
    };
    
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleReceiptFile(e.dataTransfer.files[0]);
        }
    };
}

// Handle selected receipt file
function handleReceiptFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
        showNotification(translate('invalidFileType'), 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification(translate('fileTooLarge'), 'error');
        return;
    }
    
    selectedReceiptFile = file;
    
    // Show preview
    const preview = document.getElementById('receiptFilePreview');
    const dropZone = document.getElementById('receiptDropZone');
    const previewThumb = document.getElementById('receiptPreviewThumb');
    const previewName = document.getElementById('receiptPreviewName');
    
    previewName.textContent = file.name;
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewThumb.src = e.target.result;
            previewThumb.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewThumb.src = '';
        previewThumb.style.display = 'none';
    }
    
    dropZone.style.display = 'none';
    preview.style.display = 'flex';
    document.getElementById('uploadReceiptBtn').disabled = false;
}

// Clear selected receipt file
function clearReceiptFile() {
    selectedReceiptFile = null;
    document.getElementById('receiptFileInput').value = '';
    document.getElementById('receiptFilePreview').style.display = 'none';
    document.getElementById('receiptDropZone').style.display = 'flex';
    document.getElementById('uploadReceiptBtn').disabled = true;
}

// Submit receipt upload
async function submitReceiptUpload(event) {
    event.preventDefault();
    
    if (!selectedReceiptFile || !currentReceiptTransactionId) {
        showNotification(translate('noFileSelected'), 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('receipt', selectedReceiptFile);
    
    const uploadBtn = document.getElementById('uploadReceiptBtn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + translate('uploading');
    
    try {
        const response = await fetch(`/api/cash-register/transactions/${currentReceiptTransactionId}/receipt`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(translate('receiptUploaded'), 'success');
            closeReceiptUploadModal();
            loadTransactions();
        } else {
            showNotification(data.message || translate('uploadFailed'), 'error');
        }
    } catch (error) {
        console.error('Error uploading receipt:', error);
        showNotification(translate('uploadFailed'), 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> ' + translate('upload');
    }
}

// View receipt in modal
async function viewReceipt(transactionId) {
    currentReceiptTransactionId = transactionId;
    
    const modal = document.getElementById('receiptModal');
    const loading = document.getElementById('receiptLoading');
    const image = document.getElementById('receiptPreviewImage');
    const pdf = document.getElementById('receiptPreviewPdf');
    
    // Reset and show loading
    image.style.display = 'none';
    pdf.style.display = 'none';
    loading.style.display = 'flex';
    modal.classList.add('active');
    
    try {
        const response = await fetch(`/api/cash-register/transactions/${transactionId}/receipt`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const receipt = data.receipt;
            
            // Update info
            document.getElementById('receiptFileName').textContent = receipt.fileName || '-';
            document.getElementById('receiptUploadedBy').textContent = receipt.uploadedByName || '-';
            document.getElementById('receiptUploadedAt').textContent = receipt.uploadedAt 
                ? new Date(receipt.uploadedAt).toLocaleString() 
                : '-';
            
            // Show image or PDF
            loading.style.display = 'none';
            
            if (receipt.mimeType === 'application/pdf') {
                pdf.src = `data:application/pdf;base64,${receipt.data}`;
                pdf.style.display = 'block';
            } else {
                image.src = `data:${receipt.mimeType};base64,${receipt.data}`;
                image.style.display = 'block';
            }
        } else {
            showNotification(data.message || translate('receiptNotFound'), 'error');
            closeReceiptModal();
        }
    } catch (error) {
        console.error('Error loading receipt:', error);
        showNotification(translate('loadReceiptFailed'), 'error');
        closeReceiptModal();
    }
}

// Close receipt preview modal
function closeReceiptModal() {
    document.getElementById('receiptModal').classList.remove('active');
    document.getElementById('receiptPreviewImage').src = '';
    document.getElementById('receiptPreviewPdf').src = '';
    currentReceiptTransactionId = null;
}

// Download receipt
function downloadReceipt(transactionId) {
    const url = `/api/cash-register/transactions/${transactionId}/receipt/download`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    
    // Add auth header via fetch and create blob URL
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => response.blob())
    .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    })
    .catch(error => {
        console.error('Error downloading receipt:', error);
        showNotification(translate('downloadFailed'), 'error');
    });
}

// Download current receipt from modal
function downloadCurrentReceipt() {
    if (currentReceiptTransactionId) {
        downloadReceipt(currentReceiptTransactionId);
    }
}

// Create pagination HTML (matching system design)
function createPaginationHTML(type, currentPage, totalPages, totalItems) {
    const maxVisiblePages = 5;
    const changeFn = type === 'transactions' ? 'changeTransactionsPage' : 'changeOverlappingPage';
    
    let html = '<div class="cash-pagination">';
    
    // Previous button
    html += `
        <button class="pagination-nav-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="${changeFn}(${currentPage - 1})"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Previous
        </button>
    `;
    
    // Calculate which pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page + ellipsis
    if (startPage > 1) {
        html += `<button class="pagination-page-btn" onclick="${changeFn}(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-page-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="${changeFn}(${i})">${i}</button>
        `;
    }
    
    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button class="pagination-page-btn" onclick="${changeFn}(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `
        <button class="pagination-nav-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                onclick="${changeFn}(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled' : ''}>
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += '</div>';
    return html;
}

// Delete receipt from current transaction
async function deleteCurrentReceipt() {
    if (!currentReceiptTransactionId) return;
    
    if (!confirm(translate('confirmDeleteReceipt'))) {
        return;
    }
    
    try {
        const response = await fetch(`/api/cash-register/transactions/${currentReceiptTransactionId}/receipt`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(translate('receiptDeleted'), 'success');
            closeReceiptModal();
            loadTransactions();
        } else {
            showNotification(data.message || translate('deleteFailed'), 'error');
        }
    } catch (error) {
        console.error('Error deleting receipt:', error);
        showNotification(translate('deleteFailed'), 'error');
    }
}
