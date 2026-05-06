# Control Flow Graph: User Management

## Feature Overview
User CRUD operations with role-based management, activation/deactivation, and pagination support.

---

## Function: `getAllUsers(page = 1, limit = 10)`

### Entry Point
```
getAllUsers(page, limit) → { data, total, page, limit, pages }
Parameters: page (pagination), limit (items per page)
```

### Decision Points & Branches

#### Decision 1: Pagination Calculation (No decision - deterministic)
- Calculate skip = (page - 1) * limit

#### Decision 2: Query Users (No decision - should succeed)
- Query users with pagination
- Count total users

#### Decision 3: Calculate Total Pages (No decision - deterministic)
- pages = Math.ceil(total / limit)

### All Execution Paths

| Path # | Condition Chain | Execution | Result |
|--------|-----------------|-----------|--------|
| 1 | Database available | Query → Get users → Count total → Calculate pages → Return paginated data | Pagination successful | 200 |
| 2 | Database error | Query → Database error | Internal error | 500 |

### Statement Coverage
- Calculate skip: 1 statement
- Query users: 1 statement
- Count total: 1 statement
- Calculate pages: 1 statement
- Return result: 1 statement
- **Total: 5 statements**

### Branch Coverage
- No decision branches (deterministic, unless considering database failures)
- **Total: 0 conditional branches (1 path)**

### Path Coverage
- **Total: 1 path (success)**

---

## Function: `getUserById(id: string)`

### Entry Point
```
getUserById(id) → user (object with accounts)
Parameters: id (user ID)
```

### Decision Points & Branches

#### Decision 1: User Lookup
- **Condition**: `user = prisma.user.findUnique({where: {id}})`
- **Branch A (True)**: User found → continue
- **Branch B (False)**: User not found → throw Error("User not found")

#### Decision 2: Return User with Accounts (No decision - deterministic)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | User exists | GetById → Find user → Return user with accounts | User retrieved | 200 |
| 2 | User not found | GetById → Find user (not found) → Throw error | Not found | 404 |

### Statement Coverage
- User lookup: 1 statement
- Return user: 1 statement
- **Total: 2 statements**

### Branch Coverage
- User found: 2 branches (found/not found)
- **Total: 1 branch with 2 paths**

### Path Coverage
- **Total: 2 distinct paths**

---

## Function: `createUser(data: CreateUserInput)`

### Entry Point
```
createUser(data) → user
Parameters: firstName, lastName, email, phone, password?, role?
```

### Decision Points & Branches

#### Decision 1: Email Uniqueness Check
- **Condition**: `existingEmail = prisma.user.findUnique({where: {email}})`
- **Branch A (True)**: Email exists → throw Error("Email already exists")
- **Branch B (False)**: Email unique → continue

#### Decision 2: Phone Uniqueness Check
- **Condition**: `existingPhone = prisma.user.findUnique({where: {phone}})`
- **Branch A (True)**: Phone exists → throw Error("Phone number already exists")
- **Branch B (False)**: Phone unique → continue

#### Decision 3: Password Hashing (Deterministic - uses default if not provided)
- Hash password (use provided or default 'DefaultPassword123')

#### Decision 4: Role Assignment (Deterministic - defaults to 'CUSTOMER')
- role = data.role || 'CUSTOMER'

#### Decision 5: User Creation (No decision - should succeed with valid data)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Email unique → Phone unique → User created → Success | Create → Check email → Check phone → Hash password → Create user → Return user | User created | 201 |
| 2 | Email exists | Create → Check email (exists) → Throw error | Email conflict | 400 |
| 3 | Email unique → Phone exists | Create → Check email → Check phone (exists) → Throw error | Phone conflict | 400 |

### Statement Coverage
- Email check: 1 statement
- Phone check: 1 statement
- Password hash: 1 statement
- Role assignment: 1 statement
- User creation: 1 statement
- Return user: 1 statement
- **Total: 6 statements**

### Branch Coverage
- Email exists: 2 branches (exists/not exists)
- Phone exists: 2 branches (exists/not exists)
- **Total: 2 branches with 4 combinations (1 success + 2 error paths)**

### Path Coverage
- **Total: 3 distinct paths**

---

## Function: `updateUser(id: string, data: Partial<CreateUserInput>)`

### Entry Point
```
updateUser(id, data) → user
Parameters: id, data (firstName, lastName, email, phone, role)
```

### Decision Points & Branches

#### Decision 1: User Existence
- **Condition**: `user = prisma.user.findUnique({where: {id}})`
- **Branch A (True)**: User found → continue
- **Branch B (False)**: User not found → throw Error("User not found")

#### Decision 2: Email Change Check
- **Condition**: `data.email && data.email !== user.email`
- **Branch A (True)**: Email changed → check uniqueness
- **Branch B (False)**: Email not changed → skip check

#### Decision 3: Email Uniqueness (If changed)
- **Condition**: `existingEmail = prisma.user.findUnique({where: {email}})`
- **Branch A (True)**: New email exists → throw Error("Email already exists")
- **Branch B (False)**: New email unique → continue

#### Decision 4: Phone Change Check
- **Condition**: `data.phone && data.phone !== user.phone`
- **Branch A (True)**: Phone changed → check uniqueness
- **Branch B (False)**: Phone not changed → skip check

#### Decision 5: Phone Uniqueness (If changed)
- **Condition**: `existingPhone = prisma.user.findUnique({where: {phone}})`
- **Branch A (True)**: New phone exists → throw Error("Phone number already exists")
- **Branch B (False)**: New phone unique → continue

#### Decision 6: User Update (No decision - should succeed)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | User exists → Update successful | Update → Find user → Update fields → Return user | User updated | 200 |
| 2 | User not found | Update → Find user (not found) → Throw error | Not found | 404 |
| 3 | User exists → Email changed → Email exists | Update → Find → Check email (exists) → Throw error | Email conflict | 400 |
| 4 | User exists → Email unique/unchanged → Phone changed → Phone exists | Update → Find → Check email → Check phone (exists) → Throw error | Phone conflict | 400 |

### Statement Coverage
- Find user: 1 statement
- Email change check: 1 statement
- Email uniqueness: 1 statement (conditional)
- Phone change check: 1 statement
- Phone uniqueness: 1 statement (conditional)
- Update user: 1 statement
- Return user: 1 statement
- **Total: 7 statements**

### Branch Coverage
- User exists: 2 branches (found/not found)
- Email changed: 2 branches (changed/not changed)
- Email exists: 2 branches (exists/not exists)
- Phone changed: 2 branches (changed/not changed)
- Phone exists: 2 branches (exists/not exists)
- **Total: 5 branches with 32 combinations (1 success + 3 error paths tested)**

### Path Coverage
- **Total: 4 distinct paths**

---

## Function: `deleteUser(id: string)`

### Entry Point
```
deleteUser(id) → { message }
Parameters: id
```

### Decision Points & Branches

#### Decision 1: User Existence
- **Condition**: `user = prisma.user.findUnique({where: {id}})`
- **Branch A (True)**: User found → continue
- **Branch B (False)**: User not found → throw Error("User not found")

#### Decision 2: User Deletion (No decision - should succeed)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | User exists | Delete → Find user → Delete user → Return success | User deleted | 200 |
| 2 | User not found | Delete → Find user (not found) → Throw error | Not found | 404 |

### Statement Coverage
- Find user: 1 statement
- Delete user: 1 statement
- Return message: 1 statement
- **Total: 3 statements**

### Branch Coverage
- User exists: 2 branches (found/not found)
- **Total: 1 branch with 2 paths**

### Path Coverage
- **Total: 2 distinct paths**

---

## Function: `getUserByEmail(email: string)`

### Entry Point
```
getUserByEmail(email) → user (or null)
Parameters: email
```

### Decision Points & Branches

#### Decision 1: User Lookup (No decision - returns null if not found, no error thrown)

### All Execution Paths

| Path # | Condition Chain | Execution | Result |
|--------|-----------------|-----------|--------|
| 1 | User found | Query → Find user by email → Return user | User retrieved |
| 2 | User not found | Query → Find user (not found) → Return null | No result |

### Statement Coverage
- Query user: 1 statement
- Return result: 1 statement
- **Total: 2 statements**

### Branch Coverage
- No explicit error handling branch (returns null instead)
- **Total: 0 conditional branches**

### Path Coverage
- **Total: 2 distinct paths**

---

## Function: `activateUser(id: string)`

### Entry Point
```
activateUser(id) → user (with isActive = true)
Parameters: id
```

### Decision Points & Branches

#### Decision 1: User Existence
- **Condition**: `user = prisma.user.findUnique({where: {id}})`
- **Branch A (True)**: User found → continue
- **Branch B (False)**: User not found → throw Error("User not found")

#### Decision 2: Activate User (No decision - deterministic update)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | User exists | Activate → Find user → Update isActive = true → Return user | User activated | 200 |
| 2 | User not found | Activate → Find user (not found) → Throw error | Not found | 404 |

### Statement Coverage
- Find user: 1 statement
- Update user: 1 statement
- Return user: 1 statement
- **Total: 3 statements**

### Branch Coverage
- User exists: 2 branches (found/not found)
- **Total: 1 branch with 2 paths**

### Path Coverage
- **Total: 2 distinct paths**

---

## Function: `deactivateUser(id: string)`

### Entry Point
```
deactivateUser(id) → user (with isActive = false)
Parameters: id
```

### Decision Points & Branches

#### Decision 1: User Existence
- **Condition**: `user = prisma.user.findUnique({where: {id}})`
- **Branch A (True)**: User found → continue
- **Branch B (False)**: User not found → throw Error("User not found")

#### Decision 2: Deactivate User (No decision - deterministic update)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | User exists | Deactivate → Find user → Update isActive = false → Return user | User deactivated | 200 |
| 2 | User not found | Deactivate → Find user (not found) → Throw error | Not found | 404 |

### Statement Coverage
- Find user: 1 statement
- Update user: 1 statement
- Return user: 1 statement
- **Total: 3 statements**

### Branch Coverage
- User exists: 2 branches (found/not found)
- **Total: 1 branch with 2 paths**

### Path Coverage
- **Total: 2 distinct paths**

---

## Function: `updateUserRole(id: string, role: 'ADMIN' | 'CUSTOMER' | 'TELLER')`

### Entry Point
```
updateUserRole(id, role) → user (with new role)
Parameters: id, role (ADMIN, CUSTOMER, or TELLER)
```

### Decision Points & Branches

#### Decision 1: User Existence
- **Condition**: `user = prisma.user.findUnique({where: {id}})`
- **Branch A (True)**: User found → continue
- **Branch B (False)**: User not found → throw Error("User not found")

#### Decision 2: Update Role (No decision - deterministic update)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | User exists | UpdateRole → Find user → Update role → Return user | Role updated | 200 |
| 2 | User not found | UpdateRole → Find user (not found) → Throw error | Not found | 404 |

### Statement Coverage
- Find user: 1 statement
- Update role: 1 statement
- Return user: 1 statement
- **Total: 3 statements**

### Branch Coverage
- User exists: 2 branches (found/not found)
- **Total: 1 branch with 2 paths**

### Path Coverage
- **Total: 2 distinct paths**

---

## Summary: User Management Feature

| Function | Statements | Branches | Paths |
|----------|-----------|----------|-------|
| getAllUsers() | 5 | 0 | 1 |
| getUserById() | 2 | 1 | 2 |
| createUser() | 6 | 2 | 3 |
| updateUser() | 7 | 5 | 4 |
| deleteUser() | 3 | 1 | 2 |
| getUserByEmail() | 2 | 0 | 2 |
| activateUser() | 3 | 1 | 2 |
| deactivateUser() | 3 | 1 | 2 |
| updateUserRole() | 3 | 1 | 2 |
| **TOTAL** | **34** | **11** | **20** |

### Key Test Coverage Requirements
- ✓ Happy path for each CRUD operation
- ✓ All error conditions (user not found, email/phone conflicts)
- ✓ Email/phone uniqueness only checked when values change
- ✓ Role assignment with all three roles (ADMIN, CUSTOMER, TELLER)
- ✓ Activation/deactivation state changes
- ✓ Default values (password, role)
