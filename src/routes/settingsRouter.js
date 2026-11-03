import { Router } from 'express';
import {
  getPublicSettings,
  updateSettings,
} from '../controllers/settingsController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { updateSettingsSchema } from '../validations/settingsValidation.js';

export const settingsRouter = Router();

settingsRouter.get('/public', getPublicSettings);
settingsRouter.patch(
  '/',
  authenticate,
  validate({ body: updateSettingsSchema }),
  updateSettings,
);
