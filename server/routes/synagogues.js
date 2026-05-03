const router = require('express').Router();
const Synagogue = require('../models/Synagogue');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

// GET /api/synagogues — public list for member login
router.get('/', async (req, res) => {
  try {
    const synagogues = await Synagogue.find().select('name city code').sort({ name: 1 });
    res.json(synagogues);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// GET /api/synagogues/:id — public
router.get('/:id', async (req, res) => {
  try {
    const syn = await Synagogue.findById(req.params.id).select('-gabaiId');
    if (!syn) return res.status(404).json({ message: 'בית כנסת לא נמצא' });
    res.json(syn);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// POST /api/synagogues/register — register new synagogue + gabai account
router.post('/register', async (req, res) => {
  try {
    const { synagogueName, city, gabaiUsername, gabaiPassword } = req.body;
    if (!synagogueName || !city || !gabaiUsername || !gabaiPassword)
      return res.status(400).json({ message: 'כל השדות נדרשים' });

    const existingUser = await User.findOne({ username: gabaiUsername });
    if (existingUser)
      return res.status(400).json({ message: 'שם משתמש כבר קיים' });

    // Create synagogue
    const synagogue = await Synagogue.create({ name: synagogueName, city });

    // Create gabai user
    const hash = await bcrypt.hash(gabaiPassword, 10);
    const gabai = await User.create({
      username: gabaiUsername,
      password: hash,
      role: 'gabai',
      synagogueId: synagogue._id,
    });

    // Link gabai to synagogue
    synagogue.gabaiId = gabai._id;
    await synagogue.save();

    res.status(201).json({ message: 'בית הכנסת נרשם בהצלחה', synagogue: { name: synagogue.name, city: synagogue.city, code: synagogue.code } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// PUT /api/synagogues/:id — update synagogue info (gabai only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.synagogueId !== req.params.id && req.user.synagogueId?.toString() !== req.params.id)
      return res.status(403).json({ message: 'אין הרשאה' });

    const { name, city, parasha } = req.body;
    const syn = await Synagogue.findByIdAndUpdate(req.params.id, { name, city, parasha }, { new: true });
    res.json(syn);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
