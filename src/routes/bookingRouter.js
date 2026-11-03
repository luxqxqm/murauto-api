import { Router } from 'express';
import {
  changeStatus,
  createBooking,
  createManualBooking,
  getBookings,
  getSlots,
  updateBooking,
} from '../controllers/bookingController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { createBookingLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import {
  changeStatusSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  slotsQuerySchema,
  updateBookingSchema,
} from '../validations/bookingValidation.js';
import { idParamsSchema } from '../validations/commonValidation.js';

export const bookingRouter = Router();

bookingRouter.get('/slots', validate({ query: slotsQuerySchema }), getSlots);
bookingRouter.post(
  '/',
  createBookingLimiter,
  validate({ body: createBookingSchema }),
  createBooking,
);

bookingRouter.post(
  '/manual',
  authenticate,
  validate({ body: createBookingSchema }),
  createManualBooking,
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
