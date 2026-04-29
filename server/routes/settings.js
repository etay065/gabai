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
