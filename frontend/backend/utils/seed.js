require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');
const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Food',          emoji: '🍔', type: 'expense', color: '#f59e0b', isDefault: true },
  { name: 'Transport',     emoji: '🚗', type: 'expense', color: '#3b82f6', isDefault: true },
  { name: 'Shopping',      emoji: '🛍️', type: 'expense', color: '#8b5cf6', isDefault: true },
  { name: 'Bills',         emoji: '💡', type: 'expense', color: '#ef4444', isDefault: true },
  { name: 'Health',        emoji: '💊', type: 'expense', color: '#10b981', isDefault: true },
  { name: 'Entertainment', emoji: '🎬', type: 'expense', color: '#f97316', isDefault: true },
  { name: 'Education',     emoji: '📚', type: 'expense', color: '#06b6d4', isDefault: true },
  { name: 'Travel',        emoji: '✈️', type: 'expense', color: '#64748b', isDefault: true },
  { name: 'Salary',        emoji: '💼', type: 'income',  color: '#059669', isDefault: true },
  { name: 'Freelance',     emoji: '💻', type: 'income',  color: '#7c3aed', isDefault: true },
  { name: 'Investment',    emoji: '📈', type: 'income',  color: '#0891b2', isDefault: true },
  { name: 'Other',         emoji: '📦', type: 'both',    color: '#6b7280', isDefault: true },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create default categories
    await Category.deleteMany({ isDefault: true });
    await Category.insertMany(DEFAULT_CATEGORIES);
    console.log('✅ Default categories seeded');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@moneymate.com' });
    if (!adminExists) {
      await User.create({
        name:     'Admin',
        email:    'admin@moneymate.com',
        password: 'Admin@123',
        role:     'admin',
      });
      console.log('✅ Admin user created: admin@moneymate.com / Admin@123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
