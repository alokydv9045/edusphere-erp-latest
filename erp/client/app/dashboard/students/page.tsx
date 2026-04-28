'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { studentAPI, Student } from '@/lib/api/student';
import { academicAPI } from '@/lib/api/academic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Loader2, Eye, ChevronLeft, ChevronRight, XIcon } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

import { PremiumSection } from '@/components/dashboard/PremiumSection';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [limit] = useState(25);

  const { canRegisterStudents, isTeacher } = usePermissions();

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { setPage(1); }, [selectedClassId, selectedSectionId, searchQuery]);
  useEffect(() => { fetchStudents(); }, [page, selectedClassId, selectedSectionId, searchQuery]);

  useEffect(() => {
    if (selectedClassId && selectedClassId !== 'all') {
      fetchSections(selectedClassId);
    } else {
      setSections([]);
      setSelectedSectionId('all');
    }
  }, [selectedClassId]);

  const fetchInitialData = async () => {
    try {
      const classesData = await academicAPI.getClasses();
      setClasses(classesData.classes || []);
    } catch (err) { console.error('Failed to fetch initial data', err); }
  };

  const fetchSections = async (classId: string) => {
    try {
      const data = await academicAPI.getSections({ classId });
      setSections(data.sections || []);
    } catch (err) { console.error('Failed to fetch sections', err); }
  };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params: any = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (selectedClassId && selectedClassId !== 'all') params.classId = selectedClassId;
      if (selectedSectionId && selectedSectionId !== 'all') params.sectionId = selectedSectionId;
      const data = await studentAPI.getAll(params);
      if (data && data.students) {
        setStudents(data.students);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalStudents(data.pagination?.total || 0);
      } else {
        setStudents([]);
        setTotalPages(1);
        setTotalStudents(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedClassId('all');
    setSelectedSectionId('all');
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20',
      INACTIVE: 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20',
      GRADUATED: 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20',
      TRANSFERRED: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20',
    };
    return variants[status] || 'bg-slate-500/10 text-slate-500';
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="space-y-2">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
            >
                <div className="h-2 w-8 bg-primary rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Registry</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              Student <span className="text-primary">Directory</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Omni-channel management of the institutional academic population.
            </p>
        </div>
        
        {canRegisterStudents && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Button asChild className="h-14 px-8 rounded-2xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              <Link href="/dashboard/students/register">
                <Plus className="mr-3 h-4 w-4" /> Register New Entry
              </Link>
            </Button>
          </motion.div>
        )}
      </div>

      <PremiumSection title="Dynamic Filters" icon={<Search className="h-5 w-5" />}>
        <div className="glass premium-shadow p-8 rounded-[2rem] space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="relative group lg:col-span-2">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search by name, identity, or admission ref..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 rounded-2xl glass border-none ring-1 ring-primary/10 focus:ring-primary/40 font-bold transition-all"
                  />
                </div>
                
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="h-14 rounded-2xl glass border-none ring-1 ring-primary/10 font-black uppercase text-[10px] tracking-widest">
                    <SelectValue placeholder="Class Filter" />
                  </SelectTrigger>
                  <SelectContent className="glass border-none ring-1 ring-primary/10 rounded-2xl">
                    <SelectItem value="all" className="font-black text-[10px] uppercase">All Grades</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id} className="font-bold text-xs uppercase">{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={selectedClassId === 'all'}>
                  <SelectTrigger className="h-14 rounded-2xl glass border-none ring-1 ring-primary/10 font-black uppercase text-[10px] tracking-widest">
                    <SelectValue placeholder="Section Filter" />
                  </SelectTrigger>
                  <SelectContent className="glass border-none ring-1 ring-primary/10 rounded-2xl">
                    <SelectItem value="all" className="font-black text-[10px] uppercase">All Segments</SelectItem>
                    {sections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id} className="font-bold text-xs uppercase">{sec.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    STATUS: <span className="text-primary">{totalStudents} RECORDS SYNCHRONIZED</span>
                </div>
                {(searchQuery || selectedClassId !== 'all' || selectedSectionId !== 'all') && (
                    <Button variant="ghost" onClick={resetFilters} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-xl">
                        <XIcon className="h-3 w-3 mr-2" /> Reset Protocol
                    </Button>
                )}
            </div>
        </div>
      </PremiumSection>

      <PremiumSection title="Registry Matrix" icon={<Users className="h-5 w-5" />}>
        <div className="glass premium-shadow rounded-[2rem] overflow-hidden border-none ring-1 ring-primary/5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decrypting Records...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="inline-block p-4 rounded-3xl bg-rose-500/10 text-rose-500 mb-4">
                <AlertCircle className="h-10 w-10" />
              </div>
              <p className="text-rose-500 font-black uppercase tracking-tighter italic text-xl">Uplink Error</p>
              <p className="text-slate-400 text-sm mt-2">{typeof error === "string" ? error : "Core Connection Refused"}</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-24 w-24 rounded-[2rem] bg-primary/5 flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-primary/20" />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Void Detected</p>
              <p className="text-sm text-slate-500 mt-2">No transmissions match the current search vector.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="h-16 font-black text-primary uppercase text-[10px] tracking-[0.2em] px-8">ID Vector</TableHead>
                    <TableHead className="h-16 font-black text-primary uppercase text-[10px] tracking-[0.2em]">Individual</TableHead>
                    <TableHead className="h-16 font-black text-primary uppercase text-[10px] tracking-[0.2em]">Academic Tier</TableHead>
                    <TableHead className="h-16 font-black text-primary uppercase text-[10px] tracking-[0.2em]">Comms Channel</TableHead>
                    <TableHead className="h-16 font-black text-primary uppercase text-[10px] tracking-[0.2em]">System Status</TableHead>
                    <TableHead className="h-16 text-right px-8 font-black text-primary uppercase text-[10px] tracking-[0.2em]">Interface</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {students.map((student, idx) => (
                      <motion.tr 
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="group border-b border-primary/5 hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/students/${student.id}`)}
                      >
                        <TableCell className="px-8 py-6">
                          <span className="font-mono text-xs font-bold text-primary">{student.admissionNumber}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Avatar className="h-12 w-12 rounded-xl ring-1 ring-primary/10">
                                  <AvatarImage src={student.user.avatar || undefined} className="object-cover" />
                                  <AvatarFallback className="bg-primary/5 text-primary font-black">{student.user.firstName?.[0]}{student.user.lastName?.[0]}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div>
                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm group-hover:text-primary transition-colors">
                                    {student.user.firstName} {student.user.lastName}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.rollNumber ? `ROLL: ${student.rollNumber}` : 'UNASSIGNED'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-black text-xs uppercase text-slate-700 dark:text-slate-300">
                                {student.currentClass?.name || 'GEN-ACAD'}
                            </p>
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest">
                                SEGMENT: {student.section?.name || 'CORE'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-slate-500">{student.user.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-[9px] font-black uppercase px-3 py-1 border-none shadow-sm", getStatusBadge(student.status))}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary hover:text-white transition-all">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-8 bg-primary/5 flex items-center justify-between border-t border-primary/5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    VECTOR PAGE: <span className="text-primary">{page} / {totalPages}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                      className="h-10 rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[9px] uppercase tracking-widest hover:bg-primary/10"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" /> REWIND
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || isLoading}
                      className="h-10 rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[9px] uppercase tracking-widest hover:bg-primary/10"
                    >
                      ADVANCE <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
          )}
        </div>
      </PremiumSection>
    </div>
  );
}

