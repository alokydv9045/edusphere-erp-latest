# EduSphere ERP — 10/10 Implementation Plan

> Fix every bug, performance issue, security flaw, and code quality gap identified in the review.

## Corrections to Original Report

> [!NOTE]
> After deeper research, two findings were **false positives**:
> - **SEC-3** (Open Registration): `/api/auth/register` already has `authMiddleware` + `requireRole('ADMIN')` — ✅ Already secure
> - **PERF-5** (No Indexes): Prisma schema already has 70+ indexes including `(studentId, date)` on attendance — ✅ Already indexed
>
> These are removed from the plan. All remaining 28 issues are real and will be fixed.

---

## Phase 1 — Critical Bugs & Security (Files: 8 | Est: Day 1-2)

### 1.1 BUG-1: Cache Auth Middleware User Lookups

#### [MODIFY] [auth.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/middleware/auth.js)
- Add `node-cache` (in-memory, no Redis needed) with 60s TTL
- Cache key: `user:${decoded.userId}`, value: user object
- Invalidate on logout/role-change
- **Impact**: Eliminates ~80% of all DB queries system-wide

### 1.2 BUG-3: Debounce Socket Dashboard Reloads

#### [MODIFY] [page.tsx](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/app/dashboard/page.tsx)
- Wrap `loadDashboard` in a 1000ms debounce (use `lodash.debounce` or custom)
- Remove `stats.myClassId` and `stats.studentId` from useEffect dependency array
- Use `useRef` for the debounced function to avoid re-creation

### 1.3 BUG-4: Remove Duplicate Notification Widget

#### [MODIFY] [page.tsx](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/app/dashboard/page.tsx)
- Delete the duplicate notification stats block (Lines ~561-597)
- Keep only the first instance inside the `isAdminOrPrincipal` block

### 1.4 BUG-6: Fix OVERDUE Filter Logic

#### [MODIFY] [feeService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/feeService.js)
- Change line 150 from:
  ```js
  if (status === 'OVERDUE') return s.feeStatus === 'PENDING' || s.feeStatus === 'PARTIAL';
  ```
  To:
  ```js
  if (status === 'OVERDUE') return s.feeStatus === 'OVERDUE';
  ```

### 1.5 BUG-7: Fix Negative Relative Time

#### [MODIFY] [DashboardService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/DashboardService.js)
- Move the `if (minutes < 0)` check to the very top of `getRelativeTime()`
- Guard all calculated values: `if (diff <= 0) return 'Just now'`

### 1.6 SEC-2: Enable Rate Limiting by Default

#### [MODIFY] [index.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/index.js)
- Remove the `if (process.env.RATE_LIMIT_ENABLED === 'true')` condition
- Always apply global rate limiter (200 req/15min)
- Add stricter auth-specific limiter: 10 login attempts per 15 min
  ```js
  const authLimiter = rateLimit({ windowMs: 900000, max: 10 });
  app.use('/api/auth/login', authLimiter);
  ```

### 1.7 SEC-4 + SEC-5: Strengthen Password Policy & Credentials

#### [MODIFY] [userController.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/controllers/userController.js)
- Change password minimum from 6 to 8 chars
- Add regex: must contain uppercase, lowercase, and number

#### [MODIFY] [studentService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/studentService.js)
- Replace `Math.random()` with `crypto.randomInt()` for credential generation
- Use `crypto.randomBytes(4).toString('hex')` for password suffix

### 1.8 SEC-6: Never Expose Stack Traces

#### [MODIFY] [errorHandler.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/middleware/errorHandler.js)
- Always omit `stack` from response, even in development
- Log stack to logger only, never to client response body

---

## Phase 2 — Performance Optimization (Files: 10 | Est: Day 3-5)

### 2.1 BUG-2: Aggregate Dashboard Endpoint + Server Cache

#### [NEW] [server/src/cache/dashboardCache.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/cache/dashboardCache.js)
- In-memory cache using `node-cache` with 30s TTL
- Cache key per role: `dashboard:${role}:${userId}`

#### [MODIFY] [DashboardService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/DashboardService.js)
- Wrap `getDashboardStats` with cache check/set
- Add cache invalidation on socket events (targeted, not full refresh)

#### [MODIFY] [page.tsx](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/app/dashboard/page.tsx)
- Reduce from 4 parallel API calls to 2 (merge stats + activities server-side)

### 2.2 BUG-5: Move Pagination to Database Level

#### [MODIFY] [feeService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/feeService.js)
- `getFeeStructures`: Pass `skip` and `take` to `feeRepo.findFeeStructures()`
- `getFeeStudents`: Pass pagination to `feeRepo.getFeeStudentsList()` and compute status in DB where possible

#### [MODIFY] [feeRepository.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/repositories/feeRepository.js)
- Update `findFeeStructures` to accept `skip`/`take` params
- Return `[results, count]` tuple for proper pagination

### 2.3 PERF-1: Batch Monthly Fee Queries

#### [MODIFY] [feeService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/feeService.js)
- Replace the 6-iteration loop in `getFeeStats` with a single `groupBy` query:
  ```js
  prisma.feePayment.groupBy({
    by: ['paymentDate'], // grouped by month
    where: { status: 'COMPLETED', paymentDate: { gte: sixMonthsAgo } },
    _sum: { amount: true }
  })
  ```

### 2.4 PERF-2: Filter Low Stock in Database

#### [MODIFY] [DashboardRepository.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/repositories/DashboardRepository.js)
- Replace `getLowStockItems` JS filter with `prisma.$queryRaw`:
  ```sql
  SELECT * FROM "InventoryItem" WHERE quantity <= "minStockLevel"
  ```

### 2.5 PERF-3: Add Pagination to Class-Wise Report

#### [MODIFY] [feeService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/feeService.js)
- `getClassWiseReport`: Use `groupBy` aggregation instead of loading all students
- Push aggregation logic to database using Prisma raw queries

### 2.6 PERF-4: Replace O(n²) Filters with Map Lookups

#### [MODIFY] [AttendanceService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/AttendanceService.js)
- `getAttendanceReport` (L211): Pre-build `Map<studentId, records[]>`
- `getAttendanceAnalytics` (L558): Same Map optimization
  ```js
  const recordsByStudent = new Map();
  records.forEach(r => {
    if (!recordsByStudent.has(r.studentId)) recordsByStudent.set(r.studentId, []);
    recordsByStudent.get(r.studentId).push(r);
  });
  ```

### 2.7 PERF-6: Code-Split Dashboard by Role

#### [NEW] [client/app/dashboard/views/AdminDashboard.tsx](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/app/dashboard/views/AdminDashboard.tsx)
#### [NEW] [client/app/dashboard/views/TeacherDashboard.tsx](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/app/dashboard/views/TeacherDashboard.tsx)
#### [NEW] [client/app/dashboard/views/StudentDashboard.tsx](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/app/dashboard/views/StudentDashboard.tsx)
#### [NEW] [client/app/dashboard/views/AccountantDashboard.tsx](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/app/dashboard/views/AccountantDashboard.tsx)

#### [MODIFY] [page.tsx](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/app/dashboard/page.tsx)
- Replace 800-line monolith with dynamic imports:
  ```tsx
  const AdminDashboard = dynamic(() => import('./views/AdminDashboard'));
  const TeacherDashboard = dynamic(() => import('./views/TeacherDashboard'));
  ```
- Each view handles its own data fetching and UI

### 2.8 PERF-7: Replace `alert()` with Toast

#### [MODIFY] [client.ts](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/lib/api/client.ts)
- Replace `alert()` with Sonner toast (already installed):
  ```ts
  import { toast } from 'sonner';
  toast.error(message);
  ```

---

## Phase 3 — Code Quality & Architecture (Files: 15 | Est: Day 6-9)

### 3.1 CQ-1: Split userController into Focused Modules

#### [NEW] [server/src/services/UserService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/UserService.js)
- Move all Prisma calls from userController into service layer
- Methods: `getAll`, `getById`, `create`, `update`, `delete`, `updateRoles`, `resetPassword`

#### [NEW] [server/src/services/QRService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/QRService.js)
- Methods: `getUserQR`, `regenerateQR`, `toggleQRIssued`

#### [NEW] [server/src/services/AvatarService.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/services/AvatarService.js)
- Methods: `uploadProfilePicture`, `deleteProfilePicture`

#### [MODIFY] [userController.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/controllers/userController.js)
- Reduce to thin controller: delegate all logic to services above
- Move imports to top of file (fix CQ-5)
- Target: ~200 lines max

### 3.2 CQ-2: Route ALL DB Calls Through Service/Repository

#### [MODIFY] [feeController.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/controllers/feeController.js)
- Move `downloadFeeStatement`'s direct `prisma.student.findFirst()` to `feeService`

### 3.3 CQ-4: Standardize Error Handling

#### [MODIFY] All controllers that use manual `res.status().json()` for errors
- Replace manual 404/400 responses with `throw new NotFoundError()` / `throw new ValidationError()`
- Ensure ALL controllers use `asyncHandler` wrapper consistently
- Files affected: `userController.js`, `feeController.js`

### 3.4 CQ-7: Standardize File Naming

Rename to consistent `camelCase`:
- `AiController.js` → `aiController.js`
- `TimetableController.js` → `timetableController.js`
- `AiRoutes.js` → `aiRoutes.js`
- Update all `require()` paths referencing renamed files

### 3.5 CQ-3: Eliminate `any` Types in Client

#### [MODIFY] [dashboard.ts](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/lib/api/dashboard.ts)
- Replace 5 `Promise<any>` return types with proper interfaces:
  ```ts
  export interface AccountantStats { ... }
  export interface LibraryStats { ... }
  export interface HRStats { ... }
  export interface FinanceStats { ... }
  export interface ExamStats { ... }
  ```

#### [MODIFY] [page.tsx](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/app/dashboard/page.tsx)
- Replace `useState<any>` with typed state

### 3.6 CQ-5: Fix Bottom-of-File Imports

#### [MODIFY] [userController.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/controllers/userController.js)
- Move `cloudinary`, `multer`, `fs` requires from line 747 to top of file

---

## Phase 4 — Security Hardening (Files: 6 | Est: Day 10-11)

### 4.1 SEC-1: Implement Refresh Token System

#### [MODIFY] [authController.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/controllers/authController.js)
- Access token TTL: 15 minutes (down from 7 days)
- Refresh token TTL: 7 days, stored in httpOnly cookie
- New endpoint: `POST /api/auth/refresh`

#### [MODIFY] [authRoutes.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/routes/authRoutes.js)
- Add `router.post('/refresh', refreshToken)` route

#### [MODIFY] [client.ts](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/lib/api/client.ts)
- Add 401 interceptor that auto-calls `/auth/refresh` before retrying

### 4.2 SEC-7: Add Validators to All Remaining Routes

#### [NEW] [server/src/validators/userValidator.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/validators/userValidator.js) — already exists, wire to routes
#### [NEW] [server/src/validators/dashboardValidator.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/validators/dashboardValidator.js)
#### [NEW] [server/src/validators/libraryValidator.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/validators/libraryValidator.js)
#### [NEW] [server/src/validators/inventoryValidator.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/validators/inventoryValidator.js)
#### [NEW] [server/src/validators/notificationValidator.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/validators/notificationValidator.js)
#### [NEW] [server/src/validators/calendarValidator.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/validators/calendarValidator.js)

Routes that need `validate()` middleware added:
- `userRoutes.js` — createUser, updateUser, resetPassword
- `libraryRoutes.js` — all POST/PUT routes
- `inventoryRoutes.js` — all POST/PUT routes
- `notificationRoutes.js` — send endpoints
- `calendarRoutes.js` — create/update events
- `announcementRoutes.js` — create/update
- `assignmentRoutes.js` — create/submit

### 4.3 CORS & File Upload Hardening

#### [MODIFY] [index.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/index.js)
- Reject requests when `ALLOWED_ORIGINS` is not set (error on startup)
- Add MIME type validation to multer file uploads

---

## Phase 5 — Production Infrastructure (Files: 8 | Est: Day 12-14)

### 5.1 Deep Health Check

#### [MODIFY] [index.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/index.js)
- Expand `/health` to test DB connectivity:
  ```js
  app.get('/health', async (req, res) => {
    const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    res.status(dbOk ? 200 : 503).json({ status: dbOk ? 'OK' : 'DEGRADED', db: dbOk });
  });
  ```

### 5.2 Graceful Shutdown

#### [MODIFY] [index.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/index.js)
- Add `SIGTERM`/`SIGINT` handlers that drain HTTP connections before exit:
  ```js
  process.on('SIGTERM', () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
  ```

### 5.3 API Versioning

#### [MODIFY] [index.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/index.js)
- Mount all routes under `/api/v1/` prefix
- Keep `/api/` as alias for backward compatibility

### 5.4 Implement React Query for Data Fetching

#### [NEW] [client/lib/providers/QueryProvider.tsx](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/lib/providers/QueryProvider.tsx)
- Wrap app with `QueryClientProvider` (package already installed)

#### [NEW] [client/hooks/useDashboard.ts](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/client/hooks/useDashboard.ts)
- Replace raw `useState`/`useEffect` with `useQuery`:
  ```ts
  export function useDashboardStats() {
    return useQuery({ queryKey: ['dashboard', 'stats'], queryFn: dashboardAPI.getStats, staleTime: 30000 });
  }
  ```

### 5.5 Structured Request Logging

#### [NEW] [server/src/middleware/requestLogger.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/middleware/requestLogger.js)
- Log method, path, status, duration, userId for every request
- Use existing `winston` logger with JSON format

### 5.6 Audit Logging for Financial Operations

#### [NEW] [server/src/middleware/auditLog.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/src/middleware/auditLog.js)
- Middleware for fee payments, adjustments, refunds
- Log: action, userId, entityId, before/after values, timestamp

### 5.7 CQ-9: Upgrade ERP Prisma to v7

#### [MODIFY] [server/package.json](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/package.json)
- Upgrade `@prisma/client` from `^5.22.0` to `^7.4.0`
- Run `npx prisma generate` and fix any breaking API changes

---

## Phase 6 — Testing (Files: 10+ | Est: Day 15-18)

### 6.1 Unit Tests

#### [NEW] [server/tests/services/feeService.test.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/tests/services/feeService.test.js)
- Test fee calculation, OVERDUE logic, pagination
- Mock repository layer

#### [NEW] [server/tests/services/attendanceService.test.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/tests/services/attendanceService.test.js)
- Test bulk marking, RFID scan, QR scan flows

#### [NEW] [server/tests/services/dashboardService.test.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/tests/services/dashboardService.test.js)
- Test role-specific stats aggregation

#### [NEW] [server/tests/middleware/auth.test.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/tests/middleware/auth.test.js)
- Test caching behavior, token validation, role checks

#### [NEW] [server/tests/middleware/permissions.test.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/tests/middleware/permissions.test.js)
- Test all permission-to-role mappings

### 6.2 Integration Tests

#### [NEW] [server/tests/integration/auth.test.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/tests/integration/auth.test.js)
- Test login → token → protected route → refresh → logout flow

#### [NEW] [server/tests/integration/fees.test.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/tests/integration/fees.test.js)
- Test payment creation → ledger update → idempotency check

### 6.3 Test Configuration

#### [NEW] [server/jest.config.js](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/jest.config.js)
#### [MODIFY] [server/package.json](file:///c:/Users/Acer/Desktop/edusphere-erp-latest/erp/server/package.json)
- Add `jest` and `supertest` as dev dependencies
- Add `"test": "jest --coverage"` script

---

## Verification Plan

### Automated
1. Run `npm test` — all unit + integration tests pass
2. Run `npm run build` on client — zero TypeScript errors
3. Browser test: load dashboard as Admin, verify single load < 1.5s
4. Browser test: mark bulk attendance for 30 students, verify no dashboard reload storm

### Manual
1. Attempt brute-force login — verify rate limiter blocks after 10 attempts
2. Test expired access token → auto-refresh → seamless UX
3. Verify toast notifications replace all `alert()` calls
4. Check dashboard renders only role-specific components (network tab)

---

## Target Scorecard After All Phases

| Category | Before | After | How |
|----------|--------|-------|-----|
| **Architecture** | 6/10 | **10/10** | Service layer for all controllers, consistent patterns |
| **Performance** | 3/10 | **10/10** | Cache, DB pagination, Map lookups, code-split, React Query |
| **Security** | 2/10 | **10/10** | Refresh tokens, rate limiting, strong passwords, full validation |
| **Code Quality** | 5/10 | **10/10** | Split god-files, typed state, consistent naming, no `any` |
| **Client UX** | 6/10 | **10/10** | Toast errors, code-split, React Query stale-while-revalidate |
| **Test Coverage** | 0/10 | **10/10** | Unit + integration tests for all critical paths |
| **Production Readiness** | 3/10 | **10/10** | Health checks, graceful shutdown, audit logs, API versioning |
| **Overall** | **3.5/10** | **10/10** | ✅ |
