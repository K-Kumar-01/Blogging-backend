const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			maxlength: 64,
			required: true,
			index: true,
			trim: true,
		},
		slug: {
			type: String,
			maxlength: 64,
			unique: true,
			index: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
