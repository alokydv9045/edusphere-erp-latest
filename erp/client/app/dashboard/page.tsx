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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { dashboardAPI, type DashboardStats, type RecentActivity, type UpcomingExam, type FeeCollectionSummary, teacherAPI, examAPI, feeAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/usePermissions';

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

  useEffect(() => {
    loadDashboard();
  }, [role]);

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

  // ── Derived ───────────────────────────────────────────────────────────────
  const isAdminOrPrincipal = ['ADMIN', 'SUPER_ADMIN'].includes(role);
  const isTeacher = role === 'TEACHER';
  const isAccountant = role === 'ACCOUNTANT';
  const isStudent = role === 'STUDENT';
  const isAdmissionManager = role === 'ADMISSION_MANAGER';

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
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
              <div className="rounded-full bg-green-100 p-2"><IndianRupee className="h-4 w-4 text-green-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatINR(acctSummary.todayCollection)}</div>
              <p className="mt-1 text-xs text-muted-foreground">{acctSummary.txToday} transaction{acctSummary.txToday !== 1 ? 's' : ''} today</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Year-to-Date</CardTitle>
              <div className="rounded-full bg-indigo-100 p-2"><TrendingUp className="h-4 w-4 text-indigo-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatINR(acctSummary.yearCollection)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Current academic year</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <div className="rounded-full bg-orange-100 p-2"><AlertCircle className="h-4 w-4 text-orange-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{formatINR(acctSummary.pendingAmount)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Across all students</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Receipts Issued</CardTitle>
              <div className="rounded-full bg-blue-100 p-2"><Receipt className="h-4 w-4 text-blue-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{acctSummary.txToday}</div>
              <p className="mt-1 text-xs text-muted-foreground">Fee receipts today</p>
            </CardContent>
          </Card>
        </>)}

        {/* TEACHER: class-specific stats */}
        {isTeacher && (<>
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
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <div className="rounded-full bg-blue-100 p-2"><Users className="h-4 w-4 text-blue-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">In my classes</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pending Attendance</CardTitle>
              <div className="rounded-full bg-orange-100 p-2"><AlertCircle className="h-4 w-4 text-orange-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAttendance ?? 0}</div>
              <p className="text-xs text-muted-foreground">Class sessions remaining</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
              <div className="rounded-full bg-red-100 p-2"><BookOpen className="h-4 w-4 text-red-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdueBooks ?? 0}</div>
              <p className="text-xs text-muted-foreground">Library overdue</p>
            </CardContent>
          </Card>
        </>)}

        {/* STUDENT: personal stats */}
        {isStudent && (<>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">My Attendance</CardTitle>
              <div className="rounded-full bg-blue-100 p-2"><CalendarCheck className="h-4 w-4 text-blue-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendancePercentage ?? stats.attendanceToday}%</div>
              <Progress value={stats.attendancePercentage ?? stats.attendanceToday} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
              <div className="rounded-full bg-orange-100 p-2"><AlertCircle className="h-4 w-4 text-orange-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingFees ?? 0}</div>
              <p className="text-xs text-muted-foreground">Unpaid invoices</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-pink-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Books Due</CardTitle>
              <div className="rounded-full bg-pink-100 p-2"><Clock className="h-4 w-4 text-pink-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.booksDue ?? 0}</div>
              <p className="text-xs text-muted-foreground">To return</p>
            </CardContent>
          </Card>
          <Link href="/dashboard/exams/results">
            <Card className="border-l-4 border-l-emerald-500 overflow-hidden group hover:shadow-md transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">My Results</CardTitle>
                <div className="rounded-full bg-emerald-100 p-2 group-hover:bg-emerald-200 transition-colors"><FileText className="h-4 w-4 text-emerald-600" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">View Results</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-emerald-600">
                  Marks & Report Cards <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        </>)}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: Secondary stat row (Admin only)
          ══════════════════════════════════════════════════════════════════════ */}
      {/* ── Admission Manager Specific KPI Section ── */}
      {isAdmissionManager && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Admissions Today</CardTitle>
              <UserPlus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admissionsToday ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">New students registered today</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-indigo-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Admissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admissionsThisMonth ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total for this month</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Active Students</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Current school strength</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Enquiries</CardTitle>
              <ClipboardList className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.funnelStats?.pending ?? 0) + (stats.funnelStats?.followUp ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Leads awaiting conversion</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Admission Funnel & Class Distribution ── */}
      {isAdmissionManager && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Admission Funnel */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Admission Funnel
              </CardTitle>
              <CardDescription>Pipeline stages from enquiry to conversion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400" /> Enquiries (Pending)</span>
                    <span className="font-semibold">{stats.funnelStats?.pending ?? 0}</span>
                  </div>
                  <Progress value={100} className="h-2 bg-slate-100" indicatorClassName="bg-amber-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400" /> Follow-ups</span>
                    <span className="font-semibold">{stats.funnelStats?.followUp ?? 0}</span>
                  </div>
                  <Progress
                    value={((stats.funnelStats?.followUp ?? 0) / (stats.funnelStats?.pending || 1)) * 100}
                    className="h-2 bg-slate-100"
                    indicatorClassName="bg-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> Converted</span>
                    <span className="font-semibold">{stats.funnelStats?.converted ?? 0}</span>
                  </div>
                  <Progress
                    value={((stats.funnelStats?.converted ?? 0) / ((stats.funnelStats?.pending || 1) + (stats.funnelStats?.followUp || 0) + (stats.funnelStats?.converted || 0))) * 100}
                    className="h-2 bg-slate-100"
                    indicatorClassName="bg-green-500"
                  />
                </div>
              </div>
              <div className="pt-2 border-t text-center">
                <p className="text-xs text-muted-foreground italic">"Keep pushing leads through the pipeline to hit targets!"</p>
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
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[200px]">Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentEnquiries && stats.recentEnquiries.length > 0 ? (
                    stats.recentEnquiries.map((enq) => (
                      <TableRow key={enq.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="font-medium">{enq.studentName}</div>
                          <div className="text-[10px] text-muted-foreground">P: {enq.parentName}</div>
                        </TableCell>
                        <TableCell className="text-sm">{enq.class}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" /> {enq.phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 h-5 leading-none ${enq.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                              enq.status === 'FOLLOW_UP' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}
                          >
                            {enq.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/admissions/enquiries?id=${enq.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">New Admissions</CardTitle>
              <div className="rounded-full bg-cyan-100 p-2"><UserPlus className="h-4 w-4 text-cyan-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentAdmissions ?? 0}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
              <div className="rounded-full bg-indigo-100 p-2"><FileText className="h-4 w-4 text-indigo-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingExamCount ?? upcomingExams.length}</div>
              <p className="text-xs text-muted-foreground">In next 30 days</p>
            </CardContent>
          </Card>
          <Card className={stats.pendingFeeCount && stats.pendingFeeCount > 0 ? 'border-orange-200 bg-orange-50/40' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
              <div className="rounded-full bg-yellow-100 p-2"><AlertCircle className="h-4 w-4 text-yellow-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingFeeCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">Outstanding payments</p>
            </CardContent>
          </Card>
          <Card className={stats.overdueBooks && stats.overdueBooks > 0 ? 'border-red-200 bg-red-50/40' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
              <div className="rounded-full bg-red-100 p-2"><BookOpen className="h-4 w-4 text-red-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdueBooks ?? 0}</div>
              <p className="text-xs text-muted-foreground">Library overdue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: Accountant Quick Actions
          ══════════════════════════════════════════════════════════════════════ */}
      {isAccountant && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/fees/collect">
                <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <CreditCard className="h-4 w-4" /> Collect Fee
                </Button>
              </Link>
              <Link href="/dashboard/students">
                <Button variant="outline" className="gap-2"><Search className="h-4 w-4" /> Search Student</Button>
              </Link>
              <Link href="/dashboard/fees">
                <Button variant="outline" className="gap-2"><Printer className="h-4 w-4" /> Reprint Receipt</Button>
              </Link>
              <Link href="/dashboard/fees">
                <Button variant="outline" className="gap-2"><Users className="h-4 w-4" /> Pending Fees List</Button>
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
          <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isAccountant ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <BarChart3 className="h-4 w-4 text-muted-foreground" />}
                  {isAccountant ? "Today's Transactions" : 'Recent Activity'}
                </CardTitle>
                <CardDescription>{isAccountant ? 'All fee receipts issued today' : 'Latest events across the school'}</CardDescription>
              </div>
              {isAccountant && (
                <Link href="/dashboard/fees">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">View All <ArrowRight className="h-3 w-3" /></Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {isAccountant ? (
                acctTx.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Receipt className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">No transactions yet today</p>
                    <Link href="/dashboard/fees/collect" className="mt-3">
                      <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">Collect First Fee</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-0 divide-y">
                    {acctTx.slice(0, 8).map((tx: any) => (
                      <div key={tx.id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{tx.studentName}</p>
                          <p className="text-xs text-muted-foreground">{tx.class} · #{tx.receipt}</p>
                        </div>
                        <Badge variant="secondary" className={`shrink-0 text-xs ${MODE_COLORS[tx.mode] ?? 'bg-gray-100 text-gray-700'}`}>{tx.mode}</Badge>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-green-700">₹{tx.amount.toLocaleString('en-IN')}</p>
                          <p className="flex items-center gap-0.5 text-xs text-muted-foreground justify-end">
                            <Clock className="h-3 w-3" />{new Date(tx.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <Badge variant="secondary" className="mt-0.5 shrink-0 bg-slate-100 text-slate-700">{activity.type}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{activity.time}</p>
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-orange-500" />Top Pending Students</CardTitle>
                    <CardDescription>Highest outstanding balances</CardDescription>
                  </div>
                  <Link href="/dashboard/fees"><Button variant="ghost" size="sm" className="gap-1 text-xs">Full List <ArrowRight className="h-3 w-3" /></Button></Link>
                </CardHeader>
                <CardContent>
                  {acctDefaulters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-10 w-10 mb-2 text-green-400" />
                      <p className="text-sm font-medium text-green-600">All fees are up to date!</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {acctDefaulters.map((d: any, i: number) => (
                        <div key={d.studentId} className="flex items-center gap-4 py-3">
                          <span className="w-5 text-xs text-muted-foreground font-mono">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{d.name}</p>
                            <p className="text-xs text-muted-foreground">{d.class}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-orange-600">₹{d.pendingAmount.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-muted-foreground">pending</p>
                          </div>
                          <Link href={`/dashboard/fees/collect/${d.studentId}`}>
                            <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-2">Collect</Button>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-muted-foreground" />Quick Actions</CardTitle>
            <CardDescription>Jump to your most-used pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {isTeacher && <Link href="/dashboard/attendance"><Button className="gap-2"><CalendarCheck className="h-4 w-4" /> Mark Attendance</Button></Link>}
              {!isStudent && <Link href="/dashboard/hr/my-hr"><Button variant="outline" className="gap-2"><Clock className="h-4 w-4" /> My Leaves & HR</Button></Link>}
              {isTeacher && <Link href="/dashboard/exams"><Button variant="outline" className="gap-2"><FileText className="h-4 w-4" /> View Exams</Button></Link>}
              {isTeacher && <Link href="/dashboard/students"><Button variant="outline" className="gap-2"><Users className="h-4 w-4" /> My Students</Button></Link>}
              {!isStudent && <Link href="/dashboard/announcements"><Button variant="outline" className="gap-2"><AlertCircle className="h-4 w-4" /> Announcements</Button></Link>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5: Upcoming Exams (admin + teacher + student)
          ══════════════════════════════════════════════════════════════════════ */}
      {!isAccountant && upcomingExams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />Upcoming Examinations</CardTitle>
            <CardDescription>Scheduled in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingExams.map((exam) => {
                const daysLeft = Math.ceil((new Date(exam.date).getTime() - Date.now()) / 86400000);
                return (
                  <div key={exam.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
                    <div className="rounded-full bg-blue-100 p-2 shrink-0"><BookOpen className="h-4 w-4 text-blue-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">{exam.class} · {exam.subject}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">{new Date(exam.date).toLocaleDateString('en-IN')}</p>
                      <Badge variant="outline" className={`mt-1 text-xs ${daysLeft <= 3 ? 'border-red-300 text-red-600 bg-red-50' : 'border-blue-200 text-blue-600 bg-blue-50'}`}>
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
