# EduSphere School ERP - API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Student Management](#student-management)
3. [Teacher Management](#teacher-management)
4. [Attendance Management](#attendance-management)
5. [Academic Management](#academic-management)
6. [Fee Management](#fee-management)
7. [Examination Management](#examination-management)
8. [Library Management](#library-management)
9. [Inventory Management](#inventory-management)
10. [Announcements](#announcements)

## Base URL
```
http://localhost:5001/api
```

## Authentication
All API endpoints (except `/auth/register` and `/auth/login`) require authentication using JWT Bearer tokens.

### Headers
```
Authorization: Bearer <your_jwt_token>
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "STUDENT"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT"
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT"
  }
}
```

## Student Management

### Get All Students
```http
GET /students?page=1&limit=25&classId=uuid&sectionId=uuid&status=ACTIVE&search=john
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25)
- `classId` - Filter by class ID
- `sectionId` - Filter by section ID
- `status` - Filter by status (ACTIVE, INACTIVE, TRANSFERRED, GRADUATED)
- `search` - Search by name, email, or admission number

**Response:**
```json
{
  "students": [
    {
      "id": "uuid",
      "admissionNumber": "ADM2024001",
      "rollNumber": "101",
      "status": "ACTIVE",
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "currentClass": {
        "id": "uuid",
        "name": "Grade 10"
      },
      "section": {
        "id": "uuid",
        "name": "A"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 25,
    "totalPages": 4
  }
}
```

### Get Single Student
```http
GET /students/:id
```

**Response:**
```json
{
  "student": {
    "id": "uuid",
    "admissionNumber": "ADM2024001",
    "rollNumber": "101",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "dateOfBirth": "2008-05-15",
      "gender": "MALE",
      "bloodGroup": "O+"
    },
    "currentClass": {...},
    "section": {...},
    "parents": [...],
    "rfidCard": {...},
    "documents": [...]
  }
}
```

### Create Student
```http
POST /students
```

**Required Role:** ADMIN, TEACHER

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "2008-05-15",
  "gender": "MALE",
  "bloodGroup": "O+",
  "address": "123 Main St",
  "admissionNumber": "ADM2024001",
  "rollNumber": "101",
  "currentClassId": "uuid",
  "sectionId": "uuid",
  "academicYearId": "uuid",
  "joiningDate": "2024-01-15",
  "emergencyContact": "Jane Doe",
  "emergencyPhone": "+1234567891",
  "medicalConditions": "None",
  "allergies": "None"
}
```

### Update Student
```http
PUT /students/:id
```

**Required Role:** ADMIN, TEACHER

### Delete Student (Soft Delete)
```http
DELETE /students/:id
```

**Required Role:** ADMIN

### Get Student Attendance
```http
GET /students/:id/attendance?startDate=2024-01-01&endDate=2024-12-31
```

**Response:**
```json
{
  "attendance": [
    {
      "id": "uuid",
      "date": "2024-01-15",
      "checkInTime": "08:30:00",
      "checkOutTime": "15:00:00",
      "status": "PRESENT"
    }
  ],
  "stats": {
    "total": 180,
    "present": 170,
    "absent": 5,
    "late": 5,
    "percentage": "94.44"
  }
}
```

## Teacher Management

### Get All Teachers
```http
GET /teachers?page=1&limit=25&status=ACTIVE&search=john
```

### Get Single Teacher
```http
GET /teachers/:id
```

### Create Teacher
```http
POST /teachers
```

**Required Role:** ADMIN

**Request Body:**
```json
{
  "email": "teacher@example.com",
  "password": "SecurePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "employeeId": "EMP2024001",
  "joiningDate": "2024-01-01",
  "qualification": "M.Ed",
  "experience": 5,
  "specialization": "Mathematics"
}
```

### Update Teacher
```http
PUT /teachers/:id
```

**Required Role:** ADMIN

### Assign Subject to Teacher
```http
POST /teachers/:id/subjects
```

**Required Role:** ADMIN

**Request Body:**
```json
{
  "subjectId": "uuid"
}
```

## Attendance Management

### Mark Attendance (Manual)
```http
POST /attendance/mark
```

**Required Role:** ADMIN, TEACHER

**Request Body:**
```json
{
  "studentId": "uuid",
  "date": "2024-01-15",
  "status": "PRESENT",
  "checkInTime": "08:30:00",
  "checkOutTime": "15:00:00",
  "remarks": "On time"
}
```

### RFID Scan Handler
```http
POST /attendance/rfid-scan
```

**Required Role:** ADMIN, TEACHER

**Request Body:**
```json
{
  "cardNumber": "RFID123456",
  "deviceId": "READER-001"
}
```

**Response:**
```json
{
  "message": "Attendance marked successfully",
  "action": "checkin",
  "attendance": {
    "id": "uuid",
    "date": "2024-01-15",
    "checkInTime": "08:30:00",
    "status": "PRESENT",
    "student": {...}
  }
}
```

### Bulk Mark Attendance
```http
POST /attendance/bulk-mark
```

**Required Role:** ADMIN, TEACHER

**Request Body:**
```json
{
  "date": "2024-01-15",
  "classId": "uuid",
  "sectionId": "uuid",
  "attendance": [
    {
      "studentId": "uuid1",
      "status": "PRESENT"
    },
    {
      "studentId": "uuid2",
      "status": "ABSENT"
    }
  ]
}
```

### Get Attendance Records
```http
GET /attendance?date=2024-01-15&classId=uuid&sectionId=uuid&status=PRESENT
```

### Get Class Attendance Report
```http
GET /attendance/class-report?classId=uuid&sectionId=uuid&startDate=2024-01-01&endDate=2024-12-31
```

## Academic Management

### Get All Classes
```http
GET /academic/classes
```

### Get Single Class
```http
GET /academic/classes/:id
```

### Create Class
```http
POST /academic/classes
```

**Required Role:** ADMIN

**Request Body:**
```json
{
  "name": "Grade 10",
  "description": "Tenth Grade",
  "capacity": 50,
  "academicYearId": "uuid"
}
```

### Get All Subjects
```http
GET /academic/subjects?classId=uuid
```

### Create Subject
```http
POST /academic/subjects
```

**Required Role:** ADMIN

**Request Body:**
```json
{
  "name": "Mathematics",
  "code": "MATH101",
  "description": "Advanced Mathematics",
  "classId": "uuid",
  "totalMarks": 100,
  "passingMarks": 40
}
```

### Get Sections
```http
GET /academic/sections?classId=uuid
```

### Create Section
```http
POST /academic/sections
```

**Required Role:** ADMIN

**Request Body:**
```json
{
  "name": "A",
  "classId": "uuid",
  "capacity": 40
}
```

## Fee Management

### Get Fee Structures
```http
GET /fees/structures?classId=uuid&isActive=true
```

### Create Fee Structure
```http
POST /fees/structures
```

**Required Role:** ADMIN

**Request Body:**
```json
{
  "name": "Tuition Fee",
  "description": "Monthly tuition fee",
  "classId": "uuid",
  "amount": 5000,
  "frequency": "MONTHLY",
  "dueDay": 10,
  "earlyPaymentDiscount": 100,
  "latePaymentPenalty": 50
}
```

### Get Fee Payments
```http
GET /fees/payments?studentId=uuid&status=COMPLETED&page=1&limit=25
```

### Create Fee Payment
```http
POST /fees/payments
```

**Required Role:** ADMIN, ACCOUNTANT

**Request Body:**
```json
{
  "studentId": "uuid",
  "feeStructureId": "uuid",
  "amount": 5000,
  "discount": 100,
  "penalty": 0,
  "paymentMode": "CASH",
  "transactionId": "TXN123",
  "forMonth": 1,
  "forYear": 2024
}
```

**Response:**
```json
{
  "message": "Fee payment recorded successfully",
  "payment": {
    "id": "uuid",
    "receiptNumber": "REC1705312345678",
    "amount": 5000,
    "discount": 100,
    "penalty": 0,
    "totalAmount": 4900,
    "status": "COMPLETED",
    "student": {...}
  }
}
```

### Get Student Fee Status
```http
GET /fees/students/:id/status
```

## Examination Management

### Get All Exams
```http
GET /exams?academicYearId=uuid&classId=uuid&examType=TERM&page=1&limit=25
```

### Get Single Exam
```http
GET /exams/:id
```

### Create Exam
```http
POST /exams
```

**Required Role:** ADMIN

**Request Body:**
```json
{
  "name": "Final Term 2024",
  "description": "Annual final examination",
  "examType": "FINAL",
  "classId": "uuid",
  "academicYearId": "uuid",
  "startDate": "2024-12-01",
  "endDate": "2024-12-15",
  "totalMarks": 500,
  "passingMarks": 200
}
```

### Update Exam
```http
PUT /exams/:id
```

**Required Role:** ADMIN

### Add Subject to Exam
```http
POST /exams/:id/subjects
```

**Required Role:** ADMIN

**Request Body:**
```json
{
  "subjectId": "uuid",
  "examDate": "2024-12-01",
  "startTime": "10:00:00",
  "endTime": "13:00:00",
  "maxMarks": 100,
  "passingMarks": 40
}
```

### Submit Exam Results
```http
POST /exams/results
```

**Required Role:** ADMIN, TEACHER

**Request Body:**
```json
{
  "examId": "uuid",
  "studentId": "uuid",
  "results": [
    {
      "subjectId": "uuid",
      "marksObtained": 85,
      "remarks": "Excellent"
    },
    {
      "subjectId": "uuid",
      "marksObtained": 78,
      "remarks": "Good"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Exam results submitted successfully",
  "examResult": {
    "id": "uuid",
    "totalMarks": 163,
    "percentage": 81.5,
    "grade": "A",
    "remarks": "Excellent",
    "subjectResults": [...]
  }
}
```

### Get Student Exam Results
```http
GET /exams/students/:studentId/results?academicYearId=uuid&examType=FINAL
```

### Get Exam Results Report
```http
GET /exams/:examId/report?classId=uuid&passFail=pass
```

## Library Management

### Get All Books
```http
GET /library/books?category=FICTION&status=AVAILABLE&search=harry&page=1&limit=25
```

### Get Single Book
```http
GET /library/books/:id
```

### Create Book
```http
POST /library/books
```

**Required Role:** ADMIN, LIBRARIAN

**Request Body:**
```json
{
  "title": "Introduction to Physics",
  "author": "John Smith",
  "isbn": "978-3-16-148410-0",
  "publisher": "Academic Press",
  "publishedYear": 2020,
  "category": "TEXTBOOK",
  "description": "Comprehensive physics textbook",
  "totalCopies": 10,
  "shelfLocation": "A-204"
}
```

### Update Book
```http
PUT /library/books/:id
```

**Required Role:** ADMIN, LIBRARIAN

### Issue Book
```http
POST /library/issue
```

**Required Role:** ADMIN, LIBRARIAN

**Request Body:**
```json
{
  "bookId": "uuid",
  "studentId": "uuid",
  "dueDate": "2024-02-15"
}
```

### Return Book
```http
POST /library/return
```

**Required Role:** ADMIN, LIBRARIAN

**Request Body:**
```json
{
  "issueId": "uuid"
}
```

**Response:**
```json
{
  "message": "Book returned with fine",
  "issue": {
    "id": "uuid",
    "returnedAt": "2024-02-20",
    "status": "RETURNED",
    "fine": 25
  },
  "fine": 25
}
```

### Get Book Issues
```http
GET /library/issues?studentId=uuid&bookId=uuid&status=ISSUED&page=1&limit=25
```

### Get Overdue Books
```http
GET /library/overdue
```

**Response:**
```json
{
  "overdueBooks": [
    {
      "id": "uuid",
      "dueDate": "2024-01-15",
      "daysOverdue": 5,
      "calculatedFine": 25,
      "book": {...},
      "student": {...}
    }
  ],
  "total": 12
}
```

## Inventory Management

### Get All Inventory Items
```http
GET /inventory/items?category=STATIONERY&status=ACTIVE&search=pen&page=1&limit=25
```

### Get Single Inventory Item
```http
GET /inventory/items/:id
```

### Create Inventory Item
```http
POST /inventory/items
```

**Required Role:** ADMIN, INVENTORY_MANAGER

**Request Body:**
```json
{
  "itemCode": "ITEM001",
  "name": "Blue Pen",
  "description": "Ball point pen",
  "category": "STATIONERY",
  "unit": "PCS",
  "quantity": 100,
  "minStockLevel": 20,
  "maxStockLevel": 500,
  "unitPrice": 10,
  "location": "Store Room A"
}
```

### Update Inventory Item
```http
PUT /inventory/items/:id
```

**Required Role:** ADMIN, INVENTORY_MANAGER

### Record Stock Movement
```http
POST /inventory/movements
```

**Required Role:** ADMIN, INVENTORY_MANAGER

**Request Body:**
```json
{
  "itemId": "uuid",
  "movementType": "IN",
  "quantity": 50,
  "referenceNumber": "PO-2024-001",
  "remarks": "Purchase order received"
}
```

**Movement Types:**
- `IN` - Stock received
- `OUT` - Stock issued
- `PURCHASE` - Purchase
- `ISSUE` - Issue to user
- `DAMAGE` - Damaged items
- `ADJUSTMENT` - Stock adjustment

### Get Stock Movements
```http
GET /inventory/movements?itemId=uuid&movementType=IN&page=1&limit=25
```

### Get Low Stock Items
```http
GET /inventory/low-stock
```

### Get Inventory Summary
```http
GET /inventory/summary
```

**Response:**
```json
{
  "summary": {
    "totalItems": 150,
    "activeItems": 140,
    "lowStockItems": 12,
    "outOfStockItems": 3,
    "totalQuantity": 5240,
    "inventoryValue": 124580.50
  }
}
```

## Announcements

### Get All Announcements
```http
GET /announcements?type=GENERAL&targetRole=STUDENT&isActive=true&page=1&limit=25
```

### Get Active Announcements for User
```http
GET /announcements/active
```

**Response:**
```json
{
  "announcements": [
    {
      "id": "uuid",
      "title": "Holiday Notice",
      "content": "School will be closed on 15th January",
      "type": "HOLIDAY",
      "priority": "HIGH",
      "validFrom": "2024-01-10",
      "validUntil": "2024-01-16"
    }
  ]
}
```

### Get Single Announcement
```http
GET /announcements/:id
```

### Create Announcement
```http
POST /announcements
```

**Required Role:** ADMIN

**Request Body:**
```json
{
  "title": "Holiday Notice",
  "content": "School will be closed on 15th January for Republic Day",
  "type": "HOLIDAY",
  "targetRole": "ALL",
  "priority": "HIGH",
  "validFrom": "2024-01-10",
  "validUntil": "2024-01-16",
  "attachments": ["https://example.com/notice.pdf"]
}
```

**Announcement Types:**
- `GENERAL` - General announcements
- `HOLIDAY` - Holiday notices
- `EVENT` - Event announcements
- `EXAM` - Exam related
- `URGENT` - Urgent notices

**Priority Levels:**
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

### Update Announcement
```http
PUT /announcements/:id
```

**Required Role:** ADMIN

### Delete Announcement (Soft Delete)
```http
DELETE /announcements/:id
```

**Required Role:** ADMIN

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Required fields missing"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Pagination

All list endpoints support pagination with the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25)

**Response format:**
```json
{
  "items": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 25,
    "totalPages": 4
  }
}
```

## User Roles

The following roles are supported:

- `SUPER_ADMIN` - Full system access
- `ADMIN` - School administration access
- `TEACHER` - Teacher access
- `STUDENT` - Student access
- `PARENT` - Parent access
- `ACCOUNTANT` - Finance department access
- `LIBRARIAN` - Library management access
- `INVENTORY_MANAGER` - Inventory management access

## Environment Variables

Refer to `.env.example` for all configuration options including:

- Database connection
- JWT configuration
- RFID settings
- School timing
- Fine calculations
- Limits and thresholds
