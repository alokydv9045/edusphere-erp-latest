import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatFull } from './utils';

interface DefaultersListProps {
    defaulters: Array<{
        studentId: string;
        name: string;
        class: string;
        pendingAmount: number;
    }>;
}

export function DefaultersList({ defaulters }: DefaultersListProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Top Pending Students
                    </CardTitle>
                    <CardDescription>Students with the highest outstanding balances</CardDescription>
                </div>
                <Link href="/dashboard/fees">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        Full List <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {defaulters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-10 w-10 mb-2 text-green-400" />
                        <p className="text-sm font-medium text-green-600">All fees are up to date!</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {defaulters.map((d, i) => (
                            <div key={d.studentId} className="flex items-center gap-4 py-3">
                                <span className="w-5 text-xs text-muted-foreground font-mono">{i + 1}.</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{d.name}</p>
                                    <p className="text-xs text-muted-foreground">{d.class}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-orange-600">{formatFull(d.pendingAmount)}</p>
                                    <p className="text-xs text-muted-foreground">pending</p>
                                </div>
                                <Link href="/dashboard/fees/collect">
                                    <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-2">
                                        Collect
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
