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
} = require('../controllers/blog');

// import middleware(auth)
const { requireSignin, authMiddleware, adminMiddleware } = require('../controllers/auth');

router.post('/blog', requireSignin, adminMiddleware, create);
router.get('/blogs', list);
router.post('/blogs-categories-tags', listAllBlogsCategoriesTags);
router.get('/blog/:slug', read);
router.delete('/blog/:slug', requireSignin, adminMiddleware, remove);
router.put('/blog/:slug', requireSignin, adminMiddleware, update);
router.get('/blog/photo/:slug', photo);
router.post('/blogs/related', listRelated);
router.get('/blogs/search', listSearch);

module.exports = router;
