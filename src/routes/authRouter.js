import { Router } from 'express';
import { getMe, login, logout } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../validations/authValidation.js';

export const authRouter = Router();

authRouter.post('/login', validate({ body: loginSchema }), login);
authRouter.post('/logout', authenticate, logout);
authRouter.get('/me', authenticate, getMe);
