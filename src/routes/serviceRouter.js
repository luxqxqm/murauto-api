import { Router } from 'express';
import {
  createService,
  getServices,
} from '../controllers/serviceController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { createServiceSchema } from '../validations/serviceValidation.js';

export const serviceRouter = Router();

serviceRouter.get('/', getServices);
serviceRouter.post(
  '/',
  authenticate,
  validate({ body: createServiceSchema }),
  createService,
);
