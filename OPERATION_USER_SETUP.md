# Operations Department User Setup Guide

## Quick Answer

**There is NO Operations user created by default.** You need to create it manually.

**Default Master Admin Credentials:**
- Email: `admin@jpsecurestaff.com`
- Password: `Admin@123456`

---

## Option 1: Use Helper Script (Recommended)

### Step 1: Run Seed Script (if not done already)
```bash
cd backend
npm run seed
```

### Step 2: Create Operations User
```bash
cd backend
npm run create-operation-user
```

**This will create:**
- ✅ Operations department (code: OPERATION)
- ✅ Finance department (code: FINANCE) - needed for Phase 4
- ✅ Operations Staff role (with PERSON_CREATE, PERSON_READ, PERSON_SUBMIT_TO_FINANCE permissions)
- ✅ Operations user

**Default Operations User Credentials:**
- Email: `operation@jpsecurestaff.com`
- Password: `Operation@123456`

---

## Option 2: Create Manually via API

### Step 1: Login as Master Admin
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@jpsecurestaff.com",
  "password": "Admin@123456"
}
```

Save the `token` from response.

### Step 2: Create Operations Department
```bash
POST http://localhost:5000/api/admin/departments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Operation",
  "code": "OPERATION",
  "isActive": true
}
```

### Step 3: Create Finance Department
```bash
POST http://localhost:5000/api/admin/departments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Finance",
  "code": "FINANCE",
  "isActive": true
}
```

### Step 4: Get Permission IDs
```bash
GET http://localhost:5000/api/admin/permissions
Authorization: Bearer <token>
```

Find IDs for:
- `PERSON_CREATE`
- `PERSON_READ`
- `PERSON_SUBMIT_TO_FINANCE`

### Step 5: Create Operations Role
```bash
POST http://localhost:5000/api/admin/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Operations Staff",
  "permissions": [
    "<PERSON_CREATE_ID>",
    "<PERSON_READ_ID>",
    "<PERSON_SUBMIT_TO_FINANCE_ID>"
  ]
}
```

### Step 6: Create Operations User
```bash
POST http://localhost:5000/api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Operations Staff",
  "email": "operation@jpsecurestaff.com",
  "password": "Operation@123456",
  "department": "<OPERATION_DEPARTMENT_ID>",
  "role": "<OPERATIONS_STAFF_ROLE_ID>",
  "isActive": true
}
```

---

## Environment Variables (Optional)

You can customize the Operations user credentials by adding to `backend/.env`:

```env
OPERATION_USER_EMAIL=operation@jpsecurestaff.com
OPERATION_USER_PASSWORD=Operation@123456
```

Then run:
```bash
npm run create-operation-user
```

---

## Verification

### Test Operations User Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "operation@jpsecurestaff.com",
  "password": "Operation@123456"
}
```

**Expected Response:**
- Status: 200
- Token: JWT token
- Permissions: `["PERSON_CREATE", "PERSON_READ", "PERSON_SUBMIT_TO_FINANCE"]`
- Department: Operation

---

## Summary

**Master Admin (Created by seed.js):**
- Email: `admin@jpsecurestaff.com`
- Password: `Admin@123456`
- Department: Admin
- Permissions: ALL

**Operations User (Created by create-operation-user.js):**
- Email: `operation@jpsecurestaff.com`
- Password: `Operation@123456`
- Department: Operation
- Permissions: PERSON_CREATE, PERSON_READ, PERSON_SUBMIT_TO_FINANCE

---

## Troubleshooting

**Issue: "Operation department not found"**
- Solution: Run `npm run create-operation-user` to create the department

**Issue: "Finance department not found"**
- Solution: Run `npm run create-operation-user` to create the department

**Issue: "Permission denied"**
- Solution: Ensure Operations user has `PERSON_SUBMIT_TO_FINANCE` permission

**Issue: "Only users from Operation department can submit"**
- Solution: Ensure user's department is set to Operation (not Admin)

