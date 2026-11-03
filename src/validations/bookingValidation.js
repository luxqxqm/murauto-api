import { z } from 'zod';
import { addDays, kyivDate } from '../services/slots.js';
import { isRealDate, OBJECT_ID_REGEX, TIME_REGEX } from './commonValidation.js';

const NAME_ERROR = 'Вкажіть імʼя (2–50 символів)';
const PHONE_ERROR = 'Введіть телефон у форматі +380XXXXXXXXX';
const CAR_ERROR = 'Вкажіть марку й модель авто';
const PLATE_ERROR = 'Невірний формат номера';
const SERVICE_ERROR = 'Оберіть послугу';
const DATE_ERROR = 'Оберіть іншу дату';
const TIME_ERROR = 'Цей час уже зайнятий, оберіть інший';
const COMMENT_ERROR = 'Максимум 500 символів';

const MAX_DAYS_AHEAD = 30;

// Cyrillic letters that look like Latin ones on UA plates
const CYRILLIC_TO_LATIN = {
  А: 'A',
  В: 'B',
  Е: 'E',
  І: 'I',
  К: 'K',
  М: 'M',
  Н: 'H',
  О: 'O',
  Р: 'P',
  С: 'C',
  Т: 'T',
  Х: 'X',
};

const serviceIdSchema = z
  .string({ error: SERVICE_ERROR })
  .regex(OBJECT_ID_REGEX, SERVICE_ERROR);

// Kyiv calendar date: not in the past and not further than 30 days ahead.
// Day off is checked later, it needs Settings from the database.
const bookingDateSchema = z
  .string({ error: DATE_ERROR })
  .refine(isRealDate, DATE_ERROR)
  .refine((date) => {
    const today = kyivDate(new Date());
    return date >= today && date <= addDays(today, MAX_DAYS_AHEAD);
  }, DATE_ERROR);

const phoneSchema = z
  .string({ error: PHONE_ERROR })
  // "+38 (067) 123-45-67" -> "+380671234567"
  .transform((phone) => phone.replace(/[\s()-]/g, ''))
  .transform((phone) => (/^0\d{9}$/.test(phone) ? `+38${phone}` : phone))
  .pipe(z.string().regex(/^\+380\d{9}$/, PHONE_ERROR));

// Only letters that exist on UA plates, e.g. AA1234BB
const PLATE_REGEX = /^[ABCEHIKMOPTX]{2}\d{4}[ABCEHIKMOPTX]{2}$/;

const plateSchema = z
  .string({ error: PLATE_ERROR })
  .transform((plate) =>
    plate
      .replace(/[\s-]/g, '')
      .toUpperCase()
      .replace(/[АВЕІКМНОРСТХ]/g, (letter) => CYRILLIC_TO_LATIN[letter]),
  )
  // Empty field in the form means "no plate"
  .refine((plate) => plate === '' || PLATE_REGEX.test(plate), PLATE_ERROR)
  .transform((plate) => plate || undefined);

export const slotsQuerySchema = z.object({
  date: bookingDateSchema,
  serviceId: serviceIdSchema,
});

export const createBookingSchema = z.object({
  serviceId: serviceIdSchema,
  date: bookingDateSchema,
  time: z.string({ error: TIME_ERROR }).regex(TIME_REGEX, TIME_ERROR),
  clientName: z
    .string({ error: NAME_ERROR })
    .trim()
    .min(2, NAME_ERROR)
    .max(50, NAME_ERROR)
    // Letters, spaces, hyphen, apostrophe (' ʼ ’)
    .regex(/^[\p{L}\s'ʼ’-]+$/u, NAME_ERROR),
  phone: phoneSchema,
  car: z
    .string({ error: CAR_ERROR })
    .trim()
    .min(2, CAR_ERROR)
    .max(40, CAR_ERROR),
  plate: plateSchema.optional(),
  comment: z
    .string({ error: COMMENT_ERROR })
    .trim()
    .max(500, COMMENT_ERROR)
    .optional()
    .transform((comment) => comment || undefined),
});
