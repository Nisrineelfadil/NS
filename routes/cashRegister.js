const express = require('express');
const router = express.Router();
const CashTransaction = require('../models/CashTransaction');
const MonthlyNote = require('../models/MonthlyNote');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');
const PDFDocument = require('pdfkit');

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

// Helper function to draw color legend with transaction details in 2x2 grid on the RIGHT
function drawColorLegend(doc, x, y, data, colors) {
  // Legend title aligned to the right side
  doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold')
     .text('Légende des Couleurs:', x, y, { width: 250, align: 'left', underline: true });
  doc.font('Helvetica');
  
  const startY = y + 25;
  const columns = 2; // Display 2 items per row (2x2 grid)
  const columnWidth = 125; // Width for each column
  const rowHeight = 40; // Height for each row
  
  data.forEach((item, index) => {
    const col = index % columns; // Column position (0-1)
    const row = Math.floor(index / columns); // Row position
    
    const itemX = x + (col * columnWidth);
    const itemY = startY + (row * rowHeight);
    
    // Draw color box
    doc.rect(itemX, itemY, 14, 14).fillAndStroke(colors[index % colors.length], '#000000');
    
    // Draw label with transaction title and percentage
    const percentage = ((item.value / item.total) * 100).toFixed(1);
    const typeIndicator = item.type === 'income' ? '(Rev)' : '(Dép)';
    
    doc.fontSize(7).fillColor('#000000').font('Helvetica-Bold')
       .text(`${item.label}`, itemX + 20, itemY, { width: 100, lineBreak: false });
    doc.fontSize(6).fillColor('#666666').font('Helvetica')
       .text(`${typeIndicator} ${percentage}%`, itemX + 20, itemY + 10, { width: 100, lineBreak: false });
  });
  
  // Return the total height used by the legend
  const totalRows = Math.ceil(data.length / columns);
  return startY + (totalRows * rowHeight);
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
    
    // Pie Chart - CENTERED layout with title
    const pageWidth = 515; // A4 page width minus margins
    const pieChartCenterX = 40 + pageWidth / 2; // Center of page
    const summaryTableBottom = summaryTableTop + 60; // Summary table ends at +60px
    const pieChartY = summaryTableBottom + 80; // Start 80px AFTER summary table
    
    // Prepare individual transactions for pie chart (both income and expenses)
    const allTransactions = transactions.map(t => ({
      title: t.title,
      amount: t.amount,
      type: t.type,
      category: t.category
    }));
    
    const totalAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    if (allTransactions.length > 0 && totalAmount > 0) {
      // Title for pie chart - CENTERED, positioned AFTER summary table
      doc.fontSize(11).fillColor('#ef4444').font('Helvetica-Bold')
         .text('Répartition des Transactions', 40, summaryTableBottom + 15, { width: pageWidth, align: 'center', underline: true });
      doc.font('Helvetica');
      
      // Prepare pie chart data - each transaction is a separate slice
      const pieData = allTransactions.map(t => ({
        label: t.title,
        value: t.amount,
        total: totalAmount,
        type: t.type,
        category: t.category
      }));
      
      // Extended color palette for more transactions (20 colors)
      const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
        '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', 
        '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#ec4899', '#f43f5e', '#fb7185', '#fb923c', '#fbbf24'
      ];
      
      // CENTERED LAYOUT: Pie on LEFT, Legend on RIGHT
      const pieRadius = 80; // Bigger pie
      const totalLayoutWidth = 450; // Total width of pie + legend
      const layoutStartX = 40 + (pageWidth - totalLayoutWidth) / 2; // Center the layout
      
      const pieChartCenterX = layoutStartX + 100; // Pie center position
      const legendStartX = layoutStartX + 230; // Legend start position (after pie)
      
      // Draw pie chart CENTERED on the LEFT with BIGGER size
      drawPieChart(doc, pieChartCenterX, pieChartY + 50, pieRadius, pieData, colors);
      
      // Draw color legend on the RIGHT (2x2 grid)
      const legendEndY = drawColorLegend(doc, legendStartX, pieChartY + 30, pieData, colors);
      
      // Calculate dynamic spacing based on legend height
      const minSpacing = 50; // Minimum 50px gap between legend and table
      const tableStartY = Math.max(summaryTableTop + 280, legendEndY + minSpacing);
      doc.y = tableStartY;
    } else {
      // No transactions, use default spacing
      doc.y = summaryTableTop + 280;
    }
    
    // Transactions Table (below everything) - Dynamic spacing based on legend height
    doc.fontSize(11).fillColor('#ef4444').font('Helvetica-Bold').text('Transactions Mensuelles', 40, doc.y, { underline: true });
    doc.font('Helvetica');
    doc.moveDown(0.5);
    
    if (transactions.length === 0) {
      doc.fontSize(9).fillColor('#666666').text('Aucune transaction enregistrée pour ce mois.');
    } else {
      const tableTop = doc.y;
      const tableLeft = 40;
      const col1Width = 60;
      const col2Width = 50;
      const col3Width = 140;
      const col4Width = 70;
      const col5Width = 140;
      const rowHeight = 18;
      
      // Table header with background
      doc.rect(tableLeft, tableTop, col1Width + col2Width + col3Width + col4Width + col5Width, rowHeight).fillAndStroke('#f0f0f0', '#000000');
      
      doc.fontSize(8).fillColor('#000000');
      doc.text('Date', tableLeft + 5, tableTop + 5, { width: col1Width - 10 });
      doc.text('Type', tableLeft + col1Width + 5, tableTop + 5, { width: col2Width - 10 });
      doc.text('Titre', tableLeft + col1Width + col2Width + 5, tableTop + 5, { width: col3Width - 10 });
      doc.text('Montant', tableLeft + col1Width + col2Width + col3Width + 5, tableTop + 5, { width: col4Width - 10 });
      doc.text('Remarques', tableLeft + col1Width + col2Width + col3Width + col4Width + 5, tableTop + 5, { width: col5Width - 10 });
      
      let currentY = tableTop + rowHeight;
      let rowCount = 0;
      const maxRows = 20; // Limit rows to fit on one page
      
      // Table rows with borders
      transactions.slice(0, maxRows).forEach((transaction, index) => {
        // Draw row border
        doc.rect(tableLeft, currentY, col1Width + col2Width + col3Width + col4Width + col5Width, rowHeight).stroke();
        
        // Vertical lines
        doc.moveTo(tableLeft + col1Width, currentY).lineTo(tableLeft + col1Width, currentY + rowHeight).stroke();
        doc.moveTo(tableLeft + col1Width + col2Width, currentY).lineTo(tableLeft + col1Width + col2Width, currentY + rowHeight).stroke();
        doc.moveTo(tableLeft + col1Width + col2Width + col3Width, currentY).lineTo(tableLeft + col1Width + col2Width + col3Width, currentY + rowHeight).stroke();
        doc.moveTo(tableLeft + col1Width + col2Width + col3Width + col4Width, currentY).lineTo(tableLeft + col1Width + col2Width + col3Width + col4Width, currentY + rowHeight).stroke();
        
        const typeText = transaction.type === 'income' ? 'Revenu' : 'Dépense';
        const typeColor = transaction.type === 'income' ? '#10b981' : '#ef4444';
        
        doc.fontSize(7).fillColor('#000000');
        doc.text(new Date(transaction.date).toLocaleDateString('fr-FR'), tableLeft + 3, currentY + 5, { width: col1Width - 6 });
        doc.fillColor(typeColor).text(typeText, tableLeft + col1Width + 3, currentY + 5, { width: col2Width - 6 });
        doc.fillColor('#000000');
        doc.text(transaction.title, tableLeft + col1Width + col2Width + 3, currentY + 5, { width: col3Width - 6 });
        doc.text(`${transaction.amount.toFixed(2)} MAD`, tableLeft + col1Width + col2Width + col3Width + 3, currentY + 5, { width: col4Width - 6 });
        doc.text(transaction.remarks || '-', tableLeft + col1Width + col2Width + col3Width + col4Width + 3, currentY + 5, { width: col5Width - 6 });
        
        currentY += rowHeight;
        rowCount++;
      });
      
      if (transactions.length > maxRows) {
        doc.fontSize(7).fillColor('#666666').text(`... et ${transactions.length - maxRows} autres transactions`, tableLeft, currentY + 5);
      }
      
      doc.y = currentY;
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

module.exports = router;
