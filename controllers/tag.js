const Tag = require('../models/tag');
const Blog = require('../models/blog');
const slugify = require('slugify');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.create = (req, res) => {
	const { name } = req.body;
	let slug = slugify(name).toLowerCase();

	let tag = new Tag({ name, slug });
	tag.save((err, data) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err),
			});
		}
		res.json({ message: 'Tag created successfully' });
	});
};

exports.list = (req, res) => {
	Tag.find({}).exec((err, data) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err),
			});
		}
		res.json(data);
	});
};

exports.read = (req, res) => {
	let slug = req.params.slug;
	Tag.findOne({ slug }).exec((err, tag) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err),
			});
		}
		if (!tag) {
			return res.status(404).json({ message: 'No such tag found' });
		}

		Blog.find({ tags: tag })
			.populate('categories', '_id name slug')
			.populate('tags', '_id name slug')
			.populate('postedBy', '_id name')
			.select('id title slug excerpt categories postedBy tags createdAt updatedAt')
			.exec((err, data) => {
				if (err) {
					return res.status(400).json({ error: errorHandler(err) });
				}
				res.json({ tag: tag, blogs: data });
			});
	});
};

exports.remove = (req, res) => {
	let slug = req.params.slug;
	Tag.findOneAndRemove({ slug }).exec((err, tag) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err),
			});
		}
		if (!tag) {
			return res.status(404).json({ message: 'No such tag found' });
		}
		res.json({ message: 'Tag deleted successfully' });
	});
};
