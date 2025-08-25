const express = require('express');
const router = express.Router();

// Placeholder for users routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Users API endpoint - coming soon'
  });
});

module.exports = router;