# PDF Validation Implementation Guide

## Quick Start Guide for Developers

This guide shows how to implement PDF validation in your routes and services.

---

## 📦 Available Tools

### 1. PDF Validator Utility
**Location:** `/utils/pdfValidator.js`

**Features:**
- File size validation (3 MB limit)
- MIME type checking
- PDF integrity verification
- File naming validation
- Automatic filename generation

### 2. PDF Validation Middleware
**Location:** `/middleware/pdfValidationMiddleware.js`

**Features:**
- Express middleware for route protection
- Automatic validation on upload
- Configurable validation options
- Detailed error responses

---

## 🚀 Implementation Examples

### Example 1: Basic PDF Upload with Validation

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { validatePDFUpload } = require('../middleware/pdfValidationMiddleware');

// Configure multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 } // 3MB
});

// Route with PDF validation
router.post('/upload-document', 
    upload.single('pdf'),
    validatePDFUpload({
        checkIntegrity: true,
        required: true
    }),
    async (req, res) => {
        // PDF is validated at this point
        console.log('PDF validation passed:', req.pdfValidation);
        
        // Process the file
        const pdfBuffer = req.file.buffer;
        
        res.json({
            success: true,
            message: 'PDF uploaded successfully',
            metadata: req.pdfValidation.metadata
        });
    }
);
```

---

### Example 2: PDF Upload with Student Context

```javascript
router.post('/student/:id/upload-form', 
    upload.single('pdf'),
    validatePDFUpload({
        checkIntegrity: true,
        required: true,
        getStudentName: async (req) => {
            const student = await Student.findById(req.params.id);
            return student.fullName;
        },
        getSeason: async (req) => {
            const Settings = require('../models/Settings');
            const settings = await Settings.getSettings();
            return settings.currentSeason || 'Current';
        }
    }),
    async (req, res) => {
        // PDF validated with student context
        const student = await Student.findById(req.params.id);
        
        // Save PDF
        student.pdfPath = req.file.buffer;
        await student.save();
        
        res.json({ success: true });
    }
);
```

---

### Example 3: Manual Validation (Without Middleware)

```javascript
const pdfValidator = require('../utils/pdfValidator');

router.post('/custom-upload', upload.single('pdf'), async (req, res) => {
    try {
        // Manual validation
        const validation = await pdfValidator.validatePDF(req.file, {
            studentName: req.body.studentName,
            season: req.body.season,
            checkIntegrity: true
        });
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors,
                warnings: validation.warnings
            });
        }
        
        // Process validated PDF
        console.log('PDF is valid:', validation.metadata);
        
        res.json({ success: true });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

### Example 4: Validating Generated PDFs

```javascript
const { generateRegistrationPDF } = require('../services/pdfGenerator');
const pdfValidator = require('../utils/pdfValidator');

router.post('/generate-student-pdf/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        // Generate PDF
        const pdfBuffer = await generateRegistrationPDF(student);
        
        // Validate generated PDF
        const validation = pdfValidator.validateFileSize({ buffer: pdfBuffer });
        
        if (!validation.valid) {
            console.error('Generated PDF too large:', validation.error);
            return res.status(500).json({
                error: 'Generated PDF exceeds size limit',
                size: pdfValidator.formatBytes(validation.size)
            });
        }
        
        // Generate proper filename
        const fileName = pdfValidator.generateFileName(
            student.fullName, 
            student.season
        );
        
        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(pdfBuffer);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

## 🔧 Middleware Configuration Options

### validatePDFUpload(options)

```javascript
{
    // Whether to check PDF integrity (parsing, corruption)
    checkIntegrity: true,  // default: true
    
    // Whether PDF file is required
    required: false,  // default: false
    
    // Function to extract student name from request
    getStudentName: (req) => req.body.fullName,  // optional
    
    // Function to extract season from request
    getSeason: async (req) => {  // optional
        const settings = await Settings.getSettings();
        return settings.currentSeason;
    }
}
```

---

## 📊 Validation Response Structure

### Success (req.pdfValidation)
```javascript
{
    valid: true,
    warnings: [
        "Recommended file name format: Ahmed_Benali_2024-2025.pdf"
    ],
    metadata: {
        fileSize: 2457600,
        fileSizeFormatted: "2.34 MB",
        pageCount: 3,
        suggestedFileName: "Ahmed_Benali_2024-2025.pdf"
    }
}
```

### Error Response
```javascript
{
    success: false,
    message: "PDF validation failed",
    errors: [
        "PDF file exceeds the maximum size limit. File size: 4.2 MB, Maximum allowed: 3 MB"
    ],
    warnings: [],
    metadata: {
        fileSize: 4404019,
        fileSizeFormatted: "4.2 MB"
    },
    requirements: {
        maxFileSize: "3 MB",
        minFileSize: "1 KB",
        allowedTypes: ["application/pdf"],
        namingConvention: "StudentName_Season.pdf"
    }
}
```

---

## 🛠️ Utility Functions

### 1. Validate File Size
```javascript
const pdfValidator = require('../utils/pdfValidator');

const validation = pdfValidator.validateFileSize(file);
// Returns: { valid: boolean, error: string|null, size: number }
```

### 2. Validate MIME Type
```javascript
const validation = pdfValidator.validateMimeType(file);
// Returns: { valid: boolean, error: string|null }
```

### 3. Validate PDF Integrity
```javascript
const validation = await pdfValidator.validatePDFIntegrity(buffer);
// Returns: { valid: boolean, error: string|null, pageCount: number }
```

### 4. Validate File Name
```javascript
const validation = pdfValidator.validateFileName(fileName, {
    studentName: 'Ahmed Benali',
    season: '2024-2025'
});
// Returns: { valid: boolean, error: string|null, suggestedName: string }
```

### 5. Generate Standard File Name
```javascript
const fileName = pdfValidator.generateFileName('Ahmed Benali', '2024-2025');
// Returns: "Ahmed_Benali_2024-2025.pdf"
```

### 6. Format Bytes
```javascript
const formatted = pdfValidator.formatBytes(2457600);
// Returns: "2.34 MB"
```

### 7. Get Requirements
```javascript
const requirements = pdfValidator.getRequirements();
// Returns object with all validation requirements
```

---

## 🎯 Common Use Cases

### Use Case 1: Service Request with PDF
```javascript
router.post('/service-request', 
    upload.single('document'),
    validatePDFUpload({
        checkIntegrity: true,
        required: false,
        getStudentName: (req) => req.body.fullName,
        getSeason: () => 'Current'
    }),
    async (req, res) => {
        // Create service request
        const request = new ServiceRequest({
            ...req.body,
            documentPath: req.file ? req.file.buffer : null
        });
        await request.save();
        res.json({ success: true });
    }
);
```

### Use Case 2: Bulk PDF Upload
```javascript
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 }
});

router.post('/bulk-upload', upload.array('pdfs', 10), async (req, res) => {
    const results = [];
    
    for (const file of req.files) {
        const validation = await pdfValidator.validatePDF(file, {
            checkIntegrity: true
        });
        
        results.push({
            fileName: file.originalname,
            valid: validation.valid,
            errors: validation.errors,
            size: pdfValidator.formatBytes(file.size)
        });
    }
    
    res.json({ results });
});
```

### Use Case 3: PDF Compression Check
```javascript
router.post('/check-pdf', upload.single('pdf'), async (req, res) => {
    const validation = pdfValidator.validateFileSize(req.file);
    
    if (!validation.valid) {
        return res.json({
            needsCompression: true,
            currentSize: pdfValidator.formatBytes(validation.size),
            maxSize: pdfValidator.formatBytes(pdfValidator.MAX_FILE_SIZE),
            compressionNeeded: validation.size - pdfValidator.MAX_FILE_SIZE
        });
    }
    
    res.json({ needsCompression: false });
});
```

---

## ⚠️ Error Handling Best Practices

### 1. Graceful Error Handling
```javascript
router.post('/upload', upload.single('pdf'), 
    validatePDFUpload({ checkIntegrity: true }),
    async (req, res) => {
        try {
            // Your code here
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Upload failed',
                error: error.message
            });
        }
    }
);
```

### 2. Logging Validation Results
```javascript
router.post('/upload', upload.single('pdf'),
    validatePDFUpload({ checkIntegrity: true }),
    async (req, res) => {
        // Log validation results
        console.log('✅ PDF validation passed');
        console.log('File size:', req.pdfValidation.metadata.fileSizeFormatted);
        console.log('Page count:', req.pdfValidation.metadata.pageCount);
        
        if (req.pdfValidation.warnings.length > 0) {
            console.warn('⚠️ Warnings:', req.pdfValidation.warnings);
        }
        
        // Continue processing
    }
);
```

### 3. Custom Error Messages
```javascript
const { validatePDFUpload } = require('../middleware/pdfValidationMiddleware');

// Custom middleware wrapper
const customValidation = validatePDFUpload({
    checkIntegrity: true,
    required: true
});

router.post('/upload', upload.single('pdf'), customValidation, (req, res) => {
    // Validation passed
});

// Handle validation errors
router.use((err, req, res, next) => {
    if (err.message.includes('PDF')) {
        return res.status(400).json({
            success: false,
            message: 'Invalid PDF file',
            details: err.message
        });
    }
    next(err);
});
```

---

## 🧪 Testing

### Test PDF Validation
```javascript
const pdfValidator = require('../utils/pdfValidator');
const fs = require('fs');

// Test file size validation
const testBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
const validation = pdfValidator.validateFileSize({ buffer: testBuffer });
console.assert(!validation.valid, 'Should reject files over 3MB');

// Test file name generation
const fileName = pdfValidator.generateFileName('Test Student', '2024');
console.assert(fileName === 'Test_Student_2024.pdf', 'File name format incorrect');
```

---

## 📝 Checklist for New Routes

When adding PDF upload to a new route:

- [ ] Import required modules (`multer`, `pdfValidator`, `validatePDFUpload`)
- [ ] Configure multer with 3MB limit
- [ ] Add `validatePDFUpload` middleware
- [ ] Configure validation options (integrity check, required, etc.)
- [ ] Provide student name and season extraction functions
- [ ] Handle validation results in route handler
- [ ] Log validation metadata
- [ ] Generate proper file names for downloads
- [ ] Add error handling
- [ ] Test with various PDF sizes and types
- [ ] Document the endpoint

---

## 🔗 Related Files

- **Validator:** `/utils/pdfValidator.js`
- **Middleware:** `/middleware/pdfValidationMiddleware.js`
- **PDF Generator:** `/services/pdfGenerator.js`
- **Documentation:** `/PDF-UPLOAD-REQUIREMENTS.md`
- **Example Routes:**
  - `/routes/services.js`
  - `/routes/studentManagement.js`

---

## 📞 Support

For questions or issues:
1. Review this guide
2. Check `/PDF-UPLOAD-REQUIREMENTS.md`
3. Examine example implementations in existing routes
4. Contact the development team

---

**Last Updated:** November 2024  
**Version:** 1.0.0
