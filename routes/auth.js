const express = require('express');

// declaring router
const router = express.Router();

// import controllers
const { signup, signin, signout, requireSignin } = require('../controllers/auth');

// importing validators
const { userSignupValidator, userSigninValidator } = require('../validators/auth');
const { runValidation } = require('../validators/index');

router.post('/signup', userSignupValidator, runValidation, signup);
router.post('/signin', userSigninValidator, runValidation, signin);
router.get('/signout', signout);

// test
// router.get('/secret', requireSignin, (req, res) => {
// 	res.json({
// 		message: req.user,
// 	});
// });

module.exports = router;
