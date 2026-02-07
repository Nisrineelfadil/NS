const express = require('express');
const router = express.Router();
const CashTransaction = require('../models/CashTransaction');
const MonthlyNote = require('../models/MonthlyNote');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const imageOptimizer = require('../utils/imageOptimizer');
const imageStorageService = require('../services/imageStorageService');

// Configure multer for receipt uploads (memory storage)
const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
    }
  }
});

// Middleware to check if user is authenticated
router.use(authenticateAdmin);

// ==================== TRANSACTION ROUTES ====================

// Get all transactions with filters
router.get('/transactions', async (req, res) => {
  try {
    const { year, month, type, category, startDate, endDate } = req.query;
    
    let query = {};
    
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);
    if (type) query.type = type;
    if (category) query.category = category;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const transactions = await CashTransaction.find(query)
      .sort({ date: -1 })
      .populate('addedBy', 'fullName');
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Get single transaction
router.get('/transactions/:id', async (req, res) => {
  try {
    const transaction = await CashTransaction.findById(req.params.id)
      .populate('addedBy', 'fullName');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
});

// Create new transaction
router.post('/transactions', async (req, res) => {
  try {
    const { title, amount, type, category, remarks, date, status } = req.body;
    
    // Validate required fields
    if (!title || !amount || !type || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const transactionDate = date ? new Date(date) : new Date();
    
    const transaction = new CashTransaction({
      title,
      amount: parseFloat(amount),
      type,
      category,
      remarks: remarks || '',
      date: transactionDate,
      month: transactionDate.getMonth() + 1,
      year: transactionDate.getFullYear(),
      status: status || 'completed',
      addedBy: req.admin.id,
      addedByName: req.admin.username
    });
    
    await transaction.save();
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
});

// Update transaction
router.put('/transactions/:id', async (req, res) => {
  try {
    const { title, amount, type, category, remarks, date, status } = req.body;
    
    const transaction = await CashTransaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Update fields
    if (title) transaction.title = title;
    if (amount) transaction.amount = parseFloat(amount);
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (remarks !== undefined) transaction.remarks = remarks;
    if (status) transaction.status = status;
    
    if (date) {
      const newDate = new Date(date);
      transaction.date = newDate;
      transaction.month = newDate.getMonth() + 1;
      transaction.year = newDate.getFullYear();
    }
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: error.message
    });
  }
});

// Delete transaction
router.delete('/transactions/:id', async (req, res) => {
  try {
    const transaction = await CashTransaction.findByIdAndDelete(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message
    });
  }
});

// ==================== SUMMARY & ANALYTICS ROUTES ====================

// Get monthly summary
router.get('/summary/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }
    
    const summary = await CashTransaction.getMonthlySummary(
      parseInt(year),
      parseInt(month)
    );
    
    const insights = await CashTransaction.getMonthlyInsights(
      parseInt(year),
      parseInt(month)
    );
    
    res.json({
      success: true,
      summary,
      insights
    });
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly summary',
      error: error.message
    });
  }
});

// Get yearly overview
router.get('/summary/yearly', async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required'
      });
    }
    
    const overview = await CashTransaction.getYearlyOverview(parseInt(year));
    
    res.json({
      success: true,
      overview
    });
  } catch (error) {
    console.error('Error fetching yearly overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yearly overview',
      error: error.message
    });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = {};
    if (type) query.type = type;
    
    const categories = await CashTransaction.distinct('category', query);
    
    res.json({
      success: true,
      categories: categories.sort()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// ==================== MONTHLY NOTES ROUTES ====================

// Get monthly note
router.get('/notes/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const note = await MonthlyNote.findOne({
      year: parseInt(year),
      month: parseInt(month)
    });
    
    res.json({
      success: true,
      note: note || { note: '', year: parseInt(year), month: parseInt(month) }
    });
  } catch (error) {
    console.error('Error fetching monthly note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly note',
      error: error.message
    });
  }
});

// Save or update monthly note
router.post('/notes', async (req, res) => {
  try {
    const { year, month, note } = req.body;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }
    
    const existingNote = await MonthlyNote.findOne({
      year: parseInt(year),
      month: parseInt(month)
    });
    
    if (existingNote) {
      existingNote.note = note || '';
      existingNote.addedBy = req.admin.id;
      existingNote.addedByName = req.admin.username;
      await existingNote.save();
      
      res.json({
        success: true,
        message: 'Note updated successfully',
        note: existingNote
      });
    } else {
      const newNote = new MonthlyNote({
        year: parseInt(year),
        month: parseInt(month),
        note: note || '',
        addedBy: req.admin.id,
        addedByName: req.admin.username
      });
      
      await newNote.save();
      
      res.status(201).json({
        success: true,
        message: 'Note created successfully',
        note: newNote
      });
    }
  } catch (error) {
    console.error('Error saving monthly note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly note',
      error: error.message
    });
  }
});

// ==================== PDF EXPORT ROUTE (Super Admin Only) ====================

// Helper function to draw pie chart with labels INSIDE slices (no arrows)
function drawPieChart(doc, x, y, radius, data, colors) {
  let currentAngle = -Math.PI / 2; // Start at top
  
  data.forEach((item, index) => {
    const sliceAngle = (item.value / item.total) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    
    // Draw slice with white border
    doc.save();
    doc.path(`M ${x},${y} L ${x + radius * Math.cos(currentAngle)},${y + radius * Math.sin(currentAngle)}`)
       .arc(x, y, radius, currentAngle, endAngle)
       .lineTo(x, y)
       .fillColor(colors[index])
       .fill()
       .strokeColor('#FFFFFF')
       .lineWidth(2)
       .stroke();
    doc.restore();
    
    // Calculate middle angle for label positioning INSIDE slice
    const middleAngle = currentAngle + sliceAngle / 2;
    const percentage = ((item.value / item.total) * 100).toFixed(1);
    
    // Only show label if slice is big enough (>8% for better readability)
    if (parseFloat(percentage) > 8) {
      // Position label at 65% of radius (inside the slice, slightly outward)
      const labelDistance = radius * 0.65;
      const labelX = x + labelDistance * Math.cos(middleAngle);
      const labelY = y + labelDistance * Math.sin(middleAngle);
      
      // Draw label text INSIDE slice with WHITE color and shadow for better visibility
      doc.save();
      
      // Add text shadow effect for better readability
      doc.fontSize(9).fillColor('#000000').font('Helvetica-Bold').opacity(0.3)
         .text(item.label, labelX - 45 + 1, labelY - 12 + 1, { width: 90, align: 'center' });
      doc.opacity(1);
      
      // Main text in white
      doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold')
         .text(item.label, labelX - 45, labelY - 12, { width: 90, align: 'center' });
      doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold')
         .text(`${percentage}%`, labelX - 45, labelY + 2, { width: 90, align: 'center' });
      doc.restore();
    }
    
    currentAngle = endAngle;
  });
}

// Helper function to draw COMPACT color legend (category-based, max 10 items)
function drawColorLegend(doc, x, y, data, colors) {
  // Group by category for a cleaner legend
  const categoryTotals = {};
  let grandTotal = 0;
  
  data.forEach((item, index) => {
    const key = `${item.type}-${item.category}`;
    if (!categoryTotals[key]) {
      categoryTotals[key] = {
        category: item.category,
        type: item.type,
        total: 0,
        colorIndex: Object.keys(categoryTotals).length
      };
    }
    categoryTotals[key].total += item.value;
    grandTotal += item.value;
  });
  
  const categories = Object.values(categoryTotals).slice(0, 8); // Max 8 categories
  
  if (categories.length === 0) return y;
  
  // Legend title
  doc.fontSize(9).fillColor('#000000').font('Helvetica-Bold')
     .text('Légende:', x, y, { width: 200, align: 'left' });
  doc.font('Helvetica');
  
  const startY = y + 15;
  const columns = 2;
  const columnWidth = 120;
  const rowHeight = 18;
  
  categories.forEach((cat, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    const itemX = x + (col * columnWidth);
    const itemY = startY + (row * rowHeight);
    
    // Draw color box
    doc.rect(itemX, itemY, 10, 10).fillAndStroke(colors[cat.colorIndex % colors.length], '#000000');
    
    // Draw label
    const percentage = ((cat.total / grandTotal) * 100).toFixed(1);
    const typeIndicator = cat.type === 'income' ? '↑' : '↓';
    
    doc.fontSize(6).fillColor('#000000')
       .text(`${typeIndicator} ${cat.category} (${percentage}%)`, itemX + 14, itemY + 1, { width: 105, lineBreak: false });
  });
  
  const totalRows = Math.ceil(categories.length / columns);
  return startY + (totalRows * rowHeight) + 10;
}

// Export monthly report as PDF
router.get('/export/pdf', requireSuperAdmin, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }
    
    const yearInt = parseInt(year);
    const monthInt = parseInt(month);
    
    // Get data
    const transactions = await CashTransaction.find({
      year: yearInt,
      month: monthInt
    }).sort({ date: 1 });
    
    const summary = await CashTransaction.getMonthlySummary(yearInt, monthInt);
    const insights = await CashTransaction.getMonthlyInsights(yearInt, monthInt);
    const note = await MonthlyNote.findOne({ year: yearInt, month: monthInt });
    
    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    
    // Set response headers
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const filename = `Cash_Register_${yearInt}_${monthInt}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // Add logo
    const logoPath = require('path').join(__dirname, '..', 'Img', 'logo.png');
    try {
      doc.image(logoPath, 40, 30, { width: 60 });
    } catch (err) {
      console.log('Logo not found, skipping');
    }
    
    // Header (with space for logo on left)
    doc.fontSize(16).fillColor('#000000').text('Nisrine School', 120, 40, { underline: true });
    doc.fontSize(12).text('Rapport de Caisse', 120, 58);
    
    doc.fontSize(10).text(`Mois du Rapport: ${monthNames[monthInt - 1]} ${yearInt}`, 120, 75);
    doc.fontSize(8).fillColor('#666666').text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 120, 88);
    doc.text(`Généré par: ${req.admin.username}`, 120, 98);
    
    doc.y = 120;
    
    // Summary Overview Box
    doc.fontSize(11).fillColor('#ef4444').font('Helvetica-Bold').text('Résumé Général', { underline: true });
    doc.font('Helvetica');
    doc.moveDown(0.3);
    
    const summaryTableTop = doc.y;
    const summaryLeft = 40;
    const summaryWidth = 250;
    
    // Draw summary table with borders
    doc.rect(summaryLeft, summaryTableTop, summaryWidth, 60).stroke();
    doc.moveTo(summaryLeft, summaryTableTop + 15).lineTo(summaryLeft + summaryWidth, summaryTableTop + 15).stroke();
    doc.moveTo(summaryLeft, summaryTableTop + 30).lineTo(summaryLeft + summaryWidth, summaryTableTop + 30).stroke();
    doc.moveTo(summaryLeft, summaryTableTop + 45).lineTo(summaryLeft + summaryWidth, summaryTableTop + 45).stroke();
    doc.moveTo(summaryLeft + 125, summaryTableTop).lineTo(summaryLeft + 125, summaryTableTop + 60).stroke();
    
    doc.fontSize(9).fillColor('#000000');
    doc.text('Revenu Total:', summaryLeft + 5, summaryTableTop + 3, { width: 115 });
    doc.text(`+${summary.totalIncome.toFixed(2)} MAD`, summaryLeft + 130, summaryTableTop + 3, { width: 115 });
    
    doc.text('Dépenses Totales:', summaryLeft + 5, summaryTableTop + 18, { width: 115 });
    doc.text(`-${summary.totalExpenses.toFixed(2)} MAD`, summaryLeft + 130, summaryTableTop + 18, { width: 115 });
    
    const netColor = summary.isProfitable ? '#10b981' : '#ef4444';
    doc.text('Résultat Net:', summaryLeft + 5, summaryTableTop + 33, { width: 115 });
    doc.fillColor(netColor).text(`${summary.netResult >= 0 ? '+' : ''}${summary.netResult.toFixed(2)} MAD`, summaryLeft + 130, summaryTableTop + 33, { width: 115 });
    
    doc.fillColor('#000000');
    if (summary.topExpenseCategory) {
      doc.text('Catégorie Principale:', summaryLeft + 5, summaryTableTop + 48, { width: 115 });
      doc.fontSize(8).text(`${summary.topExpenseCategory.name}`, summaryLeft + 130, summaryTableTop + 48, { width: 115 });
    }
    
    doc.y = summaryTableTop;
    
    // Pie Chart - COMPACT layout with category-based data
    const pageWidth = 515; // A4 page width minus margins
    const summaryTableBottom = summaryTableTop + 60; // Summary table ends at +60px
    
    // Group transactions by category for cleaner pie chart
    const categoryData = {};
    let totalAmount = 0;
    
    transactions.forEach(t => {
      const key = `${t.type}-${t.category}`;
      if (!categoryData[key]) {
        categoryData[key] = {
          label: t.category,
          value: 0,
          type: t.type,
          category: t.category
        };
      }
      categoryData[key].value += t.amount;
      totalAmount += t.amount;
    });
    
    const pieData = Object.values(categoryData);
    pieData.forEach(item => item.total = totalAmount);
    
    if (pieData.length > 0 && totalAmount > 0) {
      // Title for pie chart
      doc.fontSize(10).fillColor('#ef4444').font('Helvetica-Bold')
         .text('Répartition par Catégorie', 40, summaryTableBottom + 10, { width: pageWidth, align: 'center', underline: true });
      doc.font('Helvetica');
      
      // Color palette (10 colors for categories)
      const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981', 
        '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'
      ];
      
      // Compact layout: Pie on LEFT, Legend on RIGHT
      const pieRadius = 60; // Smaller pie
      const pieChartY = summaryTableBottom + 90;
      const pieChartCenterX = 140;
      const legendStartX = 280;
      
      // Draw pie chart
      drawPieChart(doc, pieChartCenterX, pieChartY, pieRadius, pieData, colors);
      
      // Draw compact legend
      const legendEndY = drawColorLegend(doc, legendStartX, summaryTableBottom + 50, pieData, colors);
      
      // Set position for transactions table
      const tableStartY = Math.max(summaryTableBottom + 180, legendEndY + 20);
      doc.y = tableStartY;
    } else {
      // No transactions, use default spacing
      doc.y = summaryTableBottom + 20;
    }
    
    // Transactions Table (below everything) - Dynamic spacing based on legend height
    doc.fontSize(10).fillColor('#ef4444').font('Helvetica-Bold').text('Transactions Mensuelles', 40, doc.y, { underline: true });
    doc.font('Helvetica');
    doc.moveDown(0.3);
    
    if (transactions.length === 0) {
      doc.fontSize(8).fillColor('#666666').text('Aucune transaction enregistrée pour ce mois.');
    } else {
      const tableLeft = 40;
      const col1Width = 55;  // Date
      const col2Width = 45;  // Type
      const col3Width = 150; // Titre
      const col4Width = 65;  // Montant
      const col5Width = 145; // Remarques
      const totalWidth = col1Width + col2Width + col3Width + col4Width + col5Width;
      const rowHeight = 14;  // Smaller rows
      const pageBottom = 750; // Leave space for footer
      
      let currentY = doc.y;
      let isFirstPage = true;
      
      // Function to draw table header
      const drawTableHeader = (y) => {
        doc.rect(tableLeft, y, totalWidth, rowHeight).fillAndStroke('#f0f0f0', '#000000');
        doc.fontSize(7).fillColor('#000000').font('Helvetica-Bold');
        doc.text('Date', tableLeft + 3, y + 3, { width: col1Width - 6 });
        doc.text('Type', tableLeft + col1Width + 3, y + 3, { width: col2Width - 6 });
        doc.text('Titre', tableLeft + col1Width + col2Width + 3, y + 3, { width: col3Width - 6 });
        doc.text('Montant', tableLeft + col1Width + col2Width + col3Width + 3, y + 3, { width: col4Width - 6 });
        doc.text('Remarques', tableLeft + col1Width + col2Width + col3Width + col4Width + 3, y + 3, { width: col5Width - 6 });
        doc.font('Helvetica');
        return y + rowHeight;
      };
      
      // Draw initial header
      currentY = drawTableHeader(currentY);
      
      // ALL transactions - no truncation
      transactions.forEach((transaction, index) => {
        // Check if we need a new page
        if (currentY + rowHeight > pageBottom) {
          doc.addPage();
          currentY = 40;
          currentY = drawTableHeader(currentY);
        }
        
        // Draw row border
        doc.rect(tableLeft, currentY, totalWidth, rowHeight).stroke();
        
        // Vertical lines
        doc.moveTo(tableLeft + col1Width, currentY).lineTo(tableLeft + col1Width, currentY + rowHeight).stroke();
        doc.moveTo(tableLeft + col1Width + col2Width, currentY).lineTo(tableLeft + col1Width + col2Width, currentY + rowHeight).stroke();
        doc.moveTo(tableLeft + col1Width + col2Width + col3Width, currentY).lineTo(tableLeft + col1Width + col2Width + col3Width, currentY + rowHeight).stroke();
        doc.moveTo(tableLeft + col1Width + col2Width + col3Width + col4Width, currentY).lineTo(tableLeft + col1Width + col2Width + col3Width + col4Width, currentY + rowHeight).stroke();
        
        const typeText = transaction.type === 'income' ? 'Revenu' : 'Dépense';
        const typeColor = transaction.type === 'income' ? '#10b981' : '#ef4444';
        
        doc.fontSize(6).fillColor('#000000');
        doc.text(new Date(transaction.date).toLocaleDateString('fr-FR'), tableLeft + 2, currentY + 4, { width: col1Width - 4 });
        doc.fillColor(typeColor).text(typeText, tableLeft + col1Width + 2, currentY + 4, { width: col2Width - 4 });
        doc.fillColor('#000000');
        doc.text(transaction.title.substring(0, 35), tableLeft + col1Width + col2Width + 2, currentY + 4, { width: col3Width - 4 });
        doc.text(`${transaction.amount.toFixed(2)} MAD`, tableLeft + col1Width + col2Width + col3Width + 2, currentY + 4, { width: col4Width - 4 });
        doc.text((transaction.remarks || '-').substring(0, 30), tableLeft + col1Width + col2Width + col3Width + col4Width + 2, currentY + 4, { width: col5Width - 4 });
        
        currentY += rowHeight;
      });
      
      doc.y = currentY + 10;
    }
    
    // Footer at bottom of page with dynamic year
    const currentYear = new Date().getFullYear();
    doc.fontSize(8).fillColor('#666666').text(
      `Nisrine School – Système de Caisse\nGénéré automatiquement par Nisrine School Management Software\n© ${currentYear} Nisrine School`,
      40, 750, { align: 'center', width: 515 }
    );
    
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
});

// ==================== RECEIPT ROUTES ====================

// Upload receipt for a transaction
router.post('/transactions/:id/receipt', receiptUpload.single('receipt'), async (req, res) => {
  try {
    const transaction = await CashTransaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    let mimeType = req.file.mimetype;
    let receiptBuffer;
    let ext = 'jpg';
    
    // If it's an image (not PDF), optimize it
    if (req.file.mimetype.startsWith('image/')) {
      // Validate image
      const validation = await imageOptimizer.validateImageReadability(req.file.buffer);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }
      
      // Optimize the image (use CIN config for receipts - good balance of quality/size)
      const optimized = await imageOptimizer.optimizeCINImage(req.file.buffer, 'receipt');
      receiptBuffer = optimized.buffer;
      mimeType = 'image/jpeg';
      ext = 'jpg';
      
      console.log(`📄 Receipt optimized: ${imageOptimizer.formatBytes(req.file.buffer.length)} → ${imageOptimizer.formatBytes(optimized.size)} (${optimized.compressionRatio}% reduction)`);
    } else {
      // For PDFs, store as-is but check size
      if (req.file.buffer.length > 2 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'PDF file too large. Maximum size is 2MB.'
        });
      }
      receiptBuffer = req.file.buffer;
      ext = 'pdf';
    }
    
    // Upload receipt to Mega.nz
    let receiptPath;
    try {
      receiptPath = await imageStorageService.uploadReceipt(receiptBuffer, req.params.id, ext);
    } catch (megaErr) {
      console.error('⚠️ Mega receipt upload failed, falling back to base64:', megaErr.message);
      receiptPath = receiptBuffer.toString('base64');
    }
    
    // Update transaction with receipt
    transaction.receiptImage = {
      data: receiptPath,
      mimeType: mimeType,
      fileName: req.file.originalname,
      uploadedAt: new Date(),
      uploadedBy: req.admin.id,
      uploadedByName: req.admin.username
    };
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      receipt: {
        fileName: req.file.originalname,
        uploadedAt: transaction.receiptImage.uploadedAt,
        uploadedByName: transaction.receiptImage.uploadedByName
      }
    });
    
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload receipt',
      error: error.message
    });
  }
});

// Get receipt for a transaction (for viewing)
router.get('/transactions/:id/receipt', async (req, res) => {
  try {
    const transaction = await CashTransaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    if (!transaction.receiptImage || !transaction.receiptImage.data) {
      return res.status(404).json({
        success: false,
        message: 'No receipt found for this transaction'
      });
    }
    
    // Return receipt data for modal display
    // If stored as Mega path, return the URL; if base64, return as-is
    let receiptData = transaction.receiptImage.data;
    if (imageStorageService.isMediaPath(receiptData)) {
      // For Mega-stored receipts, return the URL for the frontend to use as img src
      receiptData = receiptData; // Already a URL path like /api/media/receipts/xxx.jpg
    }
    
    res.json({
      success: true,
      receipt: {
        data: receiptData,
        mimeType: transaction.receiptImage.mimeType,
        fileName: transaction.receiptImage.fileName,
        uploadedAt: transaction.receiptImage.uploadedAt,
        uploadedByName: transaction.receiptImage.uploadedByName
      }
    });
    
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch receipt',
      error: error.message
    });
  }
});

// Download receipt for a transaction
router.get('/transactions/:id/receipt/download', async (req, res) => {
  try {
    const transaction = await CashTransaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    if (!transaction.receiptImage || !transaction.receiptImage.data) {
      return res.status(404).json({
        success: false,
        message: 'No receipt found for this transaction'
      });
    }
    
    // Handle both Mega paths and legacy base64
    let buffer;
    if (imageStorageService.isMediaPath(transaction.receiptImage.data)) {
      buffer = await imageStorageService.getImageBuffer(transaction.receiptImage.data);
    } else {
      buffer = Buffer.from(transaction.receiptImage.data, 'base64');
    }
    
    const fileName = transaction.receiptImage.fileName || `receipt_${transaction._id}.jpg`;
    
    // Set appropriate content type
    res.setHeader('Content-Type', transaction.receiptImage.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    
  } catch (error) {
    console.error('Error downloading receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download receipt',
      error: error.message
    });
  }
});

// Delete receipt from a transaction (without deleting the transaction)
router.delete('/transactions/:id/receipt', async (req, res) => {
  try {
    const transaction = await CashTransaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    if (!transaction.receiptImage || !transaction.receiptImage.data) {
      return res.status(404).json({
        success: false,
        message: 'No receipt found for this transaction'
      });
    }
    
    // Delete from Mega if stored there
    if (imageStorageService.isMediaPath(transaction.receiptImage.data)) {
      const ext = transaction.receiptImage.mimeType === 'application/pdf' ? 'pdf' : 'jpg';
      await imageStorageService.deleteImage('receipts', `${transaction._id}.${ext}`);
    }
    
    // Clear the receipt data
    transaction.receiptImage = {
      data: null,
      mimeType: null,
      fileName: null,
      uploadedAt: null,
      uploadedBy: null,
      uploadedByName: null
    };
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Receipt deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete receipt',
      error: error.message
    });
  }
});

module.exports = router;
