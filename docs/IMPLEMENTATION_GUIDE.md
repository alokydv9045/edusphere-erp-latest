# EduSphere Implementation Guide

## Quick Start Guide

This guide will help you set up and implement the EduSphere Multi-Tenant School ERP system from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Setup](#database-setup)
4. [Prisma Configuration](#prisma-configuration)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [RFID Integration](#rfid-integration)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v20.0.0 or higher
- **npm** v10.0.0 or higher
- **PostgreSQL** v15.0 or higher
- **Git** installed
- **Code editor** (VS Code recommended)
- **Docker** (optional, for containerized deployment)

---

## Initial Setup

### 1. Verify Installation

```bash
# Check Node.js version
node --version  # Should be >= 20.0.0

# Check npm version
npm --version   # Should be >= 10.0.0

# Check PostgreSQL
psql --version  # Should be >= 15.0

# Check Docker (optional)
docker --version
```

### 2. Clone the Repository

```bash
git clone https://github.com/yourusername/EduSphere.git
cd EduSphere
```

### 3. Project Structure Overview

```
EduSphere/
├── Admin/                    # Admin Portal
│   ├── client/              # Next.js Frontend
│   │   ├── .env.local.example
│   │   └── package.json
│   └── server/              # Express Backend
│       ├── .env.example
│       ├── package.json
│       └── prisma/
│           └── schema.prisma
├── erp/                     # School ERP
│   ├── client/              # Next.js Frontend
│   │   ├── .env.local.example
│   │   └── package.json
│   └── server/              # Express Backend
│       ├── .env.example
│       ├── package.json
│       └── prisma/
│           └── schema.prisma
├── docs/                    # Documentation
├── ARCHITECTURE.md
└── README.md
```

---

## Database Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database User

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create user
CREATE USER edusphere WITH PASSWORD 'your_secure_password';

# Grant privileges
ALTER USER edusphere CREATEDB;

# Exit
\q
```

### 3. Create Databases

```bash
# Create Admin database
createdb -U edusphere edusphere_admin

# Create demo school database
createdb -U edusphere edusphere_school_demo

# Verify
psql -U edusphere -l
```

---

## Prisma Configuration

### 1. Install Dependencies

**Admin Server:**
```bash
cd Admin/server
npm install
```

**School ERP Server:**
```bash
cd ../../erp/server
npm install
```

### 2. Configure Environment Variables

**Admin Server:**
```bash
cd Admin/server
cp .env.example .env
```

Edit `Admin/server/.env`:
```env
DATABASE_URL="postgresql://edusphere:your_secure_password@localhost:5432/edusphere_admin"
JWT_SECRET=generate-a-random-32-character-string
PORT=5000
```

**School ERP Server:**
```bash
cd ../../erp/server
cp .env.example .env
```

Edit `erp/server/.env`:
```env
DATABASE_URL="postgresql://edusphere:your_secure_password@localhost:5432/edusphere_school_demo"
JWT_SECRET=generate-a-random-32-character-string
SCHOOL_ID=demo-school
PORT=5001
RFID_ENABLED=true
```

### 3. Generate Prisma Client

**Admin:**
```bash
cd Admin/server
npx prisma generate
npx prisma db push
```

You should see:
```
✔ Generated Prisma Client
✔ The database is now in sync with your Prisma schema.
```

**School ERP:**
```bash
cd ../../erp/server
npx prisma generate
npx prisma db push
```

### 4. Verify Database Schema

```bash
# Admin database
psql -U edusphere edusphere_admin
\dt

# School database
psql -U edusphere edusphere_school_demo
\dt
```

You should see all the tables created.

---

## Backend Implementation

### Step 1: Admin Backend Structure

Create the following directory structure:

```bash
cd Admin/server

mkdir -p src/{config,controllers,middleware,routes,services,utils}
```

**File:** `src/config/database.js`
```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

module.exports = prisma;
```

**File:** `src/middleware/auth.js`
```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authMiddleware };
```

**File:** `src/controllers/authController.js`
```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'SUPPORT'
      }
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login };
```

**File:** `src/routes/authRoutes.js`
```javascript
const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

module.exports = router;
```

**File:** `index.js` (Main server file)
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`);
});
```

### Step 2: School ERP Backend (Similar Structure)

Follow the same pattern for the School ERP backend, but add RFID service.

**File:** `erp/server/src/services/rfidService.js`
```javascript
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const prisma = require('../config/database');

class RFIDService {
  constructor() {
    this.port = null;
    this.parser = null;
  }

  async initialize() {
    if (process.env.RFID_ENABLED !== 'true') {
      console.log('RFID service is disabled');
      return;
    }

    const portPath = process.env.RFID_READER_PORT || '/dev/ttyUSB0';
    const baudRate = parseInt(process.env.RFID_READER_BAUDRATE) || 9600;

    try {
      this.port = new SerialPort(portPath, { baudRate });
      this.parser = this.port.pipe(new Readline({ delimiter: '\r\n' }));

      this.parser.on('data', async (cardNumber) => {
        console.log('RFID Card Scanned:', cardNumber);
        await this.handleCardScan(cardNumber.trim());
      });

      console.log(`RFID service started on ${portPath}`);
    } catch (error) {
      console.error('Failed to initialize RFID service:', error);
    }
  }

  async handleCardScan(cardNumber) {
    try {
      const rfidCard = await prisma.rFIDCard.findUnique({
        where: { cardNumber },
        include: {
          student: { include: { user: true } }
        }
      });

      if (!rfidCard || !rfidCard.isActive) {
        console.log('Card not found or inactive');
        return;
      }

      await this.markAttendance(rfidCard);
    } catch (error) {
      console.error('Error handling card scan:', error);
    }
  }

  async markAttendance(rfidCard) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendanceRecord.create({
      data: {
        studentId: rfidCard.studentId,
        attendeeType: 'STUDENT',
        date: today,
        checkInTime: new Date(),
        status: 'PRESENT',
        scannedByRFID: true
      }
    });

    console.log('Attendance marked:', attendance);
  }
}

module.exports = new RFIDService();
```

---

## Frontend Implementation

### Admin Frontend Setup

```bash
cd Admin/client
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Create basic login page:** `Admin/client/app/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="w-96 space-y-4 rounded-lg border p-8">
        <h1 className="text-2xl font-bold">Admin Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-4 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-4 py-2"
          required
        />
        <button
          type="submit"
          className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Login
        </button>
      </form>
    </div>
  );
}
```

---

## Running the Application

### 1. Start Admin Backend

```bash
cd Admin/server
npm run dev
```

Should see: `Admin server running on port 5000`

### 2. Start Admin Frontend

```bash
cd Admin/client
npm run dev
```

Should see: `Ready on http://localhost:3000`

### 3. Start School ERP Backend

```bash
cd erp/server
npm run dev
```

Should see: `School server running on port 5001`

### 4. Start School ERP Frontend

```bash
cd erp/client
npm run dev
```

Should see: `Ready on http://localhost:3001`

---

## Testing

### 1. Test Admin API

```bash
# Health check
curl http://localhost:5000/health

# Register admin user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edusphere.com",
    "password": "Admin@123",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edusphere.com",
    "password": "Admin@123"
  }'
```

### 2. Access Frontend

- Admin Portal: http://localhost:3000
- School ERP: http://localhost:3001

---

## Next Steps

### Phase 1: Core Features
1. ✅ Database schema setup
2. ✅ Authentication system
3. ⬜ School management (Admin portal)
4. ⬜ Student management (ERP)
5. ⬜ Teacher management (ERP)
6. ⬜ Class & Section management (ERP)

### Phase 2: Attendance System
1. ⬜ RFID integration
2. ⬜ Manual attendance marking
3. ⬜ Attendance reports
4. ⬜ Real-time attendance dashboard

### Phase 3: Academic Features
1. ⬜ Timetable management
2. ⬜ Examination system
3. ⬜ Grade management
4. ⬜ Report card generation

### Phase 4: Additional Modules
1. ⬜ Fee management
2. ⬜ Library system
3. ⬜ Inventory management
4. ⬜ Announcements & notifications

### Phase 5: Deployment
1. ⬜ Docker containerization
2. ⬜ Cloud deployment
3. ⬜ SSL/TLS setup
4. ⬜ Monitoring & logging

---

## Development Best Practices

### 1. Code Organization
- Follow MVC pattern
- Separate business logic from routes
- Use middleware for authentication and validation

### 2. Security
- Never commit `.env` files
- Use environment variables for secrets
- Implement rate limiting
- Validate all user inputs
- Use parameterized queries (Prisma handles this)

### 3. Database
- Use transactions for multi-table operations
- Create indexes on frequently queried fields
- Regular backups
- Use connection pooling in production

### 4. API Design
- Follow REST conventions
- Version your APIs (/api/v1/)
- Return consistent error formats
- Document with Swagger/OpenAPI

### 5. Testing
- Write unit tests for services
- Integration tests for APIs
- E2E tests for critical flows

---

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connection string in .env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### Prisma Issues

**Error:** `Prisma Client not generated`

**Solution:**
```bash
cd Admin/server  # or erp/server
npx prisma generate
```

**Error:** `Migration failed`

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or push schema without migration
npx prisma db push
```

### Port Already in Use

**Error:** `Port 5000 is already in use`

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5002
```

---

## Resources

### Documentation
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Tutorials
- [Prisma Quick Start](https://www.prisma.io/docs/getting-started/quickstart)
- [Next.js Tutorial](https://nextjs.org/learn)
- [JWT Authentication](https://jwt.io/introduction)

### Community
- [EduSphere GitHub Issues](https://github.com/yourusername/EduSphere/issues)
- [Prisma Community](https://www.prisma.io/community)
- [Next.js Discord](https://nextjs.org/discord)

---

## Support

For implementation help:
- Email: dev@edusphere.com
- Documentation: https://docs.edusphere.com
- GitHub Issues: https://github.com/yourusername/EduSphere/issues

---

**Happy coding! 🚀**
