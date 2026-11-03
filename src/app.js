import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { logger } from './middlewares/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import { healthRouter } from './routes/healthRouter.js';
import { authRouter } from './routes/authRouter.js';
import { serviceRouter } from './routes/serviceRouter.js';
import { settingsRouter } from './routes/settingsRouter.js';
import { bookingRouter } from './routes/bookingRouter.js';

export const app = express();

// Render puts one proxy in front of the app; without this req.ip is the proxy's IP
// and the rate limit would block all clients together
app.set('trust proxy', 1);

app.use(logger);
// Security headers (nosniff, no X-Powered-By, HSTS, etc.)
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/services', serviceRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/bookings', bookingRouter);

app.use(errorHandler);
app.use(globalErrorHandler);
