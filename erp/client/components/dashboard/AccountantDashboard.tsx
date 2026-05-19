'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { dashboardAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useSocket } from '@/hooks/useSocket';

import {
    AccountantStats,
    KpiCards,
    QuickActions,
    RecentTransactions,
    CollectionTrend,
    DefaultersList
} from './accountant';

export function AccountantDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<AccountantStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { socket } = useSocket();

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.emit('join_dashboard', 'ACCOUNTANT');
            
            socket.on('FEE_PAYMENT_CREATED', () => {
                fetchStats();
            });
        }
        
        return () => {
            if (socket) {
                socket.off('FEE_PAYMENT_CREATED');
            }
        };
    }, [socket]);

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const res = await dashboardAPI.getAccountantStats();
            if (res.success) setData(res);
        } catch (err) {
            console.error('Failed to load accountant stats', err);
        } finally {
            setIsLoading(false);
        }
    };

    const firstName = user?.firstName || 'Accountant';
    const today = new Date().toLocaleDateString(process.env.NEXT_PUBLIC_LOCALE || 'en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading your dashboard…</p>
                </div>
            </div>
        );
    }

    const summary = data?.summary ?? { todayCollection: 0, yearCollection: 0, pendingAmount: 0, txToday: 0 };
    const txList = data?.todayTransactions ?? [];
    const defaulters = data?.defaulters ?? [];
    const trend = data?.trend ?? [];

    return (
        <div className="space-y-6">
            {/* ──── Header ──── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fee Collection</h1>
                    <p className="mt-1 text-muted-foreground">
                        Welcome, {firstName}. Here's your financial overview for today.
                    </p>
                </div>
                <Badge variant="outline" className="border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary">
                    {today}
                </Badge>
            </div>

            {/* ──── KPI Cards ──── */}
            <KpiCards summary={summary} />

            {/* ──── Quick Actions ──── */}
            <QuickActions />

            {/* ──── Row: Transactions + Trend ──── */}
            <div className="grid gap-4 lg:grid-cols-7">
                {/* Today's Transactions Table */}
                <RecentTransactions txList={txList} />

                {/* 6-Month Trend Chart */}
                <CollectionTrend trend={trend} />
            </div>

            {/* ──── Pending Defaulters List ──── */}
            <DefaultersList defaulters={defaulters} />
        </div>
    );
}
