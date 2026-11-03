import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createBooking, getSlots } from '../controllers/bookingController.js';
import { validate } from '../middlewares/validate.js';
import {
  createBookingSchema,
  slotsQuerySchema,
} from '../validations/bookingValidation.js';

// Protects the public form from spam: 5 requests per 15 minutes from one IP
const createBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Забагато спроб запису. Спробуйте через 15 хвилин' },
});

export const bookingRouter = Router();

bookingRouter.get('/slots', validate({ query: slotsQuerySchema }), getSlots);
bookingRouter.post(
  '/',
  createBookingLimiter,
  validate({ body: createBookingSchema }),
  createBooking,
);
