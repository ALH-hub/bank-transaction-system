import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';
import { config } from './env.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Banking System API',
      version: '1.0.0',
      description: `A comprehensive banking system API for managing user accounts and transactions.

    ## Features
    - User account management (create, read, update, delete)
    - Account balance tracking
    - User profile management

    ## Authentication
    Currently supports basic operations. JWT authentication can be implemented using the auth middleware.`,
      contact: {
        name: 'Banking System Support',
        email: 'support@banking.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: config.appUrl,
        description: 'Development server',
      },
      {
        url: `${config.appUrl}/api`,
        description: 'API base URL',
      },
    ],
    tags: [
      {
        name: 'Users',
        description: 'User management endpoints',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to your route files with JSDoc comments
};

// @ts-ignore
export const swaggerSpec = swaggerJsdoc(swaggerOptions);
export const swaggerUi = swaggerUiExpress;
