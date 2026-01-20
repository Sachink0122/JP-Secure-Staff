# Quick Start - JP Secure Staff

## ⚡ Fast Setup (5 Minutes)

### 1. Start MongoDB
```bash
docker-compose up -d mongodb
```

### 2. Backend Setup
```bash
cd backend
npm install
Copy-Item .env.example .env    # Windows PowerShell
# cp .env.example .env          # Linux/Mac
npm run seed
npm run dev
```
✅ Backend running on **http://localhost:5000**

### 3. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
Copy-Item .env.example .env    # Windows PowerShell
# cp .env.example .env          # Linux/Mac
npm run dev
```
✅ Frontend running on **http://localhost:3000**

---

## 🧪 Quick Test

**1. Test Backend:**
```bash
curl http://localhost:5000/health
```

**2. Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@jpsecurestaff.com\",\"password\":\"Admin@123456\"}"
```

**3. Open Browser:**
http://localhost:3000

---

## 🔑 Default Login

- **Email**: `admin@jpsecurestaff.com`
- **Password**: `Admin@123456`

---

📖 **For detailed instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)**

