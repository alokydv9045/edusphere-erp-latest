import apiClient from './client';

export interface Student {
  id: string;
  admissionNumber: string;
  rollNumber?: string;
  status: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    avatar?: string;
  };
  currentClass?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

export interface CreateStudentData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  admissionNumber: string;
  rollNumber?: string;
  currentClassId?: string;
  sectionId?: string;
  academicYearId: string;
  joiningDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalConditions?: string;
  allergies?: string;
}

export const studentAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/students', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/students/${id}`);
    return data;
  },

  getMe: async () => {
    const { data } = await apiClient.get('/students/me');
    return data;
  },

  create: async (studentData: CreateStudentData) => {
    const { data } = await apiClient.post('/students', studentData);
    return data;
  },

  register: async (studentData: any) => {
    const { data } = await apiClient.post('/students/register', studentData);
    return data;
  },

  update: async (id: string, updates: Partial<CreateStudentData>) => {
    const { data } = await apiClient.put(`/students/${id}`, updates);
    return data;
  },

  updateMe: async (updates: Partial<CreateStudentData>) => {
    const { data } = await apiClient.put('/students/me', updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/students/${id}`);
    return data;
  },

  getAttendance: async (id: string, params?: any) => {
    const { data } = await apiClient.get(`/students/${id}/attendance`, { params });
    return data;
  },
};

export const teacherAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/teachers', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/teachers/${id}`);
    return data;
  },

  create: async (teacherData: any) => {
    const { data } = await apiClient.post('/teachers', teacherData);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/teachers/${id}`, updates);
    return data;
  },

  assignSubject: async (id: string, subjectId: string) => {
    const { data } = await apiClient.post(`/teachers/${id}/subjects`, { subjectId });
    return data;
  },

  getMySchedule: async () => {
    const { data } = await apiClient.get('/teachers/my-schedule');
    return data;
  },

  getMyClasses: async () => {
    const { data } = await apiClient.get('/teachers/my-classes');
    return data;
  },
};

export const attendanceAPI = {
  mark: async (attendanceData: any) => {
    const { data } = await apiClient.post('/attendance/mark', attendanceData);
    return data;
  },

  rfidScan: async (cardNumber: string, deviceId: string) => {
    const { data } = await apiClient.post('/attendance/rfid-scan', { cardNumber, deviceId });
    return data;
  },

  bulkMark: async (bulkData: any) => {
    const { data } = await apiClient.post('/attendance/bulk', bulkData);
    return data;
  },

  getRecords: async (params?: any) => {
    const { data } = await apiClient.get('/attendance/date', { params });
    return data;
  },

  getClassReport: async (params: any) => {
    const { data } = await apiClient.get('/attendance/report', { params });
    return data;
  },

  // Slot-based attendance
  createSlot: async (slotData: any) => {
    const { data } = await apiClient.post('/attendance/slots', slotData);
    return data;
  },

  getSlots: async (params?: any) => {
    const { data } = await apiClient.get('/attendance/slots', { params });
    return data;
  },

  getSlot: async (id: string) => {
    const { data } = await apiClient.get(`/attendance/slots/${id}`);
    return data;
  },

  deleteSlot: async (id: string) => {
    const { data } = await apiClient.delete(`/attendance/slots/${id}`);
    return data;
  },

  submitSlotAttendance: async (id: string, attendanceData: any[]) => {
    const { data } = await apiClient.post(`/attendance/slots/${id}/submit`, { attendanceData });
    return data;
  },

  submitStaffAttendance: async (attendanceData: { date: string, attendanceData: any[], attendeeType: 'TEACHER' | 'STAFF' }) => {
    const { data } = await apiClient.post('/attendance/staff-batch', attendanceData);
    return data;
  },
};

export const academicAPI = {
  getAcademicYears: async () => {
    const { data } = await apiClient.get('/academic/years');
    return data;
  },

  createAcademicYear: async (yearData: any) => {
    const { data } = await apiClient.post('/academic/years', yearData);
    return data;
  },

  setCurrentAcademicYear: async (id: string) => {
    const { data } = await apiClient.put(`/academic/years/${id}/current`);
    return data;
  },

  getClasses: async () => {
    const { data } = await apiClient.get('/academic/classes');
    return data;
  },

  getClass: async (id: string) => {
    const { data } = await apiClient.get(`/academic/classes/${id}`);
    return data;
  },

  createClass: async (classData: any) => {
    const { data } = await apiClient.post('/academic/classes', classData);
    return data;
  },

  updateClass: async (id: string, classData: any) => {
    const { data } = await apiClient.put(`/academic/classes/${id}`, classData);
    return data;
  },

  deleteClass: async (id: string) => {
    const { data } = await apiClient.delete(`/academic/classes/${id}`);
    return data;
  },

  getSubjects: async (params?: any) => {
    const { data } = await apiClient.get('/academic/subjects', { params });
    return data;
  },

  createSubject: async (subjectData: any) => {
    const { data } = await apiClient.post('/academic/subjects', subjectData);
    return data;
  },

  updateSubject: async (id: string, subjectData: any) => {
    const { data } = await apiClient.put(`/academic/subjects/${id}`, subjectData);
    return data;
  },

  deleteSubject: async (id: string) => {
    const { data } = await apiClient.delete(`/academic/subjects/${id}`);
    return data;
  },

  assignSubjectTeacher: async (assignmentData: any) => {
    const { data } = await apiClient.post('/academic/subjects/assign', assignmentData);
    return data;
  },

  getSections: async (params?: any) => {
    const { data } = await apiClient.get('/academic/sections', { params });
    return data;
  },

  createSection: async (sectionData: any) => {
    const { data } = await apiClient.post('/academic/sections', sectionData);
    return data;
  },

  updateSection: async (id: string, sectionData: any) => {
    const { data } = await apiClient.put(`/academic/sections/${id}`, sectionData);
    return data;
  },

  deleteSection: async (id: string) => {
    const { data } = await apiClient.delete(`/academic/sections/${id}`);
    return data;
  },

  getDashboardStats: async () => {
    const { data } = await apiClient.get('/academic/dashboard');
    return data;
  },
  getTimetables: async (params?: any) => {
    const { data } = await apiClient.get('/academic/timetables', { params });
    return data;
  },
  createTimetable: async (formData: FormData) => {
    const { data } = await apiClient.post('/academic/timetables', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteTimetable: async (id: string) => {
    const { data } = await apiClient.delete(`/academic/timetables/${id}`);
    return data;
  },
};


export const feeAPI = {
  getStructures: async (params?: any) => {
    const { data } = await apiClient.get('/fees/structures', { params });
    return data;
  },

  getStructureById: async (id: string) => {
    const { data } = await apiClient.get(`/fees/structures/${id}`);
    return data;
  },

  createStructure: async (structureData: any) => {
    const { data } = await apiClient.post('/fees/structures', structureData);
    return data;
  },

  updateStructure: async (id: string, structureData: any) => {
    const { data } = await apiClient.put(`/fees/structures/${id}`, structureData);
    return data;
  },

  deleteStructure: async (id: string) => {
    const { data } = await apiClient.delete(`/fees/structures/${id}`);
    return data;
  },

  getPayments: async (params?: any) => {
    const { data } = await apiClient.get('/fees/payments', { params });
    return data;
  },

  createPayment: async (paymentData: any) => {
    const { data } = await apiClient.post('/fees/payments', paymentData);
    return data;
  },

  getStudentStatus: async (studentId: string, params?: any) => {
    const { data } = await apiClient.get(`/fees/students/${studentId}/status`, { params });
    return data;
  },

  getAdjustments: async (params?: any) => {
    const { data } = await apiClient.get('/fees/adjustments', { params });
    return data;
  },

  requestAdjustment: async (adjustmentData: any) => {
    const { data } = await apiClient.post('/fees/adjustments/request', adjustmentData);
    return data;
  },

  approveAdjustment: async (id: string, statusData: any) => {
    const { data } = await apiClient.put(`/fees/adjustments/${id}/approve`, statusData);
    return data;
  },

  processRefund: async (refundData: any) => {
    const { data } = await apiClient.post('/fees/refunds', refundData);
    return data;
  },
  getStats: async () => {
    const { data } = await apiClient.get('/fees/stats');
    return data;
  },

  getFeeStudents: async (params?: any) => {
    const { data } = await apiClient.get('/fees/students', { params });
    return data;
  },
};

export const examAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/exams', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/exams/${id}`);
    return data;
  },

  create: async (examData: any) => {
    const { data } = await apiClient.post('/exams', examData);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/exams/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/exams/${id}`);
    return data;
  },

  addSubject: async (examId: string, subjectData: any) => {
    const { data } = await apiClient.post(`/exams/${examId}/subjects`, subjectData);
    return data;
  },

  // Marks entry (subject teacher)
  enterMarks: async (examId: string, marksData: any) => {
    const { data } = await apiClient.post(`/exams/${examId}/marks`, marksData);
    return data;
  },

  // Consolidated marks (class teacher view)
  getConsolidated: async (examId: string) => {
    const { data } = await apiClient.get(`/exams/${examId}/consolidated`);
    return data;
  },

  // Freeze / Unfreeze
  freeze: async (examId: string) => {
    const { data } = await apiClient.put(`/exams/${examId}/freeze`);
    return data;
  },

  unfreeze: async (examId: string) => {
    const { data } = await apiClient.put(`/exams/${examId}/unfreeze`);
    return data;
  },

  // Legacy results
  submitResults: async (resultsData: any) => {
    const { data } = await apiClient.post('/exams/results', resultsData);
    return data;
  },

  getStudentResults: async (studentId: string, params?: any) => {
    const { data } = await apiClient.get(`/exams/students/${studentId}/results`, { params });
    return data;
  },

  getReport: async (examId: string, params?: any) => {
    const { data } = await apiClient.get(`/exams/${examId}/report`, { params });
    return data;
  },
  getTeacherTasks: async () => {
    const { data } = await apiClient.get('/exams/teacher-tasks');
    return data;
  },
  getClassTeacherReview: async (examId: string) => {
    const { data } = await apiClient.get(`/exams/${examId}/consolidated`);
    return { students: data.results || [] };
  },
  getReportCard: async (examId: string, studentId: string) => {
    const { data } = await apiClient.get(`/exams/${examId}/report`, { params: { studentId } });
    const studentResult = data.results?.find((r: any) => r.studentId === studentId);

    if (!studentResult) throw new Error('Report card not found');

    return {
      reportCard: {
        school: { name: 'EduSphere ERP' },
        exam: {
          name: studentResult.exam?.name,
          academicYear: studentResult.exam?.academicYear?.name || studentResult.exam?.academicYear
        },
        student: {
          name: studentResult.studentName,
          class: studentResult.student?.currentClass?.name || studentResult.student?.class,
          section: studentResult.student?.section?.name || studentResult.student?.section,
          rollNumber: studentResult.student?.rollNumber,
          admissionNumber: studentResult.admissionNo,
        },
        subjects: studentResult.marks?.map((m: any) => ({
          name: m.subjectName,
          totalMarks: m.totalMarks,
          obtainedMarks: m.obtainedMarks,
          grade: m.grade,
          isAbsent: m.isAbsent,
          passed: m.obtainedMarks >= (m.totalMarks * 0.4),
        })),
        summary: {
          totalMarks: studentResult.totalMarks,
          obtainedMarks: studentResult.obtainedMarks,
          percentage: studentResult.percentage,
          grade: studentResult.grade,
          rank: studentResult.rank,
          totalStudents: data.stats?.totalStudents || 0,
          result: studentResult.result,
          remarks: studentResult.remarks,
        },
        classTeacher: studentResult.exam?.classTeacher || '',
      }
    };
  }
};

export const termAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/terms', { params });
    return data;
  },

  create: async (termData: any) => {
    const { data } = await apiClient.post('/terms', termData);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/terms/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/terms/${id}`);
    return data;
  },
};

export const gradeScaleAPI = {
  getAll: async () => {
    const { data } = await apiClient.get('/grade-scales');
    return data;
  },

  create: async (scaleData: any) => {
    const { data } = await apiClient.post('/grade-scales', scaleData);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/grade-scales/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/grade-scales/${id}`);
    return data;
  },
};

export const reportCardAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/report-cards', { params });
    return data;
  },

  generate: async (generateData: any) => {
    const { data } = await apiClient.post('/report-cards/generate', generateData);
    return data;
  },

  submit: async (id: string) => {
    const { data } = await apiClient.put(`/report-cards/${id}/submit`);
    return data;
  },

  bulkSubmit: async (reportCardIds: string[]) => {
    const { data } = await apiClient.post('/report-cards/bulk-submit', { reportCardIds });
    return data;
  },

  approve: async (id: string) => {
    const { data } = await apiClient.put(`/report-cards/${id}/approve`);
    return data;
  },

  bulkApprove: async (reportCardIds: string[]) => {
    const { data } = await apiClient.post('/report-cards/bulk-approve', { reportCardIds });
    return data;
  },

  reject: async (id: string, remark: string) => {
    const { data } = await apiClient.put(`/report-cards/${id}/reject`, { remark });
    return data;
  },

  download: async (id: string) => {
    const { data } = await apiClient.get(`/report-cards/${id}/pdf`, {
      responseType: 'blob',
    });
    return data;
  },

  publish: async (reportCardIds: string[]) => {
    const { data } = await apiClient.post('/report-cards/publish', { reportCardIds });
    return data;
  },

  getTemplates: async () => {
    const { data } = await apiClient.get('/report-cards/templates');
    return data;
  },

  updateTemplate: async (id: string, templateData: any) => {
    const { data } = await apiClient.put(`/report-cards/templates/${id}`, templateData);
    return data;
  },

  createTemplate: async (templateData: any) => {
    const { data } = await apiClient.post('/report-cards/templates', templateData);
    return data;
  },
};


export const libraryAPI = {
  getBooks: async (params?: any) => {
    const { data } = await apiClient.get('/library/books', { params });
    return data;
  },

  getBook: async (id: string) => {
    const { data } = await apiClient.get(`/library/books/${id}`);
    return data;
  },

  createBook: async (bookData: any) => {
    const { data } = await apiClient.post('/library/books', bookData);
    return data;
  },

  updateBook: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/library/books/${id}`, updates);
    return data;
  },

  issueBook: async (issueData: any) => {
    const { data } = await apiClient.post('/library/issue', issueData);
    return data;
  },

  returnBook: async (issueId: string) => {
    const { data } = await apiClient.post('/library/return', { issueId });
    return data;
  },

  getIssues: async (params?: any) => {
    const { data } = await apiClient.get('/library/issues', { params });
    return data;
  },

  getOverdue: async () => {
    const { data } = await apiClient.get('/library/overdue');
    return data;
  },
};

export const inventoryAPI = {
  getItems: async (params?: any) => {
    const { data } = await apiClient.get('/inventory/items', { params });
    return data;
  },

  getItem: async (id: string) => {
    const { data } = await apiClient.get(`/inventory/items/${id}`);
    return data;
  },

  createItem: async (itemData: any) => {
    const { data } = await apiClient.post('/inventory/items', itemData);
    return data;
  },

  updateItem: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/inventory/items/${id}`, updates);
    return data;
  },

  recordMovement: async (movementData: any) => {
    const { data } = await apiClient.post('/inventory/movements', movementData);
    return data;
  },

  getMovements: async (params?: any) => {
    const { data } = await apiClient.get('/inventory/movements', { params });
    return data;
  },

  getLowStock: async () => {
    const { data } = await apiClient.get('/inventory/low-stock');
    return data;
  },

  getSummary: async () => {
    const { data } = await apiClient.get('/inventory/summary');
    return data;
  },
};

export const announcementAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/announcements', { params });
    return data;
  },

  getActive: async () => {
    const { data } = await apiClient.get('/announcements/active');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/announcements/${id}`);
    return data;
  },

  create: async (announcementData: any) => {
    const { data } = await apiClient.post('/announcements', announcementData);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/announcements/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/announcements/${id}`);
    return data;
  },
};

export const enquiryAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/enquiries', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/enquiries/${id}`);
    return data;
  },
  create: async (enquiryData: any) => {
    const { data } = await apiClient.post('/enquiries', enquiryData);
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/enquiries/${id}`, updates);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/enquiries/${id}`);
    return data;
  },
  addFollowUp: async (id: string, followUpData: any) => {
    const { data } = await apiClient.post(`/enquiries/${id}/follow-up`, followUpData);
    return data;
  },
};

// ============================================
// Dashboard API
// ============================================

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  attendanceToday: number;
  feesCollected: number;
  studentsChange: number;
  teachersChange: number;
  attendanceChange: number;
  feesChange: number;

  // Admin / Principal fields
  activeStudents?: number;
  totalClasses?: number;
  recentAdmissions?: number;
  pendingFeeCount?: number;
  upcomingExamCount?: number;
  overdueBooks?: number;

  // Admission Manager fields
  admissionsToday?: number;
  admissionsThisMonth?: number;
  funnelStats?: {
    pending: number;
    followUp: number;
    converted: number;
  };
  classDistribution?: { name: string; count: number }[];
  recentEnquiries?: {
    id: string;
    studentName: string;
    parentName: string;
    phone: string;
    class: string;
    status: string;
    createdAt: string;
  }[];

  // Role-specific optional fields
  role?: string;
  attendancePercentage?: number;
  pendingFees?: number;
  nextExam?: { name: string; date: string } | null;
  booksDue?: number;

  isClassTeacher?: boolean;
  myClassName?: string | null;
  myClassStudents?: number;
  subjectCount?: number;
  classesToday?: number;
  pendingAttendance?: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
}

export interface UpcomingExam {
  id: string;
  name: string;
  class: string;
  date: string;
  subject: string;
}

export interface FeeCollectionSummary {
  totalExpected: number;
  collected: number;
  pending: number;
  collectionRate: number;
}

export interface InventoryAlerts {
  lowStockCount: number;
  items: any[];
}

export const dashboardAPI = {
  getStats: async (): Promise<{ success: boolean; stats: DashboardStats }> => {
    const { data } = await apiClient.get('/dashboard/stats');
    return data;
  },

  getRecentActivities: async (limit?: number): Promise<{ success: boolean; activities: RecentActivity[] }> => {
    const { data } = await apiClient.get('/dashboard/activities', { params: { limit } });
    return data;
  },

  getUpcomingExams: async (limit?: number): Promise<{ success: boolean; exams: UpcomingExam[] }> => {
    const { data } = await apiClient.get('/dashboard/upcoming-exams', { params: { limit } });
    return data;
  },

  getFeeCollectionSummary: async (): Promise<{ success: boolean; summary: FeeCollectionSummary }> => {
    const { data } = await apiClient.get('/dashboard/fee-summary');
    return data;
  },

  getInventoryAlerts: async (): Promise<{ success: boolean; lowStockCount: number; items: any[] }> => {
    const { data } = await apiClient.get('/dashboard/inventory-alerts');
    return data;
  },

  getAccountantStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/dashboard/accountant-stats');
    return data;
  },
};

// ============================================
// User Management API
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ACCOUNTANT' | 'LIBRARIAN' | 'INVENTORY_MANAGER' | 'HR_MANAGER' | 'ADMISSION_MANAGER';
  roles?: string[]; // Multi-role support
  phone?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  student?: any;
  teacher?: any;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ACCOUNTANT' | 'LIBRARIAN' | 'INVENTORY_MANAGER' | 'HR_MANAGER' | 'ADMISSION_MANAGER';
  roles?: string[]; // Optional multi-role assignment
  phone?: string;
}

export const userAPI = {
  // Register new user
  register: async (userData: CreateUserData): Promise<{ user: User; token: string }> => {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },

  // Get all users (this would need to be implemented in backend)
  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<{ users: User[]; total: number }> => {
    const { data } = await apiClient.get('/users', { params });
    return data;
  },

  // Get user by ID (this would need to be implemented in backend)
  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.user;
  },

  // Get current user
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get('/auth/me');
    return data.user;
  },

  // Reset password
  resetPassword: async (id: string, password: string): Promise<any> => {
    const { data } = await apiClient.post(`/users/${id}/reset-password`, { password });
    return data;
  },

  // Update user
  update: async (id: string, updates: any): Promise<any> => {
    const { data } = await apiClient.put(`/users/${id}`, updates);
    return data;
  },

  // Update user roles directly (standalone role management)
  updateRoles: async (
    id: string,
    roles: string[],
    primaryRole?: string
  ): Promise<any> => {
    const { data } = await apiClient.put(`/users/${id}/roles`, {
      roles,
      primaryRole: primaryRole ?? roles[0],
    });
    return data;
  },

  // Update avatar
  updateAvatar: async (id: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.patch(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

// ============================================
// Service Requests API
// ============================================

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  requesterId: string;
  type: 'LEAVE' | 'CERTIFICATE' | 'ID_CARD' | 'COMPLAINT' | 'OTHER';
  subject: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  attachmentUrl?: string;
  reviewerId?: string;
  reviewerRemarks?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export const serviceAPI = {
  getAll: async (params?: any): Promise<ServiceRequest[]> => {
    const { data } = await apiClient.get('/services', { params });
    return data;
  },

  create: async (requestData: any): Promise<{ message: string, request: ServiceRequest }> => {
    const { data } = await apiClient.post('/services', requestData);
    return data;
  },

  update: async (id: string, updates: any): Promise<{ message: string, request: ServiceRequest }> => {
    const { data } = await apiClient.patch(`/services/${id}`, updates);
    return data;
  },
};

// ── HR Management API ─────────────────────────────────────────────────────
export const hrAPI = {
  getEmployees: async (params?: any) => {
    const { data } = await apiClient.get('/hr', { params });
    return data;
  },
  getEmployee: async (id: string) => {
    const { data } = await apiClient.get(`/hr/${id}`);
    return data;
  },
  createEmployee: async (employee: any) => {
    const { data } = await apiClient.post('/hr', employee);
    return data;
  },
  updateEmployee: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/hr/${id}`, updates);
    return data;
  },
  toggleStatus: async (id: string, payload: { isActive: boolean; status?: string }) => {
    const { data } = await apiClient.patch(`/hr/${id}/status`, payload);
    return data;
  },

  // Leave Management
  initializeLeaves: async (payload: { employeeId: string; academicYearId: string }) => {
    const { data } = await apiClient.post('/hr/leaves/initialize', payload);
    return data;
  },
  getMyLeaveBalances: async (academicYearId?: string) => {
    const { data } = await apiClient.get('/hr/leaves/my-balances', { params: { academicYearId } });
    return data;
  },
  requestLeave: async (leaveData: any) => {
    const { data } = await apiClient.post('/hr/leaves/request', leaveData);
    return data;
  },
  applyLeave: async (leaveData: any) => {
    // Alias for requestLeave (backward compatible)
    const { data } = await apiClient.post('/hr/leaves/request', leaveData);
    return data;
  },
  processLeave: async (id: string, payload: { status: string; remarks?: string }) => {
    const { data } = await apiClient.post(`/hr/leaves/${id}/process`, payload);
    return data;
  },

  // Performance Reviews
  createReview: async (reviewData: any) => {
    const { data } = await apiClient.post('/hr/reviews', reviewData);
    return data;
  },
  getEmployeeReviews: async (employeeId: string) => {
    const { data } = await apiClient.get(`/hr/${employeeId}/reviews`);
    return data;
  },
  acknowledgeReview: async (id: string) => {
    const { data } = await apiClient.patch(`/hr/reviews/${id}/acknowledge`);
    return data;
  },
};

// ── Payroll API ───────────────────────────────────────────────────────────
export const payrollAPI = {
  getSalaryStructures: async () => {
    const { data } = await apiClient.get('/payroll/salary-structures');
    return data;
  },
  setSalaryStructure: async (payload: any) => {
    const { data } = await apiClient.post('/payroll/salary-structures', payload);
    return data;
  },
  getPayrollList: async (month: number, year: number) => {
    const { data } = await apiClient.get(`/payroll/${month}/${year}`);
    return data;
  },
  generatePayroll: async (month: number, year: number) => {
    const { data } = await apiClient.post(`/payroll/generate/${month}/${year}`);
    return data;
  },
  markPaid: async (id: string, remarks?: string) => {
    const { data } = await apiClient.patch(`/payroll/${id}/pay`, { remarks });
    return data;
  },
  updateDays: async (id: string, payload: any) => {
    const { data } = await apiClient.patch(`/payroll/${id}/days`, payload);
    return data;
  },
  getEmployeePayroll: async () => {
    const { data } = await apiClient.get('/payroll/my');
    return data;
  },
};

// ── Razorpay Payment API ──────────────────────────────────────────────────
export const paymentAPI = {
  createOrder: async (ledgerId: string, amount: number) => {
    const { data } = await apiClient.post('/payments/create-order', { ledgerId, amount });
    return data;
  },

  verifyPayment: async (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    ledgerId: string;
  }) => {
    const { data } = await apiClient.post('/payments/verify', payload);
    return data;
  },

  getMyPaymentHistory: async () => {
    const { data } = await apiClient.get('/payments/my-history');
    return data;
  },
};

// ── School Config API ─────────────────────────────────────────────────────
export const schoolConfigAPI = {
  getConfig: async () => {
    const { data } = await apiClient.get('/school-config');
    return data;
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await apiClient.post('/school-config/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateConfig: async (payload: { key: string; value: string }) => {
    const { data } = await apiClient.put('/school-config', payload);
    return data;
  },
};

export const documentAPI = {
  upload: async (studentId: string, payload: { file: File, documentType: string, documentName: string }) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('documentType', payload.documentType);
    formData.append('documentName', payload.documentName);

    const { data } = await apiClient.post(`/students/${studentId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getAll: async (studentId: string) => {
    const { data } = await apiClient.get(`/students/${studentId}/documents`);
    return data;
  },

  delete: async (documentId: string) => {
    const { data } = await apiClient.delete(`/students/documents/${documentId}`);
    return data;
  },
};
export const scannerAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/scanners', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/scanners/${id}`);
    return data;
  },
  create: async (scannerData: any) => {
    const { data } = await apiClient.post('/scanners', scannerData);
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/scanners/${id}`, updates);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/scanners/${id}`);
    return data;
  },
  getStats: async (id: string) => {
    const { data } = await apiClient.get(`/scanners/${id}/stats`);
    return data;
  },
};
