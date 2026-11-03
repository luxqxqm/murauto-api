import { rateLimit } from 'express-rate-limit';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

// Protects the public form from spam: 5 requests per 15 minutes from one IP
export const createBookingLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Забагато спроб запису. Спробуйте через 15 хвилин' },
});

// Protects the admin password from brute force: only failed attempts are counted
export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Забагато спроб входу. Спробуйте через 15 хвилин' },
});
