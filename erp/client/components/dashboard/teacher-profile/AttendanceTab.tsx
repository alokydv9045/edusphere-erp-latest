'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, History, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface AttendanceTabProps {
    attendance: any;
    attendanceStats: { total: number; present: number; absent: number; late: number };
    attendanceRate: number;
    getCheckInTime: (date: Date, status: string) => string;
}

export default function AttendanceTab({ attendance, attendanceStats, attendanceRate, getCheckInTime }: AttendanceTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
                <Card className="rounded-3xl border-none shadow-md p-6 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                            <CheckCircle2 size={24} />
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-none shadow-none font-black">+2.4% vs Prev</Badge>
                    </div>
                    <h3 className="text-muted-foreground text-xs uppercase font-bold tracking-widest">Attendance Rate</h3>
                    <div className="text-4xl font-black mt-1">{attendanceRate}%</div>
                    <Progress value={attendanceRate} className="h-2 mt-4 bg-emerald-100" />
                </Card>
                <div className="grid grid-cols-2 gap-4">
                    <Card className="rounded-3xl border-none shadow-sm p-4 text-center">
                        <div className="text-2xl font-black text-emerald-600">{attendanceStats.present}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Present</div>
                    </Card>
                    <Card className="rounded-3xl border-none shadow-sm p-4 text-center">
                        <div className="text-2xl font-black text-amber-600">{attendanceStats.late}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Late</div>
                    </Card>
                    <Card className="rounded-3xl border-none shadow-sm p-4 text-center col-span-2">
                        <div className="text-2xl font-black text-destructive">{attendanceStats.absent}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Absences this month</div>
                    </Card>
                </div>
            </div>

            <Card className="lg:col-span-2 rounded-3xl border-none shadow-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
                    <div>
                        <CardTitle className="text-lg font-bold">Attendance Trends</CardTitle>
                        <CardDescription>Daily present vs late breakdown</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-50">Monthly</Badge>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendance.data?.records?.slice(0, 15).reverse().map((r: any) => ({
                                date: format(new Date(r.date), 'MMM dd'),
                                val: r.status === 'PRESENT' ? 100 : r.status === 'LATE' ? 60 : 0
                            })) || []}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3 rounded-3xl border-none shadow-md overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between bg-muted/10">
                    <h3 className="text-lg font-bold flex items-center gap-2"><History size={18} /> Recent Attendance Logs</h3>
                    <Button variant="ghost" size="sm" className="font-bold text-primary">View Full History</Button>
                </div>
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-black">Date</TableHead>
                            <TableHead className="font-black">Scanner / Mode</TableHead>
                            <TableHead className="font-black">Status</TableHead>
                            <TableHead className="font-black">Check-in</TableHead>
                            <TableHead className="text-right font-black">Remarks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendance.data?.records?.slice(0, 7).map((record: any) => (
                            <TableRow key={record.id} className="group transition-colors h-16">
                                <TableCell className="font-bold">{format(new Date(record.date), 'PPP')}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-slate-50 border-slate-200">
                                        <QrCode size={12} className="mr-1.5" /> {record.scanner?.name || 'Main Gate QR'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge className={`${record.status === 'PRESENT' ? 'bg-emerald-500 hover:bg-emerald-600' : record.status === 'LATE' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-destructive hover:bg-destructive/90'} text-white px-3 py-1 font-black tracking-tight`}>
                                        {record.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs opacity-70">{getCheckInTime(record.date, record.status)}</TableCell>
                                <TableCell className="text-right italic text-muted-foreground text-xs">{record.remarks || '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
