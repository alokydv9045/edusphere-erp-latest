'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { studentAPI, documentAPI, timetableAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, User, BookOpen, Loader2, FileText, Download, File, Bus, MapPin, Clock, Navigation, Activity, AlertCircle, IndianRupee } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import TimetableGrid from '@/components/academic/TimetableGrid';
import UserQRCode from '@/components/qr/UserQRCode';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

import { PremiumSection } from '@/components/dashboard/PremiumSection';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const { canManageStudents } = usePermissions();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (id) {
      fetchStudent(id as string);
    }
  }, [id]);

  const fetchStudent = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await studentAPI.getById(id);
      setStudent(data.student);
      fetchDocuments(id);
      if (data.student.sectionId) {
        fetchTimetable(data.student.sectionId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch student details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async (studentId: string) => {
    try {
      setIsLoadingDocs(true);
      const res = await documentAPI.getAll(studentId);
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchTimetable = async (sectionId: string) => {
    try {
      setIsLoadingTimetable(true);
      const res = await timetableAPI.getStudentSchedule(sectionId);
      setTimetable(res.schedule || []);
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
    } finally {
      setIsLoadingTimetable(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Identity Matrix...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Base
        </Button>
        <div className="glass premium-shadow p-12 rounded-[2rem] text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <p className="text-rose-500 font-black uppercase tracking-widest">Integrity Violation</p>
            <p className="text-slate-400 text-sm mt-2">{error || 'Target Identity Not Found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest hover:bg-primary/5">
          <ArrowLeft className="mr-2 h-4 w-4 text-primary" /> Back to Matrix
        </Button>
        {canManageStudents && (
          <Button asChild className="h-12 px-6 rounded-xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            <Link href={`/dashboard/users/${student.userId}/edit`}>
              Modify Profile Context
            </Link>
          </Button>
        )}
      </div>

      {/* Profile Identity Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[3rem] glass premium-shadow p-8 md:p-12 border-none ring-1 ring-primary/10"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <User size={200} />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-10">
            <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/40 transition-all" />
                <Avatar className="h-32 w-32 md:h-48 md:w-48 rounded-[3rem] ring-4 ring-background shadow-2xl relative z-10 border-none">
                  <AvatarImage src={student.user.avatar || undefined} className="object-cover" />
                  <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">
                    {student.user.firstName?.[0]}{student.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-4 -right-4 z-20">
                    <UserQRCode 
                        userId={student.userId}
                        userName={`${student.user.firstName} ${student.user.lastName}`}
                        userRole="STUDENT"
                        size={80}
                        className="rounded-2xl border-4 border-background shadow-xl"
                        isAdmin={currentUser?.roles?.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r)) ?? ['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role ?? '')}
                    />
                </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-6">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            {student.user.firstName} <span className="text-primary">{student.user.lastName}</span>
                        </h1>
                        <Badge className={cn("text-[10px] font-black uppercase px-4 py-1 border-none shadow-sm", 
                            student.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20 text-slate-500'
                        )}>
                            {student.status}
                        </Badge>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                        IDENTIFIER: <span className="text-primary">{student.admissionNumber}</span> // ACAD-REF: {student.rollNumber || 'UNSET'}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Mail, label: 'Communications', value: student.user.email },
                        { icon: Phone, label: 'Access Line', value: student.user.phone || 'DISCONNECTED' },
                        { icon: Calendar, label: 'Origin Date', value: student.user.dateOfBirth ? new Date(student.user.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
                        { icon: BookOpen, label: 'Current Tier', value: `${student.currentClass?.name || 'G-UNIT'} / ${student.section?.name || 'CORE'}` }
                    ].map((item, i) => (
                        <div key={i} className="glass p-4 rounded-2xl ring-1 ring-primary/5 flex items-center gap-4 group hover:bg-primary/5 transition-all">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                <item.icon size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{item.label}</p>
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </motion.div>

      {/* Tabs Matrix */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="bg-primary/5 p-1.5 h-auto rounded-2xl flex flex-wrap gap-1 border-none ring-1 ring-primary/10 mb-8">
          {[
            { value: 'details', label: 'Primary Context' },
            { value: 'academic', label: 'Academic Flow' },
            { value: 'attendance', label: 'Presence Log' },
            { value: 'fees', label: 'Treasury' },
            { value: 'timetable', label: 'Timeline' },
            { value: 'transport', label: 'Logistics' },
            { value: 'documents', label: 'Artifacts' }
          ].map(tab => (
            <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
            >
                {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-6"
            >
                <TabsContent value="details">
                  <div className="grid gap-8 md:grid-cols-2">
                    <PremiumSection title="Context Metadata" icon={<User className="h-5 w-5" />}>
                        <div className="glass premium-shadow p-8 rounded-[2rem] grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gender Identity</p>
                                <p className="text-sm font-bold uppercase">{student.user.gender || 'Not Specified'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vital Signature (Blood)</p>
                                <p className="text-sm font-bold text-rose-500 uppercase">{student.user.bloodGroup || 'UNKNOWN'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registry Sequence</p>
                                <p className="text-sm font-bold uppercase">ROLL: {student.rollNumber || 'NA-00'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Validation Status</p>
                                <p className="text-sm font-bold text-emerald-500 uppercase">SYNCHRONIZED</p>
                            </div>
                        </div>
                    </PremiumSection>
                    
                    <PremiumSection title="Location Vector" icon={<MapPin className="h-5 w-5" />}>
                        <div className="glass premium-shadow p-8 rounded-[2rem] flex items-center justify-center py-16">
                            <div className="text-center space-y-3">
                                <MapPin className="h-10 w-10 text-primary/20 mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 max-w-[180px]">
                                    Spatial data restricted to authorized security protocols.
                                </p>
                            </div>
                        </div>
                    </PremiumSection>
                  </div>
                </TabsContent>

                <TabsContent value="academic">
                  <PremiumSection title="Performance Matrix" icon={<BookOpen className="h-5 w-5" />}>
                    <div className="glass premium-shadow p-12 rounded-[2rem] text-center space-y-4">
                        <Activity className="h-12 w-12 text-primary/20 mx-auto" />
                        <p className="text-sm font-medium text-slate-500 italic">Academic telemetry is being aggregated for the current semester.</p>
                    </div>
                  </PremiumSection>
                </TabsContent>

                <TabsContent value="attendance">
                  <PremiumSection title="Physical Presence Log" icon={<Calendar className="h-5 w-5" />}>
                    <div className="glass premium-shadow p-10 rounded-[2rem] flex flex-col md:flex-row gap-10">
                        <div className="flex-1 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-tighter italic">Scanner Auth Token</h3>
                                <p className="text-sm text-slate-500">Use this token for biometric synchronization and entry logs.</p>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'Unique permanent identity signature',
                                    'Multi-scanner compatibility active',
                                    'Admin-level token regeneration possible',
                                    'Real-time geolocation validation'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="glass p-6 rounded-[2rem] bg-white ring-1 ring-primary/10 shadow-xl">
                            <UserQRCode
                              userId={student.userId}
                              userName={`${student.user.firstName} ${student.user.lastName}`}
                              userRole="STUDENT"
                              size={200}
                              isAdmin={currentUser?.roles?.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r)) ?? ['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role ?? '')}
                            />
                        </div>
                    </div>
                  </PremiumSection>
                </TabsContent>

                <TabsContent value="fees">
                   <PremiumSection title="Treasury Statement" icon={<IndianRupee className="h-5 w-5" />}>
                        <div className="glass premium-shadow p-12 rounded-[2rem] text-center space-y-4">
                            <Loader2 className="h-10 w-10 text-primary/20 animate-spin mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compiling Ledger Data...</p>
                        </div>
                    </PremiumSection>
                </TabsContent>

                <TabsContent value="timetable">
                  <PremiumSection title="Chronological Flow" icon={<Clock className="h-5 w-5" />}>
                    <div className="glass premium-shadow p-8 rounded-[2rem]">
                      {isLoadingTimetable ? (
                        <div className="flex justify-center py-24">
                          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                        </div>
                      ) : (
                        <TimetableGrid schedule={timetable} viewType="student" />
                      )}
                    </div>
                  </PremiumSection>
                </TabsContent>

                <TabsContent value="transport">
                  <PremiumSection title="Logistics Interface" icon={<Bus className="h-5 w-5" />}>
                    {student.transportAllocation ? (
                        <div className="space-y-8">
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="glass p-8 rounded-[2.5rem] ring-1 ring-emerald-500/10 hover:bg-emerald-500/5 transition-all group">
                                <div className="flex items-center gap-4 mb-6">
                                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <Navigation size={20} />
                                  </div>
                                  <p className="font-black uppercase text-[10px] tracking-widest text-emerald-500">Route Stream</p>
                                </div>
                                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{student.transportAllocation.route.name}</p>
                                <p className="text-xs font-bold text-slate-500 mt-3">{student.transportAllocation.route.startLocation} ➔ {student.transportAllocation.route.endLocation}</p>
                            </div>

                            <div className="glass p-8 rounded-[2.5rem] ring-1 ring-blue-500/10 hover:bg-blue-500/5 transition-all group">
                                <div className="flex items-center gap-4 mb-6">
                                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    <MapPin size={20} />
                                  </div>
                                  <p className="font-black uppercase text-[10px] tracking-widest text-blue-500">Boarding Logic</p>
                                </div>
                                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{student.transportAllocation.stop.name}</p>
                                <Badge className="mt-4 bg-blue-500 text-white border-none font-black text-[9px] px-4 py-1.5 rounded-full">
                                    EST ARRIVAL: {student.transportAllocation.stop.arrivalTime}
                                </Badge>
                            </div>

                            <div className="glass p-8 rounded-[2.5rem] ring-1 ring-orange-500/10 hover:bg-orange-500/5 transition-all group">
                                <div className="flex items-center gap-4 mb-6">
                                  <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    <User size={20} />
                                  </div>
                                  <p className="font-black uppercase text-[10px] tracking-widest text-orange-500">Operator Hub</p>
                                </div>
                                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none truncate">
                                  {student.transportAllocation.route.vehicle?.driver?.user?.firstName || 'Assigned Driver'}
                                </p>
                                <p className="text-xs font-bold text-slate-500 mt-3 flex items-center gap-2">
                                  <IndianRupee size={12} /> VEHICLE: {student.transportAllocation.route.vehicle?.registrationNumber || 'NA'}
                                </p>
                            </div>
                          </div>

                          <div className="p-6 md:p-8 rounded-[2.5rem] bg-slate-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-[400px] h-[200px] bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all" />
                            <div className="relative flex items-center gap-6">
                              <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center animate-pulse border border-white/10">
                                <Activity className="h-8 w-8 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-black text-white uppercase tracking-widest text-xs">Uplink Status: Active</p>
                                <p className="text-slate-400 text-sm">Synchronize with live logistics telemetry for real-time tracking.</p>
                              </div>
                            </div>
                            <Button asChild className="h-14 px-10 rounded-2xl premium-gradient text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 transition-all relative z-10 w-full md:w-auto">
                              <Link href="/dashboard/transport/track">
                                INITIATE TRACKING <ArrowLeft className="ml-3 h-4 w-4 rotate-180" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                    ) : (
                        <div className="text-center py-24 glass rounded-[3rem] border-dashed ring-2 ring-primary/10">
                          <Bus className="h-16 w-16 text-primary/10 mx-auto mb-6" />
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Logistics Offline</h3>
                          <p className="text-slate-500 text-sm max-w-xs mx-auto mt-3">
                            Target individual is not currently mapped to the institutional transport network.
                          </p>
                          <Button variant="outline" asChild className="mt-8 h-12 rounded-xl glass border-none ring-1 ring-primary/20 font-black text-[10px] uppercase tracking-widest hover:bg-primary/5">
                            <Link href="/dashboard/transport/allocations">Allocate Vector</Link>
                          </Button>
                        </div>
                    )}
                  </PremiumSection>
                </TabsContent>

                <TabsContent value="documents">
                  <PremiumSection title="Artifact Archive" icon={<FileText className="h-5 w-5" />}>
                    <div className="glass premium-shadow p-8 rounded-[2rem]">
                      {isLoadingDocs ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                        </div>
                      ) : documents.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-black uppercase text-[10px] tracking-widest italic opacity-50">
                          No Artifacts Synchronized
                        </div>
                      ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-5 rounded-[2rem] glass ring-1 ring-primary/5 group hover:bg-primary/5 transition-all">
                              <div className="flex items-center gap-4 overflow-hidden">
                                <div className="p-3 bg-white text-primary rounded-2xl shadow-sm ring-1 ring-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                                  <File size={20} />
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">{doc.documentType}</p>
                                  <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">{doc.documentName}</p>
                                </div>
                              </div>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-10 w-10 flex items-center justify-center hover:bg-primary/10 rounded-xl text-primary transition-all shrink-0"
                              >
                                <Download size={18} />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </PremiumSection>
                </TabsContent>
            </motion.div>
        </AnimatePresence>
        </Tabs>
      </div>
  );
}
