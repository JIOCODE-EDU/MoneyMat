const Transaction = require('../models/Transaction');
const mongoose    = require('mongoose');

// GET /api/analytics/summary
exports.getSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const uid = req.user._id;

    const matchFilter = { user: uid };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);
      matchFilter.date = { $gte: start, $lte: end };
    }

    const agg = await Transaction.aggregate([
      { $match: matchFilter },
      { $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      }},
    ]);

    const income  = agg.find(a => a._id === 'income')  || { total: 0, count: 0 };
    const expense = agg.find(a => a._id === 'expense') || { total: 0, count: 0 };

    res.json({
      success: true,
      data: {
        totalIncome:   income.total,
        totalExpense:  expense.total,
        balance:       income.total - expense.total,
        incomeCount:   income.count,
        expenseCount:  expense.count,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/by-category
exports.getByCategory = async (req, res, next) => {
  try {
    const { month, year, type = 'expense' } = req.query;
    const matchFilter = { user: req.user._id, type };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);
      matchFilter.date = { $gte: start, $lte: end };
    }

    const agg = await Transaction.aggregate([
      { $match: matchFilter },
      { $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      }},
      { $sort: { total: -1 } },
    ]);

    const grandTotal = agg.reduce((s, a) => s + a.total, 0);
    const data = agg.map(a => ({
      category: a._id,
      total:    a.total,
      count:    a.count,
      percentage: grandTotal > 0 ? ((a.total / grandTotal) * 100).toFixed(1) : 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/monthly-trend
exports.getMonthlyTrend = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const agg = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31T23:59:59`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
    }));

    agg.forEach(a => {
      const idx = a._id.month - 1;
      months[idx][a._id.type] = a.total;
    });

    months.forEach(m => { m.balance = m.income - m.expense; });

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/recent
exports.getRecentTransactions = async (req, res, next) => {
  try {
    const txns = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(10);
    res.json({ success: true, data: txns });
  } catch (err) {
    next(err);
  }
};
