'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Briefcase, Clock, Banknote, TrendingUp, User
} from 'lucide-react';
import { format } from 'date-fns';

interface OverviewTabProps {
    user: any;
    staffData: any;
    attendanceRate: number;
}

export default function OverviewTab({ user, staffData, attendanceRate }: OverviewTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Academic & Professional Info */}
            <Card className="lg:col-span-2 rounded-3xl overflow-hidden border-none shadow-md">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
                            <Briefcase size={20} />
                        </div>
                        Professional Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-1 bg-muted/20 p-4 rounded-2xl border border-dashed hover:border-primary/50 transition-colors">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Highest Qualification</p>
                                <p className="text-lg font-black text-primary">{staffData?.qualification || 'Not Specified'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Expertise Areas</p>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {(staffData?.subjects || ['General Education']).map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-primary hover:text-white transition-all cursor-default">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-dashed">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Briefcase size={14} /> Employment ID</span>
                                <span className="font-mono font-bold">{staffData?.employeeId || 'EDU-TEMP'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-dashed">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock size={14} /> Employment Type</span>
                                <span className="font-bold">{staffData?.employmentType || 'Permanent'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-dashed">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Banknote size={14} /> Salary Grade</span>
                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">{staffData?.salaryGrade || 'PROBATION'}</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Snippet */}
            <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 opacity-90">
                        <TrendingUp size={18} /> Month Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-4xl font-black">{attendanceRate}%</div>
                    <p className="text-sm opacity-80 leading-relaxed font-medium">
                        {attendanceRate > 90 
                            ? `You are in the top 5% of faculty attendance for ${format(new Date(), 'MMMM yyyy')}. Keep it up!` 
                            : `Maintenance of attendance is key to academic success. Current month: ${format(new Date(), 'MMMM')}.`}
                    </p>
                    
                    <div className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold opacity-70 uppercase tracking-tighter">
                                <span>Target Punctuality</span>
                                <span>98/100</span>
                            </div>
                            <Progress value={98} className="h-2 bg-white/20" color="#fff" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold opacity-70 uppercase tracking-tighter">
                                <span>Syllabus Progress</span>
                                <span>{staffData?.syllabusProgress || '0'}%</span>
                            </div>
                            <Progress value={staffData?.syllabusProgress || 0} className="h-2 bg-white/20" color="#fff" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Cards */}
            <Card className="rounded-3xl shadow-md border-none lg:col-span-3">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500 text-white shadow-md shadow-orange-500/20">
                            <User size={20} />
                        </div>
                        Personal Registry
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Blood Group</p>
                            <p className="text-lg font-black text-destructive">{user.bloodGroup || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Date of Birth</p>
                            <p className="text-lg font-bold">{user.dateOfBirth ? format(new Date(user.dateOfBirth), 'PPP') : 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Gender</p>
                            <p className="text-lg font-bold capitalize">{user.gender || 'Not Specified'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Nationality</p>
                            <p className="text-lg font-bold">{user.nationality || 'Not specified'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
