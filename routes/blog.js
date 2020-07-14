const express = require('express');

const router = express.Router();

// import controllers
const {
	create,
	list,
	listAllBlogsCategoriesTags,
	read,
	remove,
	update,
	photo,
	listRelated,
	listSearch,
	listByUser,
} = require('../controllers/blog');

// import middleware(auth)
const { requireSignin, authMiddleware, adminMiddleware, canUpdateDeleteBlog } = require('../controllers/auth');

// for admin
router.post('/blog', requireSignin, adminMiddleware, create);
router.get('/blogs', list);
router.post('/blogs-categories-tags', listAllBlogsCategoriesTags);
router.get('/blog/:slug', read);
router.delete('/blog/:slug', requireSignin, adminMiddleware, remove);
router.put('/blog/:slug', requireSignin, adminMiddleware, update);
router.get('/blog/photo/:slug', photo);
router.post('/blogs/related', listRelated);
router.get('/blogs/search', listSearch);

// for user(regular)
router.post('/user/blog', requireSignin, authMiddleware, create);
router.get('/:username/blogs', listByUser);
router.delete('/user/blog/:slug', requireSignin, authMiddleware, canUpdateDeleteBlog, remove);
router.put('/user/blog/:slug', requireSignin, authMiddleware, canUpdateDeleteBlog, update);

module.exports = router;
