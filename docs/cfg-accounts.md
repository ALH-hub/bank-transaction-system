# Control Flow Graph: Account Management

## Feature Overview
Bank account CRUD operations with business rules: minimum initial balance (1000), duplicate account type prevention per user, unique account number generation.

---

## Function: `getAllAccounts(page = 1, limit = 10)`

### Entry Point
```
getAllAccounts(page, limit) → { data, total, page, limit, pages }
Parameters: page (pagination), limit (items per page)
```

### Decision Points & Branches

#### Decision 1: Pagination Calculation (No decision - deterministic)

#### Decision 2: Query Accounts with Pagination (No decision)

### All Execution Paths

| Path # | Condition Chain | Execution | Result |
|--------|-----------------|-----------|--------|
| 1 | Database available | Query → Get accounts → Count total → Calculate pages → Return paginated data | Pagination successful | 200 |

### Statement Coverage
- Calculate skip: 1 statement
- Query accounts: 1 statement
- Count total: 1 statement
- Calculate pages: 1 statement
- Return result: 1 statement
- **Total: 5 statements**

### Branch Coverage
- **Total: 0 conditional branches**

### Path Coverage
- **Total: 1 path**

---

## Function: `getUserAccounts(userId: string, page = 1, limit = 10)`

### Entry Point
```
getUserAccounts(userId, page, limit) → { data, total, page, limit, pages }
Parameters: userId, page, limit
```

### Decision Points & Branches

#### Decision 1: Pagination Calculation (No decision - deterministic)

#### Decision 2: Query User Accounts with Pagination (No decision)

### All Execution Paths

| Path # | Condition Chain | Execution | Result |
|--------|-----------------|-----------|--------|
| 1 | User has accounts | Query → Get accounts for user → Count total → Calculate pages → Return data | Accounts retrieved | 200 |
| 2 | User has no accounts | Query → Get empty list → Count = 0 → Return empty data | Empty result (valid) | 200 |

### Statement Coverage
- Calculate skip: 1 statement
- Query accounts: 1 statement
- Count total: 1 statement
- Calculate pages: 1 statement
- Return result: 1 statement
- **Total: 5 statements**

### Branch Coverage
- **Total: 0 conditional branches**

### Path Coverage
- **Total: 2 paths**

---

## Function: `getAccountById(accountId: string)`

### Entry Point
```
getAccountById(accountId) → account (with user details)
Parameters: accountId
```

### Decision Points & Branches

#### Decision 1: Account Lookup
- **Condition**: `account = prisma.account.findUnique({where: {id}})`
- **Branch A (True)**: Account found → continue
- **Branch B (False)**: Account not found → throw Error("Account not found")

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Account exists | GetById → Find account → Return with user | Account retrieved | 200 |
| 2 | Account not found | GetById → Find account (not found) → Throw error | Not found | 404 |

### Statement Coverage
- Find account: 1 statement
- Return account: 1 statement
- **Total: 2 statements**

### Branch Coverage
- Account exists: 2 branches (found/not found)
- **Total: 1 branch with 2 paths**

### Path Coverage
- **Total: 2 distinct paths**

---

## Function: `createAccount(userId: string, data: CreateAccountInput)`

### Entry Point
```
createAccount(userId, data) → account
Parameters: userId, data (accountType, currency, initialBalance)
```

### Decision Points & Branches

#### Decision 1: User Existence
- **Condition**: `user = prisma.user.findUnique({where: {id: userId}})`
- **Branch A (True)**: User found → continue
- **Branch B (False)**: User not found → throw Error("User not found")

#### Decision 2: Duplicate Account Type Check
- **Condition**: `existingAccountOfType = prisma.account.findFirst({where: {userId, accountType}})`
- **Branch A (True)**: Account type exists for user → throw Error("User already has a [type] account")
- **Branch B (False)**: Account type unique → continue

#### Decision 3: Generate Unique Account Number (Loop with retries)
- **Condition**: `while (!isUnique)`
- **Branch A (True)**: Generate number → Check existence → Loop if duplicate
- **Branch B (False)**: Number unique → Continue

#### Decision 4: Create Account with Balance Validation (No explicit decision - Zod validates min 1000)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | User exists → Account type unique → Account number unique → Balance ≥ 1000 → Success | Create → Find user → Check account type → Generate unique number → Create account → Return account | Account created | 201 |
| 2 | User not found | Create → Find user (not found) → Throw error | User not found | 404 |
| 3 | User exists → Account type duplicate | Create → Find user → Check account type (exists) → Throw error | Account type conflict | 400 |
| 4 | User exists → Account type unique → Balance < 1000 | Create → Find user → Check account type → Validate balance (fails) → Throw error | Insufficient initial balance | 400 |

### Statement Coverage
- Find user: 1 statement
- Check duplicate account type: 1 statement
- Generate account number loop: 2 statements
- Create account: 1 statement
- Return account: 1 statement
- **Total: 6 statements**

### Branch Coverage
- User exists: 2 branches (found/not found)
- Account type duplicate: 2 branches (duplicate/unique)
- Account number unique: 2 branches (in loop)
- Balance validation: 2 branches (via Zod)
- **Total: 4 branches with multiple combinations (1 success + 2 error paths tested)**

### Path Coverage
- **Total: 3 distinct paths**

---

## Function: `updateAccount(accountId: string, data: UpdateAccountInput)`

### Entry Point
```
updateAccount(accountId, data) → account
Parameters: accountId, data (accountType, currency, isActive)
```

### Decision Points & Branches

#### Decision 1: Account Existence
- **Condition**: `account = prisma.account.findUnique({where: {id: accountId}})`
- **Branch A (True)**: Account found → continue
- **Branch B (False)**: Account not found → throw Error("Account not found")

#### Decision 2: Update Account (No decision - deterministic)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Account exists | Update → Find account → Update fields → Return account | Account updated | 200 |
| 2 | Account not found | Update → Find account (not found) → Throw error | Not found | 404 |

### Statement Coverage
- Find account: 1 statement
- Update account: 1 statement
- Return account: 1 statement
- **Total: 3 statements**

### Branch Coverage
- Account exists: 2 branches (found/not found)
- **Total: 1 branch with 2 paths**

### Path Coverage
- **Total: 2 distinct paths**

---

## Function: `deleteAccount(accountId: string)`

### Entry Point
```
deleteAccount(accountId) → { message }
Parameters: accountId
```

### Decision Points & Branches

#### Decision 1: Account Existence
- **Condition**: `account = prisma.account.findUnique({where: {id: accountId}})`
- **Branch A (True)**: Account found → continue
- **Branch B (False)**: Account not found → throw Error("Account not found")

#### Decision 2: Account Balance Check
- **Condition**: `account.balance !== 0`
- **Branch A (True)**: Balance non-zero → throw Error("Cannot delete account with non-zero balance")
- **Branch B (False)**: Balance is zero → continue

#### Decision 3: Delete Account (No decision - deterministic)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Account exists → Balance = 0 → Delete → Success | Delete → Find account → Check balance → Delete → Return success | Account deleted | 200 |
| 2 | Account not found | Delete → Find account (not found) → Throw error | Not found | 404 |
| 3 | Account exists → Balance ≠ 0 | Delete → Find account → Check balance (non-zero) → Throw error | Cannot delete | 400 |

### Statement Coverage
- Find account: 1 statement
- Balance check: 1 statement
- Delete account: 1 statement
- Return message: 1 statement
- **Total: 4 statements**

### Branch Coverage
- Account exists: 2 branches (found/not found)
- Balance = 0: 2 branches (zero/non-zero)
- **Total: 2 branches with 4 combinations (1 success + 2 error paths)**

### Path Coverage
- **Total: 3 distinct paths**

---

## Function: `getAccountByNumber(accountNumber: string)`

### Entry Point
```
getAccountByNumber(accountNumber) → account (with user details)
Parameters: accountNumber (unique identifier)
```

### Decision Points & Branches

#### Decision 1: Account Lookup by Number
- **Condition**: `account = prisma.account.findUnique({where: {accountNumber}})`
- **Branch A (True)**: Account found → continue
- **Branch B (False)**: Account not found → throw Error("Account not found")

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Account number exists | GetByNumber → Find account → Return with user | Account retrieved | 200 |
| 2 | Account number not found | GetByNumber → Find account (not found) → Throw error | Not found | 404 |

### Statement Coverage
- Find account: 1 statement
- Return account: 1 statement
- **Total: 2 statements**

### Branch Coverage
- Account exists: 2 branches (found/not found)
- **Total: 1 branch with 2 paths**

### Path Coverage
- **Total: 2 distinct paths**

---

## Summary: Account Management Feature

| Function | Statements | Branches | Paths |
|----------|-----------|----------|-------|
| getAllAccounts() | 5 | 0 | 1 |
| getUserAccounts() | 5 | 0 | 2 |
| getAccountById() | 2 | 1 | 2 |
| createAccount() | 6 | 4 | 3 |
| updateAccount() | 3 | 1 | 2 |
| deleteAccount() | 4 | 2 | 3 |
| getAccountByNumber() | 2 | 1 | 2 |
| **TOTAL** | **27** | **9** | **15** |

### Key Test Coverage Requirements
- ✓ Happy path for each CRUD operation
- ✓ All error conditions (user not found, account not found, duplicate account type)
- ✓ Business rules: minimum initial balance 1000, duplicate account type prevention
- ✓ Account deletion with zero balance requirement
- ✓ Account number uniqueness generation
- ✓ Pagination for account lists
