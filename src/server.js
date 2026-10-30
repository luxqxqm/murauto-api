import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { logger } from './middlewares/logger.js';
import { mongoConnect } from './db/mongoConnect.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import cookieParser from 'cookie-parser';
const app = express();
const port = process.env.PORT || 3000;

app.use(logger);
app.use(express.json());
app.use(cors()); // Потім треба буде поміняти на vercel фронтенда!

await mongoConnect();

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'good' });
});

app.use(cookieParser());
app.use(errorHandler);
app.use(globalErrorHandler);
app.listen(port, () => {
  console.log(`Server is listening on port : ${port}`);
});
