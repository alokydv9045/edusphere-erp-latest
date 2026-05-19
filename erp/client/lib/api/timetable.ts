import client from './client';

export interface TimetableConfigData {
  id?: string;
  daysPerWeek?: number;
  periodsPerDay?: number;
  slotDurationMinutes?: number;
  startTime?: string;
  breakDetails?: Array<{ afterPeriod: number; durationMinutes: number; name: string }>;
  academicYearId?: string;
  [key: string]: any;
}

export interface UpdateSlotData {
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  isRecurrent?: boolean;
}

export interface RoomData {
  id?: string;
  name: string;
  capacity: number;
  building?: string;
  floor?: string;
  roomNumber?: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  subject?: { name: string; code?: string };
  teacher?: { firstName: string; lastName: string };
  room?: { name: string; roomNumber?: string };
}

export interface TimetableScheduleResponse {
  success: boolean;
  slots?: TimetableSlot[];
  schedule?: TimetableSlot[];
  config?: TimetableConfigData;
}

export interface RoomListResponse {
  success: boolean;
  rooms: RoomData[];
}

export interface GenericTimetableResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  config?: T;
  slot?: TimetableSlot;
}

export const timetableAPI = {
  getConfig: async (classId: string): Promise<GenericTimetableResponse<TimetableConfigData>> => {
    const { data } = await client.get(`/timetables/config?classId=${classId}`);
    return data;
  },
  updateConfig: async (classId: string, configData: TimetableConfigData): Promise<GenericTimetableResponse<TimetableConfigData>> => {
    const { data } = await client.put(`/timetables/config/${classId}`, configData);
    return data;
  },
  generateBaseline: async (timetableId: string | null, configId: string, classId?: string): Promise<TimetableScheduleResponse> => {
    const { data } = await client.post(`/timetables/generate-baseline${timetableId ? `/${timetableId}` : ''}`, { configId, classId });
    return data;
  },
  updateSlot: async (slotId: string, data: UpdateSlotData): Promise<GenericTimetableResponse<TimetableSlot>> => {
    const { data: resData } = await client.patch(`/timetables/slots/${slotId}`, data);
    return resData;
  },
  getTeacherSchedule: async (teacherId: string): Promise<TimetableScheduleResponse> => {
    const { data } = await client.get(`/timetables/teacher/${teacherId}`);
    return data;
  },
  getStudentSchedule: async (sectionId: string): Promise<TimetableScheduleResponse> => {
    const { data } = await client.get(`/timetables/student/${sectionId}`);
    return data;
  },
  getRooms: async (): Promise<RoomListResponse> => {
    const { data } = await client.get('/timetables/rooms');
    return data;
  },
  createRoom: async (roomData: RoomData): Promise<GenericTimetableResponse<RoomData>> => {
    const { data } = await client.post('/timetables/rooms', roomData);
    return data;
  },
};
