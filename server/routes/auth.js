const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'נדרשים שם משתמש וסיסמה' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// POST /api/auth/change-password  (protected)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4)
      return res.status(400).json({ message: 'סיסמה חייבת להכיל לפחות 4 תווים' });

    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hash });
    res.json({ message: 'הסיסמה עודכנה בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// GET /api/auth/me  (protected)
router.get('/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

module.exports = router;
