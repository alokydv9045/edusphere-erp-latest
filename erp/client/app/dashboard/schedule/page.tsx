'use client';

import { useEffect, useState } from 'react';
import { teacherAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MySchedulePage() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            setIsLoading(true);
            setError('');
            const data = await teacherAPI.getMySchedule();
            setSchedule(data.schedule || []);
        } catch (err: any) {
            console.error('Failed to fetch schedule:', err);
            setError('Unable to load schedule. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const getSlotsForDay = (dayIndex: number) => {
        // dayOfWeek in DB: 1=Monday, ... 6=Saturday
        return schedule.filter(slot => slot.dayOfWeek === dayIndex + 1);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
                <p className="text-muted-foreground">View your weekly class timetable and assignments.</p>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                    {error}
                </div>
            ) : schedule.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">No Classes Assigned</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-1">
                            You don't have any classes assigned to your timetable yet. Please contact the administrator.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {daysOfWeek.map((day, index) => {
                        const daySlots = getSlotsForDay(index);
                        if (daySlots.length === 0) return null;

                        return (
                            <Card key={day} className="flex flex-col">
                                <CardHeader className="pb-3 border-b bg-slate-50/50">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                        {day}
                                    </CardTitle>
                                    <CardDescription>{daySlots.length} classes scheduled</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 p-0">
                                    <div className="divide-y">
                                        {daySlots.map((slot) => (
                                            <div key={slot.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                        Period {slot.period}
                                                    </Badge>
                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        {slot.startTime} - {slot.endTime}
                                                    </div>
                                                </div>
                                                <h4 className="font-semibold text-sm mb-1">{slot.subject?.name}</h4>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>Class {slot.section?.class?.name} - {slot.section?.name}</span>
                                                    {slot.room && (
                                                        <span className="flex items-center">
                                                            <MapPin className="mr-1 h-3 w-3" />
                                                            Room {slot.room}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
