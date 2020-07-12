// importing models
const User = require('../models/user');

// importing packages
const shortId = require('shortid');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');

exports.read = (req, res) => {
	req.profile.hashed_password = undefined;
	return res.json(req.profile);
};

exports.signup = (req, res) => {
	User.findOne({ email: req.body.email }).exec((err, user) => {
		if (user) {
			return res.status(400).json({
				error: 'Email already exists in database',
			});
		}
		const { name, email, password } = req.body;
		let username = shortId.generate();
		let profile = `${process.env.CLIENT_URL}/profile/${username}`;

		let newUser = new User({ name, email, username, password, profile });
		newUser.save((err, success) => {
			if (err) {
				return res.status(400).json({
					error: err,
				});
			}
			return res.json({
				message: 'Signup Success!. Please signin',
			});
		});
	});
};

exports.signin = (req, res) => {
	const { email, password } = req.body;
	User.findOne({ email }).exec((err, user) => {
		if (err || !user) {
			return res.status(404).json({
				error: err || 'User does not exist in database. Please sign up instead',
			});
		}

		if (!user.authenticate(password)) {
			return res.status(400).json({
				error: 'Invalid password entered',
			});
		}

		const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

		res.cookie('token', token, { expiresIn: '1d' });
		const { _id, username, name, email, role } = user;
		return res.json({
			token,
			user: { _id, username, name, email, role },
		});
	});
};

exports.signout = (req, res) => {
	res.clearCookie('token');
	res.json({
		message: 'Signout Success',
	});
};

exports.requireSignin = expressJwt({
	secret: process.env.JWT_SECRET,
	algorithms: ['HS256'],
});

exports.authMiddleware = (req, res, next) => {
	const authUserId = req.user._id;
	User.findById(authUserId).exec((err, user) => {
		if (err) {
			res.status(500).json({ error: 'Some error occurred' });
		}
		if (!user) {
			res.status(404).json({ error: 'User not found' });
		}
		req.profile = user;
		next();
	});
};

exports.adminMiddleware = (req, res, next) => {
	const adminUserId = req.user._id;
	User.findById(adminUserId).exec((err, user) => {
		if (err) {
			res.status(400).json({ error: 'Some error occurred' });
		}
		if (!user) {
			res.status(404).json({ error: 'User not found' });
		}
		if (user.role !== 1) {
			res.status(403).json({ error: 'Admin resource. Access denied' });
		}
		req.profile = user;
		next();
	});
};
