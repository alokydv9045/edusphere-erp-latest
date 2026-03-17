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
  Phone, Mail, Download, Upload, ClipboardList, Activity,
  MessageSquare,
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
    // Join role-specific room for real-time updates
    if (socket && role) {
      socket.emit('join_dashboard', role);

      // Join targeted rooms for Students and Teachers if IDs are available
      if (isTeacher && stats.myClassId) {
        socket.emit('join_room', `class_${stats.myClassId}`);
      }
      if (isStudent && stats.studentId) {
        socket.emit('join_room', `student_${stats.studentId}`);
      }

      // Listen for updates that should refresh the dashboard
      const handleUpdate = () => {
        console.log('Real-time update received, refreshing dashboard...');
        loadDashboard();
      };

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
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const acctSummary = accountantData?.summary ?? { todayCollection: 0, yearCollection: 0, pendingAmount: 0, txToday: 0 };
  const acctTx = accountantData?.todayTransactions ?? [];
  const acctDefaulters = accountantData?.defaulters ?? [];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdminOrPrincipal ? 'School Overview' : isAccountant ? 'Fee Collection' : isTeacher ? 'Teacher Dashboard' : isAdmissionManager ? 'Admission Control' : 'My Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdminOrPrincipal
              ? `Welcome back, ${firstName}. Here's your complete school summary.`
              : isAccountant
                ? `Welcome, ${firstName}. Here's your financial overview for today.`
                : isTeacher
                  ? `Good day, ${firstName}. Here's what's happening in your classes.`
                  : isAdmissionManager
                    ? `Welcome, ${firstName}. Track your admission funnel and registration targets.`
                    : `Hello, ${firstName}. Here's your personal summary.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboard()}
            className="hidden sm:flex gap-2"
          >
            <Clock className="h-4 w-4" />
            Refresh
          </Button>
          <Badge variant="outline" className="text-xs px-3 py-1.5 bg-primary/5 text-primary border-primary/20 hidden sm:flex">
            {today}
          </Badge>
        </div>
      </div>

      {/* ── Student Profile Quick Glance (Only for Students) ── */}
      {isStudent && studentProfile && (
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader className="pb-3 border-b bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{studentProfile.user?.firstName} {studentProfile.user?.lastName}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] uppercase font-bold tracking-wider">
                      Adm: {studentProfile.admissionNumber}
                    </Badge>
                    <span>·</span>
                    <span className="font-medium text-primary/80">{studentProfile.currentClass?.name} {studentProfile.section?.name ? `- Section ${studentProfile.section.name}` : ''}</span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className="bg-green-500 hover:bg-green-600 border-none">{studentProfile.status}</Badge>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Student Status</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Personal Details</p>
                <div className="space-y-1.5 mt-2">
                  <p className="text-sm flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-muted-foreground">DOB:</span> <span className="font-medium">{studentProfile.user?.dateOfBirth ? new Date(studentProfile.user.dateOfBirth).toLocaleDateString('en-IN') : '—'}</span></p>
                  <p className="text-sm flex items-center gap-2"><Users className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-muted-foreground">Gender:</span> <span className="font-medium">{studentProfile.user?.gender || '—'}</span></p>
                  <p className="text-sm flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-muted-foreground">Roll No:</span> <span className="font-medium">{studentProfile.rollNumber || '—'}</span></p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Family Information</p>
                <div className="space-y-1.5 mt-2">
                  <p className="text-sm flex items-center gap-2"><Users className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-muted-foreground">Father:</span> <span className="font-medium">{studentProfile.parents?.[0]?.parent?.firstName || '—'}</span></p>
                  <p className="text-sm flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-muted-foreground">Ph:</span> <span className="font-medium">{studentProfile.parents?.[0]?.parent?.phone || '—'}</span></p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contact Details</p>
                <div className="space-y-1.5 mt-2">
                  <p className="text-sm flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-muted-foreground">Email:</span> <span className="font-medium truncate max-w-[150px]">{studentProfile.user?.email || '—'}</span></p>
                  <p className="text-sm flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-muted-foreground">Phone:</span> <span className="font-medium">{studentProfile.user?.phone || '—'}</span></p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Address</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {studentProfile.user?.address || 'No address provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1: Top KPI Cards — role-adaptive
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* ADMIN / PRINCIPAL: school-wide numbers */}
        {isAdminOrPrincipal && (<>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <div className="rounded-full bg-blue-100 p-2"><Users className="h-4 w-4 text-blue-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.activeStudents ?? stats.totalStudents).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.totalStudents} total enrolled</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <div className="rounded-full bg-green-100 p-2"><GraduationCap className="h-4 w-4 text-green-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              <p className="text-xs text-muted-foreground mt-1">Across {stats.totalClasses ?? '—'} classes</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
              <div className="rounded-full bg-purple-100 p-2"><CalendarCheck className="h-4 w-4 text-purple-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceToday}%</div>
              <Progress value={stats.attendanceToday} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Fees This Month</CardTitle>
              <div className="rounded-full bg-orange-100 p-2"><IndianRupee className="h-4 w-4 text-orange-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.feesCollected / 1000).toFixed(1)}K</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {stats.feesChange >= 0 ? <TrendingUp className="mr-1 h-3 w-3 text-green-600" /> : <TrendingDown className="mr-1 h-3 w-3 text-red-600" />}
                <span className={stats.feesChange >= 0 ? 'text-green-600' : 'text-red-600'}>{Math.abs(stats.feesChange)}%</span>
                <span className="ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </>)}

        {/* ACCOUNTANT: fee collection KPIs */}
        {isAccountant && (<>
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Today's Collection</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><IndianRupee className="h-4 w-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{formatINR(acctSummary.todayCollection)}</div>
              <p className="mt-1 text-xs font-semibold text-primary/80">{acctSummary.txToday} transaction{acctSummary.txToday !== 1 ? 's' : ''} today</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Year-to-Date</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><TrendingUp className="h-4 w-4 text-primary/80" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{formatINR(acctSummary.yearCollection)}</div>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Current academic year</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Pending Amount</CardTitle>
              <div className="rounded-full bg-destructive/10 p-2"><AlertCircle className="h-4 w-4 text-destructive" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight text-destructive">{formatINR(acctSummary.pendingAmount)}</div>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Across all students</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/40 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Receipts Issued</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><Receipt className="h-4 w-4 text-primary/60" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{acctSummary.txToday}</div>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Fee receipts today</p>
            </CardContent>
          </Card>
        </>)}

        {/* TEACHER: class-specific stats */}
        {isTeacher && (<>
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Attendance Today</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><CalendarCheck className="h-4 w-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.attendanceToday}%</div>
              <Progress value={stats.attendanceToday} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Total Students</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><Users className="h-4 w-4 text-primary/80" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.totalStudents}</div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">In my classes</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/40 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Pending Attendance</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><AlertCircle className="h-4 w-4 text-primary/60" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.pendingAttendance ?? 0}</div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">Class sessions remaining</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Overdue Books</CardTitle>
              <div className="rounded-full bg-destructive/10 p-2"><BookOpen className="h-4 w-4 text-destructive" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.overdueBooks ?? 0}</div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">Library overdue</p>
            </CardContent>
          </Card>
        </>)}

        {/* STUDENT: personal stats */}
        {isStudent && (<>
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">My Attendance</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><CalendarCheck className="h-4 w-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.attendancePercentage ?? stats.attendanceToday}%</div>
              <Progress value={stats.attendancePercentage ?? stats.attendanceToday} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Pending Fees</CardTitle>
              <div className="rounded-full bg-destructive/10 p-2"><AlertCircle className="h-4 w-4 text-destructive" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight text-destructive">{stats.pendingFees ?? 0}</div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">Unpaid invoices</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/40 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Books Due</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><Clock className="h-4 w-4 text-primary/60" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.booksDue ?? 0}</div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">To return</p>
            </CardContent>
          </Card>
          <Link href="/dashboard/exams/results">
            <Card className="border-l-4 border-l-primary/60 overflow-hidden group hover:shadow-md transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">My Results</CardTitle>
                <div className="rounded-full bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors"><FileText className="h-4 w-4 text-primary/80" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black tracking-tight">View Results</div>
                <p className="text-xs font-semibold text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                  Marks & Report Cards <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        </>)}
      </div>

      {/* ── Student Real-time Analytics ── */}
      {isStudent && stats.studentId && (
        <div className="grid gap-6 md:grid-cols-2">
          <RealtimeChart
            title="My Attendance Trend"
            description="Personal attendance over the last 7 days"
            endpoint={`/dashboard/attendance-trend?studentId=${stats.studentId}`}
            socketEvent="ATTENDANCE_MARKED"
            type="line"
            xAxisKey="date"
            dataKey="percentage"
            color="var(--primary)"
          />
          <RealtimeChart
            title="Academic Performance"
            description="Recent exam marks by subject"
            endpoint={`/dashboard/student-performance?studentId=${stats.studentId}`}
            socketEvent="EXAM_RESULT_PUBLISHED"
            type="bar"
            xAxisKey="subject"
            dataKey="score"
            color="oklch(0.6 0.118 184)"
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: Secondary stat row (Admin only)
          ══════════════════════════════════════════════════════════════════════ */}
      {/* ── Admission Manager Specific KPI Section ── */}
      {isAdmissionManager && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Admissions Today</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><UserPlus className="h-4 w-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.admissionsToday ?? 0}</div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">New students registered today</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Monthly Admissions</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><TrendingUp className="h-4 w-4 text-primary/80" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.admissionsThisMonth ?? 0}</div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">Total for this month</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/40 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Total Active Students</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><Users className="h-4 w-4 text-primary/60" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.totalStudents ?? 0}</div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">Current school strength</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-secondary-foreground hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Open Enquiries</CardTitle>
              <div className="rounded-full bg-secondary p-2"><ClipboardList className="h-4 w-4 text-secondary-foreground" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{(stats.funnelStats?.pending ?? 0) + (stats.funnelStats?.followUp ?? 0)}</div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">Leads awaiting conversion</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Admission Funnel & Class Distribution ── */}
      {isAdmissionManager && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Admission Funnel */}
          <Card className="shadow-sm border-none bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-bold">
                <BarChart3 className="h-4 w-4 text-primary" />
                Admission Funnel
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Pipeline stages from enquiry to conversion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium"><div className="w-2 h-2 rounded-full bg-primary/40" /> Enquiries (Pending)</span>
                    <span className="font-bold">{stats.funnelStats?.pending ?? 0}</span>
                  </div>
                  <Progress value={100} className="h-2 bg-muted" indicatorClassName="bg-primary/40" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium"><div className="w-2 h-2 rounded-full bg-primary/70" /> Follow-ups</span>
                    <span className="font-bold">{stats.funnelStats?.followUp ?? 0}</span>
                  </div>
                  <Progress
                    value={((stats.funnelStats?.followUp ?? 0) / (stats.funnelStats?.pending || 1)) * 100}
                    className="h-2 bg-muted"
                    indicatorClassName="bg-primary/70"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium"><div className="w-2 h-2 rounded-full bg-primary" /> Converted</span>
                    <span className="font-bold">{stats.funnelStats?.converted ?? 0}</span>
                  </div>
                  <Progress
                    value={((stats.funnelStats?.converted ?? 0) / ((stats.funnelStats?.pending || 1) + (stats.funnelStats?.followUp || 0) + (stats.funnelStats?.converted || 0))) * 100}
                    className="h-2 bg-muted"
                    indicatorClassName="bg-primary"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-border flex justify-center items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">Conversion Focused</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Class-wise Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Class-wise Admissions
              </CardTitle>
              <CardDescription>Top 5 classes by student enrollment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.classDistribution && stats.classDistribution.length > 0 ? (
                  stats.classDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          {idx + 1}
                        </div>
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <Badge variant="outline" className="font-mono">{item.count} students</Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-lg">
                    <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No distribution data available yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions (Role-Specific) */}
      {isAdmissionManager && (
        <Card className="shadow-sm border-2 border-dashed border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Quick Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/students/register">
                <Button className="gap-2"><UserPlus className="h-4 w-4" /> New Student Registration</Button>
              </Link>
              <Link href="/dashboard/admissions/enquiries">
                <Button variant="outline" className="gap-2"><ClipboardList className="h-4 w-4" /> Enquiry Management</Button>
              </Link>
              <Link href="/dashboard/students">
                <Button variant="outline" className="gap-2 transition-all hover:scale-105"><Search className="h-4 w-4" /> Student Directory</Button>
              </Link>
              <Link href="/dashboard/reports/admissions">
                <Button variant="ghost" className="gap-2 text-primary hover:bg-primary/10 hover:text-primary"><BarChart3 className="h-4 w-4" /> Admission Reports</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Enquiries Table (Admission Manager) ── */}
      {isAdmissionManager && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Recent Enquiries
              </CardTitle>
              <CardDescription>Latest perspective students awaiting follow-up</CardDescription>
            </div>
            <Link href="/dashboard/admissions/enquiries">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-primary/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="hover:bg-transparent border-primary/10">
                    <TableHead className="w-[200px] font-bold text-primary">Student</TableHead>
                    <TableHead className="font-bold text-primary">Class</TableHead>
                    <TableHead className="font-bold text-primary">Contact</TableHead>
                    <TableHead className="font-bold text-primary">Status</TableHead>
                    <TableHead className="text-right font-bold text-primary">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentEnquiries && stats.recentEnquiries.length > 0 ? (
                    stats.recentEnquiries.map((enq) => (
                      <TableRow key={enq.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                        <TableCell>
                          <div className="font-bold text-foreground">{enq.studentName}</div>
                          <div className="text-[10px] font-semibold text-muted-foreground">P: {enq.parentName}</div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{enq.class}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5 font-medium"><Phone className="h-3 w-3 text-primary/60" /> {enq.phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px] px-1.5 py-0 h-5 leading-none font-bold",
                              enq.status === 'PENDING' ? 'bg-primary/10 text-primary' :
                                enq.status === 'FOLLOW_UP' ? 'bg-primary/20 text-primary' :
                                  'bg-primary text-white'
                            )}
                          >
                            {enq.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/admissions/enquiries?id=${enq.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary">
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                        No recent enquiries found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KPI SECTION (Original Admin/Teacher) ── */}
      {isAdminOrPrincipal && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">New Admissions</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><UserPlus className="h-4 w-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.recentAdmissions ?? 0}</div>
              <p className="text-xs font-semibold text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Upcoming Exams</CardTitle>
              <div className="rounded-full bg-primary/10 p-2"><FileText className="h-4 w-4 text-primary/80" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.upcomingExamCount ?? upcomingExams.length}</div>
              <p className="text-xs font-semibold text-muted-foreground">In next 30 days</p>
            </CardContent>
          </Card>
          <Card className={cn("border-l-4 hover:shadow-md transition-shadow",
            stats.pendingFeeCount && stats.pendingFeeCount > 0 ? 'border-l-destructive bg-destructive/5' : 'border-l-primary/40'
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Pending Fees</CardTitle>
              <div className="rounded-full bg-destructive/10 p-2"><AlertCircle className="h-4 w-4 text-destructive" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.pendingFeeCount ?? 0}</div>
              <p className="text-xs font-semibold text-muted-foreground">Outstanding payments</p>
            </CardContent>
          </Card>
          <Card className={cn("border-l-4 hover:shadow-md transition-shadow",
            stats.overdueBooks && stats.overdueBooks > 0 ? 'border-l-destructive bg-destructive/5' : 'border-l-primary/30'
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Overdue Books</CardTitle>
              <div className="rounded-full bg-destructive/10 p-2"><BookOpen className="h-4 w-4 text-destructive" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{stats.overdueBooks ?? 0}</div>
              <p className="text-xs font-semibold text-muted-foreground">Library overdue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Analytics & Trends (Real-time Charts) ── */}
      {isAdminOrPrincipal && (
        <div className="grid gap-6 md:grid-cols-2">
          <RealtimeChart
            title="Attendance Trend"
            description="Live student attendance for the last 7 days"
            endpoint="/dashboard/attendance-trend"
            socketEvent="ATTENDANCE_MARKED"
            type="area"
            xAxisKey="date"
            dataKey="percentage"
            color="var(--primary)"
          />
          <RealtimeChart
            title="Admission Activity"
            description="Daily admission registrations"
            endpoint="/dashboard/stats"
            socketEvent="STUDENT_REGISTERED"
            type="bar"
            xAxisKey="name"
            dataKey="count"
            color="oklch(0.6 0.118 184)"
          />
          <RealtimeChart
            title="Financial Overview"
            description="Fee collection breakdown"
            endpoint="/dashboard/finance-stats"
            socketEvent="FINANCE_UPDATE"
            type="pie"
            xAxisKey="name"
            dataKey="value"
            dataProperty="modes"
            colors={["var(--primary)", "oklch(0.6 0.118 184)", "oklch(0.4 0.07 227)", "oklch(0.8 0.15 230)"]}
          />
          <RealtimeChart
            title="Collection Trend"
            description="Monthly Collected vs Pending fees"
            endpoint="/dashboard/finance-stats"
            socketEvent="FINANCE_UPDATE"
            type="bar"
            xAxisKey="month"
            dataKey={["collected", "pending"]}
            dataProperty="trend"
            colors={["oklch(0.6 0.118 184)", "oklch(0.4 0.07 227)"]}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: Accountant Quick Actions
          ══════════════════════════════════════════════════════════════════════ */}
      {isAccountant && (
        <Card className="border-none bg-primary/5">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">Financial Operations Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/dashboard/fees/collect">
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold shadow-md hover:shadow-lg transition-all">
                  <CreditCard className="h-4 w-4" /> Collect Fee
                </Button>
              </Link>
              <Link href="/dashboard/students">
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10 text-primary font-bold">
                  <Search className="h-4 w-4" /> Search Student
                </Button>
              </Link>
              <Link href="/dashboard/fees">
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10 text-primary font-bold">
                  <Printer className="h-4 w-4" /> Reprint Receipt
                </Button>
              </Link>
              <Link href="/dashboard/fees">
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10 text-primary font-bold">
                  <Users className="h-4 w-4" /> Pending Fees List
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4: Main content rows
          ══════════════════════════════════════════════════════════════════════ */}
      {/* Activity + Fee/Acct panels — Admin/Accountant only */}
      {(isAdminOrPrincipal || isAccountant) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

          {/* Activity / Transactions Feed */}
          <Card className="col-span-4 border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/30">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground font-bold">
                  {isAccountant ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <BarChart3 className="h-4 w-4 text-primary" />}
                  {isAccountant ? "Today's Transactions" : 'Recent Activity'}
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">{isAccountant ? 'All fee receipts issued today' : 'Latest events across the school'}</CardDescription>
              </div>
              {isAccountant && (
                <Link href="/dashboard/fees">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary hover:bg-primary/10 font-bold">View All <ArrowRight className="h-3 w-3" /></Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {isAccountant ? (
                acctTx.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/20 rounded-xl">
                    <Receipt className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm font-medium">No transactions yet today</p>
                    <Link href="/dashboard/fees/collect" className="mt-3">
                      <Button size="sm" className="bg-primary text-white hover:bg-primary/90 font-bold">Collect First Fee</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-0 divide-y divide-primary/5">
                    {acctTx.slice(0, 8).map((tx: any) => (
                      <div key={tx.id} className="flex items-center gap-3 py-3 group hover:bg-primary/5 px-2 rounded-lg transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">{tx.studentName}</p>
                          <p className="text-xs font-medium text-muted-foreground">{tx.class} · #{tx.receipt}</p>
                        </div>
                        <Badge variant="secondary" className={cn("shrink-0 text-[10px] font-bold", MODE_COLORS[tx.mode] ?? 'bg-muted text-muted-foreground')}>{tx.mode}</Badge>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-primary">₹{tx.amount.toLocaleString('en-IN')}</p>
                          <p className="flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground justify-end">
                            <Clock className="h-3 w-3 text-primary/40" />{new Date(tx.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                recentActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Activity className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm font-medium">No recent activities</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-2 hover:bg-primary/5 rounded-lg transition-all border border-transparent hover:border-primary/10">
                        <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground leading-tight">{activity.description}</p>
                          <p className="text-[10px] font-black uppercase text-primary/60 mt-1 flex items-center gap-1">
                            {activity.type} · <Clock className="h-3 w-3" />{activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Right Panel: Fee Summary (admin/teacher) or Pending Defaulters (accountant) or Upcoming Exams (student) */}
          <Card className="col-span-3">
            {isAccountant ? (
              <>
                <CardHeader className="flex flex-row items-center justify-between bg-destructive/5">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-destructive font-bold"><AlertCircle className="h-4 w-4" />Top Pending Students</CardTitle>
                    <CardDescription className="text-destructive/80 font-medium">Highest outstanding balances</CardDescription>
                  </div>
                  <Link href="/dashboard/fees"><Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive hover:bg-destructive/10">Full List <ArrowRight className="h-3 w-3" /></Button></Link>
                </CardHeader>
                <CardContent className="pt-4">
                  {acctDefaulters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-xl">
                      <CheckCircle2 className="h-10 w-10 mb-2 text-primary/60" />
                      <p className="text-sm font-bold text-primary">All fees are up to date!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-primary/5">
                      {acctDefaulters.map((d: any, i: number) => (
                        <div key={d.studentId} className="flex items-center gap-4 py-3 group hover:bg-destructive/5 px-2 rounded-lg transition-colors">
                          <span className="w-5 text-xs text-muted-foreground font-black">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-foreground">{d.name}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground">{d.class}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-destructive">₹{d.pendingAmount.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] font-bold text-muted-foreground">pending</p>
                          </div>
                          <Link href={`/dashboard/fees/collect/${d.studentId}`}>
                            <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-2 border-primary/20 hover:bg-primary/10 text-primary font-bold">Collect</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-muted-foreground" />Fee Collection</CardTitle>
                  <CardDescription>Monthly collection status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expected</span>
                      <span className="font-semibold">₹{(feeCollectionSummary.totalExpected ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Collected</span>
                      <span className="font-semibold text-green-600">₹{(feeCollectionSummary.collected ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-semibold text-orange-600">₹{(feeCollectionSummary.pending ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Collection Rate</span>
                      <span className="font-medium text-foreground">{feeCollectionSummary.collectionRate ?? 0}%</span>
                    </div>
                    <Progress value={feeCollectionSummary.collectionRate ?? 0} className="h-2" />
                  </div>
                  {canManageFees && (
                    <Link href="/dashboard/fees"><Button className="w-full" variant="outline" size="sm">View Full Report</Button></Link>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Teacher Quick Links */}
      {isTeacher && (
        <Card className="border-none bg-primary/5">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">Academic Command Center</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4">
              {isTeacher && <Link href="/dashboard/attendance"><Button className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold shadow-md">
                <CalendarCheck className="h-4 w-4" /> Mark Attendance
              </Button></Link>}
              {!isStudent && <Link href="/dashboard/hr/my-hr"><Button variant="outline" className="gap-2 border-primary/20 text-primary font-bold hover:bg-primary/10">
                <Clock className="h-4 w-4" /> My Leaves & HR
              </Button></Link>}
              {isTeacher && <Link href="/dashboard/exams"><Button variant="outline" className="gap-2 border-primary/20 text-primary font-bold hover:bg-primary/10">
                <FileText className="h-4 w-4" /> View Exams
              </Button></Link>}
              {isTeacher && <Link href="/dashboard/students"><Button variant="outline" className="gap-2 border-primary/20 text-primary font-bold hover:bg-primary/10">
                <Users className="h-4 w-4" /> My Students
              </Button></Link>}
              {!isStudent && <Link href="/dashboard/announcements"><Button variant="outline" className="gap-2 border-primary/20 text-primary font-bold hover:bg-primary/10">
                <AlertCircle className="h-4 w-4" /> Announcements
              </Button></Link>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Teacher Real-time Analytics ── */}
      {isTeacher && stats.myClassId && (
        <div className="grid gap-6 md:grid-cols-2">
          <RealtimeChart
            title="Class Attendance Trend"
            description={`Attendance record for ${stats.myClassName || 'my class'}`}
            endpoint={`/dashboard/attendance-trend?classId=${stats.myClassId}`}
            socketEvent="ATTENDANCE_MARKED"
            type="area"
            xAxisKey="date"
            dataKey="percentage"
            color="var(--primary)"
          />
          <RealtimeChart
            title="Class Performance"
            description="Top 10 student scores in latest exam"
            endpoint={`/dashboard/class-performance?classId=${stats.myClassId}`}
            socketEvent="EXAM_RESULT_PUBLISHED"
            type="bar"
            xAxisKey="name"
            dataKey="score"
            color="oklch(0.6 0.118 184)"
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5: Upcoming Exams (admin + teacher + student)
          ══════════════════════════════════════════════════════════════════════ */}
      {!isAccountant && upcomingExams.length > 0 && (
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-foreground font-bold"><FileText className="h-4 w-4 text-primary" />Upcoming Examinations</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">Scheduled in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingExams.map((exam) => {
                const daysLeft = Math.ceil((new Date(exam.date).getTime() - Date.now()) / 86400000);
                return (
                  <div key={exam.id} className="flex items-center gap-3 rounded-xl border border-primary/10 p-4 transition-all hover:bg-primary/5 group">
                    <div className="rounded-full bg-primary/10 p-2 shrink-0 group-hover:bg-primary/20 transition-colors"><BookOpen className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate text-foreground">{exam.name}</p>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">{exam.class} · {exam.subject}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black text-primary/60">{new Date(exam.date).toLocaleDateString('en-IN')}</p>
                      <Badge variant="outline" className={cn("mt-1.5 text-[10px] font-black px-2 py-0 border-none",
                        daysLeft <= 3 ? 'text-white bg-destructive' : 'text-primary bg-primary/10'
                      )}>
                        {daysLeft}d left
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
