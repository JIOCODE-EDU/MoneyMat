const multer      = require('multer');
const csv         = require('csv-parser');
const fs          = require('fs');
const path        = require('path');
const PDFDocument = require('pdfkit');
const Statement   = require('../models/Statement');
const Transaction = require('../models/Transaction');

// ── Multer config ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// POST /api/statements/upload
exports.uploadStatement = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const statement = await Statement.create({
      user:         req.user._id,
      filename:     req.file.filename,
      originalName: req.file.originalname,
      fileSize:     req.file.size,
      mimeType:     req.file.mimetype,
      status:       'processing',
    });

    // Parse CSV asynchronously
    const rows = [];
    const errors = [];
    let rowIndex = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        rowIndex++;
        try {
          // Flexible CSV format: date, description, amount, type, category
          const normalised = {
            date:        row.date || row.Date || row.DATE,
            description: row.description || row.Description || row.DESCRIPTION || row.narration || row.Narration,
            amount:      parseFloat(row.amount || row.Amount || row.AMOUNT || 0),
            type:        (row.type || row.Type || row.TYPE || 'expense').toLowerCase(),
            category:    row.category || row.Category || row.CATEGORY || 'Other',
          };

          if (!normalised.date || !normalised.description || isNaN(normalised.amount)) {
            errors.push({ row: rowIndex, message: 'Missing required fields (date, description, amount)' });
            return;
          }
          rows.push(normalised);
        } catch (e) {
          errors.push({ row: rowIndex, message: e.message });
        }
      })
      .on('end', async () => {
        try {
          let imported = 0;
          let totalIncome = 0, totalExpense = 0;

          for (const row of rows) {
            await Transaction.create({
              user:        req.user._id,
              description: row.description,
              amount:      Math.abs(row.amount),
              type:        row.type,
              category:    row.category,
              date:        new Date(row.date),
              statementSource: statement._id,
            });
            imported++;
            if (row.type === 'income')  totalIncome  += Math.abs(row.amount);
            else                        totalExpense += Math.abs(row.amount);
          }

          await Statement.findByIdAndUpdate(statement._id, {
            status:          'completed',
            totalRecords:    rowIndex,
            importedRecords: imported,
            skippedRecords:  errors.length,
            totalIncome,
            totalExpense,
            parsingErrors: errors,
          });

          // Clean up file
          fs.unlinkSync(req.file.path);
        } catch (e) {
          await Statement.findByIdAndUpdate(statement._id, { status: 'failed' });
        }
      });

    res.status(202).json({
      success: true,
      message: 'Statement uploaded and processing',
      statementId: statement._id,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/statements
exports.getStatements = async (req, res, next) => {
  try {
    const statements = await Statement.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: statements });
  } catch (err) {
    next(err);
  }
};

// GET /api/statements/:id
exports.getStatement = async (req, res, next) => {
  try {
    const stmt = await Statement.findOne({ _id: req.params.id, user: req.user._id });
    if (!stmt) return res.status(404).json({ success: false, message: 'Statement not found' });
    res.json({ success: true, data: stmt });
  } catch (err) {
    next(err);
  }
};

// GET /api/statements/export/pdf
exports.exportPDF = async (req, res, next) => {
  try {
    const { startDate, endDate, month, year } = req.query;

    const filter = { user: req.user._id };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
    } else if (month && year) {
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59),
      };
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    const user = req.user;

    const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="moneymate-statement-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('MoneyMate Statement', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(`Account: ${user.name} (${user.email})`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, { align: 'center' });
    doc.moveDown();

    // Summary box
    doc.rect(50, doc.y, 495, 70).fill('#f0fdf4').stroke();
    const summaryY = doc.y + 10;
    doc.fillColor('#000').fontSize(11).font('Helvetica-Bold');
    doc.text(`Total Income:   ₹${totalIncome.toLocaleString('en-IN')}`,   70, summaryY);
    doc.text(`Total Expense:  ₹${totalExpense.toLocaleString('en-IN')}`,  70, summaryY + 18);
    doc.fillColor(totalIncome - totalExpense >= 0 ? '#059669' : '#e11d48');
    doc.text(`Balance:        ₹${(totalIncome - totalExpense).toLocaleString('en-IN')}`, 70, summaryY + 36);
    doc.fillColor('#000');
    doc.moveDown(3.5);

    // Table header
    const colX = [50, 130, 280, 380, 460];
    doc.font('Helvetica-Bold').fontSize(10);
    doc.rect(50, doc.y, 495, 20).fill('#e6f7f1').stroke();
    const headerY = doc.y + 5;
    doc.fillColor('#000');
    doc.text('Date',        colX[0], headerY);
    doc.text('Description', colX[1], headerY);
    doc.text('Category',    colX[2], headerY);
    doc.text('Type',        colX[3], headerY);
    doc.text('Amount',      colX[4], headerY);
    doc.moveDown(1.2);

    // Rows
    doc.font('Helvetica').fontSize(9);
    transactions.forEach((txn, idx) => {
      if (doc.y > 720) { doc.addPage(); }
      const rowY = doc.y;
      if (idx % 2 === 0) doc.rect(50, rowY, 495, 18).fill('#f9fafb').stroke();
      doc.fillColor(txn.type === 'income' ? '#059669' : '#e11d48');
      const d = new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
      doc.fillColor('#000');
      doc.text(d,                               colX[0], rowY + 4, { width: 75 });
      doc.text(txn.description.slice(0, 28),    colX[1], rowY + 4, { width: 140 });
      doc.text(txn.category,                    colX[2], rowY + 4, { width: 90 });
      doc.fillColor(txn.type === 'income' ? '#059669' : '#e11d48');
      doc.text(txn.type.toUpperCase(),          colX[3], rowY + 4, { width: 70 });
      doc.text(`₹${txn.amount.toLocaleString('en-IN')}`, colX[4], rowY + 4, { width: 85 });
      doc.fillColor('#000');
      doc.moveDown(1.3);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
};

// GET /api/statements/export/csv
exports.exportCSV = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    const transactions = await Transaction.find(filter).sort({ date: -1 });

    const header = 'Date,Description,Amount,Type,Category,Notes\n';
    const rows = transactions.map(t =>
      `"${new Date(t.date).toLocaleDateString('en-IN')}","${t.description}","${t.amount}","${t.type}","${t.category}","${t.notes || ''}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="moneymate-export-${Date.now()}.csv"`);
    res.send(header + rows);
  } catch (err) {
    next(err);
  }
};
