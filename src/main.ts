import { config } from './config/env.js';
import prisma from './config/database.js';
import { createApp } from './app.js';

const app = createApp();

// SERVER START
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Start server
    const server = app.listen(config.port, () => {
      console.log(`\nServer running on http://localhost:${config.port}`);
      console.log(`Environment: ${config.env}`);
      console.log(`Health check: http://localhost:${config.port}/api/health`);
      console.log(`API Docs: http://localhost:${config.port}/api/docs`);
      console.log(
        `Swagger JSON: http://localhost:${config.port}/api/swagger.json`,
      );
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('\nShutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server and database disconnected');
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

