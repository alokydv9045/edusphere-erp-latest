import apiClient from './client';

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface ClassItem {
  id: string;
  name: string;
  capacity?: number;
  classTeacherId?: string;
  sections?: SectionItem[];
}

export interface SectionItem {
  id: string;
  name: string;
  classId: string;
  roomNumber?: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  credits?: number;
}

export interface CreateAcademicYearData {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export interface CreateClassData {
  name: string;
  capacity?: number;
  classTeacherId?: string;
  numericValue?: number | string;
  description?: string;
  academicYearId?: string;
}

export interface CreateSectionData {
  name: string;
  classId: string;
  roomNumber?: string;
  maxStudents?: number | string;
}

export interface CreateSubjectData {
  name: string;
  code: string;
  credits?: number;
  description?: string;
  classId?: string;
  teacherId?: string;
}

export interface AssignTeacherData {
  subjectId: string;
  teacherId: string;
  classId?: string;
  sectionId?: string;
}

export interface AcademicQueryParams {
  classId?: string;
  sectionId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const academicAPI = {
  getAcademicYears: async (): Promise<{ success: boolean; academicYears: AcademicYear[] }> => {
    const { data } = await apiClient.get('/academic/years');
    return data;
  },

  createAcademicYear: async (yearData: CreateAcademicYearData): Promise<{ success: boolean; academicYear: AcademicYear }> => {
    const { data } = await apiClient.post('/academic/years', yearData);
    return data;
  },

  setCurrentAcademicYear: async (id: string): Promise<{ success: boolean; academicYear: AcademicYear }> => {
    const { data } = await apiClient.put(`/academic/years/${id}/current`);
    return data;
  },

  getClasses: async (): Promise<{ success: boolean; classes: ClassItem[] }> => {
    const { data } = await apiClient.get('/academic/classes');
    return data;
  },

  getClass: async (id: string): Promise<{ success: boolean; class: ClassItem }> => {
    const { data } = await apiClient.get(`/academic/classes/${id}`);
    return data;
  },

  createClass: async (classData: CreateClassData): Promise<{ success: boolean; class: ClassItem }> => {
    const { data } = await apiClient.post('/academic/classes', classData);
    return data;
  },

  updateClass: async (id: string, classData: Partial<CreateClassData>): Promise<{ success: boolean; class: ClassItem }> => {
    const { data } = await apiClient.put(`/academic/classes/${id}`, classData);
    return data;
  },

  deleteClass: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/academic/classes/${id}`);
    return data;
  },

  getSubjects: async (params?: AcademicQueryParams): Promise<{ success: boolean; subjects: SubjectItem[] }> => {
    const { data } = await apiClient.get('/academic/subjects', { params });
    return data;
  },

  createSubject: async (subjectData: CreateSubjectData): Promise<{ success: boolean; subject: SubjectItem }> => {
    const { data } = await apiClient.post('/academic/subjects', subjectData);
    return data;
  },

  updateSubject: async (id: string, subjectData: Partial<CreateSubjectData>): Promise<{ success: boolean; subject: SubjectItem }> => {
    const { data } = await apiClient.put(`/academic/subjects/${id}`, subjectData);
    return data;
  },

  deleteSubject: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/academic/subjects/${id}`);
    return data;
  },

  assignSubjectTeacher: async (assignmentData: AssignTeacherData): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post('/academic/subjects/assign', assignmentData);
    return data;
  },

  getSections: async (params?: AcademicQueryParams): Promise<{ success: boolean; sections: SectionItem[] }> => {
    const { data } = await apiClient.get('/academic/sections', { params });
    return data;
  },

  createSection: async (sectionData: CreateSectionData): Promise<{ success: boolean; section: SectionItem }> => {
    const { data } = await apiClient.post('/academic/sections', sectionData);
    return data;
  },

  updateSection: async (id: string, sectionData: Partial<CreateSectionData>): Promise<{ success: boolean; section: SectionItem }> => {
    const { data } = await apiClient.put(`/academic/sections/${id}`, sectionData);
    return data;
  },

  deleteSection: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/academic/sections/${id}`);
    return data;
  },

  getDashboardStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/academic/dashboard');
    return data;
  },
  getTimetables: async (params?: AcademicQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/academic/timetables', { params });
    return data;
  },
  createTimetable: async (formData: FormData): Promise<any> => {
    const { data } = await apiClient.post('/academic/timetables', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteTimetable: async (id: string): Promise<any> => {
    const { data } = await apiClient.delete(`/academic/timetables/${id}`);
    return data;
  },
};
