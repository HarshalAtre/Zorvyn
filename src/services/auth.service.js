const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, password, role: 'analyst' });
  const token = signToken(user._id);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user._id);
  // strip password from returned object
  user.password = undefined;
  return { user, token };
};

module.exports = { register, login };
