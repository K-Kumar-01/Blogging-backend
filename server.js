const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// importing routes
const blogRoutes = require('./routes/blog');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const tagRoutes = require('./routes/tag');

// app
const app = express();

// cors
if (process.env.NODE_ENV === 'development') {
	app.use(cors({ origin: `${process.env.CLIENT_URL}` }));
}

// middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// routes middleware
app.use('/api', authRoutes);
app.use('/api', blogRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', tagRoutes);

// port
const port = process.env.PORT || 8000;

// connect to mongoose and then start the port
mongoose
	.connect(
		`mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@seoblog.padjo.mongodb.net/${process.env.DB_DATABASE}?retryWrites=true&w=majority`,
		{ useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }
	)
	.then(() => {
		app.listen(port, () => {
			console.log(`App started on port ${port}`);
		});
	})
	.catch((err) => {
		console.log(err);
	});
