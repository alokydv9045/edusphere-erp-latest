import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { formatFull, CHART_COLORS } from './utils';

interface CollectionTrendProps {
    trend: Array<{ month: string; collected: number }>;
}

export function CollectionTrend({ trend }: CollectionTrendProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Collection Trend
                </CardTitle>
                <CardDescription>Last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
                {trend.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                        No data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis
                                tick={{ fontSize: 10 }}
                                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatFull(value), 'Collected']}
                                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            />
                            <Bar dataKey="collected" radius={[4, 4, 0, 0]}>
                                {trend.map((_, i) => (
                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
