const Blog = require('../models/blog');
const Category = require('../models/category');
const Tag = require('../models/tag');
const User = require('../models/user');
const formidable = require('formidable');
const slugify = require('slugify');
const _ = require('lodash');
const stripHtml = require('string-strip-html');
const { errorHandler } = require('../helpers/dbErrorHandler');
const fs = require('fs');
const { smartTrim } = require('../helpers/blog');

exports.create = (req, res) => {
	let form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.parse(req, (err, fields, files) => {
		if (err) {
			return res.status(400).json({
				err: 'Image could not upload',
			});
		}
		const { title, body, categories, tags } = fields;

		if (!title || title.length < 3) {
			return res.status(422).json({
				error: 'Title is required with a miniumum length of 3',
			});
		}

		if (!body || body.length < 200) {
			return res.status(422).json({
				error: 'Content must be atleast 200 character long',
			});
		}

		if (!categories || categories.length === 0) {
			return res.status(422).json({
				error: 'Atleast one category is required',
			});
		}

		if (!tags || tags.length === 0) {
			return res.status(422).json({
				error: 'Atleast one tag is required',
			});
		}

		let blog = new Blog();
		blog.title = title;
		blog.body = body;
		blog.excerpt = smartTrim(body, 320, ' ', ' ...');
		blog.slug = slugify(title).toLowerCase();
		blog.mtitle = `${title} | ${process.env.APP_NAME}`;
		blog.mdesc = stripHtml(body.substr(0, 160));
		blog.postedBy = req.user._id;
		// categories and tags

		let arrrayOfCategories = categories && categories.split(',');
		let arrrayOfTags = tags && tags.split(',');

		if (files.photo) {
			if (files.photo.size > 10000000) {
				return res.status(422).json({
					err: 'Image file size should be less than 1MB',
				});
			}
			blog.photo.data = fs.readFileSync(files.photo.path);
			blog.photo.contentType = files.photo.type;
		}

		blog.save((err, result) => {
			if (err) {
				return res.status(400).json({
					err: errorHandler(err),
				});
			}
			// res.json(result);
			Blog.findByIdAndUpdate(result._id, { $push: { categories: arrrayOfCategories } }, { new: true }).exec(
				(err, result) => {
					if (err) {
						return res.status(400).json({ error: errorHandler(err) });
					} else {
						Blog.findByIdAndUpdate(result._id, { $push: { tags: arrrayOfTags } }, { new: true }).exec(
							(err, result) => {
								if (err) {
									return res.status(400).json({ error: errorHandler(err) });
								} else {
									res.json(result);
								}
							}
						);
					}
				}
			);
		});
	});
};

exports.list = (req, res) => {
	Blog.find({})
		.populate('categories', '_id name slug')
		.populate('tags', '_id name slug')
		.populate('postedBy', '_id name username _profile')
		.select('_id title slug excerpt categories tags postedBy createdAt updatedAt')
		.exec((err, data) => {
			if (err) {
				return res.json({
					error: errorHandler(err),
				});
			}
			res.json(data);
		});
};

exports.listAllBlogsCategoriesTags = (req, res) => {
	let limit = req.body.limit ? parseInt(req.body.limit) : 10;
	let skip = req.body.skip ? parseInt(req.body.skip) : 0;

	let blogs;
	let categories;
	let tags;

	Blog.find({})
		.populate('categories', '_id name slug')
		.populate('tags', '_id name slug')
		.populate('postedBy', '_id name username _profile')
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit)
		.select('_id title slug excerpt categories tags postedBy createdAt updatedAt')
		.exec((err, data) => {
			if (err) {
				return res.json({
					error: errorHandler(err),
				});
			}
			blogs = data;

			// get all categories
			Category.find({}).exec((err, datac) => {
				if (err) {
					return res.json({
						error: errorHandler(err),
					});
				}
				categories = datac;

				// get all tags
				Tag.find({}).exec((err, tag) => {
					if (err) {
						return res.json({
							error: errorHandler(err),
						});
					}
					tags = tag;
					// return everything
					res.json({ blogs, categories, tags, size: blogs.length });
				});
			});
		});
};

exports.read = (req, res) => {
	const slug = req.params.slug.toLowerCase();
	Blog.findOne({ slug })
		.populate('categories', '_id name slug')
		.populate('tags', '_id name slug')
		.populate('postedBy', '_id name username _profile')
		.select('_id title slug body mtitle mdesc categories tags postedBy createdAt updatedAt')
		.exec((err, data) => {
			if (err) {
				return res.json({
					error: errorHandler(err),
				});
			}
			res.json(data);
		});
};
exports.remove = (req, res) => {
	const slug = req.params.slug.toLowerCase();
	Blog.findOneAndRemove({ slug }).exec((err, data) => {
		if (err) {
			return res.json({
				error: errorHandler(err),
			});
		}
		res.json({ message: 'Blog deleted successfully' });
	});
};

exports.update = (req, res) => {
	const slug = req.params.slug.toLowerCase();

	Blog.findOne({ slug }).exec((err, oldBlog) => {
		if (err) {
			return res.json({
				error: errorHandler(err),
			});
		}
		let form = new formidable.IncomingForm();
		form.keepExtensions = true;
		form.parse(req, (err, fields, files) => {
			if (err) {
				return res.status(400).json({
					err: 'Image could not upload',
				});
			}

			let slugBeforeMerge = oldBlog.slug;
			oldBlog = _.merge(oldBlog, fields);
			oldBlog.slug = slugBeforeMerge;

			const { body, desc, categories, tags } = fields;

			if (body) {
				oldBlog.excerpt = smartTrim(body, 320, ' ', ' ...');
				oldBlog.mdesc = stripHtml(body.substring(0, 160));
			}

			if (categories) {
				oldBlog.categories = categories.split(',');
			}

			if (tags) {
				oldBlog.tags = tags.split(',');
			}

			if (files.photo) {
				if (files.photo.size > 10000000) {
					return res.status(422).json({
						err: 'Image file size should be less than 1MB',
					});
				}
				oldBlog.photo.data = fs.readFileSync(files.photo.path);
				oldBlog.photo.contentType = files.photo.type;
			}

			oldBlog.save((err, result) => {
				if (err) {
					return res.status(400).json({
						error: errorHandler(err),
					});
				}
				// res.json(result);
				res.json(result);
			});
		});
	});
};

exports.photo = (req, res) => {
	const slug = req.params.slug;
	Blog.findOne({ slug })
		.select('photo')
		.exec((err, blog) => {
			if (err || !blog) {
				return res.status(400).json({
					error: errorHandler(err),
				});
			}
			res.set('Content-Type', blog.photo.contentType);
			return res.send(blog.photo.data);
		});
};

exports.listRelated = (req, res) => {
	const { _id, categories } = req.body;

	Blog.find({ _id: { $ne: _id }, categories: { $in: categories } })
		.limit(3)
		.populate('postedBy', 'name username _id profile')
		.select('title slug excerpt postedBy createdAt updatedAt')
		.exec((err, blogs) => {
			if (err || blogs.length === 0) {
				return res.status(400).json({ error: 'Blogs not found' });
			}
			res.json(blogs);
		});
};

exports.listSearch = (req, res) => {
	const { search } = req.query;
	if (search) {
		Blog.find(
			{
				$or: [{ title: { $regex: search, $options: 'i' } }, { body: { $regex: search, $options: 'i' } }],
			},
			(err, blogs) => {
				if (err) {
					return res.status(400).json({
						error: errorHandler(err),
					});
				}
				// else if (blogs.length === 0) {
				// 	return res.status(404).json({
				// 		error: 'No blogs of the searched criteria found',
				// 	});
				// }
				// console.log(blogs);
				res.json(blogs);
			}
		).select('-photo -body');
	} else {
		res.status(422).json({ error: 'No search parameter found' });
	}
};

exports.listByUser = (req, res) => {
	User.findOne({ username: req.params.username }).exec((err, user) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err),
			});
		}
		let userId = user._id;
		Blog.find({ postedBy: userId })
			.populate('categories', '_id name slug')
			.populate('tags', '_id name slug')
			.populate('postedBy', '_id name username')
			.select('_id title slug postedBy createdAt updatedAt')
			.exec((err, data) => {
				if (err) {
					return res.status(400).json({
						error: errorHandler(err),
					});
				}
				res.json(data);
			});
	});
};
