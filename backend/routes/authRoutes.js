const express = require('express');
const router = express.Router();
const { signup, login, requestOTP, verifyOTP, signupWithOTP } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);

// OTP-based authentication routes
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/signup-with-otp', signupWithOTP);

module.exports = router;
