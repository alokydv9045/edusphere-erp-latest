'use client';

import { useAuth } from '@/contexts/auth-context';

// These roles have elevated (admin-level) access
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
// Admin + roles with write access to specific modules
const CONTENT_ROLES = [...ADMIN_ROLES, 'TEACHER'];

export function usePermissions() {
    const { user } = useAuth();
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);

    const isAdmin = roles.some(r => ADMIN_ROLES.includes(r));
    const isTeacher = roles.includes('TEACHER');
    const isAccountant = roles.includes('ACCOUNTANT');
    const isHRManager = roles.includes('HR_MANAGER');
    const isAdmissionManager = roles.includes('ADMISSION_MANAGER');
    const isPrincipal = roles.includes('PRINCIPAL');
    const isHOD = roles.includes('HOD');

    return {
        // ── Role identity ──
        isSuperAdmin: roles.includes('SUPER_ADMIN'),
        isAdmin,
        isTeacher,
        isStudent: roles.includes('STUDENT'),
        isLibrarian: roles.includes('LIBRARIAN'),
        isAccountant,
        isHRManager,
        isAdmissionManager,
        isPrincipal,
        isHOD,

        // ── Student management ──
        canManageStudents: isAdmin || isAdmissionManager,
        canRegisterStudents: roles.some(r => [...ADMIN_ROLES, 'ADMISSION_MANAGER'].includes(r)),
        canViewStudents: isAdmin || isTeacher || isAccountant || isAdmissionManager,

        // ── Teacher management ──
        canManageTeachers: isAdmin,

        // ── Academic (classes, subjects, sections) ──
        canManageAcademics: isAdmin,
        canViewAcademics: isAdmin || isTeacher,

        // ── Attendance ──
        canMarkAttendance: isTeacher,
        canViewAttendanceReports: isAdmin,

        // ── Exams ──
        canCreateExams: isAdmin,
        canViewExams: isAdmin || isTeacher,
        canEnterMarks: isTeacher,
        canReviewMarks: isAdmin || isTeacher,
        canGenerateReportCards: isTeacher,
        canApproveReportCards: roles.includes('SUPER_ADMIN'),

        // ── Library ──
        canManageLibrary: roles.some(r => [...ADMIN_ROLES, 'LIBRARIAN'].includes(r)),

        // ── Fees ──
        canManageFeeStructures: isAdmin,
        canCollectFees: roles.some(r => [...ADMIN_ROLES, 'ACCOUNTANT'].includes(r)),
        canManageFees: isAdmin,
        canViewFees: isAdmin,

        // ── Inventory ──
        canManageInventory: roles.some(r => [...ADMIN_ROLES, 'INVENTORY_MANAGER'].includes(r)),

        // ── Announcements ──
        canManageAnnouncements: isAdmin || isTeacher,

        // ── User management ──
        canManageUsers: isAdmin,

        // ── Reports ──
        canViewReports: isAdmin,

        // ── HR Management ──
        // Admin + HR_MANAGER: full HR access | Principal/HOD: Leave approvals/Performance
        canManageHR: isAdmin || isHRManager,
        canApproveLeaves: isAdmin || isHRManager || isPrincipal || isHOD,
        canConductReviews: isAdmin || isPrincipal,
        canViewPayroll: roles.some(r => [...ADMIN_ROLES, 'ACCOUNTANT', 'HR_MANAGER'].includes(r)),

        // Raw roles for custom checks
        roles,
    };
}
