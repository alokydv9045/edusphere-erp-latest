# Quick Login Guide - EduSphere

## 🔐 How to Login to Both Portals

### 1️⃣ Admin Portal (Port 3000)

**Step 1: Register an Admin Account**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edusphere.com",
    "password": "Admin@123",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN"
  }'
```

**Step 2: Login via Admin Portal**
1. Open: http://localhost:3000
2. Click "Login" (or go to http://localhost:3000/login)
3. Enter credentials:
   - Email: `admin@edusphere.com`
   - Password: `Admin@123`
4. Click "Sign In"

---

### 2️⃣ School ERP (Port 3001)

**Step 1: Register a School User**

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "principal@school.com",
    "password": "School@123",
    "firstName": "John",
    "lastName": "Principal",
    "role": "ADMIN"
  }'
```

**Step 2: Login via School ERP**
1. Open: http://localhost:3001
2. Click "Login" (or go to http://localhost:3001/login)
3. Enter credentials:
   - Email: `principal@school.com`
   - Password: `School@123`
4. Click "Sign In"

---

## 📝 Pre-configured Test Credentials

### Admin Portal:
- **Email:** admin@edusphere.com
- **Password:** Admin@123
- **Role:** SUPER_ADMIN

### School ERP:
- **Email:** principal@school.com
- **Password:** School@123
- **Role:** ADMIN

You can also create additional users with different roles:
- `TEACHER` - For teachers
- `STUDENT` - For students
- `PARENT` - For parents
- `ACCOUNTANT` - For finance staff
- `LIBRARIAN` - For library staff
- `INVENTORY_MANAGER` - For inventory management

---

## 🔗 Current System Status

### ✅ What Works NOW:
1. **Admin Portal**
   - Registration ✅
   - Login ✅
   - Dashboard (will show mock data)
   - All UI pages work ✅

2. **School ERP**
   - Registration ✅
   - Login ✅
   - Dashboard (will show mock data)
   - All UI pages work ✅

### ❌ What's NOT Connected:
1. **Backend APIs for Admin features** (schools, subscriptions, billing) → Not implemented yet
2. **Multi-tenant linking** → Admin can't provision schools yet
3. **Database integration** → Two separate DBs, not connected

---

## 🛠️ What Needs to be Built

To make it fully functional (true multi-tenancy):

### Phase 1: Backend API Routes (Admin Server)
```
POST   /api/schools           - Create school
GET    /api/schools           - List schools
GET    /api/schools/:id       - Get school details
PATCH  /api/schools/:id       - Update school
DELETE /api/schools/:id       - Delete school

GET    /api/subscriptions     - List subscriptions
POST   /api/subscriptions     - Create subscription
PATCH  /api/subscriptions/:id - Update subscription

GET    /api/invoices          - List invoices
POST   /api/invoices/:id/mark-paid - Mark invoice as paid

GET    /api/analytics/dashboard - Get dashboard stats
```

### Phase 2: School Provisioning Service
- When admin creates school → Also create initial admin in School DB
- Link both databases
- Send welcome email with credentials

### Phase 3: Dynamic Routing (Optional)
- Route based on subdomain (school1.edusphere.com, school2.edusphere.com)
- Or route based on school_id parameter

---

## 🚀 Quick Test Commands

### Test Admin Backend:
```bash
# Health check
curl http://localhost:5000/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@admin.com","password":"Test@123","firstName":"Test","lastName":"Admin","role":"SUPER_ADMIN"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@admin.com","password":"Test@123"}'
```

### Test School Backend:
```bash
# Health check
curl http://localhost:5001/health

# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@school.com","password":"Test@123","firstName":"Jane","lastName":"Teacher","role":"TEACHER"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@school.com","password":"Test@123"}'
```

---

## 📊 Current Architecture

```
Admin Portal Frontend (3000)          School ERP Frontend (3001)
           ↓                                      ↓
Admin Backend API (5000)              School Backend API (5001)
           ↓                                      ↓
    Admin Database                          School Database
    (Supabase 1)                            (Supabase 2)

           ❌ NOT LINKED ❌
```

---

## ✨ Next Steps

**Option 1: Build Backend Integration (Recommended)**
- Implement Admin server routes (schools, subscriptions, billing)
- Build school provisioning service
- Link both databases

**Option 2: Test Current UI (Now)**
- Register and login to both portals
- Explore all UI pages
- UI is fully functional, just no backend data

**Should I implement the backend integration?** This would allow you to create schools from the Admin Portal and have them automatically appear in the School ERP.
