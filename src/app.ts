import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import ratelimite from 'express-rate-limit';

import { config } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import { swaggerSpec, swaggerUi } from './config/swagger.js';

// Import routes
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/account.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

export const createApp = (): Application => {
  const app: Application = express();
  const rateLimit = ratelimite({
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Security middleware
  app.use(helmet());

  // Rate limiting middleware
  // app.use(rateLimit);

  // CORS configuration
  app.use(
    cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
    }),
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  if (config.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Health check
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Banking System API is running',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        docs: '/api/docs',
      },
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Alternative: Serve swagger.json endpoint
  app.get('/api/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // API ROUTES
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/transactions', transactionRoutes);

  // ERROR HANDLING
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
