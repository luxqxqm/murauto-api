import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// clearCookie needs the same options as the cookie was set with, otherwise browsers keep it
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  const isPasswordValid =
    user && (await bcrypt.compare(password, user.passwordHash));

  // Same answer for wrong email and wrong password, so nobody can find out which emails exist
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Невірний email або пароль' });
  }

  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, { ...cookieOptions(), maxAge: SEVEN_DAYS_MS });

  res.status(200).json({
    user: { _id: user._id, email: user.email, name: user.name },
  });
};

export const logout = (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.status(204).end();
};

export const getMe = (req, res) => {
  res.status(200).json({ user: req.user });
};
