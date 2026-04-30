const router = require('express').Router();
const Synagogue = require('../models/Synagogue');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const synagogues = await Synagogue.find().select('name city code').sort({ name: 1 });
    res.json(synagogues);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const syn = await Synagogue.findById(req.params.id).select('-gabaiId');
    if (!syn) return res.status(404).json({ message: 'בית כנסת לא נמצא' });
    res.json(syn);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { synagogueName, city, gabaiUsername, gabaiPassword } = req.body;
    if (!synagogueName || !city || !gabaiUsername || !gabaiPassword)
      return res.status(400).json({ message: 'כל השדות נדרשים' });

    const existingUser = await User.findOne({ username: gabaiUsername });
    if (existingUser)
      return res.status(400).json({ message: 'שם משתמש כבר קיים' });

    const synagogue = await Synagogue.create({ name: synagogueName, city });
    const hash = await bcrypt.hash(gabaiPassword, 10);
    const gabai = await User.create({
      username: gabaiUsername, password: hash,
      role: 'gabai', synagogueId: synagogue._id,
    });
    synagogue.gabaiId = gabai._id;
    await synagogue.save();

    res.status(201).json({ message: 'בית הכנסת נרשם בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, city, parasha } = req.body;
    const syn = await Synagogue.findByIdAndUpdate(req.params.id, { name, city, parasha }, { new: true });
    res.json(syn);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
