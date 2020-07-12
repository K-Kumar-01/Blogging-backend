const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			maxlength: 200,
			required: true,
			index: true,
			trim: true,
		},
		slug: {
			type: String,
			maxlength: 200,
			unique: true,
			index: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Tag', tagSchema);
