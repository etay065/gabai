require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const scheduleRoutes = require('./routes/schedule');
const settingsRoutes = require('./routes/settings');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://gabai-1-4b6f.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedDefaultData();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

async function seedDefaultData() {
  const Settings = require('./models/Settings');
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');

  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    await Settings.create({
      shulName: 'בית הכנסת הגדול',
      city: 'תל אביב',
      parasha: 'בהעלותך',
    });
    console.log('✅ Default settings seeded');
  }

  const existingGabai = await User.findOne({ role: 'gabai' });
  if (!existingGabai) {
    const hash = await bcrypt.hash('1234', 10);
    await User.create({ username: 'gabai', password: hash, role: 'gabai' });
    console.log('✅ Default gabai user seeded (username: gabai, password: 1234)');
  }
}
