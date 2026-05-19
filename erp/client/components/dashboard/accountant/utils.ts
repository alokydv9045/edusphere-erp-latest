export function formatINR(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
}

export function formatFull(amount: number): string {
    const locale = process.env.NEXT_PUBLIC_LOCALE || 'en-IN';
    return `₹${amount.toLocaleString(locale)}`;
}

export function formatTime(iso: string): string {
    const locale = process.env.NEXT_PUBLIC_LOCALE || 'en-IN';
    return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export const MODE_COLORS: Record<string, string> = {
    CASH: 'bg-green-100 text-green-700',
    UPI: 'bg-purple-100 text-purple-700',
    CHEQUE: 'bg-blue-100 text-blue-700',
    BANK_TRANSFER: 'bg-orange-100 text-orange-700',
    ONLINE: 'bg-cyan-100 text-cyan-700',
};

export const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];
