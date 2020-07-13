// importing models
const User = require('../models/user');
const Blog = require('../models/blog');
const { errorHandler } = require('../helpers/dbErrorHandler');
const _ = require('lodash');
const formidable = require('formidable');
const fs = require('fs');

exports.read = (req, res) => {
	req.profile.hashed_password = undefined;
	return res.json(req.profile);
};

exports.publicProfile = (req, res) => {
	let username = req.params.username;
	let user, blogs;

	User.findOne({ username }).exec((err, userFromDB) => {
		if (err || !userFromDB) {
			return res.status(404).json({ error: 'User not found' });
		}
		user = userFromDB;
		let userId = user._id;
		Blog.find({ postedBy: userId })
			.populate('categories', '_id name slug')
			.populate('tags', '_id name slug')
			.populate('postedBy', '_id name username')
			.limit(10)
			.select('_id title slug excerpt categories tags postedBy updatedAt createdAt')
			.exec((err, data) => {
				if (err) {
					return res.status(400).json({
						error: errorHandler(err),
					});
				}
				user.photo = undefined;
				user.hashed_password = undefined;
				res.json({
					user,
					blogs: data,
				});
			});
	});
};

exports.update = (req, res) => {
	let form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.parse(req, (err, fields, files) => {
		if (err) {
			return res.status(400).json({
				error: 'Photo could not be uplaoded',
			});
		}
		const { name, username, password } = fields;
		if (!name || name.length < 3) {
			return res.status(400).json({
				error: 'Name must be atleast 3 characters long',
			});
		}

		if (!username || username.length < 3) {
			return res.status(400).json({
				error: 'Username must be atleast 3 characters long',
			});
		}

		if (password && password.length < 6) {
			return res.status(400).json({
				error: 'Password must have a minimum length of 6',
			});
		}

		let user = req.profile;
		user = _.extend(user, fields);
		if (files.photo) {
			if (files.photo.size > 10000000) {
				return res.status(400).json({
					error: 'Maximum size of photo allowed is 1MB',
				});
			}
			user.photo.data = fs.readFileSync(files.photo.path);
			user.photo.contentType = files.photo.type;
		}

		user.save((err, result) => {
			if (err) {
				return res.status(400).json({
					error: errorHandler(err),
				});
			}
			user.hashed_password = undefined;
			user.salt = undefined;
			user.photo = undefined;
			res.json(user);
		});
	});
};

exports.photo = (req, res) => {
	let username = req.params.username;
	User.findOne({ username }).exec((err, user) => {
		if (err || !user) {
			return res.status(400).json({
				error: 'User not found',
			});
		}
		if (user.photo.data) {
			res.set('Content-Type', user.photo.contentType);
			return res.send(user.photo.data);
		}
	});
};
