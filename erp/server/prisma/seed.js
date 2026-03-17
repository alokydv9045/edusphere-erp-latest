const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// ⛔ Safety guard — prevent seeding demo data in production
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Seed script cannot run in production environment!');
  console.error('   This would overwrite production data with demo data.');
  process.exit(1);
}

async function main() {
    console.log('🌱 Starting comprehensive ERP database seed...');
    const passwordHash = await bcrypt.hash('School123!', 10);

    // Helper functions for dates
    const dob = (yearsAgo) => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - yearsAgo);
        return d;
    };

    // ─── 1. STAFF USERS (Admin, SuperAdmin, Accountant, Librarian) ──────────────
    console.log('\n👤 Creating fully detailed staff and admin users...');

    const systemAdmin = await prisma.user.upsert({
        where: { email: 'admin@demoschool.com' },
        update: { roles: ['SUPER_ADMIN', 'ADMIN'], role: 'SUPER_ADMIN' },
        create: {
            firstName: 'System', lastName: 'Administrator',
            email: 'admin@demoschool.com', password: passwordHash,
            role: 'SUPER_ADMIN', roles: ['SUPER_ADMIN', 'ADMIN'], isActive: true,
            phone: '+91-9876543210', gender: 'MALE', dateOfBirth: dob(40),
            address: '100 Admin Block, Tech Park, Cityville, ST 12345',
            bloodGroup: 'O+'
        },
    });

    const principal = await prisma.user.upsert({
        where: { email: 'principal@demoschool.com' },
        update: { roles: ['ADMIN'], role: 'ADMIN' },
        create: {
            firstName: 'John', lastName: 'Principal',
            email: 'principal@demoschool.com', password: passwordHash,
            role: 'ADMIN', roles: ['ADMIN'], isActive: true,
            phone: '+91-9876543211', gender: 'MALE', dateOfBirth: dob(45),
            address: '202 Staff Quarters, Edu Campus, Cityville, ST 12345',
            bloodGroup: 'A+'
        },
    });

    const accountantUser = await prisma.user.upsert({
        where: { email: 'accountant@demoschool.com' },
        update: { roles: ['ACCOUNTANT'], role: 'ACCOUNTANT' },
        create: {
            firstName: 'Raj', lastName: 'Accountant',
            email: 'accountant@demoschool.com', password: passwordHash,
            role: 'ACCOUNTANT', roles: ['ACCOUNTANT'], isActive: true,
            phone: '+91-9876543212', gender: 'MALE', dateOfBirth: dob(35),
            address: '304 Finance Lane, Market area, Cityville, ST 12345',
            bloodGroup: 'B+'
        },
    });

    // Create corresponding Staff profile
    await prisma.staff.upsert({
        where: { userId: accountantUser.id },
        update: {},
        create: {
            user: { connect: { id: accountantUser.id } },
            employeeId: 'STF001', joiningDate: new Date('2020-01-15'),
            designation: 'Senior Accountant', department: 'Finance'
        }
    });

    const librarianUser = await prisma.user.upsert({
        where: { email: 'librarian@demoschool.com' },
        update: { roles: ['LIBRARIAN'], role: 'LIBRARIAN' },
        create: {
            firstName: 'Meena', lastName: 'Librarian',
            email: 'librarian@demoschool.com', password: passwordHash,
            role: 'LIBRARIAN', roles: ['LIBRARIAN'], isActive: true,
            phone: '+91-9876543213', gender: 'FEMALE', dateOfBirth: dob(38),
            address: '22 Library Road, Knowledge Park, Cityville, ST 12345',
            bloodGroup: 'AB+'
        },
    });

    await prisma.staff.upsert({
        where: { userId: librarianUser.id },
        update: {},
        create: {
            user: { connect: { id: librarianUser.id } },
            employeeId: 'STF002', joiningDate: new Date('2021-03-10'),
            designation: 'Head Librarian', department: 'Library'
        }
    });

    // ─── 2. ACADEMIC YEAR ──────────────────────────────────────────────────────
    console.log('\n📅 Creating academic year...');

    const academicYear = await prisma.academicYear.upsert({
        where: { name: '2024-2025' },
        update: {},
        create: {
            name: '2024-2025',
            startDate: new Date('2024-04-01'),
            endDate: new Date('2025-03-31'),
            isCurrent: true,
        },
    });

    // ─── 3. CLASSES AND SECTIONS ───────────────────────────────────────────────
    console.log('\n🏫 Creating classes and sections...');

    const class6 = await prisma.class.upsert({
        where: { name_academicYearId: { name: 'Class 6', academicYearId: academicYear.id } },
        update: {},
        create: { name: 'Class 6', numericValue: 6, academicYearId: academicYear.id },
    });
    const section6A = await prisma.section.upsert({
        where: { classId_name: { classId: class6.id, name: 'A' } },
        update: {},
        create: { name: 'A', classId: class6.id, maxStudents: 40 },
    });

    const class7 = await prisma.class.upsert({
        where: { name_academicYearId: { name: 'Class 7', academicYearId: academicYear.id } },
        update: {},
        create: { name: 'Class 7', numericValue: 7, academicYearId: academicYear.id },
    });
    const section7A = await prisma.section.upsert({
        where: { classId_name: { classId: class7.id, name: 'A' } },
        update: {},
        create: { name: 'A', classId: class7.id, maxStudents: 40 },
    });

    const class8 = await prisma.class.upsert({
        where: { name_academicYearId: { name: 'Class 8', academicYearId: academicYear.id } },
        update: {},
        create: { name: 'Class 8', numericValue: 8, academicYearId: academicYear.id },
    });

    // ─── 4. SUBJECTS ───────────────────────────────────────────────────────────
    console.log('\n📚 Creating subjects...');

    await prisma.subject.upsert({
        where: { code: 'MATH6' },
        update: {}, create: { name: 'Mathematics', code: 'MATH6', classId: class6.id },
    });
    await prisma.subject.upsert({
        where: { code: 'ENG6' },
        update: {}, create: { name: 'English', code: 'ENG6', classId: class6.id },
    });
    await prisma.subject.upsert({
        where: { code: 'SCI6' },
        update: {}, create: { name: 'Science', code: 'SCI6', classId: class6.id },
    });

    // ─── 5. TEACHERS ───────────────────────────────────────────────────────────
    console.log('\n👨‍🏫 Creating detailed teacher profiles...');

    const teacher1User = await prisma.user.upsert({
        where: { email: 'teacher1@demoschool.com' },
        update: { roles: ['TEACHER'], role: 'TEACHER' },
        create: {
            firstName: 'Amit', lastName: 'Sharma',
            email: 'teacher1@demoschool.com', password: passwordHash,
            role: 'TEACHER', roles: ['TEACHER'], isActive: true,
            phone: '+91-9876543214', gender: 'MALE', dateOfBirth: dob(30),
            address: '15 Teachers Colony, Sector 4, Cityville, ST 12345',
            bloodGroup: 'B+'
        },
    });
    await prisma.teacher.upsert({
        where: { userId: teacher1User.id },
        update: {},
        create: {
            userId: teacher1User.id, employeeId: 'TCH001',
            qualification: 'M.Sc, B.Ed', specialization: 'Mathematics',
            joiningDate: new Date('2020-06-01'), assignedClass: { connect: { id: class6.id } }
        },
    });

    const teacher2User = await prisma.user.upsert({
        where: { email: 'teacher2@demoschool.com' },
        update: { roles: ['TEACHER'], role: 'TEACHER' },
        create: {
            firstName: 'Sunita', lastName: 'Verma',
            email: 'teacher2@demoschool.com', password: passwordHash,
            role: 'TEACHER', roles: ['TEACHER'], isActive: true,
            phone: '+91-9876543215', gender: 'FEMALE', dateOfBirth: dob(32),
            address: '42 Blossom Apartments, Sector 5, Cityville, ST 12345',
            bloodGroup: 'O+'
        },
    });
    await prisma.teacher.upsert({
        where: { userId: teacher2User.id },
        update: {},
        create: {
            userId: teacher2User.id, employeeId: 'TCH002',
            qualification: 'M.A., B.Ed', specialization: 'English',
            joiningDate: new Date('2021-07-01'), assignedClass: { connect: { id: class7.id } }
        },
    });

    // ─── 6. COMPREHENSIVE STUDENT PROFILES (5 Students) ────────────────────────
    console.log('\n🎓 Creating 5 fully detailed student profiles & parents...');

    const studentData = [
        {
            email: 'student1@demoschool.com', first: 'Vivek', last: 'Kumar', gender: 'MALE', dob: dob(14),
            phone: '+91-8888888001', address: '123 Main Street, Education City, ST 12345',
            admNo: 'ADM2024001', roll: '01', classId: class6.id, sectionId: section6A.id,
            bg: 'O+', caste: 'General', religion: 'Hindu', emergencyContact: 'Robert Kumar', emergencyPhone: '+91-9999999001',
            fatherFirst: 'Robert', fatherLast: 'Kumar', fatherPhone: '+91-9999999001', fatherOcc: 'Engineer'
        },
        {
            email: 'student2@demoschool.com', first: 'Priya', last: 'Singh', gender: 'FEMALE', dob: dob(13),
            phone: '+91-8888888002', address: '456 Elm Ave, Pearl District, ST 12345',
            admNo: 'ADM2024002', roll: '02', classId: class6.id, sectionId: section6A.id,
            bg: 'A+', caste: 'OBC', religion: 'Hindu', emergencyContact: 'Rajesh Singh', emergencyPhone: '+91-9999999002',
            fatherFirst: 'Rajesh', fatherLast: 'Singh', fatherPhone: '+91-9999999002', fatherOcc: 'Business'
        },
        {
            email: 'student3@demoschool.com', first: 'Aisha', last: 'Khan', gender: 'FEMALE', dob: dob(14),
            phone: '+91-8888888003', address: '789 Crescent Moon Blvd, Model Town, ST 12345',
            admNo: 'ADM2024003', roll: '03', classId: class6.id, sectionId: section6A.id,
            bg: 'B+', caste: 'General', religion: 'Islam', emergencyContact: 'Tariq Khan', emergencyPhone: '+91-9999999003',
            fatherFirst: 'Tariq', fatherLast: 'Khan', fatherPhone: '+91-9999999003', fatherOcc: 'Doctor'
        },
        {
            email: 'student4@demoschool.com', first: 'Rohan', last: 'Das', gender: 'MALE', dob: dob(15),
            phone: '+91-8888888004', address: '321 Sunrise Road, Green Valley, ST 12345',
            admNo: 'ADM2024004', roll: '01', classId: class7.id, sectionId: section7A.id,
            bg: 'AB+', caste: 'SC', religion: 'Hindu', emergencyContact: 'Vikram Das', emergencyPhone: '+91-9999999004',
            fatherFirst: 'Vikram', fatherLast: 'Das', fatherPhone: '+91-9999999004', fatherOcc: 'Govt Employee'
        },
        {
            email: 'student5@demoschool.com', first: 'Neha', last: 'Sharma', gender: 'FEMALE', dob: dob(15),
            phone: '+91-8888888005', address: '654 Maple Street, Heritage Block, ST 12345',
            admNo: 'ADM2024005', roll: '02', classId: class7.id, sectionId: section7A.id,
            bg: 'O-', caste: 'General', religion: 'Hindu', emergencyContact: 'Suresh Sharma', emergencyPhone: '+91-9999999005',
            fatherFirst: 'Suresh', fatherLast: 'Sharma', fatherPhone: '+91-9999999005', fatherOcc: 'Teacher'
        }
    ];

    for (const data of studentData) {
        // User Account Create
        const u = await prisma.user.upsert({
            where: { email: data.email },
            update: { roles: ['STUDENT'], role: 'STUDENT' },
            create: {
                firstName: data.first, lastName: data.last,
                email: data.email, password: passwordHash,
                role: 'STUDENT', roles: ['STUDENT'], isActive: true,
                phone: data.phone, gender: data.gender, dateOfBirth: data.dob,
                address: data.address, bloodGroup: data.bg
            }
        });

        // Student Profile Create
        const s = await prisma.student.upsert({
            where: { admissionNumber: data.admNo },
            update: {},
            create: {
                userId: u.id, admissionNumber: data.admNo, rollNumber: data.roll,
                currentClassId: data.classId, sectionId: data.sectionId,
                academicYearId: academicYear.id, status: 'ACTIVE',
                religion: data.religion, caste: data.caste, nationality: 'Indian',
                permanentAddress: data.address, city: 'Cityville', state: 'State', pincode: '12345',
                emergencyContact: data.emergencyContact, emergencyPhone: data.emergencyPhone,
                medicalConditions: 'None', allergies: 'None'
            }
        });

        // Father Profile Create
        const fatherEmail = data.fatherFirst.toLowerCase() + '.' + data.fatherLast.toLowerCase() + '@parent.com';
        const p = await prisma.parent.upsert({
            where: { phone: data.fatherPhone },
            update: {},
            create: {
                firstName: data.fatherFirst, lastName: data.fatherLast,
                phone: data.fatherPhone, email: fatherEmail,
                occupation: data.fatherOcc
            }
        });

        // Student-Parent Relation Setup
        await prisma.studentParent.upsert({
            where: { studentId_parentId: { studentId: s.id, parentId: p.id } },
            update: {},
            create: {
                studentId: s.id, parentId: p.id, relationship: 'FATHER'
            }
        });
    }

    // ─── 7. FEE STRUCTURE ──────────────────────────────────────────────────────
    console.log('\n💰 Creating fee structure...');

    let fs = await prisma.feeStructure.findFirst({
        where: { academicYearId: academicYear.id, classId: class6.id },
    });

    if (!fs) {
        fs = await prisma.feeStructure.create({
            data: {
                name: 'Annual Fee 2024-25 (Class 6)',
                classId: class6.id, academicYearId: academicYear.id,
                totalAmount: 25000, frequency: 'YEARLY', isActive: true,
                items: {
                    create: [
                        { headName: 'TUITION', amount: 18000 },
                        { headName: 'EXAM', amount: 2500 },
                        { headName: 'MISC', amount: 4500 },
                    ],
                },
            },
        });
    }

    // Always ensure Class 6 students have this ledger assigned
    console.log('🔗 Ensuring Class 6 students have fee ledgers...');
    const class6Students = await prisma.student.findMany({
        where: { currentClassId: class6.id }
    });

    for (const student of class6Students) {
        await prisma.studentFeeLedger.upsert({
            where: {
                studentId_academicYearId_feeStructureId: {
                    studentId: student.id,
                    academicYearId: academicYear.id,
                    feeStructureId: fs.id
                }
            },
            update: {},
            create: {
                studentId: student.id,
                feeStructureId: fs.id,
                academicYearId: academicYear.id,
                totalPayable: fs.totalAmount,
                totalPaid: 0,
                totalDiscount: 0,
                totalPending: fs.totalAmount,
                status: 'PENDING'
            }
        });
    }

    // ─── 8. LIBRARY BOOKS ──────────────────────────────────────────────────────
    console.log('\n📚 Seeding library books...');
    const booksData = [
        { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', category: 'Fiction', type: 'PHYSICAL', totalCopies: 5 },
        { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', category: 'Science', type: 'PHYSICAL', totalCopies: 3 },
        { title: 'Introduction to Algorithms', author: 'Cormen et al.', isbn: '9780262033848', category: 'Computer Science', type: 'REFERENCE', totalCopies: 2 },
        { title: 'The Art of Computer Programming', author: 'Donald Knuth', isbn: '9780201896831', category: 'Computer Science', type: 'REFERENCE', totalCopies: 1 },
        { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '9780062316097', category: 'History', type: 'PHYSICAL', totalCopies: 4 }
    ];

    const seededBooks = [];
    for (const b of booksData) {
        const book = await prisma.book.upsert({
            where: { isbn: b.isbn },
            update: {},
            create: {
                ...b,
                availableCopies: b.totalCopies,
                status: 'AVAILABLE',
                condition: 'NEW'
            }
        });
        seededBooks.push(book);
    }

    // ─── 9. INITIAL LIBRARY ISSUES ─────────────────────────────────────────────
    console.log('\n📖 Creating initial library issues for analytics...');
    const students = await prisma.student.findMany({ take: 3 });
    
    if (students.length > 0 && seededBooks.length > 0) {
        // Issue 1: Active issue
        await prisma.libraryIssue.create({
            data: {
                bookId: seededBooks[0].id,
                studentId: students[0].id,
                issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),   // 9 days from now
                status: 'ISSUED',
                issuedBy: systemAdmin.id
            }
        });

        // Issue 2: Overdue issue
        await prisma.libraryIssue.create({
            data: {
                bookId: seededBooks[1].id,
                studentId: students[1].id,
                issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
                dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),    // 6 days overdue
                status: 'ISSUED',
                issuedBy: systemAdmin.id
            }
        });

        // Update book available copies
        await prisma.book.update({ where: { id: seededBooks[0].id }, data: { availableCopies: seededBooks[0].totalCopies - 1 } });
        await prisma.book.update({ where: { id: seededBooks[1].id }, data: { availableCopies: seededBooks[1].totalCopies - 1 } });
    }

    // ─── Summary ───────────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(55));
    console.log('📋 COMPREHENSIVE SEED SUMMARY');
    console.log('─'.repeat(55));
    console.log('ROLE           EMAIL                          PASSWORD');
    console.log('─'.repeat(55));
    console.log('Admin          principal@demoschool.com       School123!');
    console.log('Super Admin    admin@demoschool.com           School123!');
    console.log('Accountant     accountant@demoschool.com      School123!');
    console.log('Librarian      librarian@demoschool.com       School123!');
    console.log('Teacher 1      teacher1@demoschool.com        School123!');
    console.log('Teacher 2      teacher2@demoschool.com        School123!');
    console.log('Student 1      student1@demoschool.com        School123!');
    console.log('Student 5      student5@demoschool.com        School123!');
    console.log('─'.repeat(55));
    console.log('\n✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
