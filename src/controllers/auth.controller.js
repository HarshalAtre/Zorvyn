const authService = require('../services/auth.service');
const { register: registerSchema, login: loginSchema } = require('../validators/auth.validator');

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDays = Number(process.env.JWT_COOKIE_DAYS || 7);

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: cookieDays * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { user, token } = await authService.register(value);
    res.cookie('token', token, getCookieOptions());
    res.status(201).json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { user, token } = await authService.login(value);
    res.cookie('token', token, getCookieOptions());
    res.json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, logout, me };
