# Student-Parent Single Identity System

## Overview

In this ERP system, **Parents do NOT have separate user accounts**. Instead, students and their linked parents share a single identity using the student's login credentials.

## How It Works

### 1. User Account Structure

- **Student**: Has a User account with email/password
- **Parent**: Does NOT have a User account
  - Parent record exists in the `Parent` table with personal info (firstName, lastName, email, phone, occupation, etc.)
  - Parent is linked to Student via the `StudentParent` junction table
  - Parents log in using the student's email and password

### 2. Login Flow

When a user logs in with student credentials:

```
1. User enters student's email/password
2. System authenticates the User record
3. System checks if this User has a Student record
4. If Student has linked Parent records:
   - System automatically adds 'PARENT' to effective roles
   - JWT token includes both 'STUDENT' and 'PARENT' roles
   - User gets access to both student and parent features
```

### 3. Database Schema

```prisma
model User {
  id       String @id
  email    String @unique
  password String // Hashed
  role     UserRole // Primary: STUDENT
  roles    UserRole[] // Array: ['STUDENT', 'PARENT'] if parents linked
  student  Student? // 1:1 relation
  // NOTE: No parent relation - parents don't have user accounts
}

model Student {
  id              String @id
  userId          String @unique
  user            User @relation(...)
  admissionNumber String @unique
  parents         StudentParent[] // Links to Parent records
  // ... other fields
}

model Parent {
  id            String @id
  // NO userId field - parent doesn't have user account
  firstName     String
  lastName      String
  email         String? // For communication only, not for login
  phone         String?
  occupation    String?
  qualification String?
  students      StudentParent[] // Links to Student records
}

model StudentParent {
  id           String @id
  studentId    String
  parentId     String
  relationship ParentRelationship // FATHER, MOTHER, GUARDIAN, etc.
  student      Student @relation(...)
  parent       Parent @relation(...)
}
```

### 4. Authentication Controller Logic

**File**: `/erp/server/src/controllers/authController.js`

```javascript
// When user logs in:
const login = async (req, res) => {
  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      student: {
        include: {
          parents: {
            include: { parent: true }
          }
        }
      }
    }
  });

  // 2. Verify password
  const validPassword = await bcrypt.compare(password, user.password);

  // 3. Check for parent relationships
  let effectiveRoles = user.roles || [user.role];

  if (user.student && user.student.parents.length > 0) {
    // Grant PARENT role
    if (!effectiveRoles.includes('PARENT')) {
      effectiveRoles = [...effectiveRoles, 'PARENT'];
    }
  }

  // 4. Generate JWT with effective roles
  const token = generateToken({ ...user, roles: effectiveRoles });

  // 5. Return token and user with effective roles
  res.json({ token, user: { ...user, roles: effectiveRoles } });
};
```

### 5. Benefits of Single Identity System

✅ **Simplified Login**: Parents don't need to remember separate credentials
✅ **No Duplicate Accounts**: One identity per student-parent relationship
✅ **Automatic Role Detection**: System automatically grants parent access based on relationships
✅ **Security**: Parent can only access their own child's data (enforced by relationship)
✅ **Easy Management**: Admins manage one account, not multiple

### 6. Example Scenarios

#### Scenario 1: Student Without Parents

```
User: john@school.com
Role: STUDENT
Roles: ['STUDENT']
Access: Student features only
```

#### Scenario 2: Student With Linked Parent

```
User: jane@school.com
Role: STUDENT (primary)
Roles: ['STUDENT', 'PARENT'] (effective)
Access: Both student AND parent features

Parent Records Linked:
- Father: Mr. Smith (relationship: FATHER)
- Mother: Mrs. Smith (relationship: MOTHER)

When jane@school.com logs in:
→ Gets access to student dashboard
→ Also gets access to parent dashboard
→ Can view student's grades, attendance, fees
→ Can communicate with teachers as parent
```

### 7. User Management Display

In the User Management page:

| Name | Email | Roles | Relationships | Status |
|------|-------|-------|---------------|--------|
| Jane Smith | jane@school.com | STUDENT, PARENT (Primary) | 2 Parents: Linked 🔄 Shared Login | Active |

The "Shared Login" badge indicates that parent access is granted through student credentials.

### 8. API Response Example

```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "jane@school.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "STUDENT",
    "roles": ["STUDENT", "PARENT"],
    "parentAccess": [
      {
        "id": "parent-uuid-1",
        "name": "Mr. Smith",
        "relationship": "FATHER",
        "email": "father@email.com",
        "phone": "123-456-7890"
      },
      {
        "id": "parent-uuid-2",
        "name": "Mrs. Smith",
        "relationship": "MOTHER",
        "email": "mother@email.com",
        "phone": "123-456-7891"
      }
    ],
    "credentialSharing": {
      "type": "STUDENT_PARENT_SHARED",
      "message": "This account provides access to both student and parent features"
    }
  }
}
```

### 9. Permission Enforcement

The `requireRole` middleware supports multi-role checking:

```javascript
// Parent-specific route
router.get('/parent/dashboard',
  authMiddleware,
  requireRole('PARENT'),
  getParentDashboard
);

// This works because:
// 1. Student logs in
// 2. Has parent relationship
// 3. JWT includes 'PARENT' in roles array
// 4. requireRole checks if 'PARENT' is in user's roles
// 5. Access granted ✅
```

### 10. Important Notes

⚠️ **Parent Records Are NOT User Accounts**
- Parent table stores parent information only
- No userId, no login credentials
- Just personal details and relationship to student

⚠️ **Students Cannot Have Multiple Logins for Parents**
- One student = One login
- Multiple parents = Same login for all
- All parents access system using student's credentials

⚠️ **Parent Email Field**
- Used for communication (emails, notifications)
- NOT used for authentication
- Parents receive emails but log in via student credentials

### 11. Frontend User Experience

#### For Students:
1. Login with their email/password
2. See student dashboard by default
3. If parents linked: See "Parent View" option in menu
4. Can switch between student and parent perspectives

#### For Parents:
1. Login using their child's email/password
2. System automatically detects parent relationship
3. See parent dashboard with child's information
4. Can access all parent features (view grades, attendance, communicate with teachers)

### 12. Security Considerations

✅ **Access Control**: Parent can only see their linked student's data
✅ **Role-Based**: All parent routes protected by `requireRole('PARENT')`
✅ **Relationship Validation**: Backend verifies parent-student relationship before allowing access
✅ **Audit Trail**: All actions logged with user ID (student's user account)

## Migration Notes

If you previously had separate parent user accounts, run:

```bash
# This migration will:
# 1. Remove userId from Parent table
# 2. Add firstName, lastName, email, phone to Parent table
# 3. Remove parent relation from User table
# 4. Preserve parent data in Parent table
npx prisma migrate dev --name remove_parent_user_accounts
```

## Testing Checklist

- [ ] Create a student with parents
- [ ] Login with student credentials
- [ ] Verify PARENT role is in JWT
- [ ] Access parent dashboard successfully
- [ ] Verify parent can see student's data
- [ ] Verify parent cannot see other students' data
- [ ] Test with student without parents (no PARENT role)
- [ ] Test role-based access control
- [ ] Verify User Management UI shows relationships correctly

---

**Last Updated**: 2026-02-17
**System Version**: EduSphere ERP v1.0
