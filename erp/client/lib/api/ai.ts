import apiClient from './client';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
}

export interface InitResponse {
  success: boolean;
  greeting: string;
  user: {
    firstName: string;
    role: string;
  };
}

export interface GenerateAssignmentParams {
  topic: string;
  classId?: string;
  className?: string;
  subject?: string;
  referenceText?: string;
  complexity?: string;
  questionTypes?: string[] | Record<string, string | number>;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string;
  questionCount?: number;
  includeSolutions?: boolean;
  language?: string;
  format?: string;
}

export interface GeneratedAssignmentResponse {
  success: boolean;
  data?: Record<string, unknown>;
  assignment?: {
    title: string;
    questions: Array<{
      questionNumber: number;
      questionText: string;
      options?: string[];
      correctAnswer?: string;
      marks: number;
    }>;
  };
  error?: string;
  message?: string;
}

export const aiAPI = {
  initChat: async (): Promise<InitResponse> => {
    const { data } = await apiClient.post('/ai/init');
    return data;
  },

  sendMessage: async (message: string, history: { role: string; content: string }[]): Promise<ChatResponse> => {
    const { data } = await apiClient.post('/ai/chat', { message, history });
    return data;
  },

  generateSmartAssignment: async (params: GenerateAssignmentParams): Promise<GeneratedAssignmentResponse> => {
    const { data } = await apiClient.post('/ai/generate-smart-assignment', params);
    return data;
  },
};
