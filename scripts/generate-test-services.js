/**
 * Generate Test Service Requests
 * Creates 10 test requests for each service type:
 * - 10 Ausbildung applications
 * - 10 Arbeit applications
 * - 10 CV requests
 * - 10 Translation requests
 * 
 * Run: node scripts/generate-test-services.js
 * Cleanup: node scripts/cleanup-test-services.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const JobApplication = require('../models/JobApplication');
const ServiceRequest = require('../models/ServiceRequest');

// Test data marker - all test entries will have this in their email
const TEST_EMAIL_DOMAIN = '@testservice.nisrine.local';

// Sample German names for realistic data
const FIRST_NAMES = ['Hans', 'Klaus', 'Peter', 'Stefan', 'Michael', 'Thomas', 'Andreas', 'Markus', 'Christian', 'Daniel',
                     'Anna', 'Maria', 'Julia', 'Sarah', 'Laura', 'Lisa', 'Nina', 'Lena', 'Sophie', 'Emma'];
const LAST_NAMES = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
                    'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann'];

// Job fields
const JOB_FIELDS = ['pflege', 'verkaufer', 'gastronomie', 'fleischer', 'maurer', 'other'];

// Language levels
const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2'];

// Statuses for job applications
const JOB_STATUSES = ['new', 'erstgespraech', 'vorvertrag', 'interview', 'vertrag'];

// Statuses for service requests
const SERVICE_STATUSES = ['pending', 'in-progress', 'completed'];

// Languages for translation
const LANGUAGE_PAIRS = [
    'German → Arabic',
    'Arabic → German',
    'French → German',
    'German → French',
    'English → German',
    'German → English'
];

// Helper functions
function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone() {
    return `+212${Math.floor(600000000 + Math.random() * 99999999)}`;
}

function generateName() {
    return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

function generateEmail(name, index, type) {
    const cleanName = name.toLowerCase().replace(/\s+/g, '.').replace(/[äöüß]/g, c => 
        ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[c] || c));
    return `${cleanName}.${type}${index}${TEST_EMAIL_DOMAIN}`;
}

function randomDate(daysBack = 30) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date;
}

// Generate Ausbildung applications
async function generateAusbildungApplications() {
    console.log('📚 Generating 10 Ausbildung applications...');
    const applications = [];
    
    for (let i = 1; i <= 10; i++) {
        const name = generateName();
        applications.push({
            fullName: name,
            phone: generatePhone(),
            email: generateEmail(name, i, 'ausbildung'),
            applicationType: 'ausbildung',
            jobField: randomElement(JOB_FIELDS),
            status: randomElement(JOB_STATUSES),
            languageLevel: randomElement(LANGUAGE_LEVELS),
            hasDiploma: Math.random() > 0.5,
            diplomaType: Math.random() > 0.5 ? 'diploma' : 'certificate',
            experience: `${Math.floor(Math.random() * 5)} years experience in the field`,
            qualifications: 'Professional training completed',
            notes: 'Test data - auto generated',
            createdAt: randomDate(60)
        });
    }
    
    const result = await JobApplication.insertMany(applications);
    console.log(`   ✅ Created ${result.length} Ausbildung applications`);
    return result.length;
}

// Generate Arbeit applications
async function generateArbeitApplications() {
    console.log('💼 Generating 10 Arbeit applications...');
    const applications = [];
    
    for (let i = 1; i <= 10; i++) {
        const name = generateName();
        applications.push({
            fullName: name,
            phone: generatePhone(),
            email: generateEmail(name, i, 'arbeit'),
            applicationType: 'arbeit',
            jobField: randomElement(JOB_FIELDS),
            status: randomElement(JOB_STATUSES),
            languageLevel: randomElement(LANGUAGE_LEVELS),
            hasDiploma: Math.random() > 0.5,
            diplomaType: Math.random() > 0.5 ? 'diploma' : 'certificate',
            experience: `${Math.floor(Math.random() * 10)} years work experience`,
            qualifications: 'Certified professional',
            notes: 'Test data - auto generated',
            createdAt: randomDate(60)
        });
    }
    
    const result = await JobApplication.insertMany(applications);
    console.log(`   ✅ Created ${result.length} Arbeit applications`);
    return result.length;
}

// Generate CV requests
async function generateCVRequests() {
    console.log('📄 Generating 10 CV requests...');
    const requests = [];
    
    for (let i = 1; i <= 10; i++) {
        const name = generateName();
        requests.push({
            serviceType: 'cv',
            fullName: name,
            phone: generatePhone(),
            email: generateEmail(name, i, 'cv'),
            status: randomElement(SERVICE_STATUSES),
            cvDetails: {
                experience: `${Math.floor(Math.random() * 8)} years of professional experience`,
                education: 'Bachelor degree in relevant field',
                skills: 'Microsoft Office, Communication, Teamwork',
                notes: 'Test data - auto generated',
                documentCount: Math.floor(Math.random() * 3) + 1
            },
            notes: 'Test data - auto generated',
            createdAt: randomDate(45)
        });
    }
    
    const result = await ServiceRequest.insertMany(requests);
    console.log(`   ✅ Created ${result.length} CV requests`);
    return result.length;
}

// Generate Translation requests
async function generateTranslationRequests() {
    console.log('🌍 Generating 10 Translation requests...');
    const requests = [];
    
    for (let i = 1; i <= 10; i++) {
        const name = generateName();
        requests.push({
            serviceType: 'translation',
            fullName: name,
            phone: generatePhone(),
            email: generateEmail(name, i, 'translation'),
            status: randomElement(SERVICE_STATUSES),
            translationDetails: {
                languages: randomElement(LANGUAGE_PAIRS),
                documentType: randomElement(['Certificate', 'Diploma', 'ID Card', 'Birth Certificate', 'Contract']),
                pageCount: Math.floor(Math.random() * 10) + 1,
                urgency: randomElement(['normal', 'urgent', 'express']),
                notes: 'Test data - auto generated',
                documentCount: Math.floor(Math.random() * 5) + 1
            },
            notes: 'Test data - auto generated',
            createdAt: randomDate(45)
        });
    }
    
    const result = await ServiceRequest.insertMany(requests);
    console.log(`   ✅ Created ${result.length} Translation requests`);
    return result.length;
}

// Main function
async function main() {
    try {
        console.log('🚀 Starting Test Service Data Generation...\n');
        
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine';
        await mongoose.connect(mongoUri);
        console.log('📦 Connected to MongoDB\n');
        
        // Generate all test data
        const ausbildungCount = await generateAusbildungApplications();
        const arbeitCount = await generateArbeitApplications();
        const cvCount = await generateCVRequests();
        const translationCount = await generateTranslationRequests();
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 SUMMARY');
        console.log('='.repeat(50));
        console.log(`   Ausbildung applications: ${ausbildungCount}`);
        console.log(`   Arbeit applications:     ${arbeitCount}`);
        console.log(`   CV requests:             ${cvCount}`);
        console.log(`   Translation requests:    ${translationCount}`);
        console.log(`   TOTAL:                   ${ausbildungCount + arbeitCount + cvCount + translationCount}`);
        console.log('='.repeat(50));
        console.log('\n✅ Test data generation complete!');
        console.log('💡 To delete test data, run: node scripts/cleanup-test-services.js\n');
        
    } catch (error) {
        console.error('❌ Error generating test data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
}

main();
