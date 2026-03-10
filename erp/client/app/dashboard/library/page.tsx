'use client';

import { useEffect, useState, useCallback } from 'react';
import { libraryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Loader2, BookOpen, BookCheck, BookX } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const { canManageLibrary } = usePermissions();

  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    totalCopies: '',
  });

  const [issueForm, setIssueForm] = useState({
    studentId: '',
    dueDate: '',
  });

  const fetchBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await libraryAPI.getBooks();
      setBooks(data.books || []);
    } catch (err) {
      console.error('Failed to fetch books', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await libraryAPI.createBook({
        ...bookForm,
        totalCopies: parseInt(bookForm.totalCopies),
      });
      setIsDialogOpen(false);
      setBookForm({ title: '', author: '', isbn: '', category: '', totalCopies: '' });
      fetchBooks();
    } catch (err) {
      console.error('Failed to create book', err);
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      await libraryAPI.issueBook({
        bookId: selectedBook.id,
        studentId: issueForm.studentId,
        dueDate: issueForm.dueDate,
      });
      setIsIssueDialogOpen(false);
      setIssueForm({ studentId: '', dueDate: '' });
      setSelectedBook(null);
      fetchBooks();
    } catch (err) {
      console.error('Failed to issue book', err);
    }
  };

  const filteredBooks = books.filter((book) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      book.title?.toLowerCase().includes(searchLower) ||
      book.author?.toLowerCase().includes(searchLower) ||
      book.isbn?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Management</h1>
          <p className="text-muted-foreground">Manage books, issues, and returns</p>
        </div>
        {canManageLibrary && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/dashboard/library/overdue">View Overdue</a>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription>Add a new book to the library catalog</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBook} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Book Title *</Label>
                    <Input
                      id="title"
                      value={bookForm.title}
                      onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                      placeholder="Enter book title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={bookForm.author}
                      onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                      placeholder="Enter author name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={bookForm.isbn}
                      onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                      placeholder="Enter ISBN"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={bookForm.category}
                      onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                      placeholder="e.g., Science, Fiction"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalCopies">Total Copies *</Label>
                    <Input
                      id="totalCopies"
                      type="number"
                      value={bookForm.totalCopies}
                      onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })}
                      placeholder="Number of copies"
                      required
                    />
                  </div>
                  <Button type="submit">Add Book</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <p className="text-sm font-medium text-muted-foreground">Total Books</p>
              <p className="text-2xl font-bold">{books.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BookCheck className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">142</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BookX className="mx-auto mb-2 h-8 w-8 text-orange-600" />
              <p className="text-sm font-medium text-muted-foreground">Issued</p>
              <p className="text-2xl font-bold">38</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BookX className="mx-auto mb-2 h-8 w-8 text-red-600" />
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold">5</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Books Catalog */}
      <Card>
        <CardHeader>
          <CardTitle>Books Catalog</CardTitle>
          <CardDescription>Browse and manage library books ({filteredBooks.length} total)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, or ISBN..."
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
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No books found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding books to the library'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.isbn || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{book.category || 'General'}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {book.availableCopies || book.totalCopies}/{book.totalCopies}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isIssueDialogOpen && selectedBook?.id === book.id} onOpenChange={(open) => {
                          setIsIssueDialogOpen(open);
                          if (!open) setSelectedBook(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBook(book)}
                              disabled={(book.availableCopies || 0) === 0}
                            >
                              Issue
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Issue Book</DialogTitle>
                              <DialogDescription>Issue "{book.title}" to a student</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleIssueBook} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="studentId">Student Admission Number *</Label>
                                <Input
                                  id="studentId"
                                  value={issueForm.studentId}
                                  onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                                  placeholder="Enter admission number"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date *</Label>
                                <Input
                                  id="dueDate"
                                  type="date"
                                  value={issueForm.dueDate}
                                  onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                                  required
                                />
                              </div>
                              <Button type="submit">Issue Book</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
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
