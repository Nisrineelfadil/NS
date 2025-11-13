/**
 * MongoDB Capacity Management - Implementation Guide
 * Practical code examples for optimizing storage and monitoring capacity
 */

const { MongoClient, GridFSBucket } = require('mongodb');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. STORAGE MONITORING
// ============================================================================

/**
 * Monitor database storage and send alerts
 */
class StorageMonitor {
  constructor(mongoUrl, dbName, alertThresholds = { warning: 0.60, critical: 0.80 }) {
    this.mongoUrl = mongoUrl;
    this.dbName = dbName;
    this.alertThresholds = alertThresholds;
    this.maxSizeGB = 10; // Your database limit
  }

  async connect() {
    this.client = await MongoClient.connect(this.mongoUrl);
    this.db = this.client.db(this.dbName);
  }

  async getStorageStats() {
    const stats = await this.db.stats(1024 * 1024); // Get stats in MB
    
    return {
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexSize: stats.indexSize,
      totalSize: stats.dataSize + stats.indexSize,
      collections: stats.collections,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize
    };
  }

  async getCollectionStats() {
    const collections = await this.db.listCollections().toArray();
    const collectionStats = [];

    for (const coll of collections) {
      try {
        const stats = await this.db.collection(coll.name).stats(1024 * 1024);
        collectionStats.push({
          name: coll.name,
          size: stats.size,
          count: stats.count,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize,
          indexes: stats.nindexes,
          indexSize: stats.totalIndexSize
        });
      } catch (err) {
        console.error(`Error getting stats for ${coll.name}:`, err.message);
      }
    }

    return collectionStats.sort((a, b) => b.size - a.size);
  }

  async checkCapacity() {
    const stats = await this.getStorageStats();
    const maxSizeMB = this.maxSizeGB * 1024;
    const usedPercent = stats.totalSize / maxSizeMB;
    
    const status = {
      totalSizeMB: stats.totalSize.toFixed(2),
      maxSizeMB,
      usedPercent: (usedPercent * 100).toFixed(2),
      remainingMB: (maxSizeMB - stats.totalSize).toFixed(2),
      alert: 'OK'
    };

    if (usedPercent >= this.alertThresholds.critical) {
      status.alert = 'CRITICAL';
      status.message = 'Database is at critical capacity! Immediate action required.';
    } else if (usedPercent >= this.alertThresholds.warning) {
      status.alert = 'WARNING';
      status.message = 'Database approaching capacity limit. Plan scaling soon.';
    } else {
      status.message = 'Database capacity is healthy.';
    }

    return status;
  }

  async generateReport() {
    const capacity = await this.checkCapacity();
    const collections = await this.getCollectionStats();

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              MongoDB Storage Monitoring Report                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Overall Capacity:`);
    console.log(`   Total Used: ${capacity.totalSizeMB} MB (${capacity.usedPercent}%)`);
    console.log(`   Max Size: ${capacity.maxSizeMB} MB`);
    console.log(`   Remaining: ${capacity.remainingMB} MB`);
    console.log(`   Status: ${capacity.alert} - ${capacity.message}\n`);

    console.log(`📁 Collection Breakdown:`);
    collections.forEach(coll => {
      const percent = ((coll.size / capacity.totalSizeMB) * 100).toFixed(1);
      console.log(`   ${coll.name.padEnd(30)} ${coll.size.toFixed(2).padStart(10)} MB (${percent.padStart(5)}%) - ${coll.count.toLocaleString()} docs`);
    });

    return { capacity, collections };
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}

// ============================================================================
// 2. PDF COMPRESSION
// ============================================================================

/**
 * Compress PDFs before uploading to reduce storage
 * Note: Requires external libraries like pdf-lib or ghostscript
 */
class PDFCompressor {
  constructor(targetSizeMB = 2) {
    this.targetSizeMB = targetSizeMB;
  }

  /**
   * Check if PDF needs compression
   */
  needsCompression(fileSizeBytes) {
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    return fileSizeMB > this.targetSizeMB;
  }

  /**
   * Compress PDF using Ghostscript (example)
   * In production, use libraries like pdf-lib or call external tools
   */
  async compressPDF(inputPath, outputPath) {
    // This is a placeholder - implement with actual compression library
    console.log(`Compressing ${inputPath} to ${outputPath}...`);
    
    // Example using child_process to call ghostscript:
    // const { exec } = require('child_process');
    // const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${inputPath}`;
    // await exec(command);
    
    return {
      originalSize: fs.statSync(inputPath).size,
      compressedSize: fs.statSync(inputPath).size * 0.4, // Simulated 60% reduction
      compressionRatio: 0.4
    };
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(originalSize, compressedSize) {
    const savedBytes = originalSize - compressedSize;
    const savedMB = savedBytes / (1024 * 1024);
    const compressionPercent = ((savedBytes / originalSize) * 100).toFixed(1);
    
    return {
      originalMB: (originalSize / (1024 * 1024)).toFixed(2),
      compressedMB: (compressedSize / (1024 * 1024)).toFixed(2),
      savedMB: savedMB.toFixed(2),
      compressionPercent
    };
  }
}

// ============================================================================
// 3. DOCUMENT ARCHIVAL
// ============================================================================

/**
 * Archive old documents to external storage (S3, Azure, etc.)
 */
class DocumentArchiver {
  constructor(mongoUrl, dbName, archiveAgeMonths = 12) {
    this.mongoUrl = mongoUrl;
    this.dbName = dbName;
    this.archiveAgeMonths = archiveAgeMonths;
  }

  async connect() {
    this.client = await MongoClient.connect(this.mongoUrl);
    this.db = this.client.db(this.dbName);
    this.bucket = new GridFSBucket(this.db);
  }

  /**
   * Find documents older than specified months
   */
  async findOldDocuments() {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - this.archiveAgeMonths);

    const oldFiles = await this.db.collection('fs.files')
      .find({
        uploadDate: { $lt: cutoffDate }
      })
      .toArray();

    return oldFiles;
  }

  /**
   * Archive document to external storage
   */
  async archiveDocument(fileId, externalStorageUrl) {
    // 1. Download from GridFS
    const downloadStream = this.bucket.openDownloadStream(fileId);
    
    // 2. Upload to external storage (S3, Azure, etc.)
    // This is a placeholder - implement with actual cloud storage SDK
    console.log(`Archiving file ${fileId} to ${externalStorageUrl}...`);
    
    // Example with AWS S3:
    // const AWS = require('aws-sdk');
    // const s3 = new AWS.S3();
    // await s3.upload({
    //   Bucket: 'your-bucket',
    //   Key: fileId.toString(),
    //   Body: downloadStream
    // }).promise();
    
    // 3. Update metadata in MongoDB (keep reference, remove file)
    await this.db.collection('fs.files').updateOne(
      { _id: fileId },
      {
        $set: {
          archived: true,
          archivedDate: new Date(),
          externalUrl: externalStorageUrl
        }
      }
    );
    
    // 4. Delete from GridFS
    await this.bucket.delete(fileId);
    
    return { success: true, fileId, externalUrl: externalStorageUrl };
  }

  /**
   * Archive all old documents
   */
  async archiveOldDocuments(externalStorageBase) {
    const oldFiles = await this.findOldDocuments();
    const results = {
      total: oldFiles.length,
      archived: 0,
      failed: 0,
      spaceSaved: 0
    };

    console.log(`Found ${oldFiles.length} documents to archive...`);

    for (const file of oldFiles) {
      try {
        const externalUrl = `${externalStorageBase}/${file._id}`;
        await this.archiveDocument(file._id, externalUrl);
        results.archived++;
        results.spaceSaved += file.length;
        console.log(`✓ Archived ${file.filename} (${(file.length / (1024 * 1024)).toFixed(2)} MB)`);
      } catch (err) {
        console.error(`✗ Failed to archive ${file.filename}:`, err.message);
        results.failed++;
      }
    }

    results.spaceSavedMB = (results.spaceSaved / (1024 * 1024)).toFixed(2);
    return results;
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}

// ============================================================================
// 4. CAPACITY ALERTS
// ============================================================================

/**
 * Send alerts when capacity thresholds are reached
 */
class CapacityAlertSystem {
  constructor(mongoUrl, dbName, maxSizeGB = 10) {
    this.monitor = new StorageMonitor(mongoUrl, dbName);
    this.maxSizeGB = maxSizeGB;
    this.lastAlertLevel = 'OK';
  }

  async checkAndAlert() {
    await this.monitor.connect();
    const capacity = await this.monitor.checkCapacity();
    
    // Only send alert if status changed or is critical
    if (capacity.alert !== this.lastAlertLevel || capacity.alert === 'CRITICAL') {
      await this.sendAlert(capacity);
      this.lastAlertLevel = capacity.alert;
    }
    
    await this.monitor.close();
    return capacity;
  }

  async sendAlert(capacity) {
    const alert = {
      timestamp: new Date().toISOString(),
      level: capacity.alert,
      message: capacity.message,
      details: {
        usedMB: capacity.totalSizeMB,
        maxMB: capacity.maxSizeMB,
        usedPercent: capacity.usedPercent,
        remainingMB: capacity.remainingMB
      }
    };

    // Send alert via email, Slack, SMS, etc.
    console.log('\n🚨 CAPACITY ALERT 🚨');
    console.log(JSON.stringify(alert, null, 2));
    
    // Example: Send email
    // await this.sendEmail(alert);
    
    // Example: Send Slack notification
    // await this.sendSlackNotification(alert);
    
    // Example: Log to monitoring service
    // await this.logToMonitoring(alert);
  }

  /**
   * Schedule periodic checks
   */
  startMonitoring(intervalMinutes = 60) {
    console.log(`Starting capacity monitoring (checking every ${intervalMinutes} minutes)...`);
    
    // Initial check
    this.checkAndAlert();
    
    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.checkAndAlert();
    }, intervalMinutes * 60 * 1000);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('Stopped capacity monitoring.');
    }
  }
}

// ============================================================================
// 5. STUDENT CAPACITY CALCULATOR
// ============================================================================

/**
 * Calculate how many more students can be added
 */
class StudentCapacityCalculator {
  constructor(mongoUrl, dbName, maxSizeGB = 10) {
    this.mongoUrl = mongoUrl;
    this.dbName = dbName;
    this.maxSizeGB = maxSizeGB;
    this.avgStudentSizeMB = 5.065; // 15KB metadata + 5MB PDF
  }

  async connect() {
    this.client = await MongoClient.connect(this.mongoUrl);
    this.db = this.client.db(this.dbName);
  }

  async getCurrentStudentCount() {
    return await this.db.collection('students').countDocuments();
  }

  async getAverageStudentSize() {
    const stats = await this.db.collection('students').stats(1024 * 1024);
    const count = stats.count;
    
    if (count === 0) return this.avgStudentSizeMB;
    
    // Get average document size from GridFS
    const gridFSStats = await this.db.collection('fs.files').aggregate([
      {
        $group: {
          _id: null,
          avgSize: { $avg: '$length' },
          totalSize: { $sum: '$length' }
        }
      }
    ]).toArray();

    if (gridFSStats.length > 0) {
      const avgPdfSizeMB = gridFSStats[0].avgSize / (1024 * 1024);
      const metadataSizeMB = stats.size / count;
      return metadataSizeMB + avgPdfSizeMB;
    }

    return this.avgStudentSizeMB;
  }

  async calculateRemainingCapacity() {
    await this.connect();
    
    const dbStats = await this.db.stats(1024 * 1024);
    const currentUsedMB = dbStats.dataSize + dbStats.indexSize;
    const maxSizeMB = this.maxSizeGB * 1024;
    const usableSizeMB = maxSizeMB / 1.5; // Account for 50% index overhead
    const remainingMB = usableSizeMB - currentUsedMB;
    
    const currentStudents = await this.getCurrentStudentCount();
    const avgStudentSize = await this.getAverageStudentSize();
    const remainingStudents = Math.floor(remainingMB / avgStudentSize);
    
    await this.client.close();
    
    return {
      currentStudents,
      avgStudentSizeMB: avgStudentSize.toFixed(3),
      currentUsedMB: currentUsedMB.toFixed(2),
      remainingMB: remainingMB.toFixed(2),
      remainingStudents,
      maxStudents: currentStudents + remainingStudents,
      usedPercent: ((currentUsedMB / maxSizeMB) * 100).toFixed(2)
    };
  }

  async printCapacityReport() {
    const capacity = await this.calculateRemainingCapacity();
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              Student Capacity Analysis                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📊 Current Status:`);
    console.log(`   Students: ${capacity.currentStudents.toLocaleString()}`);
    console.log(`   Database Used: ${capacity.currentUsedMB} MB (${capacity.usedPercent}%)`);
    console.log(`   Avg Size per Student: ${capacity.avgStudentSizeMB} MB\n`);
    
    console.log(`📈 Remaining Capacity:`);
    console.log(`   Available Space: ${capacity.remainingMB} MB`);
    console.log(`   Additional Students: ${capacity.remainingStudents.toLocaleString()}`);
    console.log(`   Maximum Total: ${capacity.maxStudents.toLocaleString()} students\n`);
    
    if (capacity.remainingStudents < 100) {
      console.log(`⚠️  WARNING: Less than 100 students remaining capacity!`);
      console.log(`   Action: Plan scaling immediately.\n`);
    } else if (capacity.remainingStudents < 200) {
      console.log(`⚠️  CAUTION: Approaching capacity limit.`);
      console.log(`   Action: Begin planning for scaling.\n`);
    } else {
      console.log(`✅ Capacity is healthy.\n`);
    }
    
    return capacity;
  }
}

// ============================================================================
// 6. USAGE EXAMPLES
// ============================================================================

async function example1_MonitorStorage() {
  console.log('\n=== Example 1: Monitor Storage ===\n');
  
  const monitor = new StorageMonitor('mongodb://localhost:27017', 'schoolSystem');
  await monitor.connect();
  await monitor.generateReport();
  await monitor.close();
}

async function example2_CheckCapacity() {
  console.log('\n=== Example 2: Check Capacity ===\n');
  
  const calculator = new StudentCapacityCalculator('mongodb://localhost:27017', 'schoolSystem');
  await calculator.printCapacityReport();
}

async function example3_ArchiveOldDocuments() {
  console.log('\n=== Example 3: Archive Old Documents ===\n');
  
  const archiver = new DocumentArchiver('mongodb://localhost:27017', 'schoolSystem', 12);
  await archiver.connect();
  
  const results = await archiver.archiveOldDocuments('https://s3.amazonaws.com/your-bucket/archived');
  
  console.log('\nArchival Results:');
  console.log(`Total files: ${results.total}`);
  console.log(`Archived: ${results.archived}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Space saved: ${results.spaceSavedMB} MB`);
  
  await archiver.close();
}

async function example4_StartAlertSystem() {
  console.log('\n=== Example 4: Start Alert System ===\n');
  
  const alertSystem = new CapacityAlertSystem('mongodb://localhost:27017', 'schoolSystem');
  
  // Check immediately
  await alertSystem.checkAndAlert();
  
  // Start monitoring every hour
  // alertSystem.startMonitoring(60);
  
  // To stop: alertSystem.stopMonitoring();
}

// ============================================================================
// 7. MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     MongoDB Capacity Management - Implementation Guide         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  // Uncomment the examples you want to run:
  
  // await example1_MonitorStorage();
  // await example2_CheckCapacity();
  // await example3_ArchiveOldDocuments();
  // await example4_StartAlertSystem();
  
  console.log('\n💡 To use these tools:');
  console.log('1. Update MongoDB connection strings');
  console.log('2. Uncomment the examples you want to run');
  console.log('3. Install required dependencies: npm install mongodb');
  console.log('4. Run: node implementation-guide.js\n');
}

// Export classes for use in other modules
module.exports = {
  StorageMonitor,
  PDFCompressor,
  DocumentArchiver,
  CapacityAlertSystem,
  StudentCapacityCalculator
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
