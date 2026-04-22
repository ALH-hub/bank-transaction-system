# Test Suite Documentation

## Overview
Comprehensive test suite using **Mocha**, **Chai**, and **Supertest** with **NYC** for code coverage reporting.

## Test Coverage

### 1. Authentication Tests (`tests/auth.test.ts`)
- ✅ User registration with valid/invalid data
- ✅ Duplicate email/phone validation
- ✅ User login with credential validation
- ✅ Token refresh functionality
- ✅ User logout with token blacklisting

### 2. Account Tests (`tests/accounts.test.ts`)
- ✅ Account creation with minimum initial balance (1000)
- ✅ Prevent duplicate account types per user
- ✅ Allow multiple different account types
- ✅ Account retrieval by ID and user
- ✅ Account deletion (only with zero balance)
- ✅ Pagination support
- ✅ Authentication and authorization checks

### 3. Transaction Tests (`tests/transactions.test.ts`)
- ✅ Deposits with minimum amount (100)
- ✅ Withdrawals with minimum amount (100)
- ✅ Transfers between accounts
- ✅ Balance updates on transactions
- ✅ Insufficient balance validation
- ✅ Inactive account checks
- ✅ Ownership verification
- ✅ Transaction history retrieval
- ✅ Role-based access control

### 4. User Tests (`tests/users.test.ts`)
- ✅ List all users (Admin/Teller only)
- ✅ Get user profile (self or admin)
- ✅ Update user information
- ✅ Delete users (Admin only)
- ✅ Activate/deactivate users
- ✅ Change user roles
- ✅ Pagination support

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

## Coverage Report
After running `npm run test:coverage`, view the HTML report:
```
open coverage/index.html
```

## Test Configuration Files

### `.mocharc.json`
Mocha configuration for TypeScript support:
- Timeout: 10 seconds
- Exit on completion
- Recursive test discovery

### `.nycrc`
NYC configuration for code coverage:
- Coverage thresholds: 70% (lines, functions, branches, statements)
- Reporters: text, html, lcov, json
- Excludes: main.ts, test files, d.ts, node_modules

## Test Setup

### `tests/setup.ts`
Global test setup and teardown:
- Database connection before all tests
- Database cleanup before each test
- Database disconnection after all tests
- Ensures test isolation

## Key Features

✅ **Endpoint Testing**: Uses actual Express routes via Supertest
✅ **Business Rules**: Tests all validation rules (minimum amounts, duplicate types, etc.)
✅ **Authorization**: Tests role-based access control
✅ **Data Integrity**: Validates balance updates and transaction records
✅ **Error Handling**: Tests both success and failure scenarios
✅ **Coverage Reports**: HTML, JSON, LCOV, and text format reports

## Test Organization

```
tests/
├── setup.ts              # Global test setup and teardown
├── auth.test.ts          # Authentication endpoints
├── accounts.test.ts      # Account management endpoints
├── transactions.test.ts  # Transaction operations
└── users.test.ts         # User management endpoints
```

## Statistics

- **Total Test Suites**: 4
- **Total Test Cases**: 50+
- **Lines of Test Code**: 1000+
- **Coverage Goals**: 70% minimum

## Notes

- Tests use real Express application endpoints
- Database is cleaned before each test for isolation
- Each test is independent and can run in any order
- Timestamps and IDs are validated automatically
- All API responses follow consistent structure
