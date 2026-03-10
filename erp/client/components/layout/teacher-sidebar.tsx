'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    CalendarCheck,
    FileText,
    User,
    CalendarDays,
    LogOut,
    ClipboardCheck,
    QrCode
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navigationConfig = [
    { name: 'Overview', href: '/teacher-dashboard', icon: LayoutDashboard },
    { name: 'My Schedule', href: '/teacher-dashboard/schedule', icon: CalendarDays },
    { name: 'Mark Attendance', href: '/teacher-dashboard/attendance', icon: CalendarCheck },
    { name: 'Grade Exams', href: '/teacher-dashboard/exams', icon: FileText },
    { name: 'Marks Entry', href: '/dashboard/exams/marks-entry', icon: ClipboardCheck },
    { name: 'My Profile', href: '/teacher-dashboard/profile', icon: User },
];

export function TeacherSidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <div className={cn("flex h-screen w-64 flex-col border-r bg-slate-900 text-white", className)}>
            {/* Logo/Header */}
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
                <h1 className="text-xl font-bold text-white">EduSphere <span className="text-primary text-sm font-normal">Teacher</span></h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {(() => {
                    const scannerId = user?.teacher?.assignedScannerId;
                    const items = [...navigationConfig];
                    if (scannerId) {
                        items.splice(3, 0, {
                            name: 'QR Scanner',
                            href: `/dashboard/scanners/${scannerId}/prepare`,
                            icon: QrCode
                        });
                    }
                    return items.map((item) => {
                        const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/teacher-dashboard');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    });
                })()}
            </nav>

            {/* User Profile */}
            <div className="border-t border-slate-800 p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatar || undefined} className="object-cover" />
                        <AvatarFallback className="bg-slate-700 text-slate-200">
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-white">
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="mt-3 w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                    onClick={logout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
