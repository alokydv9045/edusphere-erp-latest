'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users, GraduationCap, CalendarCheck, IndianRupee,
  TrendingUp, TrendingDown, BookOpen, AlertCircle,
  FileText, UserPlus, CheckCircle2, Clock, BarChart3,
  CreditCard, Search, Printer, Receipt, ArrowRight,
  MessageSquare, Bus, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { dashboardAPI, type DashboardStats, type RecentActivity, type UpcomingExam, type FeeCollectionSummary, teacherAPI, examAPI, feeAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import { useSocket } from '@/hooks/useSocket';
import { RealtimeChart } from '@/components/dashboard/RealtimeChart';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { StatsSkeleton, ChartSkeleton, TableSkeleton } from '@/components/dashboard/SkeletonLoaders';

// Premium Components
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PremiumSection } from '@/components/dashboard/PremiumSection';
import { RecentActivity as PremiumRecentActivity } from '@/components/dashboard/RecentActivity';
import { FeeCollectionSummary as PremiumFeeSummary } from '@/components/dashboard/FeeCollectionSummary';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

const MODE_COLORS: Record<string, string> = {
  CASH: 'bg-green-100 text-green-700',
  UPI: 'bg-purple-100 text-purple-700',
  CHEQUE: 'bg-blue-100 text-blue-700',
  BANK_TRANSFER: 'bg-orange-100 text-orange-700',
};

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { canCollectFees, canManageFees, canViewStudents } = usePermissions();

  const role = user?.role || '';
  const { socket } = useSocket();
  const firstName = user?.firstName || 'User';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── Shared state ──────────────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats & {
    activeStudents?: number; totalClasses?: number; recentAdmissions?: number;
    upcomingExamCount?: number; pendingFeeCount?: number; overdueBooks?: number;
    attendancePercentage?: number; pendingFees?: number; booksDue?: number;
    pendingAttendance?: number;
    nextExam?: { name: string; date: string } | null;
  }>({
    totalStudents: 0, totalTeachers: 0, attendanceToday: 0, feesCollected: 0,
    studentsChange: 0, teachersChange: 0, attendanceChange: 0, feesChange: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [feeCollectionSummary, setFeeCollectionSummary] = useState<FeeCollectionSummary>({ totalExpected: 0, collected: 0, pending: 0, collectionRate: 0 });
  const [accountantData, setAccountantData] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [statsRes, activitiesRes, examsRes, feeSummaryRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(8),
        dashboardAPI.getUpcomingExams(5),
        dashboardAPI.getFeeCollectionSummary(),
      ]);
      if (statsRes.status === 'fulfilled' && statsRes.value.success) setStats(statsRes.value.stats);
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.success) setRecentActivities(activitiesRes.value.activities);
      if (examsRes.status === 'fulfilled' && examsRes.value.success) setUpcomingExams(examsRes.value.exams);
      if (feeSummaryRes.status === 'fulfilled' && feeSummaryRes.value.success) setFeeCollectionSummary(feeSummaryRes.value.summary);

      if (role === 'ACCOUNTANT') {
        const acctRes = await dashboardAPI.getAccountantStats().catch(() => null);
        if (acctRes?.success) setAccountantData(acctRes);
      }

      if (role === 'STUDENT') {
        const { studentAPI } = await import('@/lib/api');
        const studentRes = await studentAPI.getMe().catch(() => null);
        if (studentRes?.student) setStudentProfile(studentRes.student);
      }
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isAdminOrPrincipal = ['ADMIN', 'SUPER_ADMIN'].includes(role);
  const isTeacher = role === 'TEACHER';
  const isAccountant = role === 'ACCOUNTANT';
  const isStudent = role === 'STUDENT';
  const isAdmissionManager = role === 'ADMISSION_MANAGER';

  useEffect(() => {
    loadDashboard();
  }, [role, socket]);

  useEffect(() => {
    if (socket && role) {
      socket.emit('join_dashboard', role);
      if (isTeacher && stats.myClassId) socket.emit('join_room', `class_${stats.myClassId}`);
      if (isStudent && stats.studentId) socket.emit('join_room', `student_${stats.studentId}`);

      const handleUpdate = () => loadDashboard();
      socket.on('ATTENDANCE_MARKED', handleUpdate);
      socket.on('STUDENT_REGISTERED', handleUpdate);
      socket.on('FINANCE_UPDATE', handleUpdate);
      socket.on('INVENTORY_STOCK_MOVEMENT', handleUpdate);
      socket.on('PAYROLL_GENERATED', handleUpdate);
      socket.on('PAYROLL_PAID', handleUpdate);
      socket.on('LIBRARY_BOOK_ISSUED', handleUpdate);
      socket.on('LIBRARY_BOOK_RETURNED', handleUpdate);
      socket.on('ANNOUNCEMENT_CREATED', handleUpdate);

      return () => {
        socket.off('ATTENDANCE_MARKED', handleUpdate);
        socket.off('STUDENT_REGISTERED', handleUpdate);
        socket.off('FINANCE_UPDATE', handleUpdate);
        socket.off('INVENTORY_STOCK_MOVEMENT', handleUpdate);
        socket.off('PAYROLL_GENERATED', handleUpdate);
        socket.off('PAYROLL_PAID', handleUpdate);
        socket.off('LIBRARY_BOOK_ISSUED', handleUpdate);
        socket.off('LIBRARY_BOOK_RETURNED', handleUpdate);
        socket.off('ANNOUNCEMENT_CREATED', handleUpdate);
      };
    }
  }, [role, socket, stats.myClassId, stats.studentId, isTeacher, isStudent]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="space-y-2">
            <div className="h-9 w-64 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-40 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <StatsSkeleton />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <TableSkeleton rows={6} />
          </div>
          <div className="col-span-3">
             <div className="h-[400px] bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
           <ChartSkeleton />
           <ChartSkeleton />
           <ChartSkeleton />
        </div>
      </div>
    );
  }

  const acctSummary = accountantData?.summary ?? { todayCollection: 0, yearCollection: 0, pendingAmount: 0, txToday: 0 };
  const acctTx = accountantData?.todayTransactions ?? [];
  const acctDefaulters = accountantData?.defaulters ?? [];

  return (
    <div className="space-y-12 pb-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <DashboardHeader 
          title={
            isAdminOrPrincipal ? 'Institutional Command Center' : 
            isAccountant ? 'Treasury & Finance Matrix' : 
            isTeacher ? 'Academic Console' : 
            isAdmissionManager ? 'Growth Control' : 'Personal Portal'
          }
          subtitle={
            isAdminOrPrincipal
              ? `Strategic overview for ${firstName}. System status: Operational.`
              : isAccountant
                ? `Financial integrity monitor. Welcome, ${firstName}.`
                : isTeacher
                  ? `Empowering your classroom, ${firstName}.`
                  : isAdmissionManager
                    ? `Enrolment trajectory tracking for ${firstName}.`
                    : `Welcome back to your space, ${firstName}.`
          }
          today={today}
          onRefresh={() => loadDashboard()}
        />
      </motion.div>

      {/* ── Student Profile Quick Glance (High Fidelity) ── */}
      {isStudent && studentProfile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="overflow-hidden border-none glass-card rounded-[2.5rem]">
            <CardHeader className="pb-6 border-b border-primary/10 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-primary to-blue-600 p-0.5 shadow-2xl shadow-primary/20">
                    <div className="h-full w-full rounded-[1.9rem] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                      {studentProfile.user?.profilePicture ? (
                        <img src={studentProfile.user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <GraduationCap className="h-10 w-10 text-primary" />
                      )}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-black text-slate-900 dark:text-white">{studentProfile.user?.firstName} {studentProfile.user?.lastName}</CardTitle>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-widest">
                        ADM NO: {studentProfile.admissionNumber}
                      </Badge>
                      <span className="text-slate-400 font-bold">•</span>
                      <span className="font-black text-primary/80 uppercase text-xs tracking-tight">
                        {studentProfile.currentClass?.name} {studentProfile.section?.name ? `/ SECTION ${studentProfile.section.name}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-green-500/10 text-green-600 border-none px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest animate-pulse">
                    ACTIVE STATUS
                  </Badge>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Authenticated</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: "Temporal Data", items: [
                    { k: "DOB", v: studentProfile.user?.dateOfBirth ? new Date(studentProfile.user.dateOfBirth).toLocaleDateString('en-IN') : '—' },
                    { k: "Gender", v: studentProfile.user?.gender || '—' }
                  ]},
                  { label: "Guardian Network", items: [
                    { k: "Primary", v: studentProfile.parents?.[0]?.parent?.firstName || '—' },
                    { k: "Contact", v: studentProfile.parents?.[0]?.parent?.phone || '—' }
                  ]},
                  { label: "Communication", items: [
                    { k: "Secure Email", v: studentProfile.user?.email || '—' },
                    { k: "Emergency", v: studentProfile.user?.phone || '—' }
                  ]},
                  { label: "Geographic Location", items: [
                    { k: "Address", v: studentProfile.user?.address || '—' }
                  ]}
                ].map((sec, idx) => (
                  <div key={idx} className="space-y-3">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{sec.label}</p>
                    <div className="space-y-2">
                      {sec.items.map((item, i) => (
                        <div key={i}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.k}</p>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate">{item.v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── SECTION 1: Strategic KPIs ── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isAdminOrPrincipal && (<>
          <KpiCard title="Total Enrollment" value={(stats.activeStudents ?? stats.totalStudents ?? 0).toLocaleString()} subtitle={`${stats.totalStudents ?? 0} total records`} icon={<Users className="h-6 w-6" />} index={0} />
          <KpiCard title="Faculty Strength" value={stats.totalTeachers ?? 0} subtitle={`Across ${stats.totalClasses ?? '—'} departments`} icon={<GraduationCap className="h-6 w-6" />} index={1} />
          <KpiCard title="Attendance Flux" value={`${stats.attendanceToday ?? 0}%`} change={stats.attendanceChange} changeLabel="Daily Trend" icon={<CalendarCheck className="h-6 w-6" />} index={2} />
          <KpiCard title="Liquidity (Month)" value={`₹${((stats.feesCollected ?? 0) / 1000).toFixed(1)}K`} change={stats.feesChange} icon={<IndianRupee className="h-6 w-6" />} index={3} />
        </>)}

        {isAccountant && (<>
          <KpiCard title="Temporal Collection" value={formatINR(acctSummary.todayCollection)} subtitle={`${acctSummary.txToday} verify transactions`} icon={<IndianRupee className="h-6 w-6" />} index={0} />
          <KpiCard title="Annual Accumulation" value={formatINR(acctSummary.yearCollection)} icon={<CreditCard className="h-6 w-6" />} index={1} />
          <KpiCard title="Risk Exposure" value={formatINR(acctSummary.pendingAmount)} icon={<AlertCircle className="h-6 w-6" />} index={2} colorClassName="border-l-4 border-l-rose-500" />
          <KpiCard title="Transaction Density" value={acctSummary.txToday} icon={<BarChart3 className="h-6 w-6" />} index={3} />
        </>)}

        {isTeacher && (<>
          <KpiCard title="Class Presence" value={`${stats.attendanceToday}%`} icon={<CalendarCheck className="h-6 w-6" />} index={0} />
          <KpiCard title="Managed Pupils" value={stats.totalStudents ?? 0} icon={<Users className="h-6 w-6" />} index={1} />
          <KpiCard title="Pending Verifications" value={stats.pendingAttendance ?? 0} icon={<Clock className="h-6 w-6" />} index={2} />
          <KpiCard title="Library Overdue" value={stats.overdueBooks ?? 0} icon={<BookOpen className="h-6 w-6" />} index={3} colorClassName={(stats.overdueBooks ?? 0) > 0 ? "border-l-4 border-l-amber-500" : ""} />
        </>)}

        {isStudent && (<>
          <KpiCard title="Presence Index" value={`${stats.attendancePercentage ?? stats.attendanceToday}%`} icon={<CalendarCheck className="h-6 w-6" />} index={0} />
          <KpiCard title="Financial Dues" value={stats.pendingFees ?? 0} icon={<IndianRupee className="h-6 w-6" />} index={1} colorClassName={(stats.pendingFees ?? 0) > 0 ? "border-l-4 border-l-rose-500" : ""} />
          <KpiCard title="Library Assets" value={stats.booksDue ?? 0} icon={<BookOpen className="h-6 w-6" />} index={2} />
          <Link href="/dashboard/exams/results" className="block group">
            <KpiCard title="Academic Reports" value="VIEW MATRIX" icon={<ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />} index={3} />
          </Link>
        </>)}
      </div>


      {/* ── Dynamic Layout (Operational Intelligence) ── */}
      {isAdminOrPrincipal && (
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7">
            <PremiumRecentActivity activities={recentActivities} />
          </div>
          <div className="lg:col-span-5">
            <PremiumFeeSummary summary={feeCollectionSummary} />
          </div>
        </div>
      )}


      {/* ── Logistics & Fleet Matrix (Admin Only) ── */}
      {isAdminOrPrincipal && (
        <PremiumSection title="Logistics & Fleet Matrix" subtitle="Real-time telemetry for transit assets" icon={<Bus className="h-6 w-6" />}>
          <Link href="/dashboard/transport" className="block group">
            <div className="glass-card rounded-[2.5rem] overflow-hidden border-none shadow-2xl transition-all duration-700 hover:shadow-primary/20">
              <div className="flex flex-col md:flex-row">
                <div className="bg-primary p-12 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Bus className="h-16 w-16 text-white relative z-10 animate-float" />
                </div>
                <div className="p-12 flex-1 grid grid-cols-2 lg:grid-cols-4 gap-12 items-center bg-white/5 backdrop-blur-3xl">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Operational Units</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.transport?.totalVehicles ?? 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Live Deployments</p>
                    <div className="flex items-center gap-4">
                      <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.transport?.activeTrips ?? 0}</p>
                      <Badge className="bg-green-500 text-white border-none px-3 py-1 rounded-full text-[10px] font-black tracking-widest animate-pulse">
                        ON ROAD
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Student Nodes</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.transport?.totalAllocations ?? 0}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="lg" className="h-16 px-8 rounded-2xl group-hover:bg-primary group-hover:text-white font-black tracking-widest transition-all">
                      ACCESS FLEET <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </PremiumSection>
      )}


      {/* ── Temporal Scheduling & Events ── */}
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PremiumSection title="Temporal Matrix" subtitle="Institutional schedules & milestones" icon={<CalendarCheck className="h-6 w-6" />}>
            <div className="glass-card rounded-[2.5rem] p-4">
              <CalendarWidget />
            </div>
          </PremiumSection>
        </div>
        <div className="lg:col-span-1">
          <PremiumSection title="Upcoming Nodes" subtitle="Chronological event queue" icon={<Clock className="h-6 w-6" />}>
            <div className="glass-card rounded-[2.5rem] p-4 h-full">
              <UpcomingEvents />
            </div>
          </PremiumSection>
        </div>
      </div>

      {isAdminOrPrincipal && (
        <div className="space-y-16">
          <PremiumSection title="Live Telemetry" subtitle="Strategic performance monitoring" icon={<BarChart3 className="h-6 w-6" />}>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="glass-card rounded-[2.5rem] p-6 hover:shadow-primary/5 transition-all"><RealtimeChart title="PRESENCE INDEX" endpoint="/dashboard/attendance-trend" socketEvent="ATTENDANCE_MARKED" type="area" xAxisKey="date" dataKey="percentage" color="var(--primary)" description="Flux of student presence (7d)" /></div>
              <div className="glass-card rounded-[2.5rem] p-6 hover:shadow-green-500/5 transition-all"><RealtimeChart title="GROWTH TRAJECTORY" endpoint="/dashboard/stats" socketEvent="STUDENT_REGISTERED" type="bar" xAxisKey="name" dataKey="count" color="#10b981" description="Registration delta by class" /></div>
              <div className="glass-card rounded-[2.5rem] p-6 hover:shadow-indigo-500/5 transition-all"><RealtimeChart title="PAYMENT MODALITIES" endpoint="/dashboard/finance-stats" socketEvent="FINANCE_UPDATE" type="pie" xAxisKey="name" dataKey="value" dataProperty="modes" colors={["#6366f1", "#f59e0b", "#10b981", "#ef4444"]} description="Currency distribution matrix" /></div>
            </div>
          </PremiumSection>
        </div>
      )}

      {/* ── Admission Growth Console ── */}
      {isAdmissionManager && (
        <div className="space-y-12">
          <PremiumSection title="Growth Trajectory" subtitle="Live acquisition targets" icon={<UserPlus className="h-6 w-6" />}>
            <div className="grid gap-8 md:grid-cols-2">
              <KpiCard title="Operational Strength" value={stats.totalStudents} icon={<Users className="h-6 w-6" />} index={0} />
              <KpiCard title="Monthly Delta" value={stats.admissionsThisMonth ?? 0} icon={<UserPlus className="h-6 w-6" />} index={1} />
            </div>
          </PremiumSection>

          <PremiumSection title="Operational Protocols" icon={<Zap className="h-6 w-6" />}>
            <div className="glass-card rounded-[2.5rem] p-12 flex flex-wrap justify-center gap-8">
              <Link href="/dashboard/students/register"><Button size="lg" className="h-16 px-10 rounded-2xl premium-gradient font-black tracking-widest shadow-2xl shadow-primary/20">INITIATE REGISTRATION</Button></Link>
              <Link href="/dashboard/admissions/enquiries"><Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl glass font-black tracking-widest border-primary/20">MANAGE ENQUIRIES</Button></Link>
            </div>
          </PremiumSection>

          <PremiumSection title="Recent Acquisition Signals" icon={<MessageSquare className="h-6 w-6" />}>
            <div className="glass-card rounded-[2.5rem] overflow-hidden border-none">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-b border-primary/10">
                    <TableHead className="h-14 font-black text-primary uppercase text-[10px] tracking-[0.2em] px-8">ENTITY</TableHead>
                    <TableHead className="h-14 font-black text-primary uppercase text-[10px] tracking-[0.2em]">CLASSIFICATION</TableHead>
                    <TableHead className="h-14 font-black text-primary uppercase text-[10px] tracking-[0.2em]">COMM CHANNEL</TableHead>
                    <TableHead className="h-14 font-black text-primary uppercase text-[10px] tracking-[0.2em] text-right px-8">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentEnquiries?.map(enq => (
                    <TableRow key={enq.id} className="h-16 hover:bg-primary/5 transition-colors border-b border-primary/5 group">
                      <TableCell className="font-black text-sm text-slate-900 dark:text-white px-8">{enq.studentName}</TableCell>
                      <TableCell className="font-bold text-slate-500 uppercase text-xs">{enq.class}</TableCell>
                      <TableCell className="font-medium text-slate-400">{enq.phone}</TableCell>
                      <TableCell className="text-right px-8">
                        <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[9px] tracking-widest">{enq.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </PremiumSection>
        </div>
      )}

      {/* ── Financial Integrity Feed ── */}
      {isAccountant && (
        <PremiumSection title="Treasury Feed" subtitle="Live fiscal event stream" icon={<IndianRupee className="h-6 w-6" />}>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7 glass-card rounded-[2.5rem] overflow-hidden">
              <div className="p-8 bg-primary/5 border-b border-primary/10">
                 <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em]">Temporal Ledger</h3>
              </div>
              <div className="divide-y divide-primary/5 max-h-[500px] overflow-y-auto scrollbar-premium px-4">
                {acctTx.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-6 group hover:bg-primary/5 transition-all rounded-[1.5rem] my-2">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{tx.studentName}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.receipt}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xl font-black text-primary">₹{tx.amount}</p>
                      <Badge variant="outline" className="text-[9px] font-black uppercase bg-primary/5 border-primary/20 tracking-tighter">{tx.mode}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 glass-card rounded-[2.5rem] border-rose-500/10 overflow-hidden">
              <div className="p-8 bg-rose-500/5 border-b border-rose-500/10">
                 <h3 className="text-xs font-black text-rose-600 uppercase tracking-[0.3em]">Deficit Risk Entities</h3>
              </div>
              <div className="p-8 space-y-6">
                {acctDefaulters.map((d: any) => (
                  <div key={d.studentId} className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 group hover:scale-[1.02] transition-all">
                    <span className="font-black text-sm text-slate-700 dark:text-slate-200">{d.name}</span> 
                    <span className="font-black text-rose-600">₹{d.pendingAmount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PremiumSection>
      )}

      {/* ── Academic Analytics Matrix ── */}
      {isTeacher && stats.myClassId && (
        <PremiumSection title="Academic Metrics" subtitle="Real-time class performance telemetry" icon={<BarChart3 className="h-6 w-6" />}>
          <div className="grid gap-12 md:grid-cols-2">
            <div className="glass-card rounded-[2.5rem] p-8"><RealtimeChart title="CLASS PRESENCE" endpoint={`/dashboard/attendance-trend?classId=${stats.myClassId}`} socketEvent="ATTENDANCE_MARKED" type="area" xAxisKey="date" dataKey="percentage" color="var(--primary)" /></div>
            <div className="glass-card rounded-[2.5rem] p-8"><RealtimeChart title="ATTAINMENT CURVE" endpoint={`/dashboard/class-performance?classId=${stats.myClassId}`} socketEvent="EXAM_RESULT_PUBLISHED" type="bar" xAxisKey="name" dataKey="score" color="#00C49F" /></div>
          </div>
        </PremiumSection>
      )}

    </div>
  );
}
