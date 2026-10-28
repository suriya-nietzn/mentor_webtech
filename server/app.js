import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import env from './config/env.js';
import { isDbConnected } from './config/db.js';
import { requireDb } from './middleware/requireDb.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import miscRoutes from './routes/miscRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

app.use(helmet());
// Allowlist: only our own frontend origin(s) may call the API with cookies.
app.use(
  cors({
    origin(origin, cb) {
      // Requests with no Origin header (curl, same-origin via the Vite proxy) are allowed.
      if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
// Strips keys like "$gt" from input so users cannot inject MongoDB operators.
app.use(mongoSanitize());
if (!env.isProd) app.use(morgan('dev'));

// Health check works even when the database is down, so it reports both states.
app.get('/api/health', (req, res) => {
  const db = isDbConnected() ? 'connected' : 'disconnected';
  res.status(isDbConnected() ? 200 : 503).json({
    success: isDbConnected(),
    message: isDbConnected() ? 'OK' : 'Database unavailable',
    data: { api: 'up', db, time: new Date().toISOString() },
  });
});

// Everything below needs MongoDB.
app.use('/api', requireDb);

app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', miscRoutes);

app.use('/api', notFound);
app.use(errorHandler);

export default app;
