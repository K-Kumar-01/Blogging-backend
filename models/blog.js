const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const blogSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			trim: true,
			required: true,
			minlength: 3,
			maxlength: 160,
		},
		slug: {
			type: String,
			unique: true,
			index: true,
		},
		body: {
			type: {},
			required: true,
			minlength: 200,
			maxlength: 200000000,
		},
		excerpt: {
			type: String,
			maxlength: 1000,
		},
		mtitle: {
			type: String,
		},
		mdesc: {
			type: String,
		},
		photo: {
			data: Buffer,
			contentType: String,
		},
		categories: [{ type: ObjectId, ref: 'Category', required: true }],
		tags: [{ type: ObjectId, ref: 'Tag', required: true }],
		postedBy: {
			type: ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
