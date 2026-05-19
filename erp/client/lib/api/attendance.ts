import apiClient from './client';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED';
export type AttendeeType = 'STUDENT' | 'TEACHER' | 'STAFF';

export interface AttendanceRecord {
  id: string;
  studentId?: string;
  teacherId?: string;
  staffId?: string;
  status: AttendanceStatus;
  date: string;
  remarks?: string;
}

export interface MarkAttendanceData {
  studentId?: string;
  teacherId?: string;
  staffId?: string;
  status: AttendanceStatus;
  date: string;
  attendeeType: AttendeeType;
  remarks?: string;
}

export interface BulkAttendanceData {
  records: MarkAttendanceData[];
  date: string;
  attendeeType: AttendeeType;
}

export interface QRPayload {
  qrCode?: string;
  qrPayload?: string;
  scannerId?: string;
  deviceId?: string;
  timestamp?: string;
  scanLat?: number | null;
  scanLng?: number | null;
  action?: string | null;
  [key: string]: any;
}

export interface AttendanceParams {
  date?: string;
  classId?: string;
  sectionId?: string;
  attendeeType?: AttendeeType;
}

export interface ClassReportParams {
  startDate: string;
  endDate: string;
  classId?: string;
  sectionId?: string;
}

export interface CreateSlotData {
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  teacherId?: string;
  startTime?: string;
  endTime?: string;
  date: string;
  attendeeType?: string;
}

export interface SubmitSlotRecord {
  entityId: string;
  studentId?: string;
  status: AttendanceStatus | string;
  remarks?: string;
}

export interface StaffBatchAttendance {
  date: string;
  attendanceData: Array<{ id?: string; userId?: string; status: AttendanceStatus | string; remarks?: string }>;
  attendeeType: 'TEACHER' | 'STAFF' | string;
}

export interface AttendanceAnalyticsParams {
  classId?: string;
  sectionId?: string;
  startDate?: string;
  endDate?: string;
  attendeeType?: string;
}

export interface GenericAttendanceResponse {
  success: boolean;
  message?: string;
  record?: AttendanceRecord;
  records?: AttendanceRecord[];
  attendance?: any[];
  isMarked?: boolean;
  stats?: any;
  action?: string;
  user?: any;
  [key: string]: any;
}

export const attendanceAPI = {
  mark: async (attendanceData: MarkAttendanceData): Promise<GenericAttendanceResponse> => {
    const { data } = await apiClient.post('/attendance/mark', attendanceData);
    return data;
  },

  rfidScan: async (cardNumber: string, deviceId: string): Promise<GenericAttendanceResponse> => {
    const { data } = await apiClient.post('/attendance/rfid-scan', { cardNumber, deviceId });
    return data;
  },

  bulkMark: async (bulkData: BulkAttendanceData): Promise<GenericAttendanceResponse> => {
    const { data } = await apiClient.post('/attendance/bulk', bulkData);
    return data;
  },

  qrScan: async (payload: QRPayload): Promise<GenericAttendanceResponse> => {
    const { data } = await apiClient.post('/attendance/qr-scan', payload);
    return data;
  },

  getRecords: async (params?: AttendanceParams): Promise<GenericAttendanceResponse> => {
    const { data } = await apiClient.get('/attendance/date', { params });
    return data;
  },

  getClassReport: async (params: ClassReportParams): Promise<any> => {
    const { data } = await apiClient.get('/attendance/report', { params });
    return data;
  },

  createSlot: async (slotData: CreateSlotData): Promise<any> => {
    const { data } = await apiClient.post('/attendance/slots', slotData);
    return data;
  },

  getSlots: async (params?: Record<string, string | number>): Promise<any> => {
    const { data } = await apiClient.get('/attendance/slots', { params });
    return data;
  },

  getSlot: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/attendance/slots/${id}`);
    return data;
  },

  deleteSlot: async (id: string): Promise<any> => {
    const { data } = await apiClient.delete(`/attendance/slots/${id}`);
    return data;
  },

  submitSlotAttendance: async (id: string, attendanceData: SubmitSlotRecord[]): Promise<any> => {
    const { data } = await apiClient.post(`/attendance/slots/${id}/submit`, { attendanceData });
    return data;
  },

  submitStaffAttendance: async (attendanceData: StaffBatchAttendance): Promise<any> => {
    const { data } = await apiClient.post('/attendance/staff-batch', attendanceData);
    return data;
  },

  getAnalytics: async (params?: AttendanceAnalyticsParams): Promise<any> => {
    const { data } = await apiClient.get('/attendance/analytics', { params });
    return data;
  },

  getMyAttendance: async (params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const { data } = await apiClient.get('/attendance/my', { params });
    return data;
  },
};
