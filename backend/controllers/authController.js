const User = require('../models/user');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  address: user.address,
  location: user.location,
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
exports.requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete previous OTP if exists
    await OTP.deleteOne({ email });

    // Save OTP to database
    const otpRecord = await OTP.create({
      email,
      otp,
      expiresAt,
    });

    // Log OTP for testing/debugging
    console.log(`📧 OTP Generated for ${email}: ${otp}`);

    // Send OTP email (non-blocking)
    sendOTPEmail(email, otp).catch(err => console.error(`Failed to send email to ${email}:`, err));

    // Send response immediately 
    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. For testing, check backend logs.',
      email,
      testOTP: otp // Only for development/testing
    });

  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });
    }

    // Check if OTP expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Check if OTP is correct
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ email });
        return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });
      }
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now complete your signup.',
      email,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Signup with OTP verification
exports.signupWithOTP = async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    if (!name || !email || !password || !address) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    // Verify that OTP has been verified
    const otpRecord = await OTP.findOne({ email, verified: true });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Please verify your email with OTP first.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    // Create user
    const user = await User.create({ name, email, password, address });

    // Send welcome email
    await sendWelcomeEmail(email, name);

    // Delete OTP record after successful signup
    await OTP.deleteOne({ email });

    const token = createToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: serializeUser(user),
      message: 'Signup successful! Welcome to Urjamitra.',
    });
  } catch (error) {
    console.error('Error during signup with OTP:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
