// importing models
const User = require('../models/user');
const Blog = require('../models/blog');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// importing packages
const shortId = require('shortid');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const { errorHandler } = require('../helpers/dbErrorHandler');
const _ = require('lodash');
const { OAuth2Client } = require('google-auth-library');
const { response } = require('express');

exports.read = (req, res) => {
	req.profile.hashed_password = undefined;
	return res.json(req.profile);
};

exports.preSignup = (req, res) => {
	const { name, email, password } = req.body;
	User.findOne({ email }, (err, user) => {
		if (user) {
			return res.status(400).json({
				error: 'Email is already registered',
			});
		}
		const token = jwt.sign({ name, email, password }, process.env.JWT_ACCOUNT_ACTIVATION, { expiresIn: '15m' });
		const emailData = {
			to: email,
			from: process.env.EMAIL_FROM,
			subject: `Account Activation link`,
			html: `<p>Please use the following link to activate your account:</p>
			<p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
			<hr/>
			<p>This email may contain sensitive information</p>
			`,
		};

		sgMail.send(emailData).then((sent) => {
			return res.json({
				message: `Email has been sent to ${email}.Follow the instructions to activate your account`,
			});
		});
	});
};

// exports.signup = (req, res) => {
// 	User.findOne({ email: req.body.email }).exec((err, user) => {
// 		if (user) {
// 			return res.status(400).json({
// 				error: 'Email already exists in database',
// 			});
// 		}
// 		const { name, email, password } = req.body;
// 		let username = shortId.generate();
// 		let profile = `${process.env.CLIENT_URL}/profile/${username}`;

// 		let newUser = new User({ name, email, username, password, profile });
// 		newUser.save((err, success) => {
// 			if (err) {
// 				return res.status(400).json({
// 					error: err,
// 				});
// 			}
// 			return res.json({
// 				message: 'Signup Success!. Please signin',
// 			});
// 		});
// 	});
// };

exports.signup = (req, res) => {
	const token = req.body.token;
	if (token) {
		jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err, decoded) => {
			if (err) {
				return res.status(401).json({
					error: 'Expired link. Signup again',
				});
			}
			const { name, email, password } = jwt.decode(token);
			let username = shortId.generate();
			let profile = `${process.env.CLIENT_URL}/profile/${username}`;
			let newUser = new User({ name, email, username, password, profile });
			newUser.save((err, success) => {
				if (err) {
					return res.status(400).json({
						error: errorHandler(err),
					});
				}
				return res.json({
					message: 'Signup Success!. Please signin',
				});
			});
		});
	}
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

exports.canUpdateDeleteBlog = (req, res, next) => {
	const slug = req.params.slug.toLowerCase();
	Blog.findOne({ slug }).exec((err, data) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err),
			});
		}
		if (!data) {
			return res.staus(404).json({
				error: 'No blog found',
			});
		}
		let authorizedUser = data.postedBy._id.toString() === req.profile._id.toString();
		if (!authorizedUser) {
			return res.staus(404).json({
				error: 'You are not authorized to perform action on the blog',
			});
		}
		next();
	});
};

exports.forgotPassword = (req, res) => {
	const { email } = req.body;

	User.findOne({ email }, (err, user) => {
		if (err || !user) {
			return res.status(401).json({
				error: 'User with that email does not exist',
			});
		}

		const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: '10m' });

		// email
		const emailData = {
			to: email,
			from: process.env.EMAIL_FROM,
			subject: `Password reset link`,
			html: `<p>Please use the following link to reset your password:</p>
			<p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
			<hr/>
			<p>This email may contain sensitive information</p>
			`,
		};

		// populating the db
		return user.update({ resetPasswordLink: token }, (err, success) => {
			if (err) {
				return res.json({
					error: errorHandler(err),
				});
			} else {
				sgMail
					.send(emailData)
					.then((sent) => {
						return res.json({
							message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10 min`,
						});
					})
					.catch((err) => {
						return res.json(err);
					});
			}
		});
	});
};

exports.resetPassword = (req, res) => {
	const { resetPasswordLink, newPassword } = req.body;
	if (resetPasswordLink) {
		jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, (err, decoded) => {
			if (err) {
				return res.status(401).json({
					error: 'Expired link. Try again ',
				});
			}
			User.findOne({ resetPasswordLink }, (err, user) => {
				if (err || !user) {
					return res.status(401).json({
						error: 'Something went wrong. Try again',
					});
				}
				const updatedFields = {
					password: newPassword,
					resetPasswordLink: '',
				};

				user = _.extend(user, updatedFields);

				user.save((err, result) => {
					if (err) {
						return res.status(400).json({
							error: errorHandler(err),
						});
					}
					res.json({
						message: `Great! Now you can login with your new password`,
					});
				});
			});
		});
	}
};

// googleLOgin

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (req, res) => {
	const idToken = req.body.tokenId;
	client
		.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
		.then((response) => {
			const { email, jti, name, email_verified } = response.payload;
			if (email_verified) {
				// find the user based on email in database
				User.findOne({ email }).exec((er, user) => {
					if (er) {
						console.log(er);
						return res.json(er);
					}
					if (user) {
						const { _id, email, name, role, username } = user;
						const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
						res.cookie('token', token, { expiresIn: '1d' });
						return res.json({ token, user: { _id, email, name, role, username } });
					} else {
						let username = shortId.generate();
						let profile = `${process.env.CLIENT_URL}/profile/${username}`;
						let password = jti;
						user = new User({ name, email, password, profile, username });
						user.save((err, data) => {
							if (err) {
								return res.status(400).json({
									error: errorHandler(err),
								});
							} else {
								const { _id, email, name, role, username } = data;
								const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
								res.cookie('token', token, { expiresIn: '1d' });
								return res.json({ token, user: { _id, email, name, role, username } });
							}
						});
					}
				});
			} else {
				return res.status(400).json({
					error: 'Google login failed. Please try again later',
				});
			}
		})
		.catch((err) => {
			return res.status(400).json({
				error: 'Some error occured in google login',
			});
		});
};
