const express = require('express');
const router = express.Router();

// Placeholder for properties routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Properties API endpoint - coming soon'
  });
});

module.exports = router;