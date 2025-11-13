/**
 * MongoDB Capacity Calculator for School System
 * Interactive tool to calculate database capacity based on your specific needs
 */

class MongoDBCapacityCalculator {
  constructor(maxDatabaseSizeGB = 10) {
    this.maxDatabaseSizeGB = maxDatabaseSizeGB;
    this.maxDatabaseSizeMB = maxDatabaseSizeGB * 1024;
    this.indexOverhead = 0.50; // 50% overhead for indexes
    this.systemReserved = 0.05; // 5% reserved for system operations
    
    // Data size constants (in KB unless specified)
    this.sizes = {
      student: {
        metadata: 15, // KB
        pdfAverage: 5 * 1024, // 5 MB in KB
        pdfSmall: 2 * 1024, // 2 MB
        pdfLarge: 10 * 1024, // 10 MB
        gridFSOverhead: 1.01 // 1% overhead
      },
      teacher: {
        metadata: 8 // KB
      },
      admin: {
        metadata: 12 // KB
      },
      applicant: {
        metadata: 5, // KB
        documentAverage: 5 * 1024 // 5 MB in KB
      }
    };
  }

  /**
   * Calculate usable storage after overhead
   */
  getUsableStorage() {
    const afterIndex = this.maxDatabaseSizeMB / (1 + this.indexOverhead);
    const afterSystem = afterIndex * (1 - this.systemReserved);
    return {
      totalMB: this.maxDatabaseSizeMB,
      afterIndexMB: afterIndex,
      usableMB: afterSystem,
      usableGB: afterSystem / 1024
    };
  }

  /**
   * Calculate storage for a single student
   */
  calculateStudentSize(pdfsPerStudent = 1, pdfSizeMB = 5) {
    const metadataKB = this.sizes.student.metadata;
    const pdfSizeKB = pdfSizeMB * 1024 * this.sizes.student.gridFSOverhead;
    const totalKB = metadataKB + (pdfSizeKB * pdfsPerStudent);
    
    return {
      metadataKB,
      pdfSizeKB: pdfSizeKB * pdfsPerStudent,
      totalKB,
      totalMB: totalKB / 1024
    };
  }

  /**
   * Calculate maximum capacity for different scenarios
   */
  calculateMaxCapacity(config = {}) {
    const {
      pdfsPerStudent = 1,
      pdfSizeMB = 5,
      pdfsPerApplicant = 1,
      applicantPdfSizeMB = 5,
      studentAllocationPercent = 70,
      applicantAllocationPercent = 20,
      staffAllocationPercent = 10
    } = config;

    const usable = this.getUsableStorage();
    
    // Allocate storage
    const studentStorageMB = usable.usableMB * (studentAllocationPercent / 100);
    const applicantStorageMB = usable.usableMB * (applicantAllocationPercent / 100);
    const staffStorageMB = usable.usableMB * (staffAllocationPercent / 100);

    // Calculate student capacity
    const studentSize = this.calculateStudentSize(pdfsPerStudent, pdfSizeMB);
    const maxStudents = Math.floor((studentStorageMB * 1024) / studentSize.totalKB);

    // Calculate applicant capacity
    const applicantMetadataKB = this.sizes.applicant.metadata;
    const applicantPdfKB = applicantPdfSizeMB * 1024 * this.sizes.student.gridFSOverhead;
    const applicantTotalKB = applicantMetadataKB + (applicantPdfKB * pdfsPerApplicant);
    const maxApplicants = Math.floor((applicantStorageMB * 1024) / applicantTotalKB);

    // Calculate staff capacity (typically not a bottleneck)
    const maxTeachers = Math.floor((staffStorageMB * 1024 * 0.6) / this.sizes.teacher.metadata);
    const maxAdmins = Math.floor((staffStorageMB * 1024 * 0.4) / this.sizes.admin.metadata);

    return {
      storage: usable,
      allocation: {
        studentMB: studentStorageMB,
        applicantMB: applicantStorageMB,
        staffMB: staffStorageMB
      },
      capacity: {
        students: maxStudents,
        applicants: maxApplicants,
        teachers: maxTeachers,
        admins: maxAdmins
      },
      perRecord: {
        studentMB: studentSize.totalMB,
        applicantMB: applicantTotalKB / 1024
      }
    };
  }

  /**
   * Calculate progressive fill analysis
   */
  calculateProgressiveFill(targetStudents, pdfsPerStudent = 1, pdfSizeMB = 5) {
    const studentSize = this.calculateStudentSize(pdfsPerStudent, pdfSizeMB);
    const usable = this.getUsableStorage();
    const steps = 10;
    const increment = Math.ceil(targetStudents / steps);
    
    const results = [];
    for (let i = increment; i <= targetStudents; i += increment) {
      const metadataMB = (i * studentSize.metadataKB) / 1024;
      const pdfsMB = (i * studentSize.pdfSizeKB) / 1024;
      const totalMB = (i * studentSize.totalKB) / 1024;
      const totalWithOverhead = totalMB * (1 + this.indexOverhead);
      const percentUsed = (totalWithOverhead / this.maxDatabaseSizeMB) * 100;
      
      results.push({
        students: i,
        metadataMB: metadataMB.toFixed(2),
        pdfsMB: pdfsMB.toFixed(2),
        totalMB: totalMB.toFixed(2),
        withOverheadMB: totalWithOverhead.toFixed(2),
        percentUsed: percentUsed.toFixed(2),
        remainingMB: (this.maxDatabaseSizeMB - totalWithOverhead).toFixed(2)
      });
    }
    
    return results;
  }

  /**
   * Generate capacity comparison table
   */
  generateComparisonTable() {
    const scenarios = [
      { name: 'Light (0.5 PDF/student)', pdfs: 0.5, size: 5 },
      { name: 'Standard (1 PDF/student)', pdfs: 1, size: 5 },
      { name: 'Heavy (2 PDFs/student)', pdfs: 2, size: 5 },
      { name: 'Very Heavy (3 PDFs/student)', pdfs: 3, size: 5 },
      { name: 'Large Files (1 PDF @ 10MB)', pdfs: 1, size: 10 },
      { name: 'Compressed (1 PDF @ 2MB)', pdfs: 1, size: 2 }
    ];

    const results = scenarios.map(scenario => {
      const capacity = this.calculateMaxCapacity({
        pdfsPerStudent: scenario.pdfs,
        pdfSizeMB: scenario.size
      });
      
      return {
        scenario: scenario.name,
        maxStudents: capacity.capacity.students,
        maxApplicants: capacity.capacity.applicants,
        storagePerStudent: capacity.perRecord.studentMB.toFixed(3) + ' MB',
        totalCapacityGB: ((capacity.capacity.students * capacity.perRecord.studentMB) / 1024).toFixed(2)
      };
    });

    return results;
  }

  /**
   * Calculate when to scale based on growth rate
   */
  calculateScalingTimeline(currentStudents, monthlyGrowthRate, pdfsPerStudent = 1) {
    const capacity = this.calculateMaxCapacity({ pdfsPerStudent });
    const maxStudents = capacity.capacity.students;
    const safeThreshold = maxStudents * 0.60; // 60% capacity
    const warningThreshold = maxStudents * 0.80; // 80% capacity
    
    let students = currentStudents;
    let month = 0;
    const timeline = [];
    
    while (students < maxStudents && month < 36) { // Max 3 years projection
      month++;
      students += monthlyGrowthRate;
      
      const percentUsed = (students / maxStudents) * 100;
      let status = 'OK';
      let action = 'Continue monitoring';
      
      if (students >= maxStudents) {
        status = 'CRITICAL';
        action = 'Database full - immediate action required';
      } else if (students >= warningThreshold) {
        status = 'WARNING';
        action = 'Plan scaling within 1-2 months';
      } else if (students >= safeThreshold) {
        status = 'CAUTION';
        action = 'Begin planning for scaling';
      }
      
      // Only record significant milestones
      if (month === 1 || month % 3 === 0 || status !== 'OK') {
        timeline.push({
          month,
          students: Math.floor(students),
          percentUsed: percentUsed.toFixed(1),
          status,
          action
        });
      }
      
      if (students >= maxStudents) break;
    }
    
    return {
      maxCapacity: maxStudents,
      safeThreshold: Math.floor(safeThreshold),
      warningThreshold: Math.floor(warningThreshold),
      timeline
    };
  }

  /**
   * Generate recommendations based on current usage
   */
  generateRecommendations(currentStudents, pdfsPerStudent = 1) {
    const capacity = this.calculateMaxCapacity({ pdfsPerStudent });
    const maxStudents = capacity.capacity.students;
    const percentUsed = (currentStudents / maxStudents) * 100;
    
    const recommendations = [];
    
    if (percentUsed < 40) {
      recommendations.push({
        priority: 'LOW',
        action: 'Current capacity is sufficient',
        details: 'Continue monitoring. Set up alerts at 60% capacity.'
      });
    } else if (percentUsed < 60) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Begin capacity planning',
        details: 'Implement document compression and archival policies. Consider upgrade path.'
      });
    } else if (percentUsed < 80) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Plan immediate scaling',
        details: 'Upgrade to larger cluster or implement hybrid storage within 1-2 months.'
      });
    } else {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Emergency scaling required',
        details: 'Immediate action needed. Consider temporary document archival to external storage.'
      });
    }
    
    // Additional recommendations
    recommendations.push({
      priority: 'OPTIMIZATION',
      action: 'Implement document compression',
      details: `Compressing PDFs from 5MB to 2MB would increase capacity from ${maxStudents} to ${Math.floor(maxStudents * 2.5)} students.`
    });
    
    recommendations.push({
      priority: 'ARCHITECTURE',
      action: 'Consider hybrid storage',
      details: 'Move old documents to S3/Azure Blob Storage. Keep only recent documents in MongoDB.'
    });
    
    if (percentUsed > 50) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Set up monitoring alerts',
        details: 'Configure alerts at 70%, 80%, and 90% capacity thresholds.'
      });
    }
    
    return {
      currentUsage: {
        students: currentStudents,
        maxStudents,
        percentUsed: percentUsed.toFixed(2),
        remainingCapacity: maxStudents - currentStudents
      },
      recommendations
    };
  }

  /**
   * Print formatted report
   */
  printReport(config = {}) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║     MongoDB Capacity Analysis - School Management System      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    const usable = this.getUsableStorage();
    console.log('📊 STORAGE OVERVIEW');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`Total Database Size:        ${this.maxDatabaseSizeGB} GB (${this.maxDatabaseSizeMB} MB)`);
    console.log(`After Index Overhead (50%): ${usable.afterIndexMB.toFixed(2)} MB`);
    console.log(`Usable Storage (95%):       ${usable.usableMB.toFixed(2)} MB (${usable.usableGB.toFixed(2)} GB)`);
    console.log('');
    
    // Scenario 1: Standard (1 PDF per student)
    console.log('📈 CAPACITY SCENARIOS');
    console.log('─────────────────────────────────────────────────────────────────');
    
    const scenario1 = this.calculateMaxCapacity({ pdfsPerStudent: 1, pdfSizeMB: 5 });
    console.log('\n✓ Scenario 1: Standard Load (1 PDF @ 5MB per student)');
    console.log(`  Students:   ${scenario1.capacity.students.toLocaleString()}`);
    console.log(`  Applicants: ${scenario1.capacity.applicants.toLocaleString()}`);
    console.log(`  Teachers:   ${scenario1.capacity.teachers.toLocaleString()}`);
    console.log(`  Admins:     ${scenario1.capacity.admins.toLocaleString()}`);
    
    const scenario2 = this.calculateMaxCapacity({ pdfsPerStudent: 2, pdfSizeMB: 5 });
    console.log('\n✓ Scenario 2: Heavy Load (2 PDFs @ 5MB per student)');
    console.log(`  Students:   ${scenario2.capacity.students.toLocaleString()}`);
    console.log(`  Applicants: ${scenario2.capacity.applicants.toLocaleString()}`);
    
    const scenario3 = this.calculateMaxCapacity({ pdfsPerStudent: 1, pdfSizeMB: 2 });
    console.log('\n✓ Scenario 3: Compressed PDFs (1 PDF @ 2MB per student)');
    console.log(`  Students:   ${scenario3.capacity.students.toLocaleString()}`);
    console.log(`  Applicants: ${scenario3.capacity.applicants.toLocaleString()}`);
    
    // Comparison table
    console.log('\n\n📋 DETAILED COMPARISON TABLE');
    console.log('─────────────────────────────────────────────────────────────────');
    const comparison = this.generateComparisonTable();
    console.log('Scenario                        | Max Students | Storage/Student');
    console.log('────────────────────────────────|──────────────|────────────────');
    comparison.forEach(row => {
      console.log(`${row.scenario.padEnd(31)} | ${String(row.maxStudents).padStart(12)} | ${row.storagePerStudent.padStart(14)}`);
    });
    
    // Progressive fill
    console.log('\n\n📊 PROGRESSIVE FILL ANALYSIS (Standard: 1 PDF @ 5MB)');
    console.log('─────────────────────────────────────────────────────────────────');
    const progressive = this.calculateProgressiveFill(scenario1.capacity.students, 1, 5);
    console.log('Students | Metadata | PDFs     | Total    | With Overhead | % Used');
    console.log('─────────|──────────|──────────|──────────|───────────────|───────');
    progressive.forEach(row => {
      console.log(`${String(row.students).padStart(8)} | ${row.metadataMB.padStart(7)}MB | ${row.pdfsMB.padStart(7)}MB | ${row.totalMB.padStart(7)}MB | ${row.withOverheadMB.padStart(12)}MB | ${row.percentUsed.padStart(5)}%`);
    });
    
    console.log('\n\n💡 KEY FINDINGS');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`• Maximum students (1 PDF each): ${scenario1.capacity.students.toLocaleString()}`);
    console.log(`• Maximum students (2 PDFs each): ${scenario2.capacity.students.toLocaleString()}`);
    console.log(`• With compression (2MB PDFs): ${scenario3.capacity.students.toLocaleString()} students`);
    console.log(`• Capacity gain from compression: +${((scenario3.capacity.students / scenario1.capacity.students - 1) * 100).toFixed(0)}%`);
    console.log(`• Safe operating threshold (60%): ${Math.floor(scenario1.capacity.students * 0.6).toLocaleString()} students`);
    console.log(`• Document storage is the bottleneck (99.7% of space)`);
    
    console.log('\n\n🎯 RECOMMENDATIONS');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('1. Implement PDF compression (target: 2-3MB per file)');
    console.log('2. Set up storage monitoring with alerts at 60%, 70%, 80%');
    console.log('3. Plan hybrid architecture: MongoDB + S3 for documents');
    console.log('4. Archive documents older than 12 months to cold storage');
    console.log('5. Upgrade to 25GB cluster if expecting >500 students');
    console.log('\n');
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example 1: Basic capacity analysis
function example1_BasicAnalysis() {
  console.log('\n=== EXAMPLE 1: Basic Capacity Analysis ===\n');
  const calculator = new MongoDBCapacityCalculator(10); // 10 GB database
  calculator.printReport();
}

// Example 2: Custom scenario
function example2_CustomScenario() {
  console.log('\n=== EXAMPLE 2: Custom Scenario ===\n');
  const calculator = new MongoDBCapacityCalculator(10);
  
  const result = calculator.calculateMaxCapacity({
    pdfsPerStudent: 1.5, // Average 1.5 PDFs per student
    pdfSizeMB: 4, // Compressed to 4MB
    pdfsPerApplicant: 2,
    studentAllocationPercent: 75, // Give more space to students
    applicantAllocationPercent: 15,
    staffAllocationPercent: 10
  });
  
  console.log('Custom Configuration:');
  console.log(`- PDFs per student: 1.5`);
  console.log(`- PDF size: 4 MB (compressed)`);
  console.log(`- Student allocation: 75%`);
  console.log('\nResults:');
  console.log(`- Max students: ${result.capacity.students.toLocaleString()}`);
  console.log(`- Max applicants: ${result.capacity.applicants.toLocaleString()}`);
  console.log(`- Storage per student: ${result.perRecord.studentMB.toFixed(2)} MB`);
}

// Example 3: Scaling timeline
function example3_ScalingTimeline() {
  console.log('\n=== EXAMPLE 3: Scaling Timeline ===\n');
  const calculator = new MongoDBCapacityCalculator(10);
  
  const timeline = calculator.calculateScalingTimeline(
    200, // Current: 200 students
    25,  // Growing by 25 students per month
    1    // 1 PDF per student
  );
  
  console.log(`Current: 200 students`);
  console.log(`Growth rate: 25 students/month`);
  console.log(`Max capacity: ${timeline.maxCapacity} students`);
  console.log(`Safe threshold: ${timeline.safeThreshold} students (60%)`);
  console.log(`Warning threshold: ${timeline.warningThreshold} students (80%)`);
  console.log('\nProjected Timeline:');
  console.log('Month | Students | % Used | Status   | Action');
  console.log('─────────────────────────────────────────────────────────────');
  timeline.timeline.forEach(row => {
    console.log(`${String(row.month).padStart(5)} | ${String(row.students).padStart(8)} | ${row.percentUsed.padStart(5)}% | ${row.status.padEnd(8)} | ${row.action}`);
  });
}

// Example 4: Current usage recommendations
function example4_Recommendations() {
  console.log('\n=== EXAMPLE 4: Recommendations for Current Usage ===\n');
  const calculator = new MongoDBCapacityCalculator(10);
  
  const recs = calculator.generateRecommendations(
    600, // Current: 600 students
    1    // 1 PDF per student
  );
  
  console.log('Current Usage:');
  console.log(`- Students: ${recs.currentUsage.students}`);
  console.log(`- Max capacity: ${recs.currentUsage.maxStudents}`);
  console.log(`- Usage: ${recs.currentUsage.percentUsed}%`);
  console.log(`- Remaining: ${recs.currentUsage.remainingCapacity} students`);
  console.log('\nRecommendations:');
  recs.recommendations.forEach((rec, i) => {
    console.log(`\n${i + 1}. [${rec.priority}] ${rec.action}`);
    console.log(`   ${rec.details}`);
  });
}

// Example 5: Different database sizes
function example5_DatabaseSizeComparison() {
  console.log('\n=== EXAMPLE 5: Database Size Comparison ===\n');
  
  const sizes = [10, 25, 50, 100];
  console.log('DB Size | Max Students (1 PDF) | Max Students (2 PDFs) | Monthly Cost');
  console.log('─────────────────────────────────────────────────────────────────────');
  
  sizes.forEach(size => {
    const calc = new MongoDBCapacityCalculator(size);
    const cap1 = calc.calculateMaxCapacity({ pdfsPerStudent: 1 });
    const cap2 = calc.calculateMaxCapacity({ pdfsPerStudent: 2 });
    
    let cost = '$10-25';
    if (size === 25) cost = '$25-40';
    if (size === 50) cost = '$95-140';
    if (size === 100) cost = '$180-280';
    
    console.log(`${String(size).padStart(6)}GB | ${String(cap1.capacity.students).padStart(20)} | ${String(cap2.capacity.students).padStart(21)} | ${cost}`);
  });
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

if (require.main === module) {
  // Run all examples
  example1_BasicAnalysis();
  example2_CustomScenario();
  example3_ScalingTimeline();
  example4_Recommendations();
  example5_DatabaseSizeComparison();
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    Analysis Complete                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

// Export for use in other modules
module.exports = MongoDBCapacityCalculator;
