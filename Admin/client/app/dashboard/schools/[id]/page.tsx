'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Building2,
  Database,
  CreditCard,
  BarChart3,
  Activity,
  Loader2,
  Calendar,
  Users,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { schoolAPI, School, ActivityLog, UsageStats } from '@/lib/api';
import { toast } from 'sonner';

export default function SchoolDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSchoolData();
  }, [params.id]);

  const fetchSchoolData = async () => {
    try {
      setIsLoading(true);
      const [schoolData, logs, stats] = await Promise.all([
        schoolAPI.getById(params.id),
        schoolAPI.getActivityLogs(params.id),
        schoolAPI.getUsageStats(params.id),
      ]);
      setSchool(schoolData);
      setActivityLogs(logs);
      setUsageStats(stats);
    } catch (error) {
      toast.error('Failed to load school details');
      console.error('Failed to load school:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Loading school details...</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">School not found</h2>
          <p className="mt-2 text-slate-600">The school you're looking for doesn't exist</p>
          <Link href="/dashboard/schools">
            <Button className="mt-4">Back to Schools</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/schools">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{school.name}</h1>
            <Badge variant={school.isActive ? 'default' : 'secondary'}>
              {school.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="mt-1 text-slate-600">School Code: {school.code}</p>
        </div>
        <Button variant="outline">Edit School</Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Students</p>
                <p className="text-2xl font-bold text-slate-900">
                  {usageStats?.totalStudents || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Teachers</p>
                <p className="text-2xl font-bold text-slate-900">
                  {usageStats?.totalTeachers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 p-3">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Classes</p>
                <p className="text-2xl font-bold text-slate-900">
                  {usageStats?.totalClasses || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-orange-100 p-3">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Storage</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(usageStats?.storageUsed || 0).toFixed(1)} GB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Building2 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="mr-2 h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-600">School Code</p>
                <p className="mt-1 font-medium">{school.code}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">School Name</p>
                <p className="mt-1 font-medium">{school.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="mt-1 font-medium">{school.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Phone</p>
                <p className="mt-1 font-medium">{school.phone || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-slate-600">Address</p>
                <p className="mt-1 font-medium">{school.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <Badge variant={school.isActive ? 'default' : 'secondary'} className="mt-1">
                  {school.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-600">Deployment Status</p>
                <Badge className="mt-1">{school.deploymentStatus}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-600">Created At</p>
                <p className="mt-1 font-medium">
                  {new Date(school.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Last Updated</p>
                <p className="mt-1 font-medium">
                  {new Date(school.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Details</CardTitle>
              <CardDescription>Database connection and configuration</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-600">Database Host</p>
                <p className="mt-1 font-mono text-sm">{school.dbHost || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Database Name</p>
                <p className="mt-1 font-mono text-sm">{school.dbName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Database User</p>
                <p className="mt-1 font-mono text-sm">{school.dbUser || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">API Calls This Month</p>
                <p className="mt-1 font-medium">
                  {usageStats?.apiCallsThisMonth?.toLocaleString() || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Current subscription plan and billing</CardDescription>
            </CardHeader>
            <CardContent>
              {school.subscription ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-600">Plan</p>
                    <p className="mt-1 font-medium">{school.subscription.plan.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <Badge className="mt-1">{school.subscription.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Billing Cycle</p>
                    <p className="mt-1 font-medium">{school.subscription.billingCycle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Amount</p>
                    <p className="mt-1 font-medium">
                      ₹{school.subscription.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Start Date</p>
                    <p className="mt-1 font-medium">
                      {new Date(school.subscription.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">End Date</p>
                    <p className="mt-1 font-medium">
                      {new Date(school.subscription.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No active subscription</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent actions and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.length > 0 ? (
                    activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{log.description}</TableCell>
                        <TableCell>{log.performedBy}</TableCell>
                        <TableCell>
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500">
                        No activity logs available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
