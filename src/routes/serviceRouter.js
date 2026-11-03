import { Router } from 'express';
import {
  activateService,
  createService,
  deactivateService,
  getAllServices,
  getServices,
  updateService,
} from '../controllers/serviceController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { idParamsSchema } from '../validations/commonValidation.js';
import {
  createServiceSchema,
  updateServiceSchema,
} from '../validations/serviceValidation.js';

export const serviceRouter = Router();

serviceRouter.get('/', getServices);
serviceRouter.get('/all', authenticate, getAllServices);
serviceRouter.post(
  '/',
  authenticate,
  validate({ body: createServiceSchema }),
  createService,
);
serviceRouter.patch(
  '/:id',
  authenticate,
  validate({ params: idParamsSchema, body: updateServiceSchema }),
  updateService,
);
serviceRouter.patch(
  '/:id/deactivate',
  authenticate,
  validate({ params: idParamsSchema }),
  deactivateService,
);
serviceRouter.patch(
  '/:id/activate',
  authenticate,
  validate({ params: idParamsSchema }),
  activateService,
);
