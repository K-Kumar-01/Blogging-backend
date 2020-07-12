const express = require('express');

// declaring router
const router = express.Router();

// import controllers
const { requireSignin, authMiddleware, adminMiddleware } = require('../controllers/auth');
const { read } = require('../controllers/user');

router.get('/profile', requireSignin, authMiddleware, read);

module.exports = router;
