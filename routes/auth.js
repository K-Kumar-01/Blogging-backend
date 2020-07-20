const express = require('express');

// declaring router
const router = express.Router();

// import controllers
const { signup, signin, signout, requireSignin, forgotPassword,preSignup, resetPassword } = require('../controllers/auth');

// importing validators
const {
	userSignupValidator,
	userSigninValidator,
	forgotPasswordValidator,
	resetPasswordValidator,
} = require('../validators/auth');
const { runValidation } = require('../validators/index');

router.post('/pre-signup', userSignupValidator, runValidation, preSignup);
router.post('/signup', userSignupValidator, runValidation, signup);
router.post('/signin', userSigninValidator, runValidation, signin);
router.get('/signout', signout);
router.put('/forgot-password', forgotPasswordValidator, runValidation, forgotPassword);
router.put('/reset-password', resetPasswordValidator, runValidation, resetPassword);

module.exports = router;
