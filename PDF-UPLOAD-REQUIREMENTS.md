# PDF Upload Requirements for Student Documents

## Overview
This document outlines the strict requirements for uploading PDF files for students or any PDF documents in the system. All PDFs must meet these requirements to ensure quality, readability, and system compatibility.

---

## 📋 Requirements Checklist

### 1. **File Size Limit**
- **Maximum Size:** 3 MB (3,145,728 bytes)
- **Minimum Size:** 1 KB (to avoid empty files)
- **Enforcement:** Automatic validation on upload
- **Action if Exceeded:** Upload will be rejected with an error message

**Why?**
- Ensures fast upload/download speeds
- Prevents storage issues
- Maintains system performance
- Compatible with Dropbox and cloud storage limits

**Solution if File Exceeds Limit:**
- Use reliable PDF compression tools (e.g., Adobe Acrobat, Smallpdf, iLovePDF)
- Reduce image quality within the PDF (while maintaining readability)
- Remove unnecessary pages or embedded fonts
- Avoid extreme compression that blurs text or images

---

### 2. **Content Integrity**
All content within the PDF must be:
- ✅ **Fully visible** - No cut-off content
- ✅ **Readable** - Text must be clear and legible
- ✅ **Complete** - No missing pages or sections
- ✅ **Uncropped** - All elements within page boundaries
- ✅ **Undistorted** - No stretched or compressed images/text

**Validation:**
- Automatic PDF parsing checks for corruption
- Page count verification
- Content structure validation

**Common Issues to Avoid:**
- Scanned documents with poor quality
- PDFs with password protection
- Corrupted or incomplete files
- PDFs with missing fonts

---

### 3. **Design Preservation**
The original document design must remain intact:
- ✅ **Layout** - Original page layout preserved
- ✅ **Formatting** - Text formatting unchanged
- ✅ **Fonts** - Original fonts embedded or substituted properly
- ✅ **Colors** - Color scheme maintained
- ✅ **Images** - Images at appropriate resolution
- ✅ **Tables** - Table structures preserved

**Best Practices:**
- Use "Print to PDF" instead of scanning when possible
- Embed all fonts in the PDF
- Use high-quality image compression
- Test PDF on different devices before uploading

---

### 4. **File Naming Convention**
**Required Format:** `StudentName_Season.pdf`

**Examples:**
- ✅ `Ahmed_Benali_2024-2025.pdf`
- ✅ `Sara_Alami_Fall2024.pdf`
- ✅ `Mohamed_Idrissi_Current.pdf`
- ❌ `document.pdf` (too generic)
- ❌ `scan_001.pdf` (not descriptive)
- ❌ `Student File.pdf` (contains spaces, no season)

**Naming Rules:**
- Use underscores (_) or hyphens (-) instead of spaces
- Include student's full name
- Include season/academic year
- Avoid special characters: `< > : " / \ | ? *`
- Maximum filename length: 200 characters
- Use descriptive names for easy identification

**Automatic Generation:**
The system automatically generates proper filenames when creating PDFs programmatically.

---

### 5. **Version Control & Season Validation**
- ✅ PDF must correspond to the **current active season**
- ✅ Archived or previous season PDFs should not be uploaded as active files
- ✅ Each season should have its own PDF version
- ✅ Old PDFs should be archived, not replaced

**Season Tracking:**
- System tracks which season each PDF belongs to
- Prevents mixing documents from different academic years
- Ensures students have up-to-date registration forms

---

### 6. **Pre-Upload Validation**
Before submitting any PDF, perform these checks:

#### Manual Checklist:
1. ✅ Open the PDF and verify all pages are readable
2. ✅ Check file size (right-click → Properties)
3. ✅ Confirm file name follows convention
4. ✅ Verify it's the correct season's document
5. ✅ Ensure no password protection
6. ✅ Test on multiple PDF readers if possible

#### Automatic Validation:
The system performs these checks automatically:
- File size validation
- MIME type verification (must be `application/pdf`)
- PDF structure integrity check
- Page count validation
- Corruption detection

---

## 🛠️ Technical Implementation

### For Developers

#### PDF Validation Utility
Location: `/utils/pdfValidator.js`

```javascript
const pdfValidator = require('../utils/pdfValidator');

// Validate a PDF file
const validation = await pdfValidator.validatePDF(file, {
    studentName: 'Ahmed Benali',
    season: '2024-2025',
    checkIntegrity: true
});

if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
}
```

#### Middleware Usage
Location: `/middleware/pdfValidationMiddleware.js`

```javascript
const { validatePDFUpload } = require('../middleware/pdfValidationMiddleware');

router.post('/upload', upload.single('file'), 
    validatePDFUpload({
        checkIntegrity: true,
        required: true,
        getStudentName: (req) => req.body.fullName,
        getSeason: (req) => req.body.season
    }),
    async (req, res) => {
        // PDF is validated at this point
        // Access validation results: req.pdfValidation
    }
);
```

#### Routes with PDF Validation
1. **Service Requests:** `/api/services/upload`
2. **Student Management:** `/api/student-management/students/:id/generate-pdf`
3. **Dropbox Backup:** `/api/student-management/students/:id/backup-dropbox`

---

## 📊 Validation Response Format

### Success Response
```json
{
    "success": true,
    "message": "PDF uploaded successfully",
    "metadata": {
        "fileSize": "2.4 MB",
        "pageCount": 3,
        "suggestedFileName": "Ahmed_Benali_2024-2025.pdf"
    },
    "warnings": [
        "Recommended file name format: Ahmed_Benali_2024-2025.pdf"
    ]
}
```

### Error Response
```json
{
    "success": false,
    "message": "PDF validation failed",
    "errors": [
        "PDF file exceeds the maximum size limit. File size: 4.2 MB, Maximum allowed: 3 MB. Please compress the PDF without reducing quality."
    ],
    "warnings": [],
    "metadata": {
        "fileSize": "4.2 MB",
        "fileSizeFormatted": "4.2 MB"
    },
    "requirements": {
        "maxFileSize": "3 MB",
        "minFileSize": "1 KB",
        "allowedTypes": ["application/pdf"],
        "namingConvention": "StudentName_Season.pdf"
    }
}
```

---

## 🔧 Compression Guidelines

### Recommended Tools
1. **Adobe Acrobat Pro** - Professional compression with quality control
2. **Smallpdf** - Online tool with good compression ratio
3. **iLovePDF** - Free online compression
4. **PDF Compressor** - Desktop application
5. **Ghostscript** - Command-line tool for batch processing

### Compression Settings
- **Images:** 150-300 DPI (sufficient for documents)
- **Color Space:** RGB or Grayscale (avoid CMYK unless printing)
- **Image Format:** JPEG for photos, PNG for text/diagrams
- **Font Embedding:** Subset fonts to reduce size
- **Remove:** Metadata, annotations, form fields (if not needed)

### Command-Line Example (Ghostscript)
```bash
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=compressed.pdf input.pdf
```

---

## 🚨 Common Errors & Solutions

### Error: "PDF file exceeds the maximum size limit"
**Solution:**
1. Compress the PDF using recommended tools
2. Reduce image quality within the PDF
3. Remove unnecessary pages
4. Split into multiple PDFs if necessary

### Error: "PDF file is corrupted or invalid"
**Solution:**
1. Re-save the PDF using a different tool
2. Use "Print to PDF" to create a new version
3. Check if the file is password-protected
4. Verify the file isn't truncated or incomplete

### Error: "Invalid file type. Expected PDF"
**Solution:**
1. Ensure file has `.pdf` extension
2. Don't rename other file types to `.pdf`
3. Convert documents to PDF properly (not just rename)

### Error: "File name contains invalid characters"
**Solution:**
1. Remove special characters: `< > : " / \ | ? *`
2. Replace spaces with underscores or hyphens
3. Use only letters, numbers, hyphens, and underscores

---

## 📝 Best Practices Summary

### For Users
1. ✅ Always check file size before uploading
2. ✅ Use descriptive, standardized file names
3. ✅ Verify PDF opens correctly before upload
4. ✅ Compress large files without losing quality
5. ✅ Upload PDFs for the current active season only
6. ✅ Keep backup copies of original documents

### For Administrators
1. ✅ Monitor PDF sizes in the system
2. ✅ Regularly audit uploaded PDFs for compliance
3. ✅ Provide compression tools/guidance to users
4. ✅ Archive old season PDFs properly
5. ✅ Test PDF generation regularly
6. ✅ Review validation logs for common issues

### For Developers
1. ✅ Always use the validation middleware for PDF uploads
2. ✅ Log validation results for monitoring
3. ✅ Handle validation errors gracefully
4. ✅ Provide clear error messages to users
5. ✅ Test with various PDF types and sizes
6. ✅ Keep validation rules updated

---

## 📚 Additional Resources

### PDF Standards
- PDF/A (ISO 19005) - Archival standard
- PDF/UA (ISO 14289) - Accessibility standard
- PDF 1.7 (ISO 32000-1) - General PDF specification

### Useful Links
- [Adobe PDF Best Practices](https://www.adobe.com/acrobat/resources.html)
- [PDF Association](https://www.pdfa.org/)
- [Ghostscript Documentation](https://www.ghostscript.com/doc/)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial implementation of PDF validation system |

---

## 📞 Support

For issues or questions regarding PDF uploads:
1. Check this documentation first
2. Review error messages carefully
3. Contact system administrator
4. Report bugs to development team

---

**Last Updated:** November 2024  
**Maintained By:** Development Team  
**Status:** Active
