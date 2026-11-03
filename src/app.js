import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './middlewares/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import { healthRouter } from './routes/healthRouter.js';
import { authRouter } from './routes/authRouter.js';

export const app = express();

app.use(logger);
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

app.use(errorHandler);
app.use(globalErrorHandler);
