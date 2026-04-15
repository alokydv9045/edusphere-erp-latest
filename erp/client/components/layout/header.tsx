'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header({ onMenuClick, className }: { onMenuClick?: () => void; className?: string }) {
  return (
    <header className={`flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shrink-0 ${className || ''}`}>
      {onMenuClick && (
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div className="flex-1">
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative outline-none">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              3
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[300px]">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
            <span className="font-semibold text-sm">System Update</span>
            <span className="text-xs text-muted-foreground">EDU Sphere v2.1 has been released.</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
            <span className="font-semibold text-sm">New Enquiry</span>
            <span className="text-xs text-muted-foreground">A new admission enquiry has been received.</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
            <span className="font-semibold text-sm">Task Reminder</span>
            <span className="text-xs text-muted-foreground">Please review pending leave requests.</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
