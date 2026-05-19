import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertCircle, Receipt } from 'lucide-react';
import { formatINR } from './utils';

interface KpiCardsProps {
    summary: {
        todayCollection: number;
        yearCollection: number;
        pendingAmount: number;
        txToday: number;
    };
}

export function KpiCards({ summary }: KpiCardsProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Today's Collection */}
            <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
                    <div className="rounded-full bg-green-100 p-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-700">{formatINR(summary.todayCollection)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {summary.txToday} transaction{summary.txToday !== 1 ? 's' : ''} today
                    </p>
                </CardContent>
            </Card>

            {/* Year-to-Date Collection */}
            <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Year-to-Date</CardTitle>
                    <div className="rounded-full bg-indigo-100 p-2">
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatINR(summary.yearCollection)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Current academic year</p>
                </CardContent>
            </Card>

            {/* Pending Amount */}
            <Card className={`border-l-4 border-l-orange-500 ${summary.pendingAmount > 0 ? 'bg-orange-50/30' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                    <div className="rounded-full bg-orange-100 p-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-700">{formatINR(summary.pendingAmount)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Across all students</p>
                </CardContent>
            </Card>

            {/* Tx Count Today */}
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transactions Today</CardTitle>
                    <div className="rounded-full bg-blue-100 p-2">
                        <Receipt className="h-4 w-4 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.txToday}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Fee receipts issued</p>
                </CardContent>
            </Card>
        </div>
    );
}
