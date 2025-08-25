const express = require('express');
const router = express.Router();

// Placeholder for customers routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Customers API endpoint - coming soon'
  });
});

module.exports = router;