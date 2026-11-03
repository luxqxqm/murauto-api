import { Booking } from '../models/booking.js';
import { Service } from '../models/service.js';
import { getSettings } from '../models/settings.js';
import { findFreeSlots } from '../services/bookingService.js';
import { isWorkingDay } from '../services/slots.js';
import { notifyNewBooking } from '../services/telegram.js';

const MINUTE_MS = 60 * 1000;

// Same shape as validate() errors
const fieldError = (field, message) => ({
  message: 'Перевірте введені дані',
  errors: [{ field, message }],
});
const SERVICE_ERROR = fieldError('serviceId', 'Оберіть послугу');
const DATE_ERROR = fieldError('date', 'Оберіть іншу дату');
const SLOT_TAKEN = { message: 'Цей час уже зайнятий, оберіть інший' };

export const getSlots = async (req, res) => {
  const { date, serviceId } = req.query;

  const service = await Service.findOne({ _id: serviceId, isActive: true });
  if (!service) {
    return res.status(400).json(SERVICE_ERROR);
  }

  const settings = await getSettings();
  const slots = await findFreeSlots(settings, service, date);

  res.status(200).json({ date, slots });
};

export const createBooking = async (req, res) => {
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
  const slots = await findFreeSlots(settings, service, date);
  const slot = slots.find((freeSlot) => freeSlot.time === time);
  if (!slot) {
    return res.status(409).json(SLOT_TAKEN);
  }

  const booking = await Booking.create({
    ...client,
    service: service._id,
    startAt: slot.startAt,
    endAt: new Date(slot.startAt.getTime() + service.durationMin * MINUTE_MS),
    source: 'site',
  });

  // Not awaited: the client gets the answer right away, a Telegram failure is only logged
  notifyNewBooking(booking, service).catch((err) =>
    console.error('Telegram notification failed:', err.message),
  );

  res.status(201).json(booking);
};
