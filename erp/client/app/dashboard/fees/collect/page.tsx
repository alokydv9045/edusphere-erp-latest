'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { feeAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Search, ArrowRight, Banknote, UserRoundCheck } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
interface FeeStudent {
  id: string;
  admissionNumber: string;
  name: string;
  className: string;
  sectionName: string;
  feeStatus: string;
  totalPending: number;
}

import { PremiumSection } from '@/components/dashboard/PremiumSection';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeeCollectSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FeeStudent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { canCollectFees } = usePermissions();

  useEffect(() => {
    if (canCollectFees === false) { router.push('/dashboard/fees'); }
  }, [canCollectFees, router]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = searchQuery;
      if (!query || query.trim().length === 0) {
        setResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);
      try {
        const data = await feeAPI.getFeeStudents({ search: query, limit: 10 });
        setResults(data.students || []);
      } catch (err) {
        console.error('Student search failed', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PAID: 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20',
      PENDING: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20',
      PARTIAL: 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20',
      OVERDUE: 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20',
    };
    return variants[status] || 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20';
  };

  if (canCollectFees === false) { return null; }

  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
            >
                <div className="h-2 w-8 bg-primary rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Financial Intake</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              Fee <span className="text-primary">Counter</span>
            </h1>
        </div>
        <Button variant="ghost" asChild className="rounded-xl glass border-none ring-1 ring-primary/10 font-black text-[10px] uppercase tracking-widest hover:bg-primary/5">
          <Link href="/dashboard/fees">
            <ArrowLeft className="mr-2 h-4 w-4 text-primary" /> Return to Dashboard
          </Link>
        </Button>
      </div>

      <PremiumSection title="Ledger Search" icon={<Search className="h-5 w-5" />}>
        <div className="glass premium-shadow p-8 md:p-12 rounded-[3rem] space-y-10 border-none ring-1 ring-primary/5">
            <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Identification</p>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                      <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Admission Ref, Name, or Identity..."
                      value={searchQuery}
                      onChange={handleInputChange}
                      className="pl-16 h-20 text-xl rounded-[2rem] glass border-none ring-1 ring-primary/10 focus:ring-primary/40 font-black placeholder:text-slate-400 placeholder:font-medium transition-all shadow-inner"
                      autoFocus
                    />
                    <AnimatePresence>
                        {isSearching && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none"
                          >
                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                          </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="bg-primary/5 rounded-[2rem] overflow-hidden min-h-[300px]">
              {!hasSearched && !isSearching && (
                <div className="py-24 text-center space-y-6">
                  <div className="bg-white dark:bg-slate-800 h-20 w-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl ring-1 ring-primary/5">
                    <UserRoundCheck className="h-10 w-10 text-primary/40" />
                  </div>
                  <div>
                      <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Ready for Processing</p>
                      <p className="text-sm text-slate-500 mt-2">Initialize search protocol to fetch institutional ledger data.</p>
                  </div>
                </div>
              )}

              {hasSearched && !isSearching && results.length === 0 && (
                <div className="py-24 text-center space-y-4">
                  <p className="text-rose-500 font-black uppercase tracking-widest text-xl">Uplink Void</p>
                  <p className="text-slate-500 text-sm italic">No identities found matching the search vector.</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="divide-y divide-primary/5">
                  <AnimatePresence mode="popLayout">
                    {results.map((student, idx) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 hover:bg-white/10 transition-all cursor-pointer"
                        onClick={() => router.push(`/dashboard/fees/collect/${student.id}`)}
                      >
                        <div className="flex gap-6">
                          <div className="bg-primary/10 text-primary h-14 w-14 rounded-2xl hidden sm:flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all ring-1 ring-primary/10">
                            <Banknote className="h-7 w-7" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                              {student.name}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="font-mono bg-white/40 px-2 py-0.5 rounded-lg text-[10px] font-bold text-primary ring-1 ring-primary/10">
                                {student.admissionNumber}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Tier: {student.className} {student.sectionName !== 'N/A' && `// ${student.sectionName}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 sm:mt-0 flex w-full sm:w-auto items-center justify-between sm:justify-end gap-10">
                          <div className="flex flex-col items-start sm:items-end gap-2">
                            <Badge className={cn("text-[9px] font-black uppercase px-4 py-1.5 border-none shadow-sm", getStatusBadge(student.feeStatus))}>
                              {student.feeStatus}
                            </Badge>
                            {student.totalPending > 0 && (
                              <span className="text-xs font-black text-rose-500 uppercase tracking-widest">
                                DEBT: ₹{student.totalPending.toLocaleString()}
                              </span>
                            )}
                          </div>

                          <Button size="icon" className="h-12 w-12 rounded-2xl bg-white text-primary ring-1 ring-primary/10 hover:bg-primary hover:text-white transition-all shadow-lg group-hover:scale-110">
                            <ArrowRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
        </div>
      </PremiumSection>
    </div>
  );
}

