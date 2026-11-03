import { Router } from 'express';
import { login } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../validations/authValidation.js';

export const authRouter = Router();

authRouter.post('/login', validate({ body: loginSchema }), login);
