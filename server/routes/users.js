const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.use(protect);

// PUT /api/users/profile
router.put('/profile', async (req, res, next) => {
  try {
    const { name, currency } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, currency },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: user, message: 'Profile updated' });
  } catch (err) { next(err); }
});

module.exports = router;
