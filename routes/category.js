const express = require('express');

// declaring router
const router = express.Router();

// import controllers
const { create, list, read, remove } = require('../controllers/category');

// importing validators
const { categoryCreateValidator } = require('../validators/category');
const { runValidation } = require('../validators/index');

// importing middlewares
const { requireSignin, adminMiddleware } = require('../controllers/auth');

router.post('/category', categoryCreateValidator, runValidation, requireSignin, adminMiddleware, create);
router.get('/categories', list);
router.get('/category/:slug', read);
router.delete('/category/:slug', requireSignin, adminMiddleware, remove);

module.exports = router;
