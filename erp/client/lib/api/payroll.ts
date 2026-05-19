import apiClient from './client';

export interface SalaryComponent {
  name: string;
  amount: number;
  type: 'EARNING' | 'DEDUCTION';
}

export interface SetSalaryStructurePayload {
  employeeId: string;
  basicSalary: number;
  baseSalary?: number;
  allowances?: number;
  deductions?: number;
  effectiveFrom?: string;
  components?: SalaryComponent[];
}

export interface UpdateDaysPayload {
  workingDays: number;
  presentDays: number;
  paidLeaves: number;
  lossOfPayDays: number;
  remarks?: string;
}

export const payrollAPI = {
  getSalaryStructures: async (): Promise<any> => {
    const { data } = await apiClient.get('/payroll/salary-structures');
    return data;
  },
  setSalaryStructure: async (payload: SetSalaryStructurePayload): Promise<any> => {
    const { data } = await apiClient.post('/payroll/salary-structures', payload);
    return data;
  },
  getPayrollList: async (month: number, year: number): Promise<any> => {
    const { data } = await apiClient.get(`/payroll/${month}/${year}`);
    return data;
  },
  generatePayroll: async (month: number, year: number): Promise<any> => {
    const { data } = await apiClient.post(`/payroll/generate/${month}/${year}`);
    return data;
  },
  markPaid: async (id: string, remarks?: string): Promise<any> => {
    const { data } = await apiClient.patch(`/payroll/${id}/pay`, { remarks });
    return data;
  },
  updateDays: async (id: string, payload: UpdateDaysPayload): Promise<any> => {
    const { data } = await apiClient.patch(`/payroll/${id}/days`, payload);
    return data;
  },
  getEmployeePayroll: async (): Promise<any> => {
    const { data } = await apiClient.get('/payroll/my');
    return data;
  },
};
