'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { feeAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, IndianRupee, Printer, Download, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { ReceiptPrinter, ReceiptData } from '@/components/fees/ReceiptPrinter';
import { cn } from '@/lib/utils';

import { PremiumSection } from '@/components/dashboard/PremiumSection';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentFeeProfile({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = React.use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [studentData, setStudentData] = useState<any>(null);
    const [activeLedgerId, setActiveLedgerId] = useState<string>('');

    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('CASH');
    const [transactionId, setTransactionId] = useState<string>('');
    const [remarks, setRemarks] = useState<string>('');

    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

    const { canCollectFees } = usePermissions();
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (canCollectFees === false) { router.push('/dashboard/fees'); }
    }, [canCollectFees, router]);

    useEffect(() => { if (studentId) fetchStudentProfile(); }, [studentId]);

    const fetchStudentProfile = async () => {
        setIsLoading(true);
        try {
            const data = await feeAPI.getStudentStatus(studentId);
            setStudentData(data);
            if (data.ledgers && data.ledgers.length > 0) { setActiveLedgerId(data.ledgers[0].id); }
        } catch (err) { console.error('Failed to fetch student fee profile', err);
        } finally { setIsLoading(false); }
    };

    const getActiveLedger = () => {
        if (!studentData || !studentData.ledgers) return null;
        return studentData.ledgers.find((l: any) => l.id === activeLedgerId) || studentData.ledgers[0];
    };

    const validatePayment = (): string | null => {
        const amount = parseFloat(paymentAmount);
        const ledger = getActiveLedger();
        if (!ledger) return "No fee structure selected.";
        if (isNaN(amount) || amount <= 0) return "Please enter a valid amount greater than 0.";
        if (amount > ledger.totalPending) return `Amount cannot exceed the pending balance of ₹${ledger.totalPending.toLocaleString()}.`;
        if (paymentMode !== 'CASH' && !transactionId.trim()) return `Transaction/Reference ID is required for ${paymentMode}.`;
        return null;
    };

    const handleCollectFee = async (e: React.FormEvent) => {
        e.preventDefault();
        const errorMsg = validatePayment();
        if (errorMsg) { alert(errorMsg); return; }
        setIsProcessing(true);
        try {
            const activeLedger = getActiveLedger();
            const amountNum = parseFloat(paymentAmount);
            const response = await feeAPI.createPayment({
                studentId, ledgerId: activeLedger.id, amount: amountNum,
                paymentMode, transactionId, remarks,
            });
            const newReceipt: ReceiptData = {
                receiptNumber: response.payment?.receiptNumber || `REC${Date.now()}`,
                date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
                student: {
                    name: `${studentData.student.user.firstName} ${studentData.student.user.lastName}`,
                    admissionNumber: studentData.student.admissionNumber,
                    class: studentData.student.currentClass?.name || 'N/A',
                    section: studentData.student.section?.name || '',
                },
                payment: {
                    amount: amountNum, mode: paymentMode, transactionId: transactionId || undefined,
                    feeStructureName: activeLedger.feeStructure.name, remarks: remarks || undefined,
                }
            };
            setReceiptData(newReceipt); setShowReceipt(true);
            await fetchStudentProfile();
            setPaymentAmount(''); setTransactionId(''); setRemarks('');
        } catch (err: any) { alert(err.response?.data?.message || 'Failed to process payment.');
        } finally { setIsProcessing(false); }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('receipt-print-area');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compiling Treasury Ledger...</p>
            </div>
        );
    }

    if (!studentData || !studentData.student) {
        return (
          <div className="space-y-8">
            <Button variant="ghost" onClick={() => router.back()} className="rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Base
            </Button>
            <div className="glass premium-shadow p-12 rounded-[2rem] text-center">
                <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <p className="text-rose-500 font-black uppercase tracking-widest">Ledger Fault</p>
                <p className="text-slate-400 text-sm mt-2">Target Identity not found in Treasury Matrix.</p>
            </div>
          </div>
        );
    }

    const { student, summary } = studentData;
    const activeLedger = getActiveLedger();

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()} className="rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest hover:bg-primary/5">
                        <ArrowLeft className="h-4 w-4 text-primary" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                          Treasury <span className="text-primary">Console</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Terminal // Fee Intake Protocol active</p>
                    </div>
                </div>
                <div className="flex gap-4">
                     <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px] px-4 py-2 rounded-xl">
                        PAID: ₹{(summary?.totalPaid || 0).toLocaleString()}
                    </Badge>
                    <Badge className="bg-rose-500/10 text-rose-500 border-none font-black text-[10px] px-4 py-2 rounded-xl">
                        DUE: ₹{(summary?.totalDue ?? summary?.totalPending ?? 0).toLocaleString()}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Ledger History */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass premium-shadow rounded-[2.5rem] p-8 border-none ring-1 ring-primary/10"
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    {student.user.firstName} <span className="text-primary">{student.user.lastName}</span>
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                                    REF: {student.admissionNumber} // TIER: {student.currentClass?.name} {student.section && `(${student.section.name})`}
                                </p>
                            </div>
                            
                            <Select value={activeLedgerId} onValueChange={setActiveLedgerId}>
                                <SelectTrigger className="h-12 w-full sm:w-[280px] rounded-2xl glass border-none ring-1 ring-primary/10 font-black uppercase text-[10px] tracking-widest">
                                    <SelectValue placeholder="Select Segment" />
                                </SelectTrigger>
                                <SelectContent className="glass border-none ring-1 ring-primary/10 rounded-2xl">
                                    {studentData.ledgers.map((l: any) => (
                                        <SelectItem key={l.id} value={l.id} className="font-bold text-xs uppercase">
                                            {l.feeStructure.name} {l.totalPending === 0 ? ' (COMPLETED)' : ` (DUE ₹${l.totalPending})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="overflow-hidden rounded-2xl ring-1 ring-primary/5">
                            <Table>
                                <TableHeader className="bg-primary/5">
                                    <TableRow className="border-none hover:bg-transparent">
                                        <TableHead className="h-12 font-black text-primary uppercase text-[9px] tracking-widest">Timestamp</TableHead>
                                        <TableHead className="h-12 font-black text-primary uppercase text-[9px] tracking-widest">Artifact ID</TableHead>
                                        <TableHead className="h-12 font-black text-primary uppercase text-[9px] tracking-widest">Protocol / Ref</TableHead>
                                        <TableHead className="h-12 text-right font-black text-primary uppercase text-[9px] tracking-widest">Quantum</TableHead>
                                        <TableHead className="h-12 text-right px-6 font-black text-primary uppercase text-[9px] tracking-widest">State</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {activeLedger?.payments?.length > 0 ? (
                                            activeLedger.payments.map((payment: any, i: number) => (
                                                <motion.tr 
                                                    key={payment.id} 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    className="border-b border-primary/5 hover:bg-primary/5 transition-colors"
                                                >
                                                    <TableCell className="font-bold text-xs py-5">
                                                        {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-[10px] text-slate-500">{payment.receiptNumber}</TableCell>
                                                    <TableCell>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">{payment.paymentMode}</p>
                                                            {payment.transactionId && (
                                                                <p className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]">#{payment.transactionId}</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-xs text-slate-900 dark:text-white">
                                                        ₹{payment.amount.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right px-6">
                                                        <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5 border-none", 
                                                            payment.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                                        )}>
                                                            {payment.status}
                                                        </Badge>
                                                    </TableCell>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-24 text-center">
                                                    <div className="space-y-3 opacity-20">
                                                        <IndianRupee className="h-10 w-10 mx-auto" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero Transactions Detected</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Intake Panel */}
                <div className="lg:col-span-1">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="sticky top-10 glass premium-shadow rounded-[2.5rem] overflow-hidden border-none ring-1 ring-primary/10"
                    >
                        <div className="bg-primary/5 p-8 border-b border-primary/10">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <IndianRupee className="h-5 w-5 text-primary" /> Collect Quantum
                            </h2>
                        </div>

                        <div className="p-8 space-y-8">
                            {activeLedger?.totalPending === 0 ? (
                                <div className="py-12 text-center space-y-4">
                                    <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto ring-1 ring-emerald-500/20">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-emerald-500 uppercase tracking-tighter italic">Ledger Cleared</h3>
                                        <p className="text-xs text-slate-500 mt-2">Zero pending liability detected for this segment.</p>
                                    </div>
                                </div>
                            ) : activeLedger ? (
                                <form onSubmit={handleCollectFee} className="space-y-6">
                                    <div className="bg-rose-500/5 p-6 rounded-2xl ring-1 ring-rose-500/10 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Liability:</span>
                                        <span className="text-2xl font-black text-rose-500 tracking-tighter italic">₹{activeLedger.totalPending.toLocaleString()}</span>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment Quantum *</Label>
                                        <div className="relative group">
                                            <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                max={activeLedger.totalPending}
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="pl-12 h-14 text-xl font-black rounded-2xl glass border-none ring-1 ring-primary/10 focus:ring-primary/40 shadow-inner"
                                                required
                                                disabled={isProcessing}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transmission Mode *</Label>
                                        <Select value={paymentMode} onValueChange={setPaymentMode} disabled={isProcessing}>
                                            <SelectTrigger className="h-14 rounded-2xl glass border-none ring-1 ring-primary/10 font-black uppercase text-[10px] tracking-widest">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="glass border-none ring-1 ring-primary/10 rounded-2xl">
                                                <SelectItem value="CASH" className="font-bold text-xs uppercase">Physical Cash</SelectItem>
                                                <SelectItem value="UPI" className="font-bold text-xs uppercase">UPI / QR Link</SelectItem>
                                                <SelectItem value="BANK_TRANSFER" className="font-bold text-xs uppercase">Net Banking</SelectItem>
                                                <SelectItem value="CHEQUE" className="font-bold text-xs uppercase">Institutional Cheque</SelectItem>
                                                <SelectItem value="CARD" className="font-bold text-xs uppercase">Terminal Card</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <AnimatePresence>
                                        {paymentMode !== 'CASH' && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-3"
                                            >
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transaction ID *</Label>
                                                <Input
                                                    value={transactionId}
                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                    placeholder="UTR / REF ID"
                                                    className="h-12 rounded-xl glass border-none ring-1 ring-primary/10 font-mono text-xs uppercase"
                                                    required
                                                    disabled={isProcessing}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Annotations</Label>
                                        <Input
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="System notes..."
                                            className="h-12 rounded-xl glass border-none ring-1 ring-primary/10 font-medium text-xs"
                                            disabled={isProcessing}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full h-16 rounded-[1.5rem] premium-gradient text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50" disabled={isProcessing || !paymentAmount}>
                                        {isProcessing ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            'Authorize Intake'
                                        )}
                                    </Button>
                                </form>
                            ) : null}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Receipt Dialogue */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="max-w-4xl p-0 border-none bg-transparent overflow-hidden">
                    <div className="glass premium-shadow rounded-[3rem] overflow-hidden border-none ring-1 ring-white/20">
                        <div className="bg-white p-8 border-b border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Intake Authorized</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction artifact generated successfully.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setShowReceipt(false)} className="h-11 px-6 rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest">
                                    Dismiss
                                </Button>
                                <Button onClick={handlePrint} className="h-11 px-6 rounded-xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                                    <Printer className="mr-2 h-4 w-4" /> Print Artifact
                                </Button>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900/50 backdrop-blur-3xl overflow-y-auto max-h-[70vh]">
                            <div id="receipt-print-area" className="bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] rounded-2xl mx-auto max-w-[800px] overflow-hidden transform transition-all hover:scale-[1.01]">
                                {receiptData && <ReceiptPrinter data={receiptData} />}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

