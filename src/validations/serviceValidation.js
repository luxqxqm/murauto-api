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
  // TODO (Day 6): durationMin must also be a multiple of the slot step from Settings
  durationMin: z
    .number({ error: DURATION_ERROR })
    .int(DURATION_ERROR)
    .min(10, DURATION_ERROR)
    .max(480, DURATION_ERROR),
  sortOrder: z.number().int().optional(),
});
