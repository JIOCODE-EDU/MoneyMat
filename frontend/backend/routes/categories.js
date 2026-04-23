const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const Category = require('../models/Category');

router.use(protect);

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({
      $or: [{ user: req.user._id }, { isDefault: true }],
    }).sort({ isDefault: -1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

// POST /api/categories
router.post('/', async (req, res, next) => {
  try {
    const { name, emoji, type, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const cat = await Category.create({ user: req.user._id, name, emoji, type, color });
    res.status(201).json({ success: true, data: cat });
  } catch (err) { next(err); }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res, next) => {
  try {
    const cat = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: cat });
  } catch (err) { next(err); }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const cat = await Category.findOneAndDelete({ _id: req.params.id, user: req.user._id, isDefault: false });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found or is a default' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
