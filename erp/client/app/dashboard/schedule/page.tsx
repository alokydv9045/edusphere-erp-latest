'use client';

import { useEffect, useState } from 'react';
import { timetableAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import TimetableGrid from '@/components/academic/TimetableGrid';

import { PremiumSection } from '@/components/dashboard/PremiumSection';
import { motion } from 'framer-motion';

export default function MySchedulePage() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            setIsLoading(true);
            setError('');
            const res = await timetableAPI.getTeacherSchedule('me'); 
            setSchedule(res.schedule || []);
        } catch (err: any) {
            console.error('Failed to fetch schedule:', err);
            setError('Unable to load schedule. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <div className="h-2 w-8 bg-primary rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Academic Timeline</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                      My <span className="text-primary">Schedule</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                      Real-time chronological orchestration of your teaching sessions.
                    </p>
                </div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center ring-1 ring-primary/20 shadow-xl shadow-primary/5"
                >
                    <Clock className="h-8 w-8 text-primary" />
                </motion.div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compiling Chrono-Matrix...</p>
                </div>
            ) : error ? (
                <PremiumSection title="System Fault" icon={<CalendarIcon className="h-5 w-5 text-rose-500" />}>
                    <div className="glass premium-shadow p-12 rounded-[2rem] text-center border-rose-500/10">
                        <p className="text-rose-500 font-black uppercase tracking-widest italic">{typeof error === "string" ? error : "Telemetry Error"}</p>
                    </div>
                </PremiumSection>
            ) : schedule.length === 0 ? (
                <PremiumSection title="Availability Matrix" icon={<CalendarIcon className="h-5 w-5" />}>
                    <div className="glass premium-shadow p-24 rounded-[3rem] text-center space-y-6">
                        <div className="h-24 w-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <CalendarIcon className="h-12 w-12 text-primary/20" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Zero Assignments</h3>
                        <p className="text-slate-500 max-w-sm mx-auto text-sm">
                            The academic department hasn't synchronized any teaching periods to your current profile context.
                        </p>
                    </div>
                </PremiumSection>
            ) : (
                <PremiumSection title="Weekly Period Distribution" icon={<CalendarIcon className="h-5 w-5" />}>
                    <div className="glass premium-shadow p-8 rounded-[3rem] overflow-hidden border-none ring-1 ring-primary/5">
                        <TimetableGrid schedule={schedule} viewType="teacher" />
                    </div>
                </PremiumSection>
            )}
        </div>
    );
}

