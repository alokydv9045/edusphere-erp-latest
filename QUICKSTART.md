# 🚀 Quick Start Guide - EduSphere Backend Servers

## ✅ What's Been Built

- **Admin Portal Backend** (Port 5000)
  - Authentication API (register, login, get user)
  - JWT-based security
  - Connected to Admin Supabase database

- **School ERP Backend** (Port 5001)
  - Authentication API (register, login, get user)
  - JWT-based security
  - Connected to School Supabase database

---

## 📋 Starting the Servers

### Method 1: Quick Start (Both Servers)

```bash
cd /home/ahqafcoder/Desktop/Github/EduSphere
./start-servers.sh
```

### Method 2: Manual Start

**Terminal 1 - Admin Server:**
```bash
cd /home/ahqafcoder/Desktop/Github/EduSphere/Admin/server
source ~/.nvm/nvm.sh
npm run dev
```

**Terminal 2 - ERP Server:**
```bash
cd /home/ahqafcoder/Desktop/Github/EduSphere/erp/server
source ~/.nvm/nvm.sh
npm run dev
```

---

## 🧪 Testing the APIs

### 1. Health Checks

**Admin Portal:**
```bash
curl http://localhost:5000/health
```

**School ERP:**
```bash
curl http://localhost:5001/health
```

### 2. Register Admin User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edusphere.com",
    "password": "Admin@123456",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN"
  }'
```

### 3. Login Admin User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edusphere.com",
    "password": "Admin@123456"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "admin@edusphere.com",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN"
  }
}
```

### 4. Get Current User (Protected Route)

```bash
# Save your token from login response
TOKEN="your-jwt-token-here"

curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Register School User (ERP)

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@demoschool.com",
    "password": "Teacher@123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER"
  }'
```

### 6. Login School User

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@demoschool.com",
    "password": "Teacher@123"
  }'
```

---

## 📂 Project Structure

```
Admin/server/
├── index.js                    # Main server file
├── src/
│   ├── config/
│   │   └── database.js        # Prisma client with adapter
│   ├── controllers/
│   │   └── authController.js  # Auth logic
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   └── routes/
│       └── authRoutes.js      # Auth endpoints
├── prisma/
│   └── schema.prisma          # Database schema
└── .env                       # Environment variables

erp/server/
├── index.js                    # Main server file
├── src/
│   ├── config/
│   │   └── database.js        # Prisma client with adapter
│   ├── controllers/
│   │   └── authController.js  # Auth logic
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   └── routes/
│       └── authRoutes.js      # Auth endpoints
├── prisma/
│   └── schema.prisma          # Database schema
└── .env                       # Environment variables
```

---

## 🔑 API Endpoints

### Admin Portal (Port 5000)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| POST | `/api/auth/register` | Register admin user | No |
| POST | `/api/auth/login` | Login admin user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### School ERP (Port 5001)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| POST | `/api/auth/register` | Register user (teacher/student/parent) | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

---

## 🛡️ Security Features

✅ **Implemented:**
- Password hashing with bcrypt (10 rounds)
- JWT token authentication
- Role-based access control middleware
- CORS protection
- Helmet security headers
- Rate limiting (configurable)
- Request validation

---

## 🗄️ Database Connections

**Admin Database:**
- Host: `postgres.gmmkmgpclbywifzvbwpi` (Supabase)
- Tables: School, AdminUser, Subscription, Invoice, AuditLog, etc.

**School ERP Database:**
- Host: `postgres.jvvzrlgtcjwpioijfyrd` (Supabase)
- Tables: User, Student, Teacher, Attendance, RFID, Exam, Fee, etc.

---

## 🔧 Troubleshooting

### Server won't start

```bash
# Check if port is already in use
lsof -i :5000
lsof -i :5001

# Kill process if needed
kill -9 <PID>
```

### Prisma errors

```bash
# Regenerate Prisma client
cd Admin/server (or erp/server)
source ~/.nvm/nvm.sh
npx prisma generate
```

### Database connection errors

Check `.env` file has correct `DATABASE_URL`

---

## 📊 Next Steps

### To Add New Features:

1. **Create Controller**: `src/controllers/schoolController.js`
2. **Create Routes**: `src/routes/schoolRoutes.js`
3. **Add to index.js**: `app.use('/api/schools', schoolRoutes)`

### Example - School Management API:

```javascript
// src/controllers/schoolController.js
const prisma = require('../config/database');

const getSchools = async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        deploymentStatus: true,
      },
    });
    res.json({ schools });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getSchools };
```

---

## 🎯 Available User Roles

### Admin Portal
- `SUPER_ADMIN` - Full system access
- `ADMIN` - Manage schools
- `SUPPORT` - View-only access

### School ERP
- `SUPER_ADMIN` - School administrator
- `ADMIN` - Administrative staff
- `TEACHER` - Teaching staff
- `STUDENT` - Students
- `PARENT` - Parents/Guardians
- `LIBRARIAN` - Library staff
- `ACCOUNTANT` - Accounts staff

---

## 📝 Sample Workflows

### 1. Create and Manage a School (Admin Portal)

```bash
# 1. Register as Super Admin
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"email":"admin@edusphere.com","password":"Admin@123","firstName":"Super","lastName":"Admin","role":"SUPER_ADMIN"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@edusphere.com","password":"Admin@123"}'

# Save the token

# 3. Create School (API endpoint to be built)
# 4. Provision Database for School
# 5. Assign Admin to School
```

### 2. Student Enrollment (School ERP)

```bash
# 1. Login as School Admin
curl -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@school.com","password":"School@123"}'

# 2. Create Student Account (API to be built)
# 3. Enroll in Class
# 4. Assign RFID Card
# 5. Start Taking Attendance
```

---

## ✅ What's Working

- [x] Server infrastructure
- [x] Database connections (Prisma + Supabase)
- [x] User authentication (register/login)
- [x] JWT token generation
- [x] Protected routes
- [x] Role-based access
- [x] CORS & Security headers
- [x] Error handling
- [x] Request logging

---

## 🚧 To Be Built

- [ ] School management APIs (Admin)
- [ ] Student management APIs (ERP)
- [ ] Teacher management APIs (ERP)
- [ ] RFID attendance APIs (ERP)
- [ ] Class & timetable APIs (ERP)
- [ ] Examination APIs (ERP)
- [ ] Fee management APIs (ERP)
- [ ] Library APIs (ERP)
- [ ] Frontend applications (Next.js)

---

**Your backend is ready! Start building amazing features! 🚀**
