'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Coffee, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { hrAPI } from '@/lib/api/hr';
import { toast } from 'sonner';

interface LeavesTabProps {
    leaveBalances: any;
    leaveRequests: any;
}

export default function LeavesTab({ leaveBalances, leaveRequests }: LeavesTabProps) {
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
    const [leaveForm, setLeaveForm] = useState({
        leaveType: 'CASUAL_LEAVE', startDate: '', endDate: '', subject: '', description: '', priority: 'NORMAL'
    });

    const handleLeaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingLeave(true);
        try {
            await hrAPI.requestLeave({
                ...leaveForm,
                metadata: { ...leaveForm, days: Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 }
            });
            setIsLeaveModalOpen(false);
            toast.success('Leave application submitted successfully!');
            leaveRequests.refetch();
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit leave request');
        } finally {
            setIsSubmittingLeave(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {leaveBalances.data?.map((bal: any) => (
                <Card key={bal.id} className="rounded-3xl border-none shadow-md p-6 group hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                            <Coffee size={24} />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Remaining</p>
                            <p className="text-2xl font-black">{bal.remaining}</p>
                        </div>
                    </div>
                    <h4 className="font-black text-lg text-slate-800 dark:text-slate-200">{bal.leaveType.split('_').join(' ')}</h4>
                    <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center text-xs opacity-60 font-bold">
                        <span>Consumed: {bal.consumed}</span>
                        <span>Total: {bal.total}</span>
                    </div>
                </Card>
            ))}

            <Card className="rounded-3xl border-4 border-dashed border-primary/20 bg-background hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-6 space-y-2" onClick={() => setIsLeaveModalOpen(true)}>
                <div className="p-4 rounded-full bg-primary/10 text-primary"><Plus size={32} /></div>
                <span className="font-black text-primary uppercase text-xs tracking-widest">Apply New Leave</span>
            </Card>

            <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary p-6 text-primary-foreground">
                        <DialogTitle className="text-2xl font-black flex items-center gap-2"><Coffee size={24} /> New Leave Request</DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 font-medium">Submit your leave application for review.</DialogDescription>
                    </div>
                    <form onSubmit={handleLeaveSubmit} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Leave Type</Label>
                                <Select onValueChange={(v) => setLeaveForm({...leaveForm, leaveType: v})} required>
                                    <SelectTrigger className="rounded-xl border-muted bg-muted/30"><SelectValue placeholder="Select Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CL">Casual Leave</SelectItem>
                                        <SelectItem value="SL">Sick Leave</SelectItem>
                                        <SelectItem value="ML">Maternity/Paternity Leave</SelectItem>
                                        <SelectItem value="EL">Earned Leave</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Priority</Label>
                                <Select onValueChange={(v) => setLeaveForm({...leaveForm, priority: v})} defaultValue="NORMAL">
                                    <SelectTrigger className="rounded-xl border-muted bg-muted/30"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="NORMAL">Normal</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Start Date</Label>
                                <Input type="date" className="rounded-xl border-muted bg-muted/30" required onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase tracking-widest opacity-70">End Date</Label>
                                <Input type="date" className="rounded-xl border-muted bg-muted/30" required onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Reason / Subject</Label>
                            <Input placeholder="Short reason for leave" className="rounded-xl border-muted bg-muted/30" required onChange={(e) => setLeaveForm({...leaveForm, subject: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Description</Label>
                            <Textarea placeholder="Provide more details if necessary..." className="rounded-xl border-muted bg-muted/30 min-h-[100px]" onChange={(e) => setLeaveForm({...leaveForm, description: e.target.value})} />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" className="rounded-xl font-bold" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="rounded-xl font-black px-8 shadow-lg shadow-primary/20" disabled={isSubmittingLeave}>
                                {isSubmittingLeave ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                                Submit Application
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Card className="lg:col-span-4 rounded-3xl border-none shadow-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-3">
                    <div>
                        <CardTitle className="text-lg font-bold">Request History</CardTitle>
                        <CardDescription>All your submitted leave applications</CardDescription>
                    </div>
                </CardHeader>
                <Table>
                    <TableHeader className="bg-muted/10">
                        <TableRow>
                            <TableHead className="font-black">Request ID</TableHead>
                            <TableHead className="font-black">Type</TableHead>
                            <TableHead className="font-black">Duration</TableHead>
                            <TableHead className="font-black">Status</TableHead>
                            <TableHead className="text-right font-black">Applied On</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaveRequests.data?.map((req: any) => (
                            <TableRow key={req.id} className="h-16">
                                <TableCell className="font-mono font-bold text-xs opacity-60">#{req.requestNumber}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-700 dark:text-slate-300">{req.subject}</span>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase">{req.metadata?.leaveType || 'General'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Calendar size={14} className="text-muted-foreground" />
                                        {format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd')}
                                        <Badge variant="outline" className="text-[10px] ml-1 opacity-60">({req.metadata?.days || '1'} Days)</Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={`${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'} shadow-none border-none px-3 py-1 font-black`}>
                                        {req.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium opacity-60">{format(new Date(req.createdAt), 'PPP')}</TableCell>
                            </TableRow>
                        ))}
                        {(!leaveRequests.data || leaveRequests.data.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground font-medium italic">No leave requests found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
