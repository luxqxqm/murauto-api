import { Booking } from '../models/booking.js';
import { addDays, getFreeSlots, kyivToUtc } from './slots.js';

// Free slots for a service on a Kyiv date, without the ones that already passed today
export const findFreeSlots = async (settings, service, date) => {
  const dayStart = kyivToUtc(date, '00:00');
  const dayEnd = kyivToUtc(addDays(date, 1), '00:00');

  const bookings = await Booking.find({
    startAt: { $lt: dayEnd },
    endAt: { $gt: dayStart },
    status: { $ne: 'canceled' },
  })
    .select('startAt endAt status')
    .lean();

  const now = new Date();
  return getFreeSlots(settings, service.durationMin, bookings, date).filter(
    (slot) => slot.startAt > now,
  );
};
