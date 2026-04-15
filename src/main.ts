import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import prisma from './config/database.js';
import { swaggerSpec, swaggerUi } from './config/swagger.js';

// Import routes
import userRoutes from './routes/user.routes.js';

const app: Application = express();

// Security middleware
app.use(helmet());

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
      users: '/api/users',
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

// DOCUMENTATION ROUTES
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Alternative: Serve swagger.json endpoint
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API ROUTES
app.use('/api/users', userRoutes);

// ERROR HANDLING
app.use(notFound);
app.use(errorHandler);

// SERVER START
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected successfully');

    // Start server
    const server = app.listen(config.port, () => {
      console.log(`\n✓ Server running on http://localhost:${config.port}`);
      console.log(`✓ Environment: ${config.env}`);
      console.log(`✓ Health check: http://localhost:${config.port}/api/health`);
      console.log(`✓ API Docs: http://localhost:${config.port}/api/docs`);
      console.log(
        `✓ Swagger JSON: http://localhost:${config.port}/api/swagger.json`,
      );
      console.log(`✓ Users API: http://localhost:${config.port}/api/users\n`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('\n⏱ Shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✓ Server and database disconnected');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Start server
startServer();

export default app;
