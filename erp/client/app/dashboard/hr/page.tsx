import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PremiumSection } from '@/components/dashboard/PremiumSection';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
    Users, UserCheck, UserX, Briefcase, Settings, Plus, Search, 
    Edit, Eye, IndianRupee, CheckCircle, Clock, BarChart, 
    Calendar, ChevronLeft, ChevronRight, Download, RefreshCw,
    Loader2, Trash2, Mail, Phone, MapPin, Zap
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { 
    hrAPI, 
    scannerAPI, 
    payrollAPI, 
    attendanceAPI, 
    serviceAPI 
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RealtimeChart } from '@/components/dashboard/RealtimeChart';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const ALL_ROLES = [
    'TEACHER', 'ADMIN', 'HR', 'ACCOUNTANT', 'PRINCIPAL', 'HOD', 'STAFF'
];

const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'TEACHER',
    joiningDate: '',
    qualification: '',
    experience: '',
    specialization: '',
    designation: '',
    department: '',
    assignedScannerId: ''
};

export default function HRManagementPage() {
    const { socket } = useSocket();
    const { toast } = useToast();
    const {
        isAdmin, isSuperAdmin, isHRManager, isPrincipal, isHOD,
        canManageHR, canApproveLeaves, canConductReviews, canViewPayroll
    } = usePermissions();
    const now = new Date();

    const [employees, setEmployees] = useState<any[]>([]);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [empDialog, setEmpDialog] = useState(false);
    const [editingEmp, setEditingEmp] = useState<any>(null);
    const [empForm, setEmpForm] = useState({ ...emptyForm });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [salaryDialog, setSalaryDialog] = useState(false);
    const [salaryEmp, setSalaryEmp] = useState<any>(null);
    const [salaryForm, setSalaryForm] = useState({ basicSalary: '', allowances: '0', deductions: '0' });
    const [isSalarySubmitting, setIsSalarySubmitting] = useState(false);

    const [payMonth, setPayMonth] = useState(now.getMonth() + 1);
    const [payYear, setPayYear] = useState(now.getFullYear());
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [payrollSummary, setPayrollSummary] = useState<any>(null);
    const [isPayrollLoading, setIsPayrollLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const [attDate, setAttDate] = useState(now.toISOString().split('T')[0]);
    const [attType, setAttType] = useState<'TEACHER' | 'STAFF'>('TEACHER');
    const [attList, setAttList] = useState<any[]>([]);
    const [isAttLoading, setIsAttLoading] = useState(false);
    const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);

    const [leaves, setLeaves] = useState<any[]>([]);
    const [isLeavesLoading, setIsLeavesLoading] = useState(false);
    const [leaveProcessDialog, setLeaveProcessDialog] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [processRemarks, setProcessRemarks] = useState('');

    const onLeaveToday = (leaves || []).filter(l => {
        const d = new Date(attDate);
        return l.status === 'APPROVED' && new Date(l.startDate) <= d && new Date(l.endDate) >= d;
    });

    const [reviewDialog, setReviewDialog] = useState(false);
    const [reviewEmp, setReviewEmp] = useState<any>(null);
    const [reviewForm, setReviewForm] = useState({
        periodStart: '', periodEnd: '',
        ratings: { academic: 5, discipline: 5, punctuality: 5 },
        strengths: '', improvements: '', comments: ''
    });
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();

    const getLeavesForDay = (day: number) => {
        const d = new Date(viewYear, viewMonth - 1, day);
        return (leaves || []).filter(l =>
            l.status === 'APPROVED' &&
            new Date(l.startDate) <= d &&
            new Date(l.endDate) >= d
        );
    };

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await hrAPI.getEmployees({
                search: search || undefined,
                type: typeFilter || undefined,
                status: statusFilter || undefined,
            });
            setEmployees(data.employees || []);
            setTotalEmployees(data.pagination?.total || 0);
        } catch { toast({ title: 'Error', description: 'Failed to load employees', variant: 'destructive' });
        } finally { setIsLoading(false); }
    }, [search, typeFilter, statusFilter, toast]);

    const [scanners, setScanners] = useState<any[]>([]);
    const fetchScanners = useCallback(async () => {
        try {
            const data = await scannerAPI.getAll();
            setScanners(data.scanners || []);
        } catch { console.error('Failed to load scanners'); }
    }, []);

    useEffect(() => { fetchEmployees(); fetchScanners(); }, [fetchEmployees, fetchScanners]);

    const fetchPayroll = useCallback(async () => {
        setIsPayrollLoading(true);
        try {
            const data = await payrollAPI.getPayrollList(payMonth, payYear);
            setPayrolls(data.payrolls || []);
            setPayrollSummary(data.summary || null);
        } catch { setPayrolls([]); setPayrollSummary(null);
        } finally { setIsPayrollLoading(false); }
    }, [payMonth, payYear]);

    useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

    const openCreate = () => { setEditingEmp(null); setEmpForm({ ...emptyForm }); setEmpDialog(true); };

    const openEdit = (emp: any) => {
        setEditingEmp(emp);
        const tOrS = emp.teacher || emp.staff;
        setEmpForm({
            firstName: emp.firstName || '', lastName: emp.lastName || '', email: emp.email || '',
            password: '', phone: emp.phone || '', role: emp.role || 'TEACHER',
            joiningDate: tOrS?.joiningDate ? tOrS.joiningDate.split('T')[0] : '',
            qualification: emp.teacher?.qualification || '',
            experience: emp.teacher?.experience?.toString() || '',
            specialization: emp.teacher?.specialization || '',
            designation: emp.staff?.designation || '', department: emp.staff?.department || '',
            assignedScannerId: (emp.teacher?.assignedScannerId || emp.staff?.assignedScannerId) || '',
        });
        setEmpDialog(true);
    };

    const handleSubmitEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingEmp) { await hrAPI.updateEmployee(editingEmp.id, empForm); toast({ title: 'Success', description: 'Employee updated' });
            } else { await hrAPI.createEmployee(empForm); toast({ title: 'Success', description: 'Employee created' }); }
            setEmpDialog(false); fetchEmployees();
        } catch (err: any) { toast({ title: 'Error', description: err?.response?.data?.error || 'Operation failed', variant: 'destructive' });
        } finally { setIsSubmitting(false); }
    };

    const handleToggleStatus = async (emp: any) => {
        const newActive = !emp.isActive;
        try {
            await hrAPI.toggleStatus(emp.id, { isActive: newActive, status: newActive ? 'ACTIVE' : 'RESIGNED' });
            toast({ title: 'Success', description: `Employee ${newActive ? 'activated' : 'deactivated'}` });
            fetchEmployees();
        } catch { toast({ title: 'Error', description: 'Status update failed', variant: 'destructive' }); }
    };

    const openSalaryDialog = (emp: any) => {
        setSalaryEmp(emp);
        setSalaryForm({
            basicSalary: emp.salaryStructure?.basicSalary?.toString() || '',
            allowances: emp.salaryStructure?.allowances?.toString() || '0',
            deductions: '0',
        });
        setSalaryDialog(true);
    };

    const handleSaveSalary = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!salaryEmp) return;
        setIsSalarySubmitting(true);
        try {
            await payrollAPI.setSalaryStructure({
                employeeId: salaryEmp.id,
                basicSalary: parseFloat(salaryForm.basicSalary),
                allowances: parseFloat(salaryForm.allowances),
                deductions: parseFloat(salaryForm.deductions),
            });
            toast({ title: 'Success', description: 'Salary structure saved' });
            setSalaryDialog(false); fetchEmployees();
        } catch (err: any) { toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to save salary', variant: 'destructive' });
        } finally { setIsSalarySubmitting(false); }
    };

    const handleGeneratePayroll = async () => {
        setIsGenerating(true);
        try {
            const data = await payrollAPI.generatePayroll(payMonth, payYear);
            toast({ title: 'Payroll Generated', description: data.message });
            fetchPayroll();
        } catch (err: any) { toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to generate payroll', variant: 'destructive' });
        } finally { setIsGenerating(false); }
    };

    const handleMarkPaid = async (payrollId: string) => {
        try { await payrollAPI.markPaid(payrollId); toast({ title: 'Success', description: 'Marked as paid' }); fetchPayroll();
        } catch { toast({ title: 'Error', description: 'Failed to mark as paid', variant: 'destructive' }); }
    };

    const fetchStaffForAttendance = useCallback(async () => {
        try {
            setIsAttLoading(true); setIsAlreadyMarked(false);
            const response = await hrAPI.getEmployees({ type: attType, status: 'ACTIVE' });
            const employees = response.employees || [];
            const attResponse = await attendanceAPI.getRecords({ date: attDate, attendeeType: attType });
            const existingMap = new Map();
            if (attResponse.attendance) {
                attResponse.attendance.forEach((r: any) => {
                    const existingRecord = r.attendance;
                    const entityId = attType === 'TEACHER' ? existingRecord?.teacherId : existingRecord?.staffId;
                    if (entityId) existingMap.set(entityId, existingRecord?.status);
                });
            }
            const list = employees.map((e: any) => ({
                id: e.id, name: `${e.firstName} ${e.lastName}`, employeeId: getEmployeeId(e),
                status: existingMap.get(e.id) || null
            }));
            setAttList(list);
            if (attResponse.isMarked || (attResponse.stats && attResponse.stats.marked > 0)) { setIsAlreadyMarked(true); }
        } catch (error) { toast({ title: 'Error', description: 'Failed to fetch staff list', variant: 'destructive' });
        } finally { setIsAttLoading(false); }
    }, [attType, attDate, toast]);

    useEffect(() => { fetchStaffForAttendance(); }, [fetchStaffForAttendance]);

    const handleAttendanceChange = (id: string, status: string) => {
        setAttList(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    };

    const submitAttendance = async () => {
        const unmarked = attList.filter(item => !item.status);
        if (unmarked.length > 0) {
            toast({ title: 'Incomplete', description: `Please mark all ${unmarked.length} members.`, variant: 'destructive' });
            return;
        }
        setIsAttLoading(true);
        try {
            const payload = {
                date: attDate, attendeeType: attType,
                attendanceData: attList.map(item => ({ userId: item.id, status: item.status, remarks: '' }))
            };
            await attendanceAPI.submitStaffAttendance(payload);
            setIsAlreadyMarked(true); toast({ title: 'Success', description: 'Attendance submitted' });
        } catch (err: any) { toast({ title: 'Error', description: err?.response?.data?.error || 'Failed', variant: 'destructive' });
        } finally { setIsAttLoading(false); }
    };

    const fetchLeaves = useCallback(async () => {
        setIsLeavesLoading(true);
        try { const data = await serviceAPI.getAll({ type: 'LEAVE' }); setLeaves(data || []);
        } catch { toast({ title: 'Error', description: 'Failed to fetch leaves', variant: 'destructive' });
        } finally { setIsLeavesLoading(false); }
    }, [toast]);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    useEffect(() => {
        if (socket) {
            const handlePayrollUpdate = () => fetchPayroll();
            const handleEmployeeUpdate = () => fetchEmployees();
            const handleAttendanceUpdate = () => fetchStaffForAttendance();
            socket.on('PAYROLL_GENERATED', handlePayrollUpdate);
            socket.on('PAYROLL_PAID', handlePayrollUpdate);
            socket.on('PAYROLL_UPDATED', handlePayrollUpdate);
            socket.on('HR_UPDATE', handleEmployeeUpdate);
            socket.on('ATTENDANCE_MARKED', handleAttendanceUpdate);
            return () => {
                socket.off('PAYROLL_GENERATED', handlePayrollUpdate);
                socket.off('PAYROLL_PAID', handlePayrollUpdate);
                socket.off('PAYROLL_UPDATED', handlePayrollUpdate);
                socket.off('HR_UPDATE', handleEmployeeUpdate);
                socket.off('ATTENDANCE_MARKED', handleAttendanceUpdate);
            };
        }
    }, [socket, fetchPayroll, fetchEmployees, fetchStaffForAttendance]);

    const processLeaveRequest = async (status: 'APPROVED' | 'REJECTED') => {
        if (!selectedLeave) return;
        try {
            await hrAPI.processLeave(selectedLeave.id, { status, remarks: processRemarks });
            toast({ title: 'Success', description: `Leave request ${status.toLowerCase()}` });
            setLeaveProcessDialog(false); fetchLeaves();
        } catch (err: any) { toast({ title: 'Error', description: err?.response?.data?.error || 'Failed', variant: 'destructive' }); }
    };

    const openReviewDialog = (emp: any) => {
        setReviewEmp(emp);
        setReviewForm({
            periodStart: '', periodEnd: '',
            ratings: { academic: 5, discipline: 5, punctuality: 5 },
            strengths: '', improvements: '', comments: ''
        });
        setReviewDialog(true);
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewEmp) return;
        setIsReviewSubmitting(true);
        try {
            await hrAPI.createReview({ employeeId: reviewEmp.id, ...reviewForm });
            toast({ title: 'Success', description: 'Performance review submitted' });
            setReviewDialog(false);
        } catch (err: any) { toast({ title: 'Error', description: err?.response?.data?.error || 'Failed', variant: 'destructive' });
        } finally { setIsReviewSubmitting(false); }
    };

    const downloadPayrollCSV = () => {
        if (payrolls.length === 0) return;
        const headers = ['Employee', 'Employee ID', 'Role', 'Basic Salary', 'Allowances', 'Deductions', 'LOP Amount', 'Net Salary', 'Status', 'Paid At'];
        const rows = payrolls.map(p => [
            `${p.employee?.firstName} ${p.employee?.lastName}`,
            p.employee?.teacher?.employeeId || p.employee?.staff?.employeeId || p.employee?.id,
            p.employee?.role, p.basicSalary, p.allowances, p.deductions, p.lopAmount || 0, p.netSalary,
            p.status, p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url); link.setAttribute('download', `payroll_${MONTHS[payMonth - 1]}_${payYear}.csv`);
        link.style.visibility = 'hidden'; document.body.appendChild(link);
        link.click(); document.body.removeChild(link);
    };

    const getEmployeeId = (emp: any) =>
        emp.teacher?.employeeId || emp.staff?.employeeId || `USR-${emp.id?.slice(-5).toUpperCase()}`;

    const getDesignation = (emp: any) => {
        if (emp.teacher) return `Teacher${emp.teacher.specialization ? ` (${emp.teacher.specialization})` : ''}`;
        if (emp.staff) return emp.staff.designation || emp.role;
        return (emp.roles?.length ? emp.roles : [emp.role]).join(' / ');
    };

    if (!canManageHR && !isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-24 glass rounded-[2rem]">
                <UserX className="h-12 w-12 text-rose-500/50 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Breach // Access Denied</p>
                <p className="text-slate-500 text-sm mt-2">HR management requires Tier-1 Admin clearance.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                      HR <span className="text-primary">Management</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Institutional Human Resources & Employee Directory</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={openCreate} className="h-12 px-6 rounded-2xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                        <Plus className="mr-2 h-4 w-4" /> Onboard Personnel
                    </Button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Personnel', value: totalEmployees, icon: Users, color: 'primary' },
                    { label: 'Active State', value: employees.filter(e => e.isActive).length, icon: UserCheck, color: 'emerald' },
                    { label: 'Faculty', value: employees.filter(e => e.role === 'TEACHER').length, icon: Briefcase, color: 'blue' },
                    { label: 'Operations', value: employees.filter(e => e.role !== 'TEACHER').length, icon: Settings, color: 'purple' }
                ].map((stat, i) => (
                    <motion.div 
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass premium-shadow p-6 rounded-[2rem] ring-1 ring-primary/5 flex flex-col items-center text-center group hover:ring-primary/20 transition-all"
                    >
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", 
                            stat.color === 'primary' ? 'bg-primary/10 text-primary' : 
                            stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                            stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                        )}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mt-1">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <Tabs defaultValue="employees" className="space-y-8">
                <TabsList className="bg-transparent border-none p-0 flex flex-wrap gap-2 h-auto">
                    {[
                        { id: 'employees', icon: Users, label: 'Employee Directory' },
                        { id: 'attendance', icon: CheckCircle, label: 'Presence Log' },
                        { id: 'leaves', icon: Clock, label: 'Time-Off Protocols' },
                        { id: 'payroll', icon: IndianRupee, label: 'Treasury Hub' },
                        { id: 'analytics', icon: BarChart, label: 'Analytics Hub' }
                    ].map((tab) => (
                        <TabsTrigger 
                            key={tab.id}
                            value={tab.id}
                            className="h-11 px-6 rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest data-[state=active]:premium-gradient data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all"
                        >
                            <tab.icon className="mr-2 h-4 w-4" /> {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* --- PERSONNEL REGISTRY --- */}
                <TabsContent value="employees">
                    <PremiumSection icon={Users} title="Personnel Registry" description="Identity management and role assignment matrix">
                        <div className="space-y-6">
                            {/* Search & Filters */}
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        placeholder="Scan by Identity, ID, or Protocol..." 
                                        className="pl-12 h-14 rounded-2xl glass border-none ring-1 ring-primary/10 focus:ring-primary/40 text-sm font-medium"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <select className="h-14 px-6 rounded-2xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest outline-none focus:ring-primary/40 transition-all min-w-[160px]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                        <option value="">All Tiers</option>
                                        <option value="TEACHER">Faculty</option>
                                        <option value="STAFF">Operations</option>
                                    </select>
                                    <select className="h-14 px-6 rounded-2xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest outline-none focus:ring-primary/40 transition-all min-w-[160px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                        <option value="">Any State</option>
                                        <option value="ACTIVE">Online</option>
                                        <option value="INACTIVE">Offline</option>
                                    </select>
                                </div>
                            </div>

                            {/* Main Table */}
                            <div className="overflow-hidden rounded-3xl ring-1 ring-primary/5 bg-white/5 backdrop-blur-xl">
                                <Table>
                                    <TableHeader className="bg-primary/5">
                                        <TableRow className="border-none hover:bg-transparent">
                                            <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Identity</TableHead>
                                            <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Protocol ID</TableHead>
                                            <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Tier / Role</TableHead>
                                            <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Treasury</TableHead>
                                            <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">State</TableHead>
                                            <TableHead className="h-14 text-right px-8 font-black text-primary uppercase text-[9px] tracking-widest">Control</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {isLoading ? (
                                                <TableRow><TableCell colSpan={6} className="py-24 text-center">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                                                </TableCell></TableRow>
                                            ) : employees.length === 0 ? (
                                                <TableRow><TableCell colSpan={6} className="py-24 text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Empty</p>
                                                </TableCell></TableRow>
                                            ) : (
                                                employees.map((emp, i) => (
                                                    <motion.tr 
                                                        key={emp.id} 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className="border-b border-primary/5 hover:bg-primary/5 transition-colors group"
                                                    >
                                                        <TableCell className="py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-11 w-11 rounded-2xl premium-gradient flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform">
                                                                    {emp.firstName[0]}{emp.lastName[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                                                                    <p className="text-[10px] text-slate-400 font-mono">{emp.email}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-[10px] text-slate-500">{getEmployeeId(emp)}</TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">{getDesignation(emp)}</p>
                                                                <div className="flex gap-1">
                                                                    {(emp.roles?.length ? emp.roles : [emp.role]).map((r: string) => (
                                                                        <Badge key={r} className="text-[8px] font-black uppercase px-2 py-0 border-none bg-primary/10 text-primary">{r}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-black text-xs text-slate-900">
                                                            {emp.salaryStructure ? `₹${emp.salaryStructure.grossSalary.toLocaleString()}` : <span className="opacity-30 italic">None</span>}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5 border-none", emp.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                                                                {emp.isActive ? "Online" : "Offline"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right px-8">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                                                                    <Link href={`/dashboard/users/${emp.userId || emp.id}`}><Eye size={16} /></Link>
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} className="h-9 w-9 rounded-xl hover:bg-blue-500/10 hover:text-blue-500">
                                                                    <Edit size={16} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => openSalaryDialog(emp)} className="h-9 w-9 rounded-xl hover:bg-amber-500/10 hover:text-amber-500">
                                                                    <IndianRupee size={16} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(emp)} className={cn("h-9 w-9 rounded-xl", emp.isActive ? "hover:bg-rose-500/10 hover:text-rose-500" : "hover:bg-emerald-500/10 hover:text-emerald-500")}>
                                                                    {emp.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </PremiumSection>
                </TabsContent>

                {/* --- PRESENCE LOG --- */}
                <TabsContent value="attendance">
                    <PremiumSection icon={CheckCircle} title="Presence Log" description="Institutional attendance protocols and real-time activity tracking">
                        <div className="space-y-8">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 glass p-6 rounded-3xl ring-1 ring-primary/5">
                                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                    <Input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10 font-bold text-sm w-full sm:w-48" disabled={isAttLoading} />
                                    <select className="h-12 px-6 rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest outline-none min-w-[160px]" value={attType} onChange={e => setAttType(e.target.value as any)} disabled={isAttLoading}>
                                        <option value="TEACHER">Faculty Hub</option>
                                        <option value="STAFF">Operations Hub</option>
                                    </select>
                                </div>
                                
                                {isAlreadyMarked ? (
                                    <Badge className="h-12 px-8 rounded-xl bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px] uppercase tracking-[0.2em]">
                                        PROTOCOL SUBMITTED
                                    </Badge>
                                ) : (
                                    <Button onClick={submitAttendance} disabled={isAttLoading || attList.length === 0} className="h-12 px-8 rounded-xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                                        {isAttLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />} Authorize Attendance
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {attList.map((item, i) => (
                                        <motion.div 
                                            key={item.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            className={cn("glass premium-shadow p-6 rounded-[2rem] border-none ring-1 transition-all group", 
                                                item.status === 'PRESENT' ? 'ring-emerald-500/20' : 
                                                item.status === 'ABSENT' ? 'ring-rose-500/20' : 
                                                item.status === 'LATE' ? 'ring-amber-500/20' : 'ring-primary/5'
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs uppercase">
                                                        {item.name.split(' ').map((n: string) => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900">{item.name}</p>
                                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{item.employeeId}</p>
                                                    </div>
                                                </div>
                                                {!item.status && <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Mark Required" />}
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { id: 'PRESENT', color: 'emerald' },
                                                    { id: 'ABSENT', color: 'rose' },
                                                    { id: 'LATE', color: 'amber' }
                                                ].map(s => (
                                                    <button
                                                        key={s.id}
                                                        disabled={isAlreadyMarked}
                                                        onClick={() => handleAttendanceChange(item.id, s.id)}
                                                        className={cn("h-10 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all", 
                                                            item.status === s.id ? 
                                                            (s.id === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                                                             s.id === 'ABSENT' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 
                                                             'bg-amber-500 text-white shadow-lg shadow-amber-500/20') : 
                                                            'bg-slate-100/50 hover:bg-slate-200/50 text-slate-500'
                                                        )}
                                                    >
                                                        {s.id}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </PremiumSection>
                </TabsContent>

                {/* --- TIME-OFF PROTOCOLS --- */}
                <TabsContent value="leaves">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <PremiumSection icon={Calendar} title="Deployment Matrix" description="Monthly personnel distribution calendar">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                                            if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
                                            else setViewMonth(m => m - 1);
                                        }}><ChevronLeft size={16} /></Button>
                                        <p className="text-[10px] font-black uppercase tracking-widest">{MONTHS[viewMonth - 1]} {viewYear}</p>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                                            if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
                                            else setViewMonth(m => m + 1);
                                        }}><ChevronRight size={16} /></Button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                            <div key={d} className="text-center text-[9px] font-black text-slate-400 py-2">{d}</div>
                                        ))}
                                        {Array.from({ length: firstDay }).map((_, i) => (
                                            <div key={`empty-${i}`} className="h-10 rounded-xl bg-slate-50/50" />
                                        ))}
                                        {Array.from({ length: daysInMonth }).map((_, i) => {
                                            const day = i + 1;
                                            const dayLeaves = getLeavesForDay(day);
                                            return (
                                                <div key={day} className={cn("h-10 rounded-xl relative flex items-center justify-center text-[10px] font-bold group hover:scale-110 transition-transform", 
                                                    dayLeaves.length > 0 ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "bg-slate-50 text-slate-400"
                                                )}>
                                                    {day}
                                                    {dayLeaves.length > 0 && <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary text-[8px] flex items-center justify-center text-white border-2 border-white">{dayLeaves.length}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </PremiumSection>
                        </div>
                        <div className="lg:col-span-2">
                            <PremiumSection icon={Clock} title="Protocol Requests" description="Personnel absence and leave authorization requests">
                                <div className="overflow-hidden rounded-3xl ring-1 ring-primary/5 bg-white/5 backdrop-blur-xl">
                                    <Table>
                                        <TableHeader className="bg-primary/5">
                                            <TableRow className="border-none">
                                                <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Requester</TableHead>
                                                <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Protocol Type</TableHead>
                                                <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Timeline</TableHead>
                                                <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Status</TableHead>
                                                <TableHead className="h-14 text-right px-8 font-black text-primary uppercase text-[9px] tracking-widest">Control</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {leaves.map((l, i) => (
                                                <TableRow key={l.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                                                    <TableCell className="py-4">
                                                        <p className="font-bold text-sm">{l.requester?.firstName} {l.requester?.lastName}</p>
                                                        <p className="text-[10px] font-black uppercase text-slate-400">{l.requester?.role}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-bold text-xs">{l.subject}</p>
                                                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{l.description}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-slate-700">{new Date(l.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                                            <span className="text-[9px] text-slate-400 uppercase tracking-widest">to {new Date(l.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5 border-none", 
                                                            l.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-500" : 
                                                            l.status === 'REJECTED' ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                                                        )}>
                                                            {l.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right px-8">
                                                        {(l.status === 'PENDING' || l.status.startsWith('PENDING_')) && canApproveLeaves && (
                                                            <Button size="sm" onClick={() => { setSelectedLeave(l); setLeaveProcessDialog(true); }} className="h-9 px-4 rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                                                                Authorize
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </PremiumSection>
                        </div>
                    </div>
                </TabsContent>

                {/* --- TREASURY HUB --- */}
                <TabsContent value="payroll">
                    <div className="space-y-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 glass p-6 rounded-3xl ring-1 ring-primary/5">
                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-xl">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg" onClick={() => {
                                        if (payMonth === 1) { setPayMonth(12); setPayYear(y => y - 1); }
                                        else setPayMonth(m => m - 1);
                                    }}><ChevronLeft size={18} /></Button>
                                    <p className="px-4 font-black text-[10px] uppercase tracking-widest">{MONTHS[payMonth - 1]} {payYear}</p>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg" onClick={() => {
                                        if (payMonth === 12) { setPayMonth(1); setPayYear(y => y + 1); }
                                        else setPayMonth(m => m + 1);
                                    }}><ChevronRight size={18} /></Button>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button variant="ghost" onClick={downloadPayrollCSV} className="h-12 px-6 rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest flex-1 sm:flex-none">
                                    <Download className="mr-2 h-4 w-4" /> Export Ledger
                                </Button>
                                <Button onClick={handleGeneratePayroll} disabled={isGenerating} className="h-12 px-6 rounded-xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex-1 sm:flex-none">
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Compile Treasury
                                </Button>
                            </div>
                        </div>

                        {payrollSummary && (
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Artifact Count', value: payrollSummary.total, color: 'primary' },
                                    { label: 'Liquidated', value: payrollSummary.paid, color: 'emerald' },
                                    { label: 'Pending Transmission', value: payrollSummary.pending, color: 'rose' },
                                    { label: 'Total Quantum', value: `₹${payrollSummary.totalAmount.toLocaleString()}`, color: 'blue' }
                                ].map((s, i) => (
                                    <motion.div 
                                        key={s.label}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="glass p-5 rounded-2xl ring-1 ring-primary/5 text-center"
                                    >
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                                        <p className={cn("text-xl font-black tracking-tight", 
                                            s.color === 'emerald' ? 'text-emerald-500' : 
                                            s.color === 'rose' ? 'text-rose-500' : 
                                            s.color === 'blue' ? 'text-blue-500' : 'text-slate-900'
                                        )}>{s.value}</p>
                                    </motion.div>
                                ))}
                             </div>
                        )}

                        <PremiumSection icon={IndianRupee} title="Treasury Ledger" description="Personnel compensation distribution and disbursement control">
                            <div className="overflow-hidden rounded-3xl ring-1 ring-primary/5 bg-white/5 backdrop-blur-xl">
                                <Table>
                                    <TableHeader className="bg-primary/5">
                                        <TableRow className="border-none">
                                            <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Personnel</TableHead>
                                            <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Base</TableHead>
                                            <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Protocol</TableHead>
                                            <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">Net Quantum</TableHead>
                                            <TableHead className="h-14 font-black text-primary uppercase text-[9px] tracking-widest">State</TableHead>
                                            <TableHead className="h-14 text-right px-8 font-black text-primary uppercase text-[9px] tracking-widest">Control</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payrolls.map((p, i) => (
                                            <TableRow key={p.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors group">
                                                <TableCell className="py-4">
                                                    <p className="font-bold text-sm text-slate-900">{p.employee?.firstName} {p.employee?.lastName}</p>
                                                    <p className="text-[9px] font-mono text-slate-400 uppercase">{p.employee?.teacher?.employeeId || p.employee?.staff?.employeeId || `USR-${p.employee?.id?.slice(-5)}`}</p>
                                                </TableCell>
                                                <TableCell className="text-xs font-bold text-slate-600">₹{p.basicSalary.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-emerald-500 font-bold">+₹{p.allowances.toLocaleString()}</span>
                                                        <span className="text-[9px] text-rose-500 font-bold">-₹{p.deductions.toLocaleString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-black text-sm text-slate-900">₹{p.netSalary.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5 border-none", 
                                                        p.status === 'PAID' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                    )}>
                                                        {p.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right px-8">
                                                    {p.status === 'PENDING' ? (
                                                        <Button size="sm" onClick={() => handleMarkPaid(p.id)} className="h-9 px-4 rounded-xl bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                                                            Mark Transmission
                                                        </Button>
                                                    ) : (
                                                        <span className="text-[9px] font-black uppercase text-slate-400 italic">Confirmed // {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Paid'}</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </PremiumSection>
                    </div>
                </TabsContent>

                {/* --- INSIGHTS ENGINE --- */}
                <TabsContent value="analytics">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <PremiumSection icon={BarChart} title="Presence Pulse" description="Staff activity and attendance trend vectors">
                            <RealtimeChart 
                                title="Institutional Velocity" 
                                description="Real-time attendance transmission percentage" 
                                endpoint="/dashboard/hr-stats" 
                                socketEvent="HR_UPDATE" 
                                type="area" 
                                dataKey="percentage" 
                                xAxisKey="day" 
                                color="#8b5cf6" 
                            />
                        </PremiumSection>
                        <PremiumSection icon={Users} title="Tier Distribution" description="Personnel allocation by institutional role">
                            <RealtimeChart 
                                title="Role Distribution" 
                                description="Faculty vs Operations quantum" 
                                endpoint="/dashboard/hr-stats" 
                                socketEvent="HR_UPDATE" 
                                type="bar" 
                                dataKey="count" 
                                xAxisKey="role" 
                                color="#3b82f6" 
                            />
                        </PremiumSection>
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- DIALOGS (MODERNIZED) --- */}
            <AnimatePresence>
                {empDialog && (
                    <Dialog open={empDialog} onOpenChange={setEmpDialog}>
                        <DialogContent className="max-w-2xl p-0 border-none bg-transparent">
                            <div className="glass premium-shadow rounded-[3rem] overflow-hidden border-none ring-1 ring-white/20">
                                <div className="bg-white p-8 border-b border-primary/10">
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Onboard <span className="text-primary">Employee</span></h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initialize identity record in Institutional Directory</p>
                                </div>
                                <div className="p-8 max-h-[70vh] overflow-y-auto">
                                    <form onSubmit={handleSubmitEmployee} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">First Identity</Label>
                                                <Input value={empForm.firstName} onChange={(e) => setEmpForm({ ...empForm, firstName: e.target.value })} required className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Last Identity</Label>
                                                <Input value={empForm.lastName} onChange={(e) => setEmpForm({ ...empForm, lastName: e.target.value })} required className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Link (Email)</Label>
                                            <Input type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} required disabled={!!editingEmp} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                        </div>
                                        {!editingEmp && (
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access Key (Password)</Label>
                                                <Input type="password" value={empForm.password} onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })} required className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Communication Node (Phone)</Label>
                                                <Input value={empForm.phone} onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Joining Timestamp</Label>
                                                <Input type="date" value={empForm.joiningDate} onChange={(e) => setEmpForm({ ...empForm, joiningDate: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Institutional Tier</Label>
                                            <select className="w-full h-12 px-4 rounded-xl glass border-none ring-1 ring-primary/10 font-bold text-sm outline-none" value={empForm.role} onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })} disabled={!!editingEmp}>
                                                {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>

                                        {empForm.role === 'TEACHER' ? (
                                            <div className="space-y-6 pt-4 border-t border-primary/5">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Faculty Credentials</Label>
                                                    <Input placeholder="e.g., B.Ed, PhD" value={empForm.qualification} onChange={(e) => setEmpForm({ ...empForm, qualification: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Experience Vectors (Years)</Label>
                                                        <Input type="number" value={empForm.experience} onChange={(e) => setEmpForm({ ...empForm, experience: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subject Core</Label>
                                                        <Input placeholder="e.g., Quantum Physics" value={empForm.specialization} onChange={(e) => setEmpForm({ ...empForm, specialization: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-primary/5">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operational Designation</Label>
                                                    <Input placeholder="e.g., Core Accountant" value={empForm.designation} onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Functional Segment</Label>
                                                    <Input placeholder="e.g., Treasury" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3 pt-6 border-t border-primary/5">
                                            <Button type="button" variant="ghost" onClick={() => setEmpDialog(false)} className="h-12 px-8 rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest">Cancel</Button>
                                            <Button type="submit" disabled={isSubmitting} className="h-12 px-8 rounded-xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : editingEmp ? 'Authorize Update' : 'Authorize Onboarding'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            {/* --- PERFORMANCE REVIEW DIALOG --- */}
            <AnimatePresence>
                {reviewDialog && (
                    <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
                        <DialogContent className="max-w-xl p-0 border-none bg-transparent">
                            <div className="glass premium-shadow rounded-[3rem] overflow-hidden border-none ring-1 ring-white/20">
                                <div className="bg-white p-8 border-b border-primary/10">
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Performance <span className="text-primary">Review</span></h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Record personnel evaluation and feedback</p>
                                </div>
                                <div className="p-8">
                                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Period Start</Label>
                                                <Input type="date" value={reviewForm.periodStart} onChange={(e) => setReviewForm({ ...reviewForm, periodStart: e.target.value })} required className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Period End</Label>
                                                <Input type="date" value={reviewForm.periodEnd} onChange={(e) => setReviewForm({ ...reviewForm, periodEnd: e.target.value })} required className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rating Matrix</Label>
                                            {Object.entries(reviewForm.ratings).map(([key, value]) => (
                                                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-primary/5">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{key}</span>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map((v) => (
                                                            <button
                                                                key={v}
                                                                type="button"
                                                                onClick={() => setReviewForm({
                                                                    ...reviewForm,
                                                                    ratings: { ...reviewForm.ratings, [key]: v }
                                                                })}
                                                                className={cn("h-8 w-8 rounded-lg font-bold text-xs transition-all", 
                                                                    value === v ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-slate-400 hover:bg-slate-50"
                                                                )}
                                                            >
                                                                {v}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Core Strengths</Label>
                                            <Input value={reviewForm.strengths} onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Improvement Vectors</Label>
                                            <Input value={reviewForm.improvements} onChange={(e) => setReviewForm({ ...reviewForm, improvements: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-6 border-t border-primary/5">
                                            <Button type="button" variant="ghost" onClick={() => setReviewDialog(false)} className="h-12 px-8 rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest">Cancel</Button>
                                            <Button type="submit" disabled={isReviewSubmitting} className="h-12 px-8 rounded-xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                                                {isReviewSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Authorize Review'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            {/* --- LEAVE PROCESS DIALOG --- */}
            <AnimatePresence>
                {leaveProcessDialog && (
                    <Dialog open={leaveProcessDialog} onOpenChange={setLeaveProcessDialog}>
                        <DialogContent className="max-w-md p-0 border-none bg-transparent">
                            <div className="glass premium-shadow rounded-[3rem] overflow-hidden border-none ring-1 ring-white/20">
                                <div className="bg-white p-8 border-b border-primary/10">
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Leave <span className="text-primary">Authorization</span></h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Process protocol request</p>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Authorization Remarks</Label>
                                        <Input value={processRemarks} onChange={(e) => setProcessRemarks(e.target.value)} placeholder="Enter protocol decision remarks..." className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button onClick={() => processLeaveRequest('REJECTED')} className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20">Reject</Button>
                                        <Button onClick={() => processLeaveRequest('APPROVED')} className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20">Approve</Button>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            {/* --- SALARY CONFIG DIALOG --- */}
            <AnimatePresence>
                {salaryDialog && (
                    <Dialog open={salaryDialog} onOpenChange={setSalaryDialog}>
                        <DialogContent className="max-w-md p-0 border-none bg-transparent">
                            <div className="glass premium-shadow rounded-[3rem] overflow-hidden border-none ring-1 ring-white/20">
                                <div className="bg-white p-8 border-b border-primary/10">
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Treasury <span className="text-primary">Config</span></h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configure personnel compensation matrix</p>
                                </div>
                                <div className="p-8">
                                    <form onSubmit={handleSaveSalary} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Basic Quantum</Label>
                                            <Input type="number" value={salaryForm.basicSalary} onChange={(e) => setSalaryForm({ ...salaryForm, basicSalary: e.target.value })} required className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Allowances</Label>
                                            <Input type="number" value={salaryForm.allowances} onChange={(e) => setSalaryForm({ ...salaryForm, allowances: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deductions</Label>
                                            <Input type="number" value={salaryForm.deductions} onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })} className="h-12 rounded-xl glass border-none ring-1 ring-primary/10" />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-6 border-t border-primary/5">
                                            <Button type="button" variant="ghost" onClick={() => setSalaryDialog(false)} className="h-12 px-8 rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest">Cancel</Button>
                                            <Button type="submit" disabled={isSalarySubmitting} className="h-12 px-8 rounded-xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                                                {isSalarySubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Matrix'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>
        </div>
    );
}
