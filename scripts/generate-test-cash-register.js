/**
 * Generate Test Cash Register Data
 * Creates test transactions and overlapping (unpaid) services for the current month
 * 
 * - 25 Transactions (mix of income and expenses)
 * - 20 Overlapping/Unpaid Services
 * 
 * Run: node scripts/generate-test-cash-register.js
 * Cleanup: node scripts/cleanup-test-cash-register.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CashTransaction = require('../models/CashTransaction');
const UnpaidService = require('../models/UnpaidService');
const Admin = require('../models/Admin');

// Test data marker - all test entries will have this in remarks/description
const TEST_MARKER = '[TEST-DATA]';

// Sample names for realistic data
const FIRST_NAMES = ['Ahmed', 'Youssef', 'Omar', 'Karim', 'Hassan', 'Mehdi', 'Amine', 'Rachid', 'Samir', 'Khalid',
                     'Fatima', 'Aicha', 'Khadija', 'Salma', 'Nadia', 'Laila', 'Zineb', 'Houda', 'Samira', 'Meryem'];
const LAST_NAMES = ['Alaoui', 'Benali', 'Idrissi', 'Tazi', 'Fassi', 'Berrada', 'Chaoui', 'Amrani', 'Bennani', 'Lahlou',
                    'Kettani', 'Sqalli', 'Chraibi', 'Benjelloun', 'Filali', 'Sefrioui', 'Zniber', 'Belhaj', 'Ouazzani', 'Tahiri'];

// Income categories
const INCOME_CATEGORIES = [
    'Tuition Fees',
    'Registration Fees',
    'Late Fees',
    'Exam Fees',
    'Certificate Fees',
    'Other Income'
];

// Expense categories
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

// Service types for overlapping
const SERVICE_TYPES = [
    'CV Creation',
    'Translation Service',
    'Document Certification',
    'Visa Assistance',
    'Job Application Help',
    'Language Certificate',
    'Consultation',
    'Document Preparation'
];

// Helper functions
function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone() {
    return `+212 6${randomNumber(10, 99)} ${randomNumber(100, 999)} ${randomNumber(100, 999)}`;
}

function generateName() {
    return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

function randomDateThisMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = randomNumber(1, now.getDate());
    return new Date(year, month, day, randomNumber(8, 18), randomNumber(0, 59));
}

function randomDatePast(maxDaysBack = 60) {
    const date = new Date();
    date.setDate(date.getDate() - randomNumber(1, maxDaysBack));
    return date;
}

// Generate income transactions
async function generateIncomeTransactions(adminId, adminName) {
    console.log('💰 Generating income transactions...');
    const transactions = [];
    const now = new Date();
    
    // Tuition fees (main income)
    for (let i = 0; i < 8; i++) {
        const studentName = generateName();
        transactions.push({
            title: `Tuition Fee - ${studentName}`,
            amount: randomNumber(800, 2500),
            type: 'income',
            category: 'Tuition Fees',
            remarks: `${TEST_MARKER} Monthly tuition payment`,
            date: randomDateThisMonth(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            status: 'completed',
            addedBy: adminId,
            addedByName: adminName
        });
    }
    
    // Registration fees
    for (let i = 0; i < 4; i++) {
        const studentName = generateName();
        transactions.push({
            title: `Registration - ${studentName}`,
            amount: randomNumber(200, 500),
            type: 'income',
            category: 'Registration Fees',
            remarks: `${TEST_MARKER} New student registration`,
            date: randomDateThisMonth(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            status: 'completed',
            addedBy: adminId,
            addedByName: adminName
        });
    }
    
    // Other income
    for (let i = 0; i < 3; i++) {
        const category = randomElement(['Exam Fees', 'Certificate Fees', 'Late Fees', 'Other Income']);
        transactions.push({
            title: `${category} Payment`,
            amount: randomNumber(50, 300),
            type: 'income',
            category: category,
            remarks: `${TEST_MARKER} ${category.toLowerCase()} collected`,
            date: randomDateThisMonth(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            status: Math.random() > 0.2 ? 'completed' : 'pending',
            addedBy: adminId,
            addedByName: adminName
        });
    }
    
    const result = await CashTransaction.insertMany(transactions);
    console.log(`   ✅ Created ${result.length} income transactions`);
    return result.length;
}

// Generate expense transactions
async function generateExpenseTransactions(adminId, adminName) {
    console.log('💸 Generating expense transactions...');
    const transactions = [];
    const now = new Date();
    
    // Salaries
    transactions.push({
        title: 'Monthly Salaries',
        amount: randomNumber(15000, 25000),
        type: 'expense',
        category: 'Salaries',
        remarks: `${TEST_MARKER} Staff salaries for ${now.toLocaleString('default', { month: 'long' })}`,
        date: randomDateThisMonth(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: 'completed',
        addedBy: adminId,
        addedByName: adminName
    });
    
    // Teacher payments
    for (let i = 0; i < 3; i++) {
        const teacherName = generateName();
        transactions.push({
            title: `Teacher Payment - ${teacherName}`,
            amount: randomNumber(2000, 5000),
            type: 'expense',
            category: 'Teacher Payments',
            remarks: `${TEST_MARKER} Teaching hours payment`,
            date: randomDateThisMonth(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            status: 'completed',
            addedBy: adminId,
            addedByName: adminName
        });
    }
    
    // Rent
    transactions.push({
        title: 'Monthly Rent',
        amount: randomNumber(5000, 8000),
        type: 'expense',
        category: 'Rent',
        remarks: `${TEST_MARKER} Office rent for ${now.toLocaleString('default', { month: 'long' })}`,
        date: randomDateThisMonth(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: 'completed',
        addedBy: adminId,
        addedByName: adminName
    });
    
    // Utilities
    transactions.push({
        title: 'Utilities (Electric, Water, Internet)',
        amount: randomNumber(800, 1500),
        type: 'expense',
        category: 'Utilities',
        remarks: `${TEST_MARKER} Monthly utilities`,
        date: randomDateThisMonth(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: 'completed',
        addedBy: adminId,
        addedByName: adminName
    });
    
    // Other expenses
    const otherExpenses = ['Supplies', 'Equipment', 'Marketing', 'Maintenance', 'Transportation'];
    for (let i = 0; i < 4; i++) {
        const category = randomElement(otherExpenses);
        transactions.push({
            title: `${category} - ${['Office', 'School', 'Monthly', 'Weekly'][randomNumber(0, 3)]}`,
            amount: randomNumber(100, 1000),
            type: 'expense',
            category: category,
            remarks: `${TEST_MARKER} ${category.toLowerCase()} expense`,
            date: randomDateThisMonth(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            status: Math.random() > 0.1 ? 'completed' : 'pending',
            addedBy: adminId,
            addedByName: adminName
        });
    }
    
    const result = await CashTransaction.insertMany(transactions);
    console.log(`   ✅ Created ${result.length} expense transactions`);
    return result.length;
}

// Generate overlapping (unpaid) services
async function generateOverlappingServices(adminId, adminName) {
    console.log('📋 Generating overlapping/unpaid services...');
    const services = [];
    
    // Generate 20 unpaid services with varying ages
    for (let i = 0; i < 20; i++) {
        const clientName = generateName();
        const serviceType = randomElement(SERVICE_TYPES);
        const daysAgo = randomNumber(1, 60);
        const dateRequested = new Date();
        dateRequested.setDate(dateRequested.getDate() - daysAgo);
        
        // Determine status - most should be unpaid, some paid/cancelled
        let status = 'unpaid';
        let datePaid = null;
        let paidBy = null;
        let paidByName = null;
        
        if (i < 15) {
            // 15 unpaid
            status = 'unpaid';
        } else if (i < 18) {
            // 3 paid
            status = 'paid';
            datePaid = new Date();
            datePaid.setDate(datePaid.getDate() - randomNumber(0, daysAgo - 1));
            paidBy = adminId;
            paidByName = adminName;
        } else {
            // 2 cancelled
            status = 'cancelled';
        }
        
        services.push({
            clientName: clientName,
            phone: generatePhone(),
            serviceType: serviceType,
            amount: randomNumber(100, 800),
            description: `${TEST_MARKER} ${serviceType} requested by ${clientName}`,
            dateRequested: dateRequested,
            status: status,
            datePaid: datePaid,
            addedBy: adminId,
            addedByName: adminName,
            paidBy: paidBy,
            paidByName: paidByName
        });
    }
    
    const result = await UnpaidService.insertMany(services);
    console.log(`   ✅ Created ${result.length} overlapping services`);
    
    // Count by status
    const unpaidCount = services.filter(s => s.status === 'unpaid').length;
    const paidCount = services.filter(s => s.status === 'paid').length;
    const cancelledCount = services.filter(s => s.status === 'cancelled').length;
    console.log(`      - Unpaid: ${unpaidCount}, Paid: ${paidCount}, Cancelled: ${cancelledCount}`);
    
    return result.length;
}

// Main function
async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🏦 CASH REGISTER TEST DATA GENERATOR');
    console.log('='.repeat(60) + '\n');
    
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        process.exit(1);
    }
    
    try {
        await mongoose.connect(mongoUri);
        console.log('📦 Connected to MongoDB\n');
        
        // Get admin user for addedBy field
        const admin = await Admin.findOne({ role: { $in: ['super_admin', 'superadmin', 'admin'] } });
        if (!admin) {
            console.error('❌ No admin user found. Please create an admin first.');
            process.exit(1);
        }
        
        console.log(`👤 Using admin: ${admin.username}\n`);
        
        // Generate all test data
        const incomeCount = await generateIncomeTransactions(admin._id, admin.username);
        const expenseCount = await generateExpenseTransactions(admin._id, admin.username);
        const overlappingCount = await generateOverlappingServices(admin._id, admin.username);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`   Income transactions:     ${incomeCount}`);
        console.log(`   Expense transactions:    ${expenseCount}`);
        console.log(`   Overlapping services:    ${overlappingCount}`);
        console.log(`   TOTAL RECORDS:           ${incomeCount + expenseCount + overlappingCount}`);
        console.log('='.repeat(60));
        console.log('\n✅ Test data generation complete!');
        console.log('💡 To delete test data, run: node scripts/cleanup-test-cash-register.js\n');
        
    } catch (error) {
        console.error('❌ Error generating test data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
}

main();
