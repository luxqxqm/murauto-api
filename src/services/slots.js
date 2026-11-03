// Pure functions: no database, no current time, so they are easy to test
import { WEEK_DAYS } from '../models/settings.js';

const TIME_ZONE = 'Europe/Kyiv';
const MINUTE_MS = 60 * 1000;

const kyivFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

// How many minutes Kyiv is ahead of UTC at this moment (120 in winter, 180 in summer)
const kyivOffsetMin = (utcMs) => {
  const parts = Object.fromEntries(
    kyivFormatter.formatToParts(utcMs).map((part) => [part.type, part.value]),
  );
  const kyivAsUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  return Math.round((kyivAsUtcMs - utcMs) / MINUTE_MS);
};

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const toTime = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// "2026-11-05" + "09:30" in Kyiv -> Date in UTC
export const kyivToUtc = (date, time) => {
  const [year, month, day] = date.split('-').map(Number);
  const asUtcMs = Date.UTC(year, month - 1, day) + toMinutes(time) * MINUTE_MS;
  // Checked twice, because the offset itself can change on a DST night
  const firstGuess = asUtcMs - kyivOffsetMin(asUtcMs) * MINUTE_MS;
  return new Date(asUtcMs - kyivOffsetMin(firstGuess) * MINUTE_MS);
};

// "2026-11-05" -> "thursday" (calendar date, no time zone involved)
export const weekDayOf = (date) => {
  const [year, month, day] = date.split('-').map(Number);
  const sundayFirst = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return WEEK_DAYS[(sundayFirst + 6) % 7];
};

// "2026-11-05" + 1 -> "2026-11-06"
export const addDays = (date, days) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
};

// Calendar date in Kyiv at the given moment, "YYYY-MM-DD"
export const kyivDate = (moment) => {
  const { year, month, day } = Object.fromEntries(
    kyivFormatter.formatToParts(moment).map((part) => [part.type, part.value]),
  );
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const isWorkingDay = (settings, date) =>
  !settings.daysOff.includes(date) &&
  !settings.workingHours[weekDayOf(date)].isDayOff;

// Max number of bookings that run at the same moment inside [start, end).
// A slot is free while this is less than the number of posts.
const maxParallel = (bookings, start, end) => {
  const overlapping = bookings.filter(
    (booking) => booking.startAt < end && booking.endAt > start,
  );
  // The busiest moment is always the slot start or the start of some booking
  const moments = [
    start,
    ...overlapping.map((b) => b.startAt).filter((t) => t > start),
  ];

  return Math.max(
    ...moments.map(
      (moment) =>
        overlapping.filter((b) => b.startAt <= moment && b.endAt > moment)
          .length,
    ),
  );
};

/**
 * Free slots for one Kyiv calendar date.
 * settings: { workingHours, slotStepMin, postsCount, daysOff }
 * bookings: [{ startAt: Date, endAt: Date, status }] for that day
 * date: "YYYY-MM-DD"
 * Returns [{ time: "09:00", startAt: Date (UTC) }]
 */
export const getFreeSlots = (settings, durationMin, bookings, date) => {
  if (!isWorkingDay(settings, date)) {
    return [];
  }

  const day = settings.workingHours[weekDayOf(date)];

  const activeBookings = bookings.filter(
    (booking) => booking.status !== 'canceled',
  );
  const openMin = toMinutes(day.open);
  const closeMin = toMinutes(day.close);
  const slots = [];

  // The service must finish before closing time
  for (
    let startMin = openMin;
    startMin + durationMin <= closeMin;
    startMin += settings.slotStepMin
  ) {
    const time = toTime(startMin);
    const startAt = kyivToUtc(date, time);
    const endAt = new Date(startAt.getTime() + durationMin * MINUTE_MS);

    if (maxParallel(activeBookings, startAt, endAt) < settings.postsCount) {
      slots.push({ time, startAt });
    }
  }

  return slots;
};
