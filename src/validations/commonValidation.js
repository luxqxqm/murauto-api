import { z } from 'zod';

const ID_ERROR = 'Невірний ідентифікатор';

// For every /:id route: 24 hex chars, otherwise 400
export const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, ID_ERROR),
});
