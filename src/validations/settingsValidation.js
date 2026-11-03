import { z } from 'zod';
import { SLOT_STEPS, WEEK_DAYS } from '../models/settings.js';

const HOURS_ERROR = 'Час відкриття має бути раніше за час закриття';
const STEP_ERROR = 'Оберіть крок слоту';
const POSTS_ERROR = 'Вкажіть кількість постів (1–10)';
const DATE_ERROR = 'Невірна дата';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// "YYYY-MM-DD" that really exists (no 2026-02-30)
const isRealDate = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !isNaN(date) && date.toISOString().slice(0, 10) === value;
};

const daySchema = z
  .object({
    isDayOff: z.boolean({ error: HOURS_ERROR }),
    open: z.string({ error: HOURS_ERROR }).regex(TIME_REGEX, HOURS_ERROR),
    close: z.string({ error: HOURS_ERROR }).regex(TIME_REGEX, HOURS_ERROR),
  })
  // "HH:mm" strings compare correctly as text
  .refine((day) => day.isDayOff || day.open < day.close, {
    message: HOURS_ERROR,
    path: ['close'],
  });

// Each day that is sent replaces that day completely; days not sent stay as they are
const workingHoursSchema = z
  .object(Object.fromEntries(WEEK_DAYS.map((day) => [day, daySchema])))
  .partial();

export const updateSettingsSchema = z
  .object({
    workingHours: workingHoursSchema,
    slotStepMin: z
      .number({ error: STEP_ERROR })
      .refine((step) => SLOT_STEPS.includes(step), STEP_ERROR),
    postsCount: z
      .number({ error: POSTS_ERROR })
      .int(POSTS_ERROR)
      .min(1, POSTS_ERROR)
      .max(10, POSTS_ERROR),
    daysOff: z
      .array(z.string({ error: DATE_ERROR }).refine(isRealDate, DATE_ERROR))
      // Drop duplicates and keep the list sorted
      .transform((dates) => [...new Set(dates)].sort()),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Немає даних для оновлення',
  });
