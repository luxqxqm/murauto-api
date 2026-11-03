import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

const UNAUTHORIZED = { message: 'Потрібно увійти в акаунт' };

export const authenticate = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json(UNAUTHORIZED);
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Expired or forged token
    return res.status(401).json(UNAUTHORIZED);
  }

  // The user could have been deleted after the token was issued
  const user = await User.findById(payload.sub).select('-passwordHash');
  if (!user) {
    return res.status(401).json(UNAUTHORIZED);
  }

  req.user = user;
  next();
};
