# Control Flow Graph: Authorization & Access Control Middleware

## Feature Overview
JWT authentication middleware with role-based authorization for endpoint access control. Includes stateless access token verification and optional authentication modes.

---

## Middleware: `authenticate(req, res, next)`

### Entry Point
```
authenticate(req: AuthRequest, res: Response, next: NextFunction) → void
Purpose: Verify JWT access token and attach user info to request
Behavior: On success calls next(), on error calls next(error)
```

### Decision Points & Branches

#### Decision 1: Authorization Header Presence
- **Condition**: `authHeader = req.headers.authorization`
- **Branch A (True)**: Header exists → continue to check format
- **Branch B (False)**: No header → throw AppError("No authorization token provided", 401)

#### Decision 2: Bearer Token Format Check
- **Condition**: `authHeader.startsWith('Bearer ')`
- **Branch A (True)**: Correct format → extract token
- **Branch B (False)**: Invalid format → throw AppError("No authorization token provided", 401)

#### Decision 3: Extract Token from Header
- **Condition**: Extract via `authHeader.slice(7)` to remove 'Bearer ' prefix
- **Branch A (True)**: Token extracted → continue
- **Branch B (False)**: Should not fail (deterministic operation)

#### Decision 4: Token Verification (JWT Signature & Expiration)
- **Condition**: `decoded = verifyToken(token)`
- **Branch A (True)**: Token valid and not expired → continue
- **Branch B (False)**: Invalid or expired token → throw AppError("Invalid or expired token", 401)

#### Decision 5: Request Enhancement (Attach userId and user info)
- **Condition**: Set `req.userId = decoded.userId` and `req.user = decoded`
- **Branch A (True)**: Properties attached → continue
- **Branch B (False)**: Should not fail (assignment operation)

#### Decision 6: Proceed to Next Handler
- **Condition**: Call `next()`
- Always calls next()

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Header exists → Bearer format → Token valid/not expired → Decoded → User info attached → next() | Authenticate → Check header → Check format → Extract token → Verify token → Attach user → Call next() | Authentication successful, request proceeds | 200 (next handler) |
| 2 | No authorization header | Authenticate → Check header (missing) → Throw error | Missing token | 401 |
| 3 | Header exists → Invalid format | Authenticate → Check header → Check format (fails) → Throw error | Invalid format | 401 |
| 4 | Header exists → Format OK → Token invalid/expired | Authenticate → Check header → Check format → Extract → Verify (fails) → Throw error | Invalid/expired token | 401 |
| 5 | Catch-all error handling | Authenticate → Any error → Catch block → Throw AppError("Authentication failed", 401) | Generic auth error | 401 |

### Statement Coverage
- Get authorization header: 1 statement
- Check Bearer format: 1 statement
- Extract token: 1 statement
- Verify token: 1 statement
- Attach userId: 1 statement
- Attach user: 1 statement
- Call next(): 1 statement
- Error handling (try/catch): 2 statements
- **Total: 9 statements**

### Branch Coverage
- Header exists: 2 branches (exists/missing)
- Bearer format: 2 branches (valid/invalid)
- Token valid: 2 branches (valid/invalid)
- Error handling: 2 branches (AppError/other error)
- **Total: 4 branches with 16 combinations (1 success + 4 error paths)**

### Path Coverage
- **Total: 5 distinct paths**

---

## Middleware: `authorize(...allowedRoles: string[])`

### Entry Point
```
authorize(...allowedRoles) → middleware function
Purpose: Higher-order function that returns middleware to check user role
Behavior: Checks if authenticated user has one of allowedRoles
```

### Decision Points & Branches

#### Decision 1: User Authentication State
- **Condition**: `!req.user` (check if authenticate middleware ran successfully)
- **Branch A (True)**: User not authenticated → throw AppError("User not authenticated", 401)
- **Branch B (False)**: User authenticated → continue to role check

#### Decision 2: User Role Check
- **Condition**: `!allowedRoles.includes(req.user.role)`
- **Branch A (True)**: User role NOT in allowedRoles → throw AppError with required roles message, 403
- **Branch B (False)**: User role IS in allowedRoles → continue

#### Decision 3: Proceed to Next Handler
- **Condition**: Call `next()`
- Always calls next()

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | User authenticated → Role in allowedRoles → next() | Authorize → Check user exists → Check role (in allowedRoles) → Call next() | Authorization successful, request proceeds | 200 (next handler) |
| 2 | User not authenticated (req.user missing) | Authorize → Check user (missing) → Throw error | Not authenticated | 401 |
| 3 | User authenticated → Role NOT in allowedRoles | Authorize → Check user → Check role (not in allowedRoles) → Throw error | Insufficient permissions | 403 |

### Statement Coverage
- Check user exists: 1 statement
- Check user role: 1 statement
- Call next(): 1 statement
- **Total: 3 statements**

### Branch Coverage
- User exists: 2 branches (exists/not exists)
- Role in allowedRoles: 2 branches (included/not included)
- **Total: 2 branches with 4 combinations (1 success + 2 error paths)**

### Path Coverage
- **Total: 3 distinct paths**

---

## Middleware: `optionalAuth(req, res, next)`

### Entry Point
```
optionalAuth(req: AuthRequest, res: Response, next: NextFunction) → void
Purpose: Attempt to authenticate but don't fail if no token provided
Behavior: Always calls next() regardless of authentication result
```

### Decision Points & Branches

#### Decision 1: Authorization Header Presence
- **Condition**: `authHeader = req.headers.authorization`
- **Branch A (True)**: Header exists → continue to check format
- **Branch B (False)**: No header → skip authentication, call next()

#### Decision 2: Bearer Token Format Check
- **Condition**: `authHeader && authHeader.startsWith('Bearer ')`
- **Branch A (True)**: Correct format → extract token
- **Branch B (False)**: Invalid format OR no header → skip verification, call next()

#### Decision 3: Extract Token from Header
- **Condition**: Extract via `authHeader.slice(7)`
- **Branch A (True)**: Token extracted → continue
- **Branch B (False)**: Should not fail (deterministic)

#### Decision 4: Token Verification
- **Condition**: `decoded = verifyToken(token)`
- **Branch A (True)**: Token valid → attach to request
- **Branch B (False)**: Token invalid → ignore error, call next() without user info

#### Decision 5: Request Enhancement (Optional - only if token valid)
- **Condition**: `if (decoded)`
- **Branch A (True)**: Set user info on request
- **Branch B (False)**: Skip setting user info

#### Decision 6: Proceed to Next Handler
- **Condition**: Call `next()` (always, in catch block too)
- Always calls next()

### All Execution Paths

| Path # | Condition Chain | Execution | Result | Status Code |
|--------|-----------------|-----------|--------|-------------|
| 1 | Header exists → Bearer format → Token valid → User info attached → next() | OptionalAuth → Check header → Check format → Extract → Verify (success) → Attach user → Call next() | Optional auth successful, user info available | 200 (next handler) |
| 2 | No authorization header → Proceed without auth | OptionalAuth → Check header (missing) → Skip verification → Call next() | Unauthenticated proceed | 200 (next handler) |
| 3 | Header exists → Invalid format → Skip verification | OptionalAuth → Check header → Check format (invalid) → Skip verification → Call next() | Unauthenticated proceed | 200 (next handler) |
| 4 | Header exists → Format OK → Token invalid/expired → Error caught | OptionalAuth → Check header → Check format → Extract → Verify (fails) → Catch → Call next() | Unauthenticated proceed (error ignored) | 200 (next handler) |

### Statement Coverage
- Get authorization header: 1 statement
- Check header and format: 1 statement
- Extract token: 1 statement
- Verify token: 1 statement
- Check decoded: 1 statement
- Attach userId: 1 statement (conditional)
- Attach user: 1 statement (conditional)
- Call next(): 1 statement (appears twice - try and catch blocks)
- Error handling: 1 statement (catch block)
- **Total: 9 statements**

### Branch Coverage
- Header exists: 2 branches (exists/missing)
- Bearer format: 2 branches (valid/invalid)
- Token valid: 2 branches (valid/invalid)
- Decoded exists: 2 branches (exists/not exists)
- Error handling: 2 branches (try/catch)
- **Total: 5 branches with 32 combinations (4 success paths, all non-error)**

### Path Coverage
- **Total: 4 distinct paths (all lead to next(), no error responses)**

---

## Role-Based Access Control Matrix

### Allowed Roles by Endpoint Group

| Endpoint Group | Allowed Roles | Middleware Chain |
|----------------|---------------|------------------|
| Admin operations (create user, delete user, view all users) | ADMIN | authenticate → authorize('ADMIN') |
| Teller operations (view all accounts, view all transactions) | ADMIN, TELLER | authenticate → authorize('ADMIN', 'TELLER') |
| Customer operations (view own accounts, deposit/withdraw) | ADMIN, CUSTOMER, TELLER | authenticate → authorize('ADMIN', 'CUSTOMER', 'TELLER') |
| Authorization required operations | Any authenticated user | authenticate only |
| Public endpoints (register, login) | None | No middleware |

---

## Decision Flow Diagram: Complete Authentication Flow

```
Request arrives
    ↓
Has Authorization Header?
    ├─→ NO  → 401 "No authorization token provided"
    └─→ YES → Check Bearer format?
              ├─→ NO  → 401 "No authorization token provided"
              └─→ YES → Extract token
                        ↓
                        Verify token (signature & expiration)
                        ├─→ INVALID → 401 "Invalid or expired token"
                        └─→ VALID   → Attach user info to request
                                     ↓
                                     Pass to authorize middleware (if needed)
                                     ↓
                                     User has required role?
                                     ├─→ NO  → 403 "You don't have permission..."
                                     └─→ YES → Proceed to route handler
```

---

## Summary: Authorization & Access Control Feature

| Component | Statements | Branches | Paths |
|-----------|-----------|----------|-------|
| authenticate() | 9 | 4 | 5 |
| authorize() | 3 | 2 | 3 |
| optionalAuth() | 9 | 5 | 4 |
| **TOTAL** | **21** | **11** | **12** |

### Key Test Coverage Requirements

#### Authenticate Middleware Tests
- ✓ Valid token with all claims (userId, email, role)
- ✓ Missing authorization header
- ✓ Invalid Bearer format (missing, incorrect prefix)
- ✓ Invalid/expired token
- ✓ Correct error responses (401 for auth failures)
- ✓ User info properly attached to request

#### Authorize Middleware Tests
- ✓ User has required role (passes through)
- ✓ User lacks required role (403 error)
- ✓ Not authenticated (missing req.user)
- ✓ Multiple allowed roles (user with any role in list passes)
- ✓ Single role requirement

#### OptionalAuth Middleware Tests
- ✓ Valid token provided (attaches user info)
- ✓ No token provided (continues without user info)
- ✓ Invalid token provided (catches error, continues)
- ✓ Malformed header (continues without user info)
- ✓ Always proceeds (never throws error)

#### Integration Tests
- ✓ Complete auth flow: authenticate → authorize → endpoint
- ✓ Role-based access for different user roles (ADMIN, TELLER, CUSTOMER)
- ✓ Mixed authentication scenarios with optionalAuth
