'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, Building2, CheckCircle2, Download, Eye, History } from 'lucide-react';
import { format } from 'date-fns';

interface PayrollTabProps {
    payroll: any;
    staffData: any;
}

export default function PayrollTab({ payroll, staffData }: PayrollTabProps) {
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {payroll.data && payroll.data.length > 0 ? (
                <Card className="lg:col-span-2 rounded-3xl border-none shadow-md overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-white p-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest opacity-70">Earnings for {(payroll.data[0] as any).monthShort} {(payroll.data[0] as any).year}</p>
                            <h2 className="text-5xl font-black mt-2">₹{(payroll.data[0] as any).netSalary.toLocaleString()}<span className="text-xl font-normal opacity-60">.00</span></h2>
                            <div className="flex items-center gap-2 mt-2 font-bold opacity-80">
                                <CheckCircle2 size={16} /> Credited on {format(new Date((payroll.data[0] as any).paidAt || new Date()), 'MMM dd')}
                            </div>
                        </div>
                        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
                            <Banknote size={40} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-10">
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <p className="text-[10px] font-black uppercase opacity-60">Gross Salary</p>
                            <p className="text-xl font-bold">₹{(payroll.data[0] as any).basicSalary.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <p className="text-[10px] font-black uppercase opacity-60">Deductions</p>
                            <p className="text-xl font-bold">-₹{(payroll.data[0] as any).deductions.toLocaleString()}</p>
                        </div>
                    </div>
                </Card>
            ) : (
                <Card className="lg:col-span-2 rounded-3xl border-none shadow-md overflow-hidden bg-slate-100 p-8 flex items-center justify-center italic text-muted-foreground">
                    No payroll records found.
                </Card>
            )}

            <Card className="lg:col-span-2 rounded-3xl border-none shadow-md p-6 bg-slate-50 dark:bg-slate-900 shadow-inner">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg font-bold flex items-center justify-between">
                        Salary Structure
                        <Badge variant="outline" className="border-primary/20">Monthly</Badge>
                    </CardTitle>
                </CardHeader>
                <div className="space-y-4">
                    {[['Basic Salary', '₹45,000'], ['HRA Allowance', '₹18,000']].map(([label, val]) => (
                        <div key={label} className="flex justify-between py-2 border-b border-dashed">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{label}</span>
                            <span className="font-black">{val}</span>
                        </div>
                    ))}
                    {[['Provident Fund (PF)', '-₹1,800'], ['Professional Tax', '-₹200']].map(([label, val]) => (
                        <div key={label} className="flex justify-between py-2 border-b border-dashed">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{label}</span>
                            <span className="font-black text-destructive">{val}</span>
                        </div>
                    ))}
                </div>
                <Button className="w-full mt-6 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-black hover:opacity-90 transition-opacity font-bold">
                    View Full Structure
                </Button>
            </Card>

            <Card className="lg:col-span-4 rounded-3xl border-none shadow-md overflow-hidden mt-2">
                <div className="p-6 border-b flex items-center justify-between bg-muted/10">
                    <h3 className="text-lg font-bold flex items-center gap-2"><History size={18} /> Payout Lifecycle</h3>
                </div>
                <Table>
                    <TableHeader className="bg-muted/10">
                        <TableRow>
                            <TableHead className="font-black">Period</TableHead>
                            <TableHead className="font-black">Net Salary</TableHead>
                            <TableHead className="font-black">Status</TableHead>
                            <TableHead className="font-black">Paid On</TableHead>
                            <TableHead className="text-right font-black">Payslip</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payroll.data?.map((p: any) => (
                            <TableRow key={p.id} className="h-16 group">
                                <TableCell className="font-bold">{p.monthShort || 'April'} {p.year}</TableCell>
                                <TableCell><span className="font-black text-md">₹{p.netSalary.toLocaleString()}</span></TableCell>
                                <TableCell>
                                    <Badge className={`${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'} px-3 shadow-none border-none font-black`}>{p.status}</Badge>
                                </TableCell>
                                <TableCell className="opacity-60 text-sm font-medium">{p.paidDate ? format(new Date(p.paidDate), 'PPP') : 'Processing...'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all"><Download size={18} /></Button>
                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all ml-1" onClick={() => { setSelectedPayroll(p); setIsPayslipModalOpen(true); }}><Eye size={18} /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!payroll.data || payroll.data.length === 0) && (
                            <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground font-medium italic">Your payroll history will appear here once generated.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Payslip View Dialog */}
            <Dialog open={isPayslipModalOpen} onOpenChange={setIsPayslipModalOpen}>
                <DialogContent className="sm:max-w-[700px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    {selectedPayroll && (
                        <>
                            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-primary rounded-lg"><Building2 size={24} /></div>
                                        <span className="text-xl font-black tracking-tighter uppercase">EduSphere ERP</span>
                                    </div>
                                    <h3 className="text-2xl font-black">Salary Slip: {selectedPayroll.monthShort} {selectedPayroll.year}</h3>
                                    <p className="text-slate-400 font-medium">Employee ID: {staffData?.employeeId || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-black mb-2 px-3 py-1">PAID</Badge>
                                    <p className="text-slate-400 text-sm">{selectedPayroll.paidDate ? format(new Date(selectedPayroll.paidDate), 'PPP') : 'Processing'}</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <h4 className="font-black text-xs uppercase tracking-widest text-primary">Earnings</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm py-1 border-b border-dashed"><span>Basic Salary</span><span className="font-bold">₹{selectedPayroll.basicSalary?.toLocaleString() || '45,000'}</span></div>
                                            <div className="flex justify-between text-sm py-1 border-b border-dashed"><span>Allowances (HRA)</span><span className="font-bold">₹{selectedPayroll.allowances?.toLocaleString() || '18,500'}</span></div>
                                            <div className="flex justify-between text-sm py-1 border-b border-dashed text-primary bg-primary/5 px-2 -mx-2 rounded"><span className="font-black">Gross Income</span><span className="font-black">₹{((selectedPayroll.basicSalary || 45000) + (selectedPayroll.allowances || 18500)).toLocaleString()}</span></div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-black text-xs uppercase tracking-widest text-destructive">Deductions</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm py-1 border-b border-dashed"><span>Prof. Tax</span><span className="font-bold">₹200</span></div>
                                            <div className="flex justify-between text-sm py-1 border-b border-dashed"><span>PF / Pension</span><span className="font-bold">₹1,800</span></div>
                                            <div className="flex justify-between text-sm py-1 border-b border-dashed text-destructive bg-destructive/5 px-2 -mx-2 rounded"><span className="font-black">Total Deductions</span><span className="font-black">₹2,000</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t-4 border-slate-900 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Payable Amount</p>
                                        <h2 className="text-4xl font-black">₹{selectedPayroll.netSalary.toLocaleString()}<span className="text-sm font-normal opacity-50">.00</span></h2>
                                        <p className="text-xs italic text-muted-foreground font-medium mt-1">Amount credited to BANK AC ***1234</p>
                                    </div>
                                    <Button className="rounded-2xl gap-2 font-black h-12 px-6"><Download size={20} /> Download PDF</Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
