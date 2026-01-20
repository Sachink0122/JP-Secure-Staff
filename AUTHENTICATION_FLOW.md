# Authentication & RBAC Flow - JP Secure Staff

## Overview

This document explains the authentication and RBAC (Role-Based Access Control) flow implemented in Phase 1.

## Architecture

### 1. Database Models

#### Department
- Represents organizational departments
- Fields: `name`, `code`, `isActive`
- Used to associate users with departments

#### Permission
- Individual permission flags for RBAC
- Fields: `name` (uppercase), `description`
- All permissions are stored as constants in `backend/constants/permissions.js`

#### Role
- Groups permissions together
- Fields: `name`, `permissions[]` (array of Permission references)
- **NO role-name checks in code** - only permission flags are checked

#### User
- System users with authentication
- Fields: `fullName`, `email`, `password` (hashed), `department` (ref), `role` (ref), `isActive`
- Password is automatically hashed using bcrypt before saving

## Authentication Flow

### 1. Login Process

```
POST /api/auth/login
Body: { email, password }
```

**Steps:**
1. **Validation**: Input validated using `express-validator`
   - Email format validation
   - Password minimum length (8 characters)

2. **User Lookup**: Find user by email with password field included
   - Populate role and permissions
   - Populate department

3. **Verification**:
   - Check if user exists
   - Check if user is active
   - Verify password using bcrypt comparison

4. **JWT Generation**:
   - Extract permission names from role
   - Create JWT payload:
     ```javascript
     {
       userId: user._id,
       departmentId: user.department._id,
       permissions: ['USER_READ', 'USER_CREATE', ...] // Array of permission strings
     }
     ```
   - Sign token with JWT_SECRET

5. **Response**: Return user info, token, and permissions array

### 2. Token Verification (Middleware)

**Middleware**: `authenticate` in `backend/middleware/auth.js`

**Process:**
1. Extract token from `Authorization: Bearer <token>` header
2. Verify JWT signature and expiration
3. Lookup user in database to ensure still exists and is active
4. Attach to `req.user`:
   ```javascript
   {
     userId: string,
     departmentId: string,
     permissions: string[],
     user: User object (full)
   }
   ```

## RBAC Flow

### Permission Checking

**Middleware**: `checkPermission(permissionName)` in `backend/middleware/rbac.js`

**Key Rules:**
- ✅ **NO role-name checks** - only permission flags
- ✅ Permissions stored in JWT payload (no database lookup needed)
- ✅ Server-side enforcement only
- ✅ Normalized to uppercase for consistency

**Process:**
1. Ensure user is authenticated (`req.user` exists)
2. Normalize permission to uppercase
3. Check if `permission` exists in `req.user.permissions` array
4. If not found, return 403 Forbidden
5. If found, proceed to next middleware/controller

### Available Middleware Functions

1. **`checkPermission(permission)`**
   - Requires single permission
   - Example: `checkPermission(PERMISSIONS.USER_READ)`

2. **`checkAnyPermission([permission1, permission2])`**
   - Requires any one of the permissions
   - Example: `checkAnyPermission([PERMISSIONS.USER_READ, PERMISSIONS.USER_CREATE])`

3. **`checkAllPermissions([permission1, permission2])`**
   - Requires all permissions
   - Example: `checkAllPermissions([PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE])`

## Seed Data

### Running Seed Script

```bash
npm run seed
```

Or:
```bash
node backend/scripts/seed.js
```

### What Gets Created

1. **All Permissions**: All permission constants from `constants/permissions.js`
   - Total: ~40+ permissions covering all system modules

2. **Admin Department**: 
   - Name: "Administration"
   - Code: "ADMIN"

3. **Master Admin Role**:
   - Name: "Master Admin"
   - Permissions: ALL permissions in the system

4. **Master Admin User**:
   - Email: From `MASTER_ADMIN_EMAIL` env var (default: `admin@jpsecurestaff.com`)
   - Password: From `MASTER_ADMIN_PASSWORD` env var (default: `Admin@123456`)
   - Department: Admin
   - Role: Master Admin

### Environment Variables for Seed

Add to `.env`:
```env
MASTER_ADMIN_EMAIL=admin@jpsecurestaff.com
MASTER_ADMIN_PASSWORD=Admin@123456
```

## Example Usage

### Protected Route Example

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../constants/permissions');

// Route requiring USER_READ permission
router.get(
  '/users',
  authenticate,                    // 1. Verify JWT token
  checkPermission(PERMISSIONS.USER_READ),  // 2. Check permission
  getUsersController              // 3. Execute controller
);
```

### Demo Routes

Two demo routes are available:

1. **GET /api/demo/protected**
   - Requires: `USER_READ` permission
   - Returns: User info and permissions

2. **GET /api/demo/admin-only**
   - Requires: `MASTER_ADMIN` permission
   - Returns: Admin confirmation

## Security Features

1. **Password Hashing**: bcrypt with 12 rounds
2. **JWT Expiration**: Configurable via `JWT_EXPIRE` (default: 7 days)
3. **Token Verification**: Every request verified
4. **User Status Check**: Inactive users cannot authenticate
5. **Permission Normalization**: All permissions uppercase
6. **No Role Checks**: Only permission flags used

## API Endpoints

### Public
- `POST /api/auth/login` - Login with email/password

### Protected (Require Authentication)
- `GET /api/auth/me` - Get current user profile
- `GET /api/demo/protected` - Demo route (requires USER_READ)
- `GET /api/demo/admin-only` - Demo route (requires MASTER_ADMIN)

## Testing the Flow

1. **Seed Database**:
   ```bash
   npm run seed
   ```

2. **Start Server**:
   ```bash
   npm run dev
   ```

3. **Login**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@jpsecurestaff.com","password":"Admin@123456"}'
   ```

4. **Access Protected Route**:
   ```bash
   curl -X GET http://localhost:5000/api/demo/protected \
     -H "Authorization: Bearer <token-from-login>"
   ```

## Next Steps

- Implement refresh token mechanism
- Add password reset functionality
- Implement session management
- Add rate limiting per user
- Implement audit logging for auth events

