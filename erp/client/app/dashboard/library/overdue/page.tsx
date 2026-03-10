'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { libraryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function OverdueBooksPage() {
  const [overdueBooks, setOverdueBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverdueBooks();
  }, []);

  const fetchOverdueBooks = async () => {
    try {
      setIsLoading(true);
      const data = await libraryAPI.getOverdue();
      setOverdueBooks(data.issues || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch overdue books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async (issueId: string) => {
    try {
      await libraryAPI.returnBook(issueId);
      fetchOverdueBooks();
    } catch (err) {
      console.error('Failed to return book', err);
    }
  };

  const calculateOverdueDays = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/library">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overdue Books</h1>
        <p className="text-muted-foreground">Books that are past their due date</p>
      </div>

      {/* Alert */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-900">
                {overdueBooks.length} book{overdueBooks.length !== 1 ? 's are' : ' is'} overdue
              </p>
              <p className="text-sm text-orange-700">
                Please follow up with students to return these books
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Book Issues</CardTitle>
          <CardDescription>List of all overdue book returns</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : overdueBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No overdue books</p>
              <p className="text-sm text-muted-foreground">
                All books have been returned on time
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Overdue Days</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueBooks.map((issue) => {
                    const overdueDays = calculateOverdueDays(issue.dueDate);
                    const fine = overdueDays * 5; // ₹5 per day
                    return (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.book?.title || 'N/A'}</TableCell>
                        <TableCell>
                          {issue.student?.user?.firstName} {issue.student?.user?.lastName}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {issue.student?.admissionNumber}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(issue.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(issue.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-700">
                            {overdueDays} day{overdueDays !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-red-600">₹{fine}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturn(issue.id)}
                          >
                            Mark Returned
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
