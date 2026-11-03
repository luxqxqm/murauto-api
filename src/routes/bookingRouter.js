import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  changeStatus,
  createBooking,
  getBookings,
  getSlots,
  updateBooking,
} from '../controllers/bookingController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  changeStatusSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  slotsQuerySchema,
  updateBookingSchema,
} from '../validations/bookingValidation.js';
import { idParamsSchema } from '../validations/commonValidation.js';

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

bookingRouter.get(
  '/',
  authenticate,
  validate({ query: listBookingsQuerySchema }),
  getBookings,
);
bookingRouter.patch(
  '/:id/status',
  authenticate,
  validate({ params: idParamsSchema, body: changeStatusSchema }),
  changeStatus,
);
bookingRouter.patch(
  '/:id',
  authenticate,
  validate({ params: idParamsSchema, body: updateBookingSchema }),
  updateBooking,
);
