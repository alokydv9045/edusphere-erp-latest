'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { teacherAPI } from '@/lib/api/teacher';
import { academicAPI } from '@/lib/api/academic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Loader2, Eye, ChevronLeft, ChevronRight, XIcon, Users, UserCheck, GraduationCap, Briefcase } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { PremiumSection } from '@/components/dashboard/PremiumSection';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [limit] = useState(25);

  const { isAdmin, isSuperAdmin } = usePermissions();

  const fetchInitialData = useCallback(async () => {
    try {
      const data = await academicAPI.getClasses();
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const params: any = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (selectedClassId && selectedClassId !== 'all') params.classId = selectedClassId;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const data = await teacherAPI.getAll(params);
      setTeachers(data.teachers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalTeachers(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch teachers');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, selectedClassId, statusFilter]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedClassId('all');
    setStatusFilter('all');
    setPage(1);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20';
      case 'INACTIVE': return 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20';
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
        <div className="space-y-3">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="h-2 w-10 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Academic Faculty</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
            Faculty <span className="text-primary">Matrix</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl text-lg">
            High-fidelity control center for institutional educators and academic leadership.
          </p>
        </div>
        
        {(isAdmin || isSuperAdmin) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button asChild className="h-16 px-10 rounded-[2rem] premium-gradient text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30">
              <Link href="/dashboard/hr">
                <Plus className="mr-3 h-5 w-5" /> Onboard Educator
              </Link>
            </Button>
          </motion.div>
        )}
      </div>

      {/* ── SECTION 1: Tactical KPIs ── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Faculty" value={totalTeachers} subtitle="Authorized Educators" icon={<Users className="h-6 w-6" />} index={0} />
        <KpiCard title="Active Status" value={teachers.filter(t => t.status === 'ACTIVE').length} subtitle="Currently Deployed" icon={<UserCheck className="h-6 w-6" />} index={1} />
        <KpiCard title="Departments" value={classes.length} subtitle="Academic Divisions" icon={<GraduationCap className="h-6 w-6" />} index={2} />
        <KpiCard title="Staff Utilization" value="94%" subtitle="Efficiency Index" icon={<Briefcase className="h-6 w-6" />} index={3} />
      </div>

      {/* ── SECTION 2: Dynamic Interrogator (Filters) ── */}
      <PremiumSection title="Dynamic Interrogator" icon={<Search className="h-5 w-5" />}>
        <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="relative group lg:col-span-2">
                  <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-all duration-300" />
                  <Input
                    placeholder="Search by name, employee vector, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-16 pl-14 rounded-2xl bg-white/5 border-none ring-1 ring-primary/10 focus:ring-primary/40 font-bold text-lg transition-all"
                  />
                </div>
                
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="h-16 rounded-2xl bg-white/5 border-none ring-1 ring-primary/10 font-black uppercase text-[10px] tracking-widest">
                    <SelectValue placeholder="Department Filter" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-none rounded-2xl">
                    <SelectItem value="all" className="font-black text-[10px] uppercase">All Departments</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id} className="font-bold text-xs uppercase">{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-16 rounded-2xl bg-white/5 border-none ring-1 ring-primary/10 font-black uppercase text-[10px] tracking-widest">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-none rounded-2xl">
                    <SelectItem value="all" className="font-black text-[10px] uppercase">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE" className="font-bold text-xs uppercase">Deployed (Active)</SelectItem>
                    <SelectItem value="INACTIVE" className="font-bold text-xs uppercase">Off-line (Inactive)</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    REAL-TIME SYNC: <span className="text-primary">{totalTeachers} ENTITIES LOCATED</span>
                  </span>
                </div>
                {(searchQuery || selectedClassId !== 'all' || statusFilter !== 'all') && (
                    <Button variant="ghost" onClick={resetFilters} className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                        <XIcon className="h-4 w-4 mr-2" /> Reset Search Vector
                    </Button>
                )}
            </div>
        </div>
      </PremiumSection>

      {/* ── SECTION 3: Faculty Matrix (Table) ── */}
      <PremiumSection title="Faculty Matrix" icon={<Users className="h-5 w-5" />}>
        <div className="glass-card rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary/30" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Synchronizing Data Streams...</p>
            </div>
          ) : error ? (
            <div className="p-20 text-center space-y-6">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-500/10 text-rose-500">
                <XIcon className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-rose-500 uppercase tracking-tighter italic">Transmission Interrupted</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">{error}</p>
            </div>
          ) : teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
              <div className="h-32 w-32 rounded-[3rem] bg-primary/5 flex items-center justify-center border border-primary/10">
                <Users className="h-14 w-14 text-primary/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Zero Entities Found</h3>
                <p className="text-slate-500 text-sm">The current search parameters yielded no matches in the directory.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-none">
                    <TableHead className="h-20 font-black text-primary uppercase text-[10px] tracking-[0.3em] px-10">Employee Vector</TableHead>
                    <TableHead className="h-20 font-black text-primary uppercase text-[10px] tracking-[0.3em]">Individual</TableHead>
                    <TableHead className="h-20 font-black text-primary uppercase text-[10px] tracking-[0.3em]">Comm Channel</TableHead>
                    <TableHead className="h-20 font-black text-primary uppercase text-[10px] tracking-[0.3em]">Contact Ref</TableHead>
                    <TableHead className="h-20 font-black text-primary uppercase text-[10px] tracking-[0.3em]">Deployment Status</TableHead>
                    <TableHead className="h-20 text-right px-10 font-black text-primary uppercase text-[10px] tracking-[0.3em]">Interface</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {teachers.map((teacher, idx) => (
                      <motion.tr 
                        key={teacher.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.03 }}
                        className="group border-b border-primary/5 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                        onClick={() => router.push(`/dashboard/teachers/${teacher.id}`)}
                      >
                        <TableCell className="px-10 py-8">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-black text-primary tracking-tighter">{teacher.employeeId || 'ID-PENDING'}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Ref</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Avatar className="h-14 w-14 rounded-2xl ring-2 ring-white/10 shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-110">
                                  <AvatarImage src={teacher.user?.profilePicture} className="object-cover" />
                                  <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
                                    {teacher.user?.firstName?.[0]}{teacher.user?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="space-y-1">
                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base group-hover:text-primary transition-colors">
                                    {teacher.user?.firstName} {teacher.user?.lastName}
                                </p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Professional</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">{teacher.user?.email}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold text-slate-500">{teacher.user?.phone || 'NO-REF'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-[9px] font-black uppercase px-4 py-1.5 border-none shadow-md tracking-widest", getStatusStyle(teacher.status))}>
                            {teacher.status || 'ACTIVE'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-10">
                          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-primary hover:text-white hover:rotate-12 transition-all duration-500 shadow-lg hover:shadow-primary/40">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}

          {/* ── Pagination Footer ── */}
          {totalPages > 1 && (
            <div className="p-10 bg-primary/5 flex items-center justify-between border-t border-primary/5">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Temporal Vector</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    PAGE <span className="text-primary">{page}</span> <span className="text-slate-300 mx-2">/</span> {totalPages}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                      className="h-14 px-8 rounded-2xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:translate-x-[-4px] transition-all"
                    >
                      <ChevronLeft className="h-5 w-5 mr-3" /> Previous Node
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || isLoading}
                      className="h-14 px-8 rounded-2xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:translate-x-[4px] transition-all"
                    >
                      Next Node <ChevronRight className="h-5 w-5 ml-3" />
                    </Button>
                </div>
            </div>
          )}
        </div>
      </PremiumSection>
    </div>
  );
}
