import { z } from 'zod';
import { SERVICE_CATEGORIES } from '../models/service.js';

const NAME_ERROR = 'Вкажіть назву послуги';
const CATEGORY_ERROR = 'Оберіть категорію';
const PRICE_ERROR = 'Вкажіть коректну ціну';
const DURATION_ERROR = 'Вкажіть тривалість у хвилинах';

export const createServiceSchema = z.object({
  name: z
    .string({ error: NAME_ERROR })
    .trim()
    .min(2, NAME_ERROR)
    .max(80, NAME_ERROR),
  category: z.enum(SERVICE_CATEGORIES, { error: CATEGORY_ERROR }),
  price: z
    .number({ error: PRICE_ERROR })
    .int(PRICE_ERROR)
    .min(0, PRICE_ERROR)
    .max(100000, PRICE_ERROR),
  isPriceFrom: z.boolean().optional(),
  // Multiple of the slot step is checked in the controller (the step is in Settings)
  durationMin: z
    .number({ error: DURATION_ERROR })
    .int(DURATION_ERROR)
    .min(10, DURATION_ERROR)
    .max(480, DURATION_ERROR),
  sortOrder: z.number().int().optional(),
});

// Same rules, but every field is optional; an empty body makes no sense
export const updateServiceSchema = createServiceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Немає даних для оновлення',
  });
