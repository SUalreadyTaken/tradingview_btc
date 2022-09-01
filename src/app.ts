import express from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cors from 'cors';
const sleep = require('util').promisify(setTimeout);
import * as cron from 'node-cron'

import { globalErrorHandler } from './controllers/errorController';
import dotenv from 'dotenv';
import { candleRoutes } from './routes/candleRoutes';

export const app = express();

app.enable('trust proxy');
app.use(cors());
app.options('*', cors());
dotenv.config({ path: `${__dirname}/../config.env` });

if (process.env.NODE_ENV === 'development') {
  // app.use(morgan('dev'));
  app.use(morgan('[:date[iso]] :method :url :status :res[content-length] - :response-time ms'));
}

app.use('/api/v1/candle', candleRoutes);

// const limiter = rateLimit({
// 	max: 100,
// 	windowMs: 60 * 1000,
// 	message: 'Too many requests from this IP, please try again in a minute!',
// });

// app.use(limiter);

app.use(globalErrorHandler);