import { describe, expect, it } from 'vitest';
import { getFreeSlots, kyivToUtc } from '../../src/services/slots.js';

const day = (open, close, isDayOff = false) => ({ isDayOff, open, close });

// 2026-11-07 is Saturday, 2026-11-08 is Sunday
const SATURDAY = '2026-11-07';
const SUNDAY = '2026-11-08';
const HOLIDAY = '2026-12-25';

const settings = {
  slotStepMin: 30,
  postsCount: 1,
  daysOff: [HOLIDAY],
  workingHours: {
    monday: day('08:00', '18:00'),
    tuesday: day('08:00', '18:00'),
    wednesday: day('08:00', '18:00'),
    thursday: day('08:00', '18:00'),
    friday: day('08:00', '18:00'),
    saturday: day('09:00', '12:00'),
    sunday: day('09:00', '15:00', true),
  },
};

const booking = (date, from, to, status = 'new') => ({
  startAt: kyivToUtc(date, from),
  endAt: kyivToUtc(date, to),
  status,
});

const times = (slots) => slots.map((slot) => slot.time);

describe('kyivToUtc', () => {
  it('uses UTC+2 in winter', () => {
    expect(kyivToUtc('2026-11-05', '09:00').toISOString()).toBe(
      '2026-11-05T07:00:00.000Z',
    );
  });

  it('uses UTC+3 in summer', () => {
    expect(kyivToUtc('2026-07-01', '09:00').toISOString()).toBe(
      '2026-07-01T06:00:00.000Z',
    );
  });
});

describe('getFreeSlots: days off', () => {
  it('returns nothing on a weekly day off', () => {
    expect(getFreeSlots(settings, 30, [], SUNDAY)).toEqual([]);
  });

  it('returns nothing on a date from daysOff', () => {
    // 2026-12-25 is Friday, a normal working day of the week
    expect(getFreeSlots(settings, 30, [], HOLIDAY)).toEqual([]);
  });

  it('returns slots on a working day', () => {
    expect(times(getFreeSlots(settings, 30, [], SATURDAY))).toEqual([
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
    ]);
  });

  it('returns start time in UTC next to Kyiv time', () => {
    const [first] = getFreeSlots(settings, 30, [], SATURDAY);
    expect(first).toEqual({
      time: '09:00',
      startAt: new Date('2026-11-07T07:00:00.000Z'),
    });
  });
});

describe('getFreeSlots: end of day', () => {
  it('the service must finish before closing time', () => {
    // 09:00–12:00, 60 min: the last start is 11:00, not 11:30
    expect(times(getFreeSlots(settings, 60, [], SATURDAY)).at(-1)).toBe(
      '11:00',
    );
  });

  it('a service exactly as long as the day fits once', () => {
    expect(times(getFreeSlots(settings, 180, [], SATURDAY))).toEqual(['09:00']);
  });

  it('a service longer than the day does not fit', () => {
    expect(getFreeSlots(settings, 240, [], SATURDAY)).toEqual([]);
  });
});

describe('getFreeSlots: busy posts', () => {
  it('1 post: a booking blocks every slot that overlaps it', () => {
    const bookings = [booking(SATURDAY, '10:00', '11:00')];
    expect(times(getFreeSlots(settings, 60, bookings, SATURDAY))).toEqual([
      '09:00',
      '11:00',
    ]);
  });

  it('canceled bookings do not take a post', () => {
    const bookings = [booking(SATURDAY, '09:00', '12:00', 'canceled')];
    expect(getFreeSlots(settings, 60, bookings, SATURDAY)).toHaveLength(5);
  });

  it('2 posts: one booking still leaves the slot free', () => {
    const twoPosts = { ...settings, postsCount: 2 };
    const bookings = [booking(SATURDAY, '09:00', '10:00')];
    expect(times(getFreeSlots(twoPosts, 60, bookings, SATURDAY))).toContain(
      '09:00',
    );
  });

  it('2 posts: two parallel bookings block the slot', () => {
    const twoPosts = { ...settings, postsCount: 2 };
    const bookings = [
      booking(SATURDAY, '09:00', '10:00'),
      booking(SATURDAY, '09:00', '10:00'),
    ];
    expect(times(getFreeSlots(twoPosts, 30, bookings, SATURDAY))).toEqual([
      '10:00',
      '10:30',
      '11:00',
      '11:30',
    ]);
  });

  it('2 posts: bookings one after another fit on one post', () => {
    // 09:00–09:30 and 09:30–10:00 never run at the same time
    const twoPosts = { ...settings, postsCount: 2 };
    const bookings = [
      booking(SATURDAY, '09:00', '09:30'),
      booking(SATURDAY, '09:30', '10:00'),
    ];
    expect(times(getFreeSlots(twoPosts, 60, bookings, SATURDAY))).toContain(
      '09:00',
    );
  });
});
