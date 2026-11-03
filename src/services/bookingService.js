import { Booking } from '../models/booking.js';
import { addDays, getFreeSlots, kyivToUtc } from './slots.js';

// Bookings that touch this Kyiv calendar date
export const dayRange = (date) => ({
  $lt: kyivToUtc(addDays(date, 1), '00:00'),
  $gte: kyivToUtc(date, '00:00'),
});

// Free slots on a Kyiv date, without the ones that already passed today.
// excludeId: the booking being moved must not block its own new time.
export const findFreeSlots = async (settings, durationMin, date, excludeId) => {
  const { $gte: dayStart, $lt: dayEnd } = dayRange(date);

  const bookings = await Booking.find({
    startAt: { $lt: dayEnd },
    endAt: { $gt: dayStart },
    status: { $ne: 'canceled' },
    ...(excludeId && { _id: { $ne: excludeId } }),
  })
    .select('startAt endAt status')
    .lean();

  const now = new Date();
  return getFreeSlots(settings, durationMin, bookings, date).filter(
    (slot) => slot.startAt > now,
  );
};
