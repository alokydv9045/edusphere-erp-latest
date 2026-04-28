'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { studentAPI, Student } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Loader2, Eye, Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const { canManageStudents, canRegisterStudents } = usePermissions();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await studentAPI.getAll();

      if (data && data.students) {
        setStudents(data.students);
      } else {
        setStudents([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.user.firstName.toLowerCase().includes(searchLower) ||
      student.user.lastName.toLowerCase().includes(searchLower) ||
      student.admissionNumber.toLowerCase().includes(searchLower) ||
      student.user.email.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      INACTIVE: 'bg-gray-100 text-gray-700',
      GRADUATED: 'bg-blue-100 text-blue-700',
      TRANSFERRED: 'bg-orange-100 text-orange-700',
    };
    return variants[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage all student records and information</p>
        </div>
        {canRegisterStudents && (
          <Button asChild>
            <Link href="/dashboard/students/register">
              <Plus className="mr-2 h-4 w-4" />
              Register Student
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            Browse and manage student records ({filteredStudents.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, admission number, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{typeof error === "string" ? error : JSON.stringify(error)}</div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first student'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.admissionNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.user.avatar || undefined} alt={`${student.user.firstName} ${student.user.lastName}`} className="object-cover" />
                            <AvatarFallback>{student.user.firstName?.[0]}{student.user.lastName?.[0]}</AvatarFallback>
                          </Avatar>
                          <span>{student.user.firstName} {student.user.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.currentClass?.name || '-'}
                        {student.section && ` - ${student.section.name}`}
                      </TableCell>
                      <TableCell>{student.user.email}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(student.status)} variant="secondary">
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/dashboard/students/${student.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
