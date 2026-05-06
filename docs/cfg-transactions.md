# Control Flow Graph: Transaction Processing

## Feature Overview
Core transaction operations (deposit, withdraw, transfer) with validation, authorization, account status checks, balance management, and transaction history tracking.

---

## Function: `getAllTransactions(page = 1, limit = 10)`

### Entry Point
```
getAllTransactions(page, limit) → { data, total, page, limit, pages }
Parameters: page (pagination), limit (items per page)
```

### Decision Points & Branches

#### Decision 1: Pagination Calculation (No decision - deterministic)

#### Decision 2: Query Transactions with Pagination (No decision)

### All Execution Paths

| Path # | Condition Chain | Execution | Result |
|--------|-----------------|-----------|--------|
| 1 | Database available | Query → Get transactions → Count total → Calculate pages → Return paginated data | Pagination successful | 200 |

### Statement Coverage
- Calculate skip: 1 statement
- Query transactions: 1 statement
- Count total: 1 statement
- Calculate pages: 1 statement
- Return result: 1 statement
- **Total: 5 statements**

### Branch Coverage
- **Total: 0 conditional branches**

### Path Coverage
- **Total: 1 path**

---

## Function: `getAccountTransactions(accountId: string, page = 1, limit = 10)`

### Entry Point
```
getAccountTransactions(accountId, page, limit) → { data, total, page, limit, pages }
Parameters: accountId, page, limit
```

### Decision Points & Branches

#### Decision 1: Pagination Calculation (No decision - deterministic)

#### Decision 2: Query Account Transactions with Pagination (No decision)
- Uses OR condition: fromAccountId OR toAccountId

### All Execution Paths

| Path # | Condition Chain | Execution | Result |
|--------|-----------------|-----------|--------|
| 1 | Account has transactions | Query → Get transactions for account → Count total → Calculate pages → Return data | Transactions retrieved | 200 |
| 2 | Account has no transactions | Query → Get empty list → Count = 0 → Return empty data | Empty result (valid) | 200 |

### Statement Coverage
- Calculate skip: 1 statement
- Query transactions: 1 statement
- Count total: 1 statement
- Calculate pages: 1 statement
- Return result: 1 statement
- **Total: 5 statements**

### Branch Coverage
- **Total: 0 conditional branches**

### Path Coverage
- **Total: 2 paths**

---

## Function: `deposit(userId: string, data: DepositInput)`

### Entry Point
```
deposit(userId, data) → transaction
Parameters: userId, data (accountId, amount, description?)
```

### Decision Points & Branches

#### Decision 1: Account Existence
- **Condition**: `account = prisma.account.findUnique({where: {id: data.accountId}})`
- **Branch A (True)**: Account found → continue
- **Branch B (False)**: Account not found → throw Error("Account not found")

#### Decision 2: User Lookup (for role check)
- **Condition**: `user = prisma.user.findUnique({where: {id: userId}})`
- **Branch A (True)**: User found → continue
- **Branch B (False)**: User not found → throw Error (implicit - shouldn't happen)

#### Decision 3: Account Ownership/Role Check
- **Condition**: `account.userId !== userId && user?.role === 'CUSTOMER'`
- **Branch A (True)**: Customer depositing to someone else's account → throw Error("You can only deposit to your own account")
- **Branch B (False)**: User is account owner OR user is ADMIN/TELLER → continue

#### Decision 4: Account Active Check
- **Condition**: `!account.isActive`
- **Branch A (True)**: Account inactive → throw Error("Account is not active")
- **Branch B (False)**: Account active → continue

#### Decision 5: Amount Validation (via Zod schema, min 100)
- **Condition**: `data.amount >= 100`
- **Branch A (True)**: Amount valid → continue
- **Branch B (False)**: Amount < 100 → throw validation error

#### Decision 6: Create Transaction (No decision - deterministic)

#### Decision 7: Update Account Balance (No decision - deterministic)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Account exists → User found → Authorization OK (owner OR admin/teller) → Account active → Amount ≥ 100 → Success | Deposit → Find account → Find user → Check auth → Check active → Validate amount → Create transaction → Update balance → Return transaction | Deposit successful | 200 |
| 2 | Account not found | Deposit → Find account (not found) → Throw error | Account not found | 404 |
| 3 | Account exists → User is CUSTOMER → Account owned by different user | Deposit → Find account → Find user → Check auth (fails) → Throw error | Unauthorized deposit | 403 |
| 4 | Account exists → Account inactive | Deposit → Find account → Find user → Check auth → Check active (false) → Throw error | Account inactive | 400 |
| 5 | Account exists → Amount < 100 | Deposit → Find account → Validate amount (fails) → Throw error | Invalid amount | 400 |

### Statement Coverage
- Find account: 1 statement
- Find user: 1 statement
- Check authorization: 1 statement
- Check active: 1 statement
- Validate amount: 1 statement (implicit via Zod)
- Create transaction: 1 statement
- Update balance: 1 statement
- Return result: 1 statement
- **Total: 8 statements**

### Branch Coverage
- Account exists: 2 branches (found/not found)
- Authorization: 2 branches (authorized/unauthorized)
- Account active: 2 branches (active/inactive)
- Amount valid: 2 branches (≥100/<100 via Zod)
- **Total: 4 branches with 16 combinations (1 success + 4 error paths)**

### Path Coverage
- **Total: 5 distinct paths**

---

## Function: `withdraw(userId: string, data: WithdrawInput)`

### Entry Point
```
withdraw(userId, data) → transaction
Parameters: userId, data (accountId, amount, description?)
```

### Decision Points & Branches

#### Decision 1: Account Existence
- **Condition**: `account = prisma.account.findUnique({where: {id: data.accountId}})`
- **Branch A (True)**: Account found → continue
- **Branch B (False)**: Account not found → throw Error("Account not found")

#### Decision 2: Account Ownership
- **Condition**: `account.userId !== userId`
- **Branch A (True)**: Account not owned by user → throw AppError("You can only withdraw from your own account", 403)
- **Branch B (False)**: Account owned by user → continue

#### Decision 3: Account Active Check
- **Condition**: `!account.isActive`
- **Branch A (True)**: Account inactive → throw AppError("Account is not active", 400)
- **Branch B (False)**: Account active → continue

#### Decision 4: Sufficient Balance Check
- **Condition**: `account.balance < data.amount`
- **Branch A (True)**: Insufficient balance → throw AppError("Insufficient balance", 400)
- **Branch B (False)**: Sufficient balance → continue

#### Decision 5: Amount Validation (via Zod schema, min 100)
- **Condition**: `data.amount >= 100`
- **Branch A (True)**: Amount valid → continue
- **Branch B (False)**: Amount < 100 → throw validation error

#### Decision 6: Create Transaction (No decision - deterministic)

#### Decision 7: Update Account Balance (No decision - deterministic)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Account exists → Owned by user → Account active → Balance sufficient → Amount ≥ 100 → Success | Withdraw → Find account → Check owner → Check active → Check balance → Validate amount → Create transaction → Update balance → Return transaction | Withdrawal successful | 200 |
| 2 | Account not found | Withdraw → Find account (not found) → Throw error | Account not found | 404 |
| 3 | Account exists → Not owned by user | Withdraw → Find account → Check owner (fails) → Throw error | Unauthorized withdrawal | 403 |
| 4 | Account exists → Account inactive | Withdraw → Find account → Check owner → Check active (false) → Throw error | Account inactive | 400 |
| 5 | Account exists → Insufficient balance | Withdraw → Find account → Check owner → Check active → Check balance (fails) → Throw error | Insufficient balance | 400 |
| 6 | Account exists → Amount < 100 | Withdraw → Find account → Validate amount (fails) → Throw error | Invalid amount | 400 |

### Statement Coverage
- Find account: 1 statement
- Check ownership: 1 statement
- Check active: 1 statement
- Check balance: 1 statement
- Validate amount: 1 statement
- Create transaction: 1 statement
- Update balance: 1 statement
- Return result: 1 statement
- **Total: 8 statements**

### Branch Coverage
- Account exists: 2 branches (found/not found)
- Ownership: 2 branches (owned/not owned)
- Account active: 2 branches (active/inactive)
- Balance sufficient: 2 branches (sufficient/insufficient)
- Amount valid: 2 branches (≥100/<100 via Zod)
- **Total: 5 branches with 32 combinations (1 success + 5 error paths)**

### Path Coverage
- **Total: 6 distinct paths**

---

## Function: `transfer(userId: string, data: TransferInput)`

### Entry Point
```
transfer(userId, data) → transaction
Parameters: userId, data (fromAccountId, toAccountId, amount, description?)
```

### Decision Points & Branches

#### Decision 1: From Account Existence
- **Condition**: `fromAccount = prisma.account.findUnique({where: {id: data.fromAccountId}})`
- **Branch A (True)**: Account found → continue
- **Branch B (False)**: Account not found → throw AppError("From account not found", 404)

#### Decision 2: To Account Existence
- **Condition**: `toAccount = prisma.account.findUnique({where: {id: data.toAccountId}})`
- **Branch A (True)**: Account found → continue
- **Branch B (False)**: Account not found → throw AppError("To account not found", 404)

#### Decision 3: From Account Ownership
- **Condition**: `fromAccount.userId !== userId`
- **Branch A (True)**: Account not owned by user → throw AppError("You can only transfer from your own account", 403)
- **Branch B (False)**: Account owned by user → continue

#### Decision 4: Both Accounts Active Check
- **Condition**: `!fromAccount.isActive || !toAccount.isActive`
- **Branch A (True)**: One or both accounts inactive → throw AppError("One or both accounts are not active", 400)
- **Branch B (False)**: Both accounts active → continue

#### Decision 5: Sufficient Balance in From Account
- **Condition**: `fromAccount.balance < data.amount`
- **Branch A (True)**: Insufficient balance → throw AppError("Insufficient balance", 400)
- **Branch B (False)**: Sufficient balance → continue

#### Decision 6: Self-Transfer Check
- **Condition**: `data.fromAccountId === data.toAccountId`
- **Branch A (True)**: Same account → throw AppError("Cannot transfer to the same account", 400)
- **Branch B (False)**: Different accounts → continue

#### Decision 7: Amount Validation (via Zod schema, min 100)
- **Condition**: `data.amount >= 100`
- **Branch A (True)**: Amount valid → continue
- **Branch B (False)**: Amount < 100 → throw validation error

#### Decision 8: Create Transaction (No decision - deterministic)

#### Decision 9: Update Both Account Balances (No decision - parallel updates)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Both accounts exist → From owned by user → Both active → Balance sufficient → Not self-transfer → Amount ≥ 100 → Success | Transfer → Find both → Check from owner → Check both active → Check balance → Check not self-transfer → Validate amount → Create transaction → Update both balances → Return transaction | Transfer successful | 200 |
| 2 | From account not found | Transfer → Find from account (not found) → Throw error | Account not found | 404 |
| 3 | To account not found | Transfer → Find both → Find to account (not found) → Throw error | Account not found | 404 |
| 4 | Both exist → From not owned by user | Transfer → Find both → Check from owner (fails) → Throw error | Unauthorized transfer | 403 |
| 5 | Both exist → From owned → One/both inactive | Transfer → Find both → Check owner → Check active (false) → Throw error | Account inactive | 400 |
| 6 | Both exist → From owned → Both active → Insufficient balance | Transfer → Find both → Check owner → Check active → Check balance (fails) → Throw error | Insufficient balance | 400 |
| 7 | Both exist → From owned → Both active → Balance sufficient → Self-transfer | Transfer → Find both → Check owner → Check active → Check balance → Check not self (fails) → Throw error | Cannot self-transfer | 400 |
| 8 | Both exist → Amount < 100 | Transfer → Find both → Validate amount (fails) → Throw error | Invalid amount | 400 |

### Statement Coverage
- Find from account: 1 statement
- Find to account: 1 statement
- Check from owner: 1 statement
- Check both active: 1 statement
- Check from balance: 1 statement
- Check self-transfer: 1 statement
- Validate amount: 1 statement
- Create transaction: 1 statement
- Update both balances: 2 statements (parallel)
- Return result: 1 statement
- **Total: 11 statements**

### Branch Coverage
- From exists: 2 branches (found/not found)
- To exists: 2 branches (found/not found)
- From ownership: 2 branches (owned/not owned)
- Both active: 2 branches (active/inactive)
- Balance sufficient: 2 branches (sufficient/insufficient)
- Self-transfer: 2 branches (same/different)
- Amount valid: 2 branches (≥100/<100 via Zod)
- **Total: 7 branches with 128 combinations (1 success + 7 error paths)**

### Path Coverage
- **Total: 8 distinct paths**

---

## Function: `getTransactionByReference(reference: string)`

### Entry Point
```
getTransactionByReference(reference) → transaction
Parameters: reference (unique identifier)
```

### Decision Points & Branches

#### Decision 1: Transaction Lookup by Reference
- **Condition**: `transaction = prisma.transaction.findUnique({where: {reference}})`
- **Branch A (True)**: Transaction found → continue
- **Branch B (False)**: Transaction not found → throw AppError("Transaction not found", 404)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Transaction found | GetByReference → Find transaction → Return with accounts and users | Transaction retrieved | 200 |
| 2 | Transaction not found | GetByReference → Find transaction (not found) → Throw error | Not found | 404 |

### Statement Coverage
- Find transaction: 1 statement
- Return transaction: 1 statement
- **Total: 2 statements**

### Branch Coverage
- Transaction exists: 2 branches (found/not found)
- **Total: 1 branch with 2 paths**

### Path Coverage
- **Total: 2 distinct paths**

---

## Summary: Transaction Processing Feature

| Function | Statements | Branches | Paths |
|----------|-----------|----------|-------|
| getAllTransactions() | 5 | 0 | 1 |
| getAccountTransactions() | 5 | 0 | 2 |
| deposit() | 8 | 4 | 5 |
| withdraw() | 8 | 5 | 6 |
| transfer() | 11 | 7 | 8 |
| getTransactionByReference() | 2 | 1 | 2 |
| **TOTAL** | **39** | **17** | **24** |

### Key Test Coverage Requirements
- ✓ Happy path for each transaction type (deposit, withdraw, transfer)
- ✓ All error conditions:
  - Account not found (from/to accounts in transfer)
  - Unauthorized access (ownership verification)
  - Insufficient balance
  - Inactive accounts
  - Self-transfer prevention
  - Minimum amount validation (100)
- ✓ Authorization logic (customers vs admin/teller for deposits)
- ✓ Balance updates (before/after snapshots)
- ✓ Transaction reference retrieval
- ✓ Pagination for transaction lists
