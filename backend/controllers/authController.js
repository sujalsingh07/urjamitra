const User = require('../models/user');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const serializeUser = (user) => ({
  _id:     user._id,          // keep _id for socket.emit('register', user._id)
  id:      user._id,          // keep id for backwards compat
  name:    user.name,
  email:   user.email,
  mobile:  user.mobile,
  address: user.address,
  location: user.location,
  wallet:  user.wallet,       // needed for dashboard balance display
});

exports.signup = async (req, res) => {
  try {
    const { name, email, password, address } = req.body;
    if (!name || !email || !password || !address) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }
    const user = await User.create({ name, email, password, address });
    const token = createToken(user._id);
    res.status(201).json({ success: true, token, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email' });
    }
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
    const token = createToken(user._id);
    res.status(200).json({ success: true, token, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request OTP for email verification
// ── Step 1: Request OTP ──────────────────────────────────────────────────────
exports.requestOTP = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const otp = generateOTP();
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    console.log(`📧 OTP for ${email}: ${otp}`);

    const emailDelivered = await sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: emailDelivered ? `OTP sent to ${email}` : 'OTP generated (email failed - see code below)',
      emailDelivered,
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('requestOTP error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Step 2: Verify OTP ───────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp   = String(req.body.otp   || '').replace(/\D/g, '').trim();

    if (!email || otp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Provide email and 6-digit OTP.' });
    }

    const record = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request one.' });
    }
    if (Date.now() > record.expiresAt.getTime()) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
    }
    if (record.otp !== otp) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        await OTP.deleteMany({ email });
        return res.status(400).json({ success: false, message: 'Too many attempts. Request a new OTP.' });
      }
      await record.save();
      const left = 5 - record.attempts;
      return res.status(400).json({ success: false, message: `Incorrect OTP. ${left} attempt${left !== 1 ? 's' : ''} left.` });
    }

    record.verified = true;
    await record.save();
    res.json({ success: true, message: 'Email verified.' });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Step 3: Complete Signup ──────────────────────────────────────────────────
exports.signupWithOTP = async (req, res) => {
  try {
    const email    = String(req.body.email    || '').trim().toLowerCase();
    const name     = String(req.body.name     || '').trim();
    const password = String(req.body.password || '');

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const record = await OTP.findOne({ email, verified: true }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ success: false, message: 'Email not verified. Complete the OTP step first.' });
    }
    if (Date.now() > record.expiresAt.getTime()) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ success: false, message: 'Session expired. Start signup again.' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Account already exists. Please login.' });
    }

    const user = await User.create({ name, email, password, address: 'Campus' });
    await OTP.deleteMany({ email });
    sendWelcomeEmail(email, name).catch(() => {});

    const token = createToken(user._id);
    res.status(201).json({ success: true, token, user: serializeUser(user) });
  } catch (err) {
    console.error('signupWithOTP error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
