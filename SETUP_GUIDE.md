# JP Secure Staff - Setup & Testing Guide

Complete guide to set up and run both Frontend and Backend for testing.

## Prerequisites

1. **Node.js** (>= 18.0.0)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **npm** (>= 9.0.0)
   - Comes with Node.js
   - Verify: `npm --version`

3. **MongoDB** (Local or Docker)
   - **Option A - Local MongoDB**: Install from https://www.mongodb.com/try/download/community
   - **Option B - Docker**: Use Docker Compose (recommended for quick setup)

---

## 🚀 Quick Start (Using Docker for MongoDB)

### Step 1: Start MongoDB with Docker

Open terminal in project root and run:

```bash
docker-compose up -d mongodb
```

This starts MongoDB on port 27017.

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
# On Windows (PowerShell):
Copy-Item .env.example .env

# On Linux/Mac:
# cp .env.example .env
```

**Edit `backend/.env` file** with these values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jp-secure-staff

# JWT Secrets (change these in production!)
JWT_SECRET=your-super-secret-jwt-key-dev-12345
JWT_REFRESH_SECRET=your-refresh-token-secret-dev-12345
SESSION_SECRET=your-session-secret-dev-12345

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Master Admin credentials (for seed script)
MASTER_ADMIN_EMAIL=admin@jpsecurestaff.com
MASTER_ADMIN_PASSWORD=Admin@123456
```

### Step 3: Seed Database

```bash
# Still in backend directory
npm run seed
```

**Expected output:**
```
✓ Created/Updated permission: USER_CREATE
✓ Created/Updated permission: USER_READ
...
✓ Created/Updated department: Administration
✓ Created/Updated role: Master Admin with 40+ permissions
✓ Created Master Admin user: admin@jpsecurestaff.com
```

### Step 4: Start Backend Server

```bash
# Still in backend directory
npm run dev
```

**Expected output:**
```
Server running in development mode on port 5000
MongoDB connected successfully
```

Backend is now running at: **http://localhost:5000**

### Step 5: Frontend Setup

**Open a NEW terminal window** (keep backend running):

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
# On Windows (PowerShell):
Copy-Item .env.example .env

# On Linux/Mac:
# cp .env.example .env
```

**Edit `frontend/.env` file** with these values:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000
```

### Step 6: Start Frontend Server

```bash
# Still in frontend directory
npm run dev
```

**Expected output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Frontend is now running at: **http://localhost:3000**

---

## 🧪 Testing the Application

### 1. Test Backend Health

Open browser or use curl:

```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Test Login API

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@jpsecurestaff.com\",\"password\":\"Admin@123456\"}"
```

**Using PowerShell:**
```powershell
$body = @{
    email = "admin@jpsecurestaff.com"
    password = "Admin@123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "fullName": "Master Administrator",
      "email": "admin@jpsecurestaff.com",
      "department": {
        "id": "...",
        "name": "Administration",
        "code": "ADMIN"
      },
      "role": {
        "id": "...",
        "name": "Master Admin"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "permissions": ["USER_CREATE", "USER_READ", ...]
  }
}
```

**Save the `token` value for next steps!**

### 3. Test Protected Route

Replace `<YOUR_TOKEN>` with the token from login:

```bash
curl -X GET http://localhost:5000/api/demo/protected \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**Expected response:**
```json
{
  "success": true,
  "message": "You have successfully accessed a protected route!",
  "data": {
    "userId": "...",
    "departmentId": "...",
    "permissions": ["USER_CREATE", "USER_READ", ...],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Test Frontend

1. Open browser: **http://localhost:3000**
2. You should see the login page (or dashboard if already logged in)
3. Test the login functionality

---

## 📋 Manual Setup (Without Docker)

If you don't want to use Docker for MongoDB:

### Step 1: Install MongoDB Locally

1. Download from: https://www.mongodb.com/try/download/community
2. Install MongoDB
3. Start MongoDB service:
   - **Windows**: MongoDB should start automatically as a service
   - **Linux**: `sudo systemctl start mongod`
   - **Mac**: `brew services start mongodb-community`

### Step 2: Verify MongoDB is Running

```bash
mongosh
# or
mongo
```

If connected, you'll see MongoDB shell.

### Step 3: Continue with Backend Setup

Follow **Step 2-4** from Quick Start section above.

---

## 🛠️ Troubleshooting

### Backend Issues

**Issue: Cannot connect to MongoDB**
```
Solution: 
- Check if MongoDB is running: docker ps (for Docker) or mongosh (for local)
- Verify MONGODB_URI in .env file
- For Docker: docker-compose up -d mongodb
```

**Issue: Port 5000 already in use**
```
Solution:
- Change PORT in backend/.env to another port (e.g., 5001)
- Update frontend/.env VITE_API_BASE_URL accordingly
```

**Issue: Module not found errors**
```
Solution:
- Delete node_modules folder
- Delete package-lock.json
- Run: npm install
```

**Issue: Seed script fails**
```
Solution:
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Try running seed again: npm run seed
```

### Frontend Issues

**Issue: Port 3000 already in use**
```
Solution:
- Vite will automatically use next available port (3001, 3002, etc.)
- Check terminal output for actual port
- Or change port in vite.config.js
```

**Issue: Cannot connect to API**
```
Solution:
- Verify backend is running on port 5000
- Check VITE_API_BASE_URL in frontend/.env
- Ensure backend CORS is configured for frontend URL
```

**Issue: CORS errors in browser**
```
Solution:
- Verify FRONTEND_URL in backend/.env matches frontend URL
- Restart backend server after changing .env
```

---

## 📁 Project Structure (Running Servers)

When both servers are running, you'll have:

```
JP Secure Staff/
├── backend/
│   ├── node_modules/
│   ├── .env                 ← Backend configuration
│   ├── package.json
│   └── server.js            ← Running on port 5000
│
└── frontend/
    ├── node_modules/
    ├── .env                 ← Frontend configuration
    ├── package.json
    └── src/                 ← Running on port 3000
```

---

## 🔄 Development Workflow

### Daily Development

1. **Start MongoDB** (if using Docker):
   ```bash
   docker-compose up -d mongodb
   ```

2. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open Browser**: http://localhost:3000

### Hot Reload

- **Backend**: Uses `nodemon` - automatically restarts on file changes
- **Frontend**: Uses `Vite` - automatically refreshes browser on file changes

---

## 📝 Available Scripts

### Backend Scripts

```bash
npm run dev        # Start development server (with auto-reload)
npm start          # Start production server
npm run seed       # Seed database with initial data
npm test           # Run tests
npm run lint       # Check code quality
```

### Frontend Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Check code quality
```

---

## 🔐 Default Credentials

After running seed script:

- **Email**: `admin@jpsecurestaff.com`
- **Password**: `Admin@123456`

**⚠️ IMPORTANT**: Change password after first login in production!

---

## ✅ Verification Checklist

- [ ] MongoDB is running (Docker or local)
- [ ] Backend dependencies installed (`npm install` in backend/)
- [ ] Backend `.env` file created and configured
- [ ] Database seeded (`npm run seed`)
- [ ] Backend server running on port 5000
- [ ] Frontend dependencies installed (`npm install` in frontend/)
- [ ] Frontend `.env` file created and configured
- [ ] Frontend server running on port 3000
- [ ] Can access http://localhost:3000 in browser
- [ ] Login API works (test with curl or Postman)
- [ ] Protected routes work with JWT token

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check server logs for error messages
4. Ensure all prerequisites are installed
5. Try deleting `node_modules` and reinstalling

---

**Happy Coding! 🚀**

