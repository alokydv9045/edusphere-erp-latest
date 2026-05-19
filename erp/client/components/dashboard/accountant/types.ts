export interface AccountantStats {
    summary?: {
        todayCollection: number;
        yearCollection: number;
        pendingAmount: number;
        txToday: number;
    };
    todayTransactions?: Array<{
        id: string;
        receipt: string;
        studentName: string;
        class: string;
        amount: number;
        mode: string;
        time: string;
    }>;
    defaulters?: Array<{
        studentId: string;
        name: string;
        class: string;
        pendingAmount: number;
    }>;
    trend?: Array<{ month: string; collected: number }>;
    modeBreakdown?: Array<{ mode: string; amount: number; count: number }>;
    [key: string]: any;
}
