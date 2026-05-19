import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Search, Printer, Users } from 'lucide-react';

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-3">
                    <Link href="/dashboard/fees/collect">
                        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                            <CreditCard className="h-4 w-4" />
                            Collect Fee
                        </Button>
                    </Link>
                    <Link href="/dashboard/students">
                        <Button variant="outline" className="gap-2">
                            <Search className="h-4 w-4" />
                            Search Student
                        </Button>
                    </Link>
                    <Link href="/dashboard/fees">
                        <Button variant="outline" className="gap-2">
                            <Printer className="h-4 w-4" />
                            Reprint Receipt
                        </Button>
                    </Link>
                    <Link href="/dashboard/fees">
                        <Button variant="outline" className="gap-2">
                            <Users className="h-4 w-4" />
                            Pending Fees List
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
