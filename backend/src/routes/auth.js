const express = require('express');
const router = express.Router();
const { signUp, signIn, getProfile, verifyToken } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/signup', signUp);
router.post('/signin', signIn);
router.get('/profile', authMiddleware, getProfile);
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;
