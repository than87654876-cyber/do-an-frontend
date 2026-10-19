const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { getSummary } = require('../controllers/reportController');

router.get('/summary', verifyToken, getSummary);

module.exports = router;
