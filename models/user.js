const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			trim: true,
			required: true,
			maxlength: 64,
			unique: true,
			index: true,
			lowercase: true,
		},
		name: {
			type: String,
			trim: true,
			required: true,
			maxlength: 32,
		},
		email: {
			type: String,
			trim: true,
			required: true,
			lowercase: true,
			unique: true,
		},
		profile: {
			type: String,
			required: true,
		},
		hashed_password: {
			type: String,
			required: true,
		},
		salt: { type: String },
		about: {
			type: String,
		},
		role: {
			type: Number,
			default: 0,
		},
		photo: {
			data: Buffer,
			contentType: String,
		},
		resetPasswordLink: {
			data: String,
			default: '',
		},
	},
	{ timestamps: true }
);

userSchema
	.virtual('password')
	.set(function (password) {
		// create a temporary variable called password
		this._password = password;

		// make salt
		this.salt = this.makeSalt();

		// encrypt password
		this.hashed_password = this.encyptPassword(password);
	})
	.get(function () {
		return this._password;
	});

userSchema.methods = {
	authenticate: function (enteredPassword) {
		return this.encyptPassword(enteredPassword) === this.hashed_password;
	},

	encyptPassword: function (password) {
		if (!password) return '';
		try {
			return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
		} catch (error) {
			return '';
		}
	},

	makeSalt: function () {
		return Math.round(new Date().valueOf() * Math.random()) + '';
	},
};

module.exports = mongoose.model('User', userSchema);
