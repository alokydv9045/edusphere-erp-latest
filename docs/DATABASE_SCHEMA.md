# Database Schema Documentation

## Overview

EduSphere uses a **database-per-tenant** architecture with two distinct database schemas:

1. **Admin Database** - Manages all schools, subscriptions, and admin users
2. **School Database** - Per-school isolated database for student, teacher, and academic data

Both databases use PostgreSQL 15+ with Prisma ORM.

---

## Admin Database Schema

**Database Purpose**: Central management of all schools in the EduSphere platform

### Tables

#### 1. School
Stores information about each registered school.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| schoolCode | String | Unique identifier for the school |
| name | String | School name |
| email | String | School contact email (unique) |
| phone | String | School contact phone |
| databaseUrl | String | Connection string to school's database |
| databaseName | String | School's database name (unique) |
| isActive | Boolean | School status |
| deploymentStatus | Enum | PROVISIONING, DEPLOYING, ACTIVE, etc. |
| createdAt | DateTime | Record creation timestamp |

**Indexes**: schoolCode, email

#### 2. Subscription
Manages school subscription plans and billing.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| schoolId | UUID | Foreign key to School |
| planType | Enum | TRIAL, BASIC, STANDARD, PREMIUM, ENTERPRISE |
| billingCycle | Enum | MONTHLY, QUARTERLY, YEARLY |
| maxStudents | Int | License limit for students |
| maxTeachers | Int | License limit for teachers |
| status | Enum | TRIAL, ACTIVE, PAST_DUE, EXPIRED, CANCELLED |
| startDate | DateTime | Subscription start |
| endDate | DateTime | Subscription end |

**Indexes**: schoolId, status, endDate

#### 3. Invoice
Billing invoice records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| invoiceNumber | String | Unique invoice number |
| subscriptionId | UUID | Foreign key to Subscription |
| amount | Float | Base amount |
| totalAmount | Float | Total after tax |
| status | Enum | PENDING, PAID, OVERDUE, CANCELLED, REFUNDED |
| paymentDate | DateTime | Payment completion date |

**Indexes**: subscriptionId, status, invoiceNumber

#### 4. AdminUser
Admin portal users who manage schools.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | String | Admin email (unique) |
| password | String | Hashed password (bcrypt) |
| firstName | String | First name |
| lastName | String | Last name |
| role | Enum | SUPER_ADMIN, ADMIN, SUPPORT |
| isActive | Boolean | Account status |
| emailVerified | Boolean | Email verification status |

**Indexes**: email

#### 5. SchoolAdminAccess
Many-to-many relationship between admins and schools.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| adminUserId | UUID | Foreign key to AdminUser |
| schoolId | UUID | Foreign key to School |
| canManage | Boolean | Management permission |
| canViewOnly | Boolean | View-only permission |

**Indexes**: adminUserId, schoolId

#### 6. AuditLog
Complete audit trail of all admin actions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| adminUserId | UUID | Actor |
| schoolId | UUID | Target school |
| action | String | Action performed |
| entityType | String | Affected entity |
| description | String | Action description |
| ipAddress | String | Request IP |
| createdAt | DateTime | Action timestamp |

**Indexes**: adminUserId, schoolId, action, createdAt

---

## School Database Schema

**Database Purpose**: Complete school management system (isolated per school)

### User Management

#### 1. User
Central user table for all user types.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | String | User email (unique) |
| password | String | Hashed password (bcrypt) |
| firstName | String | First name |
| lastName | String | Last name |
| role | Enum | SUPER_ADMIN, ADMIN, TEACHER, STUDENT, PARENT, etc. |
| isActive | Boolean | Account status |
| lastLogin | DateTime | Last login timestamp |

**Indexes**: email, role

**Relationships**:
- One-to-One with Student, Teacher, Staff, or Parent (based on role)

### Student Management

#### 2. Student
Student profiles and academic information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key to User |
| admissionNumber | String | Unique admission number |
| rollNumber | String | Roll number |
| currentClassId | UUID | Current class |
| sectionId | UUID | Current section |
| academicYearId | UUID | Current academic year |
| status | Enum | ACTIVE, INACTIVE, GRADUATED, TRANSFERRED |
| joiningDate | DateTime | Admission date |

**Indexes**: admissionNumber, currentClassId, status

#### 3. StudentParent
Many-to-many relationship between students and parents.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| studentId | UUID | Foreign key to Student |
| parentId | UUID | Foreign key to Parent |
| relationship | Enum | FATHER, MOTHER, GUARDIAN, etc. |

#### 4. Parent
Parent/guardian profiles.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key to User |
| occupation | String | Parent occupation |
| qualification | String | Educational qualification |
| annualIncome | Float | Annual income |

#### 5. StudentDocument
Student document storage.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| studentId | UUID | Foreign key to Student |
| documentType | String | Document type |
| fileUrl | String | Cloud storage URL |
| uploadedAt | DateTime | Upload timestamp |

### Teacher & Staff Management

#### 6. Teacher
Teacher profiles and assignments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key to User |
| employeeId | String | Unique employee ID |
| qualification | String | Educational qualification |
| experience | Int | Years of experience |
| specialization | String | Subject specialization |
| status | Enum | ACTIVE, ON_LEAVE, RESIGNED, TERMINATED |

**Indexes**: employeeId, userId

#### 7. Staff
Non-teaching staff profiles.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key to User |
| employeeId | String | Unique employee ID |
| designation | String | Job title |
| department | String | Department |
| status | Enum | ACTIVE, ON_LEAVE, RESIGNED, TERMINATED |

### Academic Structure

#### 8. AcademicYear
Academic year definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Year name (e.g., "2024-2025") |
| startDate | DateTime | Start date |
| endDate | DateTime | End date |
| isCurrent | Boolean | Is current year flag |

#### 9. Class
Class/grade definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Class name (e.g., "Class 10") |
| numericValue | Int | For sorting (1-12) |
| academicYearId | UUID | Academic year |
| classTeacherId | UUID | Class teacher |

#### 10. Section
Class sections (A, B, C, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Section name |
| classId | UUID | Parent class |
| maxStudents | Int | Maximum students |

#### 11. Subject
Subject definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Subject name |
| code | String | Subject code (unique) |
| classId | UUID | Applicable class |
| type | Enum | CORE, ELECTIVE, OPTIONAL, EXTRACURRICULAR |
| totalMarks | Int | Total marks |
| passMarks | Int | Passing marks |

#### 12. SubjectTeacher
Subject-teacher assignments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| subjectId | UUID | Subject |
| teacherId | UUID | Teacher |
| assignedAt | DateTime | Assignment date |

### Timetable Management

#### 13. Timetable
Timetable definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Timetable name |
| classId | UUID | Class |
| effectiveFrom | DateTime | Start date |
| effectiveTo | DateTime | End date |
| isActive | Boolean | Active status |

#### 14. TimetableSlot
Individual timetable periods.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| timetableId | UUID | Timetable |
| dayOfWeek | Int | 0=Sunday, 6=Saturday |
| startTime | String | HH:mm format |
| endTime | String | HH:mm format |
| period | Int | Period number |
| sectionId | UUID | Section |
| subjectId | UUID | Subject |
| teacherId | UUID | Teacher |

### RFID & Attendance

#### 15. RFIDCard
RFID card assignments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| cardNumber | String | RFID card UID (unique) |
| holderType | Enum | STUDENT, TEACHER, STAFF |
| studentId | UUID | Student (if applicable) |
| teacherId | UUID | Teacher (if applicable) |
| staffId | UUID | Staff (if applicable) |
| isActive | Boolean | Card status |
| issuedDate | DateTime | Issue date |

**Indexes**: cardNumber, holderType

#### 16. AttendanceRecord
Daily attendance records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| attendeeType | Enum | STUDENT, TEACHER, STAFF |
| studentId | UUID | Student (if applicable) |
| teacherId | UUID | Teacher (if applicable) |
| staffId | UUID | Staff (if applicable) |
| date | Date | Attendance date |
| checkInTime | DateTime | Check-in timestamp |
| checkOutTime | DateTime | Check-out timestamp |
| status | Enum | PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE |
| scannedByRFID | Boolean | RFID scan flag |
| deviceId | String | RFID reader ID |

**Indexes**: studentId+date, teacherId+date, staffId+date, date

### Examination System

#### 17. Exam
Exam definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Exam name |
| examType | Enum | UNIT_TEST, MONTHLY_TEST, QUARTERLY, etc. |
| classId | UUID | Class |
| academicYearId | UUID | Academic year |
| startDate | DateTime | Exam start |
| endDate | DateTime | Exam end |

#### 18. ExamSubject
Subject-wise exam schedules.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| examId | UUID | Exam |
| subjectId | UUID | Subject |
| examDate | DateTime | Exam date |
| startTime | String | Start time |
| duration | Int | Duration in minutes |
| totalMarks | Int | Total marks |
| passMarks | Int | Passing marks |

#### 19. ExamResult
Student exam results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| examId | UUID | Exam |
| studentId | UUID | Student |
| totalMarks | Float | Total marks |
| obtainedMarks | Float | Obtained marks |
| percentage | Float | Percentage |
| grade | String | Grade |
| rank | Int | Class rank |
| result | Enum | PASS, FAIL, ABSENT, WITHHELD |
| isPublished | Boolean | Publication status |

#### 20. ExamMark
Subject-wise marks breakdown.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| examResultId | UUID | Exam result |
| subjectName | String | Subject name |
| subjectCode | String | Subject code |
| totalMarks | Float | Total marks |
| obtainedMarks | Float | Obtained marks |
| grade | String | Grade |

### Fee Management

#### 21. FeeStructure
Fee structure definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Fee name |
| classId | String | Applicable class (null = all) |
| amount | Float | Fee amount |
| frequency | Enum | ONE_TIME, MONTHLY, QUARTERLY, etc. |
| dueDay | Int | Day of month when due |
| earlyPaymentDiscount | Float | Early payment discount |
| latePaymentPenalty | Float | Late payment penalty |

#### 22. FeePayment
Fee payment records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| receiptNumber | String | Unique receipt number |
| studentId | UUID | Student |
| feeStructureId | UUID | Fee type |
| amount | Float | Base amount |
| discount | Float | Discount applied |
| penalty | Float | Late fee penalty |
| totalAmount | Float | Total paid |
| paymentDate | DateTime | Payment date |
| paymentMode | Enum | CASH, CHEQUE, CARD, UPI, etc. |
| status | Enum | PENDING, COMPLETED, FAILED, REFUNDED |

**Indexes**: studentId, receiptNumber, paymentDate

### Library Management

#### 23. Book
Book inventory.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | String | Book title |
| author | String | Author name |
| isbn | String | ISBN number (unique) |
| publisher | String | Publisher name |
| category | String | Book category |
| totalCopies | Int | Total copies |
| availableCopies | Int | Available copies |
| price | Float | Book price |

**Indexes**: isbn, category, title

#### 24. LibraryIssue
Book issue/return tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| bookId | UUID | Book |
| studentId | UUID | Student |
| issueDate | DateTime | Issue date |
| dueDate | DateTime | Due date |
| returnDate | DateTime | Return date |
| status | Enum | ISSUED, RETURNED, OVERDUE, LOST |
| fineAmount | Float | Fine amount |
| finePaid | Boolean | Fine payment status |

**Indexes**: bookId, studentId, status

### Inventory Management

#### 25. InventoryItem
General inventory items.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Item name |
| category | String | Item category |
| itemCode | String | Unique item code |
| quantity | Int | Current quantity |
| unit | String | Unit of measurement |
| minStockLevel | Int | Minimum stock threshold |
| unitPrice | Float | Unit price |

**Indexes**: itemCode, category

#### 26. StockMovement
Inventory movement tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| itemId | UUID | Inventory item |
| movementType | Enum | PURCHASE, ISSUE, RETURN, ADJUSTMENT, etc. |
| quantity | Int | Quantity moved |
| previousQuantity | Int | Quantity before |
| newQuantity | Int | Quantity after |
| performedBy | String | User ID |

**Indexes**: itemId, movementType, createdAt

### Communication

#### 27. Announcement
School announcements.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | String | Announcement title |
| content | String | Announcement content |
| targetAudience | String[] | Target roles |
| classIds | String[] | Target classes |
| priority | Enum | LOW, NORMAL, HIGH, URGENT |
| isPublished | Boolean | Publication status |
| publishedAt | DateTime | Publication date |

**Indexes**: isPublished, createdAt

#### 28. Notification
User notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | String | Recipient user ID |
| title | String | Notification title |
| message | String | Notification message |
| type | Enum | ATTENDANCE, EXAM, FEE, etc. |
| isRead | Boolean | Read status |
| readAt | DateTime | Read timestamp |

**Indexes**: userId, isRead, createdAt

---

## Database Relationships

### Admin Database
```
School 1---1 Subscription
School 1---N Invoice (through Subscription)
School N---N AdminUser (through SchoolAdminAccess)
AdminUser 1---N AuditLog
School 1---N AuditLog
```

### School Database
```
User 1---1 Student/Teacher/Staff/Parent
Student N---N Parent (through StudentParent)
Student N---1 Class
Student N---1 Section
Student 1---1 RFIDCard
Student 1---N AttendanceRecord
Student 1---N ExamResult
Student 1---N FeePayment
Student 1---N LibraryIssue

Teacher N---N Subject (through SubjectTeacher)
Teacher 1---N TimetableSlot
Teacher 1---1 RFIDCard

Class 1---N Section
Class 1---N Subject
Class 1---N Timetable

Exam 1---N ExamSubject
Exam 1---N ExamResult
ExamResult 1---N ExamMark
```

---

## Indexes & Performance

### Key Indexes

**Admin Database**:
- School: schoolCode, email
- Subscription: schoolId, status, endDate
- Invoice: subscriptionId, status
- AdminUser: email
- AuditLog: action, createdAt

**School Database**:
- User: email, role
- Student: admissionNumber, currentClassId, status
- Teacher: employeeId
- RFIDCard: cardNumber
- AttendanceRecord: studentId+date, date
- ExamResult: examId, studentId
- FeePayment: receiptNumber, studentId, paymentDate
- Book: isbn, title

### Query Optimization Tips

1. **Always use indexed fields** in WHERE clauses
2. **Pagination**: Use cursor-based pagination for large datasets
3. **Joins**: Limit join depth to 3 levels
4. **Aggregations**: Use database aggregations instead of application-level
5. **Caching**: Cache frequently accessed data (Redis)
6. **Connection Pooling**: Use PgBouncer for connection management

---

## Backup & Recovery

### Backup Strategy
- **Daily**: Full automated backups
- **Hourly**: Incremental backups
- **Point-in-Time Recovery**: Enabled on all databases

### Retention Policy
- Daily backups: 30 days
- Weekly backups: 3 months
- Monthly backups: 1 year

---

## Migrations

### Prisma Migrations

**Admin Database**:
```bash
cd Admin/server
npx prisma migrate dev --name init
npx prisma generate
```

**School Database**:
```bash
cd erp/server
npx prisma migrate dev --name init
npx prisma generate
```

### Migration Best Practices
1. Always test migrations in staging first
2. Take backups before running migrations
3. Use transactions for data migrations
4. Monitor migration duration on large tables
5. Schedule migrations during low-traffic periods

---

## Security

### Data Protection
- **Encryption at Rest**: PostgreSQL encryption
- **Encryption in Transit**: SSL/TLS connections
- **Password Hashing**: bcrypt with salt
- **Sensitive Data**: Masked in logs and audit trails

### Access Control
- **Row-Level Security**: Implemented for multi-tenancy
- **Least Privilege**: Users have minimum required permissions
- **Audit Trails**: All data modifications logged

---

## Scaling Considerations

### Vertical Scaling
- Increase database server resources (CPU, RAM, storage)
- Recommended for databases up to 10GB

### Horizontal Scaling
- Read replicas for read-heavy workloads
- Connection pooling with PgBouncer
- Partitioning large tables (AttendanceRecord, AuditLog)

### Recommended Limits per School
- Students: Up to 5,000
- Attendance Records: Partition by academic year
- Exam Results: Partition by academic year
- Audit Logs: Archive after 1 year

---

## Prisma Client Usage

### Example Queries

**Create a student**:
```typescript
const student = await prisma.student.create({
  data: {
    user: {
      create: {
        email: "student@example.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
        role: "STUDENT"
      }
    },
    admissionNumber: "2024001",
    academicYearId: academicYearId,
    currentClassId: classId,
    sectionId: sectionId
  },
  include: {
    user: true
  }
})
```

**Record attendance via RFID**:
```typescript
const attendance = await prisma.attendanceRecord.create({
  data: {
    studentId: student.id,
    attendeeType: "STUDENT",
    date: new Date(),
    checkInTime: new Date(),
    status: "PRESENT",
    scannedByRFID: true,
    deviceId: "RFID-001"
  }
})
```

**Get student report card**:
```typescript
const result = await prisma.examResult.findUnique({
  where: { id: resultId },
  include: {
    marks: true,
    exam: true,
    student: {
      include: {
        user: true,
        currentClass: true,
        section: true
      }
    }
  }
})
```

---

## Support

For schema modifications or database issues, contact the development team or create an issue in the repository.
