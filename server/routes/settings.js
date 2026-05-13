const router = require('express').Router();
const Settings = require('../models/Settings');
const authMiddleware = require('../middleware/auth');

// GET /api/settings  — public (members need shul name + parasha)
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// PUT /api/settings  (protected)
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { shulName, city, parasha } = req.body;
    const settings = await Settings.findOneAndUpdate(
      {},
      { shulName, city, parasha },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;

// GET /api/settings/announce-template
router.get('/announce-template', authMiddleware, async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const s = await Settings.findOne({ synagogueId: req.user.synagogueId });
    res.json({ template: s?.announceTemplate || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/settings/announce-template
router.put('/announce-template', authMiddleware, async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const { template } = req.body;
    await Settings.findOneAndUpdate(
      { synagogueId: req.user.synagogueId },
      { announceTemplate: template },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
