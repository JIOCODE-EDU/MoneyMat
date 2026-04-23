const Transaction = require('../models/Transaction');

// GET /api/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      type, category,
      startDate, endDate,
      search, sortBy = 'date', sortOrder = 'desc',
    } = req.query;

    const filter = { user: req.user._id };
    if (type)     filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate + 'T23:59:59');
    }
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/:id
exports.getTransaction = async (req, res, next) => {
  try {
    const txn = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: txn });
  } catch (err) {
    next(err);
  }
};

// POST /api/transactions
exports.createTransaction = async (req, res, next) => {
  try {
    const { description, amount, type, category, date, notes, tags, isRecurring, recurringInterval } = req.body;
    if (!description || !amount || !type || !category || !date) {
      return res.status(400).json({ success: false, message: 'Description, amount, type, category and date are required' });
    }

    const txn = await Transaction.create({
      user: req.user._id,
      description, amount, type, category, date, notes, tags, isRecurring, recurringInterval,
    });
    res.status(201).json({ success: true, data: txn, message: 'Transaction added' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/transactions/:id
exports.updateTransaction = async (req, res, next) => {
  try {
    const txn = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: txn, message: 'Transaction updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res, next) => {
  try {
    const txn = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/transactions (bulk delete all for user)
exports.deleteAll = async (req, res, next) => {
  try {
    await Transaction.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'All transactions deleted' });
  } catch (err) {
    next(err);
  }
};
