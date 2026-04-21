import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';
import { config } from './env.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Banking System API',
      version: '1.0.0',
      description: `
# Complete Banking System API

A comprehensive, production-ready banking system API with full CRUD operations for users and accounts, complete transaction management (deposit, withdrawal, transfer), JWT authentication, and role-based access control.

## System Features

### Authentication & Authorization
- **JWT Tokens**: Access (1h) and Refresh (7d) tokens
- **Token Blacklisting**: Logout with token invalidation via database
- **Role-Based Access Control**: ADMIN, CUSTOMER, TELLER roles with specific permissions
- **Secure Password Hashing**: Industry-standard password encryption

### User Management (Full CRUD)
- User registration and login with validation
- Profile management and updates
- User activation/deactivation
- Role assignment (ADMIN, CUSTOMER, TELLER)
- Admin-only user creation and deletion

### Account Management (Full CRUD)
- Multiple accounts per user
- Auto-generated unique account numbers (format: ACC + timestamp + random)
- Account types: Savings, Checking, Investment
- Multi-currency support (default: USD)
- Account activation/deactivation
- Account balance tracking

### Transaction Management
- **Deposits**: Add funds to account
- **Withdrawals**: Remove funds with sufficient balance validation
- **Transfers**: Move money between accounts with ownership verification
- **Transaction History**: Complete audit trail with reference tracking
- **Transaction Status**: PENDING, COMPLETED, FAILED, REVERSED states
- **Balance Tracking**: Before/after balance for each transaction

## User Roles & Permissions Matrix

| Permission | ADMIN | CUSTOMER | TELLER |
|---|:---:|:---:|:---:|
| View all users | ✓ | ✗ | ✓ |
| Manage users (CRUD) | ✓ | ✗ | ✗ |
| Change user roles | ✓ | ✗ | ✗ |
| View own profile | ✓ | ✓ | ✓ |
| Create accounts | ✓ | ✓ | ✗ |
| View all accounts | ✓ | ✗ | ✓ |
| Manage own accounts | ✓ | ✓ | ✗ |
| View own transactions | ✓ | ✓ | ✓ |
| View all transactions | ✓ | ✗ | ✓ |
| Deposit (any account) | ✓ | ✓* | ✗ |
| Withdraw | ✓ | ✓* | ✗ |
| Transfer | ✓ | ✓* | ✗ |

*Customer operations only on own accounts

## Authentication

All protected endpoints require the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

### Login Flow
1. Register or login to get tokens
2. Use access_token for API requests
3. When token expires, use refresh_token to get new access_token
4. On logout, token is blacklisted

## HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request / Validation Error
- **401**: Unauthorized / Invalid Token
- **403**: Forbidden / No Permission
- **404**: Not Found
- **409**: Conflict (Duplicate Email/Phone/Account)
- **500**: Internal Server Error

## Support

- **Documentation**: See API endpoints below
- **Models**: See Schemas section
- **Examples**: Each endpoint has request/response examples

---

**API Version**: 1.0.0 | **Status**: Production Ready       `,
      contact: {
        name: 'Banking System Support',
        email: 'support@bankingsystem.com',
        url: 'https://bankingsystem.com/support',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
      'x-logo': {
        url: 'https://www.openapis.org/wp-content/uploads/sites/3/2016/11/favicon.png',
        altText: 'Banking System API',
      },
    },
    servers: [
      {
        url: config.appUrl,
        description: config.appUrl.includes('localhost')
          ? 'Local development server'
          : 'Production server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: config.appUrl.startsWith('https') ? 'https' : 'http',
          },
        },
      },
      {
        url: `${config.appUrl}/api`,
        description: config.appUrl.includes('localhost')
          ? 'Local API base'
          : 'Production API base',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User registration, login, token management',
      },
      {
        name: 'Users Management',
        description: 'Full CRUD operations for users (Admin/Teller)',
      },
      {
        name: 'Accounts',
        description: 'Bank account management - create, read, update, delete',
      },
      {
        name: 'Transactions',
        description: 'Deposit, withdraw, transfer operations',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
      },
      schemas: {
        // User Models
        User: {
          type: 'object',
          description: 'User account in the banking system',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier (CUID)',
              example: 'clh123abc456def789',
            },
            firstName: {
              type: 'string',
              description: "User's first name",
              example: 'John',
            },
            lastName: {
              type: 'string',
              description: "User's last name",
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Unique email address',
              example: 'john.doe@example.com',
            },
            phone: {
              type: 'string',
              description: 'Unique phone number',
              example: '+1234567890',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'CUSTOMER', 'TELLER'],
              description: 'User role with specific permissions',
              example: 'CUSTOMER',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2024-04-15T10:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last account update timestamp',
              example: '2024-04-15T10:30:00Z',
            },
          },
          required: [
            'id',
            'firstName',
            'lastName',
            'email',
            'phone',
            'role',
            'isActive',
            'createdAt',
            'updatedAt',
          ],
        },

        // Account Models
        Account: {
          type: 'object',
          description: 'Bank account owned by a user',
          properties: {
            id: {
              type: 'string',
              description: 'Unique account identifier (CUID)',
              example: 'clh123acc456def789',
            },
            userId: {
              type: 'string',
              description: 'ID of the account owner',
              example: 'clh123abc456def789',
            },
            accountNumber: {
              type: 'string',
              description: 'Unique auto-generated account number',
              example: 'ACC16542K7A9B',
            },
            accountType: {
              type: 'string',
              enum: ['savings', 'checking', 'investment'],
              description: 'Type of bank account',
              example: 'savings',
            },
            balance: {
              type: 'number',
              format: 'double',
              description: 'Current account balance',
              example: 5000.0,
            },
            currency: {
              type: 'string',
              description: 'Currency code (ISO 4217)',
              example: 'USD',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the account is active',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2024-04-15T10:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last account update timestamp',
              example: '2024-04-15T10:30:00Z',
            },
          },
          required: [
            'id',
            'userId',
            'accountNumber',
            'accountType',
            'balance',
            'currency',
            'isActive',
            'createdAt',
            'updatedAt',
          ],
        },

        // Transaction Models
        Transaction: {
          type: 'object',
          description: 'Bank transaction record (deposit, withdraw, transfer)',
          properties: {
            id: {
              type: 'string',
              description: 'Unique transaction identifier',
              example: 'clh123trx456def789',
            },
            reference: {
              type: 'string',
              description: 'Unique transaction reference for tracking',
              example: 'TRX20240415001234',
            },
            type: {
              type: 'string',
              enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'],
              description: 'Type of transaction',
              example: 'DEPOSIT',
            },
            amount: {
              type: 'number',
              format: 'double',
              description: 'Transaction amount',
              example: 1000.0,
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
              description: 'Transaction status',
              example: 'COMPLETED',
            },
            description: {
              type: 'string',
              description: 'Optional transaction description',
              example: 'Salary deposit',
            },
            balanceBefore: {
              type: 'number',
              format: 'double',
              description: 'Account balance before transaction',
              example: 4000.0,
            },
            balanceAfter: {
              type: 'number',
              format: 'double',
              description: 'Account balance after transaction',
              example: 5000.0,
            },
            fromAccountId: {
              type: 'string',
              nullable: true,
              description: 'Source account (for withdraw/transfer)',
              example: 'clh123acc456def789',
            },
            toAccountId: {
              type: 'string',
              nullable: true,
              description: 'Destination account (for deposit/transfer)',
              example: 'clh123acc456def790',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction timestamp',
              example: '2024-04-15T10:30:00Z',
            },
          },
          required: [
            'id',
            'reference',
            'type',
            'amount',
            'status',
            'balanceBefore',
            'balanceAfter',
            'createdAt',
          ],
        },

        // Auth Request/Response Models
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              example: 'Password123',
            },
          },
        },

        RegisterRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'phone', 'password'],
          properties: {
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            password: {
              type: 'string',
              example: 'SecurePassword123',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'CUSTOMER', 'TELLER'],
              default: 'CUSTOMER',
              example: 'CUSTOMER',
            },
          },
        },

        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login successful',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                accessToken: {
                  type: 'string',
                  description: 'JWT access token (1 hour expiry)',
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token (7 days expiry)',
                },
              },
            },
          },
        },

        // Transaction Request Models
        DepositRequest: {
          type: 'object',
          required: ['accountId', 'amount'],
          properties: {
            accountId: {
              type: 'string',
              description: 'Target account for deposit',
              example: 'clh123acc456def789',
            },
            amount: {
              type: 'number',
              format: 'double',
              description: 'Amount to deposit',
              example: 500.0,
            },
            description: {
              type: 'string',
              description: 'Optional deposit description',
              example: 'Monthly salary',
            },
          },
        },

        WithdrawRequest: {
          type: 'object',
          required: ['accountId', 'amount'],
          properties: {
            accountId: {
              type: 'string',
              description: 'Source account for withdrawal',
              example: 'clh123acc456def789',
            },
            amount: {
              type: 'number',
              format: 'double',
              description: 'Amount to withdraw',
              example: 200.0,
            },
            description: {
              type: 'string',
              description: 'Optional withdrawal description',
              example: 'ATM withdrawal',
            },
          },
        },

        TransferRequest: {
          type: 'object',
          required: ['fromAccountId', 'toAccountId', 'amount'],
          properties: {
            fromAccountId: {
              type: 'string',
              description: 'Source account for transfer',
              example: 'clh123acc456def789',
            },
            toAccountId: {
              type: 'string',
              description: 'Destination account for transfer',
              example: 'clh123acc456def790',
            },
            amount: {
              type: 'number',
              format: 'double',
              description: 'Amount to transfer',
              example: 1000.0,
            },
            description: {
              type: 'string',
              description: 'Optional transfer description',
              example: 'Payment to contractor',
            },
          },
        },

        // Generic Response Models
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },

        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed',
            },
          },
        },

        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Data retrieved successfully',
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  example: 100,
                },
                page: {
                  type: 'integer',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  example: 10,
                },
                pages: {
                  type: 'integer',
                  example: 10,
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

// @ts-ignore
export const swaggerSpec = swaggerJsdoc(swaggerOptions);
export const swaggerUi = swaggerUiExpress;
