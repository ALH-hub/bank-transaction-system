# Control Flow Graph: Authentication & Token Management

## Feature Overview
Authentication service with JWT token management (access tokens for stateless verification, refresh tokens for persistent storage and logout).

---

## Function: `register(data: RegisterInput)`

### Entry Point
```
register(data: RegisterInput) → { user, accessToken, refreshToken }
Parameters: firstName, lastName, email, phone, password, role?
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

#### Decision 3: Password Hashing (No decision - deterministic)
- Hash password → continue

#### Decision 4: User Creation (No decision - should succeed with valid data)
- Create user with hashed password, role defaults to 'CUSTOMER'

#### Decision 5: Token Generation (No decision - deterministic)
- Generate access token (1h expiry) and refresh token (7d expiry)

#### Decision 6: Delete Old Tokens (Idempotent - shouldn't find any for new users)
- Delete any existing tokens for user

#### Decision 7: Store Refresh Token
- Create token record in database

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Email unique → Phone unique → User created → Tokens generated → Success | Register → Hash password → Create user → Generate tokens → Delete old tokens → Store refresh token → Return user+tokens | User created with tokens | 201 |
| 2 | Email exists | Register → Find email → Throw error | Email conflict | 400 |
| 3 | Email unique → Phone exists | Register → Find email (unique) → Find phone → Throw error | Phone conflict | 400 |

### Statement Coverage
- Email uniqueness check: 1 statement
- Phone uniqueness check: 1 statement
- Password hashing: 1 statement
- User creation: 1 statement
- Token generation: 1 statement
- Delete old tokens: 1 statement
- Store refresh token: 1 statement
- Return result: 1 statement
- **Total: 8 statements**

### Branch Coverage
- Email branch: 2 branches (exists/not exists)
- Phone branch: 2 branches (exists/not exists)
- **Total: 2 branches with 4 combinations (1 success path + 2 error paths)**

### Path Coverage
- **Total: 3 distinct paths**

---

## Function: `login(data: LoginInput)`

### Entry Point
```
login(data: LoginInput) → { user, accessToken, refreshToken }
Parameters: email, password
```

### Decision Points & Branches

#### Decision 1: User Lookup
- **Condition**: `user = prisma.user.findUnique({where: {email}})`
- **Branch A (True)**: User found → continue
- **Branch B (False)**: User not found → throw Error("Invalid credentials")

#### Decision 2: Password Verification
- **Condition**: `isPasswordValid = verifyPassword(password, user.password)`
- **Branch A (True)**: Password valid → continue
- **Branch B (False)**: Password invalid → throw Error("Invalid credentials")

#### Decision 3: Account Active Check
- **Condition**: `user.isActive`
- **Branch A (True)**: User active → continue
- **Branch B (False)**: User deactivated → throw Error("User account is deactivated")

#### Decision 4: Token Generation (No decision - deterministic)

#### Decision 5: Delete Old Tokens (Idempotent)

#### Decision 6: Store Refresh Token

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | User exists → Password valid → User active → Tokens generated → Success | Login → Find user → Verify password → Check active → Generate tokens → Delete old tokens → Store refresh token → Return user+tokens | Login successful | 200 |
| 2 | User not found | Login → Find user (not found) → Throw error | Authentication failed | 401 |
| 3 | User exists → Password invalid | Login → Find user → Verify password (fails) → Throw error | Authentication failed | 401 |
| 4 | User exists → Password valid → User deactivated | Login → Find user → Verify password → Check active (false) → Throw error | User deactivated | 403 |

### Statement Coverage
- User lookup: 1 statement
- Password verification: 1 statement
- Active check: 1 statement
- Token generation: 1 statement
- Delete old tokens: 1 statement
- Store refresh token: 1 statement
- Return result: 1 statement
- **Total: 7 statements**

### Branch Coverage
- User exists: 2 branches (found/not found)
- Password valid: 2 branches (valid/invalid)
- Account active: 2 branches (active/inactive)
- **Total: 3 branches with 8 combinations (1 success path + 3 error paths)**

### Path Coverage
- **Total: 4 distinct paths**

---

## Function: `refreshAccessToken(refreshToken: string)`

### Entry Point
```
refreshAccessToken(refreshToken: string) → { accessToken, refreshToken }
Parameters: refreshToken
```

### Decision Points & Branches

#### Decision 1: Token Decoding
- **Condition**: `decoded = decodeToken(refreshToken)`
- **Branch A (True)**: Token decodes → continue
- **Branch B (False)**: Token invalid → throw Error("Invalid refresh token")

#### Decision 2: Token in Database
- **Condition**: `storedToken = prisma.token.findUnique({where: {token}})`
- **Branch A (True)**: Token found → continue
- **Branch B (False)**: Token not found → throw Error("Refresh token is invalid or revoked")

#### Decision 3: Token Validity & Blacklist Check
- **Condition**: `!storedToken || storedToken.isBlacklisted || !storedToken.isValid`
- **Branch A (True)**: Token invalid/blacklisted → throw Error("Refresh token is invalid or revoked")
- **Branch B (False)**: Token valid → continue

#### Decision 4: Token Expiration Check
- **Condition**: `storedToken.expiresAt < new Date()`
- **Branch A (True)**: Token expired → throw Error("Refresh token has expired")
- **Branch B (False)**: Token not expired → continue

#### Decision 5: User Lookup
- **Condition**: `user = prisma.user.findUnique({where: {id}})`
- **Branch A (True)**: User found → continue
- **Branch B (False)**: User not found → throw Error("User not found")

#### Decision 6: Generate New Access Token (No decision - deterministic)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Token decodes → Found in DB → Valid/not blacklisted → Not expired → User exists → Access token generated → Success | Refresh → Decode token → Find in DB → Check valid → Check not expired → Find user → Generate access token → Return tokens | Token refreshed | 200 |
| 2 | Token invalid decode | Refresh → Decode token (fails) → Throw error | Invalid token | 401 |
| 3 | Token decodes → Not found in DB | Refresh → Decode → Find in DB (not found) → Throw error | Token revoked | 401 |
| 4 | Token decodes → Found → Invalid/blacklisted | Refresh → Decode → Find → Check valid (false) → Throw error | Token revoked | 401 |
| 5 | Token decodes → Found → Valid → Expired | Refresh → Decode → Find → Check valid → Check expired (true) → Throw error | Token expired | 401 |
| 6 | Token decodes → Found → Valid → Not expired → User not found | Refresh → Decode → Find → Check valid → Check not expired → Find user (not found) → Throw error | User not found | 404 |

### Statement Coverage
- Token decode: 1 statement
- Find in database: 1 statement
- Check validity: 1 statement
- Check expiration: 1 statement
- Find user: 1 statement
- Generate token: 1 statement
- Return result: 1 statement
- **Total: 7 statements**

### Branch Coverage
- Token decode: 2 branches (valid/invalid)
- Token in DB: 2 branches (found/not found)
- Token validity: 2 branches (valid/invalid+blacklisted)
- Token expiration: 2 branches (expired/not expired)
- User exists: 2 branches (found/not found)
- **Total: 5 branches with 32 possible combinations (1 success path + 5 error paths)**

### Path Coverage
- **Total: 6 distinct paths**

---

## Function: `logout(token: string)`

### Entry Point
```
logout(token: string) → void (idempotent operation)
Parameters: token (refresh token)
```

### Decision Points & Branches

#### Decision 1: Token Lookup
- **Condition**: `storedToken = prisma.token.findUnique({where: {token}})`
- **Branch A (True)**: Token found → continue
- **Branch B (False)**: Token not found → skip update (idempotent)

#### Decision 2: Update Token (Only if found)
- **Condition**: `if (storedToken)`
- **Branch A (True)**: Blacklist token
- **Branch B (False)**: No operation

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Token found in DB | Logout → Find token → Update (blacklist, set invalid) → Success | Token blacklisted | 200 |
| 2 | Token not found in DB | Logout → Find token (not found) → No operation → Success | Idempotent success | 200 |

### Statement Coverage
- Token lookup: 1 statement
- Token blacklist update: 2 statements (conditional)
- **Total: 3 statements**

### Branch Coverage
- Token found: 2 branches (found/not found)
- **Total: 1 branch with 2 paths (both success)**

### Path Coverage
- **Total: 2 distinct paths (both successful)**

---

## Function: `verifyToken(token: string)`

### Entry Point
```
verifyToken(token: string) → storedToken (object)
Parameters: token (typically refresh token)
```

### Decision Points & Branches

#### Decision 1: Token in Database
- **Condition**: `storedToken = prisma.token.findUnique({where: {token}})`
- **Branch A (True)**: Token found → continue
- **Branch B (False)**: Token not found → throw Error("Token not found")

#### Decision 2: Token Validity & Blacklist Check
- **Condition**: `storedToken.isBlacklisted || !storedToken.isValid`
- **Branch A (True)**: Token invalid/blacklisted → throw Error("Token is invalid or revoked")
- **Branch B (False)**: Token valid → continue

#### Decision 3: Token Expiration Check
- **Condition**: `storedToken.expiresAt < new Date()`
- **Branch A (True)**: Token expired → throw Error("Token has expired")
- **Branch B (False)**: Token not expired → continue

#### Decision 4: Return Token (No decision - deterministic)

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Token in DB → Valid/not blacklisted → Not expired → Success | Verify → Find token → Check valid → Check not expired → Return token | Token verified | 200 |
| 2 | Token not in DB | Verify → Find token (not found) → Throw error | Token not found | 401 |
| 3 | Token in DB → Invalid/blacklisted | Verify → Find → Check valid (false) → Throw error | Token invalid | 401 |
| 4 | Token in DB → Valid → Expired | Verify → Find → Check valid → Check expired (true) → Throw error | Token expired | 401 |

### Statement Coverage
- Token lookup: 1 statement
- Validity check: 1 statement
- Expiration check: 1 statement
- Return token: 1 statement
- **Total: 4 statements**

### Branch Coverage
- Token found: 2 branches (found/not found)
- Token validity: 2 branches (valid/invalid)
- Token expiration: 2 branches (expired/not expired)
- **Total: 3 branches with 8 combinations (1 success path + 3 error paths)**

### Path Coverage
- **Total: 4 distinct paths**

---

## Summary: Authentication Feature

| Function | Statements | Branches | Paths |
|----------|-----------|----------|-------|
| register() | 8 | 2 | 3 |
| login() | 7 | 3 | 4 |
| refreshAccessToken() | 7 | 5 | 6 |
| logout() | 3 | 1 | 2 |
| verifyToken() | 4 | 3 | 4 |
| **TOTAL** | **29** | **14** | **19** |

### Key Test Coverage Requirements
- ✓ Happy path for each function
- ✓ All error conditions (user not found, invalid token, expired token, deactivated user, email/phone conflicts)
- ✓ Idempotent operations (logout, delete old tokens)
- ✓ All decision point combinations
