const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Create a token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all fields'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login instead.'
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Create new user (password gets scrambled automatically)
    const user = await User.create({ name, email, password, address });

    // Create token
    const token = createToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      error: error.message
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if fields provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Check password
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    // Create token
    const token = createToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      error: error.message
    });
  }
};