const express = require('express');

// declaring router
const router = express.Router();

// import controllers
const { contactForm, contactBlogAuthorForm } = require('../controllers/form');

// importing validators
const { contactFormValidator } = require('../validators/form');
const { runValidation } = require('../validators/index');

router.post('/contact', contactFormValidator, runValidation, contactForm);
router.post('/contact-blog-author', contactFormValidator, runValidation, contactBlogAuthorForm);

module.exports = router;
