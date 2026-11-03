import { Booking } from '../models/booking.js';
import { Service } from '../models/service.js';
import { getSettings } from '../models/settings.js';
import { canChangeStatus } from '../services/bookingStatus.js';
import { dayRange, findFreeSlots } from '../services/bookingService.js';
import { isWorkingDay } from '../services/slots.js';
import { notifyNewBooking } from '../services/telegram.js';
import { normalizePlate } from '../validations/bookingValidation.js';

const MINUTE_MS = 60 * 1000;

// Same shape as validate() errors
const fieldError = (field, message) => ({
  message: 'Перевірте введені дані',
  errors: [{ field, message }],
});
const SERVICE_ERROR = fieldError('serviceId', 'Оберіть послугу');
const DATE_ERROR = fieldError('date', 'Оберіть іншу дату');
const SLOT_TAKEN = { message: 'Цей час уже зайнятий, оберіть інший' };
const NOT_FOUND = { message: 'Запис не знайдено' };
const BAD_STATUS = { message: 'Недопустима зміна статусу' };
const FINAL_BOOKING = {
  message: 'Запис уже виконано або скасовано, його не можна змінити',
};

export const getSlots = async (req, res) => {
  const { date, serviceId } = req.query;

  const service = await Service.findOne({ _id: serviceId, isActive: true });
  if (!service) {
    return res.status(400).json(SERVICE_ERROR);
  }

  const settings = await getSettings();
  const slots = await findFreeSlots(settings, service.durationMin, date);

  res.status(200).json({ date, slots });
};

// source "site": the client's form; "phone": the owner adds it himself after a call
const create = async (req, res, source) => {
  const { serviceId, date, time, ...client } = req.body;

  const service = await Service.findOne({ _id: serviceId, isActive: true });
  if (!service) {
    return res.status(400).json(SERVICE_ERROR);
  }

  const settings = await getSettings();
  if (!isWorkingDay(settings, date)) {
    return res.status(400).json(DATE_ERROR);
  }

  // Check again on the server: the slot could be taken while the client was filling the form
  const slots = await findFreeSlots(settings, service.durationMin, date);
  const slot = slots.find((freeSlot) => freeSlot.time === time);
  if (!slot) {
    return res.status(409).json(SLOT_TAKEN);
  }

  const booking = await Booking.create({
    ...client,
    service: service._id,
    startAt: slot.startAt,
    endAt: new Date(slot.startAt.getTime() + service.durationMin * MINUTE_MS),
    source,
  });

  // The owner doesn't need a notification about a booking he added himself.
  // Not awaited: the client gets the answer right away, a Telegram failure is only logged.
  if (source === 'site') {
    notifyNewBooking(booking, service).catch((err) =>
      console.error('Telegram notification failed:', err.message),
    );
  }

  res.status(201).json(booking);
};

export const createBooking = (req, res) => create(req, res, 'site');

export const createManualBooking = (req, res) => create(req, res, 'phone');

export const getBookings = async (req, res) => {
  const { date, status, search, page, limit } = req.query;
  const filter = {};

  if (date) {
    filter.startAt = dayRange(date);
  }
  if (status) {
    filter.status = status;
  }
  if (search) {
    // Only digits / plate characters are left, so the regex is safe
    const plate = normalizePlate(search).replace(/[^A-Z0-9]/g, '');
    const digits = search.replace(/\D/g, '');
    // Letters mean it's a plate; only digits can be a phone or a plate
    const hasLetters = /\p{L}/u.test(search);

    filter.$or = [
      plate && { plate: { $regex: plate } },
      !hasLetters && digits && { phone: { $regex: digits } },
    ].filter(Boolean);
    if (filter.$or.length === 0) {
      return res.status(200).json({ items: [], page, limit, total: 0 });
    }
  }

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate('service', 'name')
      // One day: in order of the day; everything: newest first
      .sort({ startAt: date ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  res.status(200).json({ items, page, limit, total });
};

export const changeStatus = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json(NOT_FOUND);
  }

  if (!canChangeStatus(booking.status, req.body.status)) {
    return res.status(400).json(BAD_STATUS);
  }

  booking.status = req.body.status;
  await booking.save();
  res.status(200).json(booking);
};

export const updateBooking = async (req, res) => {
  const { date, time, comment } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json(NOT_FOUND);
  }
  if (booking.status === 'done' || booking.status === 'canceled') {
    return res.status(400).json(FINAL_BOOKING);
  }

  if (date) {
    const settings = await getSettings();
    if (!isWorkingDay(settings, date)) {
      return res.status(400).json(DATE_ERROR);
    }

    // Keep the booking's own duration, even if the service duration changed since then
    const durationMs = booking.endAt - booking.startAt;
    const slots = await findFreeSlots(
      settings,
      durationMs / MINUTE_MS,
      date,
      booking._id,
    );
    const slot = slots.find((freeSlot) => freeSlot.time === time);
    if (!slot) {
      return res.status(409).json(SLOT_TAKEN);
    }

    booking.startAt = slot.startAt;
    booking.endAt = new Date(slot.startAt.getTime() + durationMs);
  }

  if (comment !== undefined) {
    // Empty string removes the comment
    booking.comment = comment || undefined;
  }

  await booking.save();
  res.status(200).json(booking);
};
