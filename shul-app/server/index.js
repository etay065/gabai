require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes       = require('./routes/auth');
const requestRoutes    = require('./routes/requests');
const scheduleRoutes   = require('./routes/schedule');
const synagogueRoutes  = require('./routes/synagogues');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://gabai-1-4b6f.onrender.com',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth',       authRoutes);
app.use('/api/requests',   requestRoutes);
app.use('/api/schedule',   scheduleRoutes);
app.use('/api/synagogues', synagogueRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedDemo();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

async function seedDemo() {
  const Synagogue = require('./models/Synagogue');
  const User      = require('./models/User');
  const bcrypt    = require('bcryptjs');

  const existing = await Synagogue.findOne({ name: 'בית הכנסת הגדול' });
  if (!existing) {
    const syn = await Synagogue.create({ name: 'בית הכנסת הגדול', city: 'תל אביב', parasha: 'בהעלותך' });
    const hash = await bcrypt.hash('1234', 10);
    const gabai = await User.create({ username: 'gabai', password: hash, role: 'gabai', synagogueId: syn._id });
    syn.gabaiId = gabai._id;
    await syn.save();
    console.log('✅ Demo synagogue + gabai seeded (username: gabai, password: 1234)');
  }
}
