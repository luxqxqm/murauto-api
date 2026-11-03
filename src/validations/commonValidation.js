import { z } from 'zod';

const ID_ERROR = 'Невірний ідентифікатор';

export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// For every /:id route: 24 hex chars, otherwise 400
export const idParamsSchema = z.object({
  id: z.string().regex(OBJECT_ID_REGEX, ID_ERROR),
});

// "YYYY-MM-DD" that really exists (no 2026-02-30)
export const isRealDate = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !isNaN(date) && date.toISOString().slice(0, 10) === value;
};

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
