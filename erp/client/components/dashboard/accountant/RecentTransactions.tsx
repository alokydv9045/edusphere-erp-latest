import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Receipt, Clock } from 'lucide-react';
import { formatFull, formatTime, MODE_COLORS } from './utils';

interface RecentTransactionsProps {
    txList: Array<{
        id: string;
        receipt: string;
        studentName: string;
        class: string;
        amount: number;
        mode: string;
        time: string;
    }>;
}

export function RecentTransactions({ txList }: RecentTransactionsProps) {
    return (
        <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Today's Transactions
                    </CardTitle>
                    <CardDescription>All fee receipts issued today</CardDescription>
                </div>
                <Link href="/dashboard/fees">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        View All <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {txList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <Receipt className="h-10 w-10 mb-2 opacity-30" />
                        <p className="text-sm">No transactions yet today</p>
                        <Link href="/dashboard/fees/collect" className="mt-3">
                            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">Collect First Fee</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-0 divide-y">
                        {txList.slice(0, 8).map((tx) => (
                            <div key={tx.id} className="flex items-center gap-3 py-2.5">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{tx.studentName}</p>
                                    <p className="text-xs text-muted-foreground">{tx.class} · #{tx.receipt}</p>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={`shrink-0 text-xs ${MODE_COLORS[tx.mode] ?? 'bg-gray-100 text-gray-700'}`}
                                >
                                    {tx.mode}
                                </Badge>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-green-700">{formatFull(tx.amount)}</p>
                                    <p className="flex items-center gap-0.5 text-xs text-muted-foreground justify-end">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(tx.time)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
