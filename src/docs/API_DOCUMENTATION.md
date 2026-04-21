# Complete Banking System API Documentation

## 🏦 Overview

This is a comprehensive banking system API built with Express.js, TypeScript, Prisma ORM, and JWT authentication. The system supports complete CRUD operations for users and accounts, full transaction management (deposit, withdrawal, transfer), and role-based access control.

## 🔐 Authentication & Authorization

### Roles
- **ADMIN**: Full system access, can manage users, accounts, and view all transactions
- **CUSTOMER**: Can manage their own accounts and perform transactions
- **TELLER**: Can help customers and view transactions (limited access)

### Token Management
- **Access Token**: Short-lived (1 hour), for API requests
- **Refresh Token**: Long-lived (7 days), for obtaining new access tokens
- **Token Blacklisting**: Invalidate tokens on logout via database

## 📊 Database Models

### User
```typescript
- id: String (CUID)
- firstName: String
- lastName: String
- email: String (unique)
- phone: String (unique)
- password: String (hashed)
- role: Role (ADMIN, CUSTOMER, TELLER)
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
- Relations: accounts[], tokens[], transactionsSent[], transactionsReceived[]
```

### Account
```typescript
- id: String (CUID)
- userId: String (FK to User)
- accountNumber: String (unique, auto-generated)
- accountType: String (savings, checking, investment)
- balance: Float
- currency: String (default: USD)
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
- Relations: user, transactions[]
```

### Transaction
```typescript
- id: String (CUID)
- fromAccountId: String (FK to Account, nullable)
- toAccountId: String (FK to Account, nullable)
- fromUserId: String (FK to User, nullable)
- toUserId: String (FK to User, nullable)
- type: TransactionType (DEPOSIT, WITHDRAWAL, TRANSFER)
- amount: Float
- description: String (optional)
- status: TransactionStatus (PENDING, COMPLETED, FAILED, REVERSED)
- balanceBefore: Float
- balanceAfter: Float
- reference: String (unique)
- createdAt: DateTime
- updatedAt: DateTime
- Relations: fromUser, toUser, fromAccount, toAccount
```

### Token
```typescript
- id: String (CUID)
- userId: String (FK to User)
- token: String (unique)
- tokenType: String (ACCESS, REFRESH)
- isValid: Boolean
- isBlacklisted: Boolean
- expiresAt: DateTime
- createdAt: DateTime
- updatedAt: DateTime
- Relations: user
```

## 🔌 API Endpoints

### Authentication Routes
```
POST /api/auth/register          - Register new user
POST /api/auth/login             - Login user
POST /api/auth/refresh           - Refresh access token
POST /api/auth/logout            - Logout user (blacklist token)
```

### User Management Routes (Admin/Teller only for most operations)
```
GET    /api/users                - Get all users (pagination)
GET    /api/users/{id}           - Get user by ID
POST   /api/users                - Create new user
PUT    /api/users/{id}           - Update user
DELETE /api/users/{id}           - Delete user
PUT    /api/users/{id}/activate  - Activate user
PUT    /api/users/{id}/deactivate - Deactivate user
PUT    /api/users/{id}/role      - Update user role
```

### Account Management Routes
```
GET    /api/accounts             - Get all accounts (Admin/Teller)
GET    /api/accounts/{id}        - Get account details
GET    /api/accounts/user/{userId} - Get user's accounts
POST   /api/accounts/user/{userId} - Create account
PUT    /api/accounts/{id}        - Update account
DELETE /api/accounts/{id}        - Delete account (balance must be 0)
```

### Transaction Routes
```
GET    /api/transactions         - Get all transactions (Admin/Teller)
GET    /api/transactions/account/{accountId} - Get account transactions
GET    /api/transactions/reference/{reference} - Get transaction by reference
POST   /api/transactions/deposit  - Deposit money
POST   /api/transactions/withdraw - Withdraw money
POST   /api/transactions/transfer - Transfer between accounts
```

## 🔑 Request Headers

All authenticated requests require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 📋 Request/Response Examples

### Register
```bash
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePassword123",
  "role": "CUSTOMER"
}

Response 201:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}

Response 200:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Create Account
```bash
POST /api/accounts/user/user-id-here
Authorization: Bearer <token>

{
  "accountType": "savings",
  "currency": "USD",
  "initialBalance": 1000
}

Response 201:
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": "...",
    "accountNumber": "ACC...",
    "balance": 1000,
    ...
  }
}
```

### Deposit
```bash
POST /api/transactions/deposit
Authorization: Bearer <token>

{
  "accountId": "account-id",
  "amount": 500,
  "description": "Salary deposit"
}

Response 201:
{
  "success": true,
  "message": "Deposit successful",
  "data": {
    "id": "...",
    "type": "DEPOSIT",
    "amount": 500,
    "reference": "...",
    ...
  }
}
```

### Withdraw
```bash
POST /api/transactions/withdraw
Authorization: Bearer <token>

{
  "accountId": "account-id",
  "amount": 200,
  "description": "ATM withdrawal"
}

Response 201: Same as deposit
```

### Transfer
```bash
POST /api/transactions/transfer
Authorization: Bearer <token>

{
  "fromAccountId": "from-account-id",
  "toAccountId": "to-account-id",
  "amount": 1000,
  "description": "Payment to contractor"
}

Response 201: Same as deposit
```

## ✅ Validation Rules

### User Creation
- firstName: 1-50 characters, required
- lastName: 1-50 characters, required
- email: Valid email format, unique, required
- phone: 10-15 characters, unique, required
- password: 6-100 characters, required
- role: ADMIN, CUSTOMER, or TELLER, optional

### Account Creation
- accountType: savings, checking, or investment
- currency: 3-character code (e.g., USD, GBP)
- initialBalance: >= 0

### Transactions
- amount: > 0
- fromAccountId / toAccountId: Valid CUID format
- Sufficient balance for withdraw/transfer
- Both accounts must be active

## 🔒 Security Features

✅ JWT Authentication with token blacklisting
✅ Role-based access control
✅ Password hashing
✅ Input validation with Zod
✅ Helmet.js for security headers
✅ CORS configuration
✅ Rate limiting support
✅ SQL injection prevention via Prisma ORM

## 🚀 Deployment

### Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bank_db"
PORT=3000
NODE_ENV=production
APP_URL="https://api.yourdomain.com"
CORS_ORIGINS="https://yourdomain.com"
JWT_SECRET="your-super-secret-key-change-this"
JWT_EXPIRE="1h"
```

### Build & Run
```bash
npm run build
npm start
```

## 📈 Performance Considerations

- Pagination support on all list endpoints
- Database indexes on foreign keys and unique fields
- Token expiration to reduce database checks
- Efficient query selection to minimize data transfer

## 🐛 Error Handling

All errors return proper HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad request / Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 409: Conflict (duplicate email/phone/account)
- 500: Server error

Error response format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🧪 Testing Workflow

1. **Register**: Create user account
2. **Login**: Get access and refresh tokens
3. **Create Account**: Set up bank account(s)
4. **Deposit**: Add funds to account
5. **Withdraw**: Remove funds (if balance sufficient)
6. **Transfer**: Move money between accounts
7. **View Transactions**: Check transaction history
8. **Logout**: Blacklist tokens

## 📚 Related Files

- Prisma Schema: `prisma/schema.prisma`
- Zod Schemas: `src/zod-schema/`
- Services: `src/services/`
- Controllers: `src/controllers/`
- Routes: `src/routes/`
- Middleware: `src/middleware/`
- Utilities: `src/utils/`

---

**API Version**: 1.0.0
**Last Updated**: 2024
**Status**: Production Ready ✅
