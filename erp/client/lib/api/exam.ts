import apiClient from './client';

export interface CreateExamData {
  name: string;
  type?: string;
  examType?: string;
  startDate: string;
  endDate: string;
  classId: string;
  academicYearId: string;
  termId?: string;
  gradeScaleId?: string;
  totalMarks?: number;
  passingMarks?: number;
  subjects?: any[];
}

export interface AddSubjectData {
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
}

export interface MarkEntryItem {
  studentId: string;
  obtainedMarks?: number;
  theoryObtained?: number;
  practicalObtained?: number;
  internalObtained?: number;
  isAbsent?: boolean;
  absenceType?: string;
  remarks?: string;
}

export interface EnterMarksData {
  subjectId: string;
  marks: MarkEntryItem[];
}

export interface SubmitResultsData {
  examId: string;
  classId: string;
  results: Array<{
    studentId: string;
    totalMarks: number;
    obtainedMarks: number;
    grade?: string;
    remarks?: string;
  }>;
}

export interface ExamQueryParams {
  page?: number;
  limit?: number;
  classId?: string;
  academicYearId?: string;
  studentId?: string;
  status?: string;
}

export interface ExamMarkRecord {
  subjectName: string;
  totalMarks: number;
  obtainedMarks: number;
  grade?: string;
  isAbsent?: boolean;
}

export interface StudentResultItem {
  studentId: string;
  studentName: string;
  admissionNo?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  result?: string;
  remarks?: string;
  student?: {
    currentClass?: { name: string };
    class?: string;
    section?: { name: string } | string;
    rollNumber?: string;
  };
  exam?: {
    name: string;
    academicYear?: { name: string } | string;
    classTeacher?: string;
  };
  marks?: ExamMarkRecord[];
}

export const examAPI = {
  getAll: async (params?: ExamQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/exams', { params });
    return data;
  },

  getById: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/exams/${id}`);
    return data;
  },

  create: async (examData: CreateExamData): Promise<any> => {
    const { data } = await apiClient.post('/exams', examData);
    return data;
  },

  update: async (id: string, updates: Partial<CreateExamData>): Promise<any> => {
    const { data } = await apiClient.put(`/exams/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<any> => {
    const { data } = await apiClient.delete(`/exams/${id}`);
    return data;
  },

  addSubject: async (examId: string, subjectData: AddSubjectData): Promise<any> => {
    const { data } = await apiClient.post(`/exams/${examId}/subjects`, subjectData);
    return data;
  },

  enterMarks: async (examId: string, marksData: EnterMarksData): Promise<any> => {
    const { data } = await apiClient.post(`/exams/${examId}/marks`, marksData);
    return data;
  },

  getConsolidated: async (examId: string): Promise<any> => {
    const { data } = await apiClient.get(`/exams/${examId}/consolidated`);
    return data;
  },

  freeze: async (examId: string): Promise<any> => {
    const { data } = await apiClient.put(`/exams/${examId}/freeze`);
    return data;
  },

  unfreeze: async (examId: string): Promise<any> => {
    const { data } = await apiClient.put(`/exams/${examId}/unfreeze`);
    return data;
  },

  submitResults: async (resultsData: SubmitResultsData): Promise<any> => {
    const { data } = await apiClient.post('/exams/results', resultsData);
    return data;
  },

  getStudentResults: async (studentId: string, params?: ExamQueryParams): Promise<any> => {
    const { data } = await apiClient.get(`/exams/students/${studentId}/results`, { params });
    return data;
  },

  getReport: async (examId: string, params?: ExamQueryParams): Promise<any> => {
    const { data } = await apiClient.get(`/exams/${examId}/report`, { params });
    return data;
  },
  getTeacherTasks: async (): Promise<any> => {
    const { data } = await apiClient.get('/exams/teacher-tasks');
    return data;
  },
  getClassTeacherReview: async (examId: string): Promise<{ students: StudentResultItem[] }> => {
    const { data } = await apiClient.get(`/exams/${examId}/consolidated`);
    return { students: data.results || [] };
  },
  getReportCard: async (examId: string, studentId: string): Promise<any> => {
    const { data } = await apiClient.get(`/exams/${examId}/report`, { params: { studentId } });
    const studentResult = data.results?.find((r: StudentResultItem) => r.studentId === studentId);

    if (!studentResult) throw new Error('Report card not found');

    const className = studentResult.student?.currentClass?.name || studentResult.student?.class || 'N/A';
    const sectionObj = studentResult.student?.section;
    const sectionName = typeof sectionObj === 'object' && sectionObj !== null ? sectionObj.name : (sectionObj || 'N/A');

    const academicYearObj = studentResult.exam?.academicYear;
    const academicYearName = typeof academicYearObj === 'object' && academicYearObj !== null ? academicYearObj.name : (academicYearObj || 'N/A');

    return {
      reportCard: {
        school: { name: 'EduSphere ERP' },
        exam: {
          name: studentResult.exam?.name || 'Exam',
          academicYear: academicYearName
        },
        student: {
          name: studentResult.studentName,
          class: className,
          section: sectionName,
          rollNumber: studentResult.student?.rollNumber || '',
          admissionNumber: studentResult.admissionNo || '',
        },
        subjects: studentResult.marks?.map((m: ExamMarkRecord) => ({
          name: m.subjectName,
          totalMarks: m.totalMarks,
          obtainedMarks: m.obtainedMarks,
          grade: m.grade || '',
          isAbsent: Boolean(m.isAbsent),
          passed: m.obtainedMarks >= (m.totalMarks * 0.4),
        })) || [],
        summary: {
          totalMarks: studentResult.totalMarks,
          obtainedMarks: studentResult.obtainedMarks,
          percentage: studentResult.percentage,
          grade: studentResult.grade,
          rank: studentResult.rank || 0,
          totalStudents: data.stats?.totalStudents || 0,
          result: studentResult.result || '',
          remarks: studentResult.remarks || '',
        },
        classTeacher: studentResult.exam?.classTeacher || '',
      }
    };
  }
};
