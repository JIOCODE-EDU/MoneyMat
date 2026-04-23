const User        = require('../models/User');
const Transaction = require('../models/Transaction');
const Statement   = require('../models/Statement');

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTransactions, totalStatements, recentUsers] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      Statement.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email role createdAt isActive'),
    ]);

    const incomeAgg = await Transaction.aggregate([
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    const totals = { income: 0, expense: 0 };
    incomeAgg.forEach(a => { totals[a._id] = a.total; });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTransactions,
        totalStatements,
        platformIncome:  totals.income,
        platformExpense: totals.expense,
        recentUsers,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: 'Role updated' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/status
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await Transaction.deleteMany({ user: req.params.id });
    res.json({ success: true, message: 'User and their data deleted' });
  } catch (err) {
    next(err);
  }
};
