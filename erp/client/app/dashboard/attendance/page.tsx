'use client';

import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI, academicAPI } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Check, X, Calendar, Save, Plus, Trash2, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50';

export default function AttendancePage() {
  const { canMarkAttendance } = usePermissions();


  // ── Filters ────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendeeType, setAttendeeType] = useState<'STUDENT' | 'TEACHER' | 'STAFF'>('STUDENT');

  // ── Slots ──────────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<any[]>([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);

  // ── Today's overview (all classes with slots today) ────────────────────
  const [todayOverview, setTodayOverview] = useState<any[]>([]);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  // ── Overview detail modal ───────────────────────────────────────────────
  const [overviewDetailSlot, setOverviewDetailSlot] = useState<any>(null);
  const [overviewDetailData, setOverviewDetailData] = useState<{ entities: any[]; attendance: Record<string, string> } | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [overviewDetailOpen, setOverviewDetailOpen] = useState(false);

  // ── Active slot (open for marking) ─────────────────────────────────────
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // ── Delete confirmation ────────────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState<any>(null);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await academicAPI.getClasses();
      setClasses(data.classes || []);
    } catch {
      toast.error('Failed to fetch classes');
    }
  }, []);

  const fetchSections = useCallback(async (classId: string) => {
    try {
      const data = await academicAPI.getSections({ classId });
      setSections(data.sections || []);
    } catch {
      toast.error('Failed to fetch sections');
    }
  }, []);

  const fetchTodayOverview = useCallback(async () => {
    setIsOverviewLoading(true);
    try {
      const data = await attendanceAPI.getSlots({ date: todayStr, attendeeType });
      setTodayOverview(data.slots || []);
    } catch {
      // silently fail overview
    } finally {
      setIsOverviewLoading(false);
    }
  }, [todayStr, attendeeType]);

  const fetchSlots = useCallback(async () => {
    setIsSlotsLoading(true);
    try {
      const params: any = { date: selectedDate, attendeeType };
      if (attendeeType === 'STUDENT' && selectedClass) {
        params.classId = selectedClass;
      }
      const data = await attendanceAPI.getSlots(params);
      setSlots(data.slots || []);
    } catch {
      toast.error('Failed to load slots');
    } finally {
      setIsSlotsLoading(false);
    }
  }, [selectedDate, selectedClass, attendeeType]);

  const openOverviewDetail = async (slot: any) => {
    setOverviewDetailSlot(slot);
    setOverviewDetailOpen(true);
    setIsDetailLoading(true);
    setOverviewDetailData(null);
    try {
      const data = await attendanceAPI.getSlot(slot.id);
      setOverviewDetailData({
        entities: data.entities || [],
        attendance: data.attendance || {},
      });
    } catch {
      toast.error('Could not load attendance details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTodayOverview();
  }, [fetchClasses, fetchTodayOverview]);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
      setSelectedSection('');
      setActiveSlot(null);
      setStudents([]);
    } else {
      setSections([]);
    }
  }, [selectedClass, fetchSections]);

  useEffect(() => {
    if (attendeeType === 'STUDENT' && !selectedClass) return;
    fetchSlots();
    setActiveSlot(null);
    setStudents([]);
  }, [selectedClass, selectedDate, attendeeType, fetchSlots]);

  const handleCreateSlot = async () => {
    setIsCreating(true);
    try {
      await attendanceAPI.createSlot({
        date: selectedDate,
        attendeeType,
        classId: attendeeType === 'STUDENT' ? selectedClass : undefined,
        sectionId: (attendeeType === 'STUDENT' && selectedSection) ? selectedSection : undefined,
      });
      toast.success('Attendance slot created');
      fetchSlots();
      if (selectedDate === todayStr) fetchTodayOverview();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create slot');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!deletingSlot) return;
    try {
      await attendanceAPI.deleteSlot(deletingSlot.id);
      toast.success('Slot deleted');
      setDeleteDialog(false);
      setDeletingSlot(null);
      if (activeSlot?.id === deletingSlot.id) {
        setActiveSlot(null);
        setStudents([]);
      }
      fetchSlots();
      if (selectedDate === todayStr) fetchTodayOverview();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete slot');
    }
  };

  // ── Open a slot to mark attendance ─────────────────────────────────────

  const openSlot = async (slot: any) => {
    setActiveSlot(slot);
    setIsStudentsLoading(true);
    try {
      const data = await attendanceAPI.getSlot(slot.id);
      setStudents(data.entities || []); // Using common 'entities' field from updated API

      const initial: Record<string, 'PRESENT' | 'ABSENT'> = {};
      (data.entities || []).forEach((e: any) => {
        if (data.attendance?.[e.id]) {
          initial[e.id] = data.attendance[e.id];
        }
      });
      setAttendance(initial);
    } catch {
      toast.error('Failed to load list');
    } finally {
      setIsStudentsLoading(false);
    }
  };

  // ── Local state toggles (no API calls) ─────────────────────────────────

  const handleAttendanceChange = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const bulk: Record<string, 'PRESENT' | 'ABSENT'> = {};
    students.forEach((s) => {
      bulk[s.id] = status;
    });
    setAttendance(bulk);
  };

  // ── Submit — single batch API call ─────────────────────────────────────

  const handleSubmit = async () => {
    if (!activeSlot) return;
    const finalAttendance: Record<string, 'PRESENT' | 'ABSENT'> = {};
    students.forEach((s) => {
      finalAttendance[s.id] = attendance[s.id] || 'ABSENT';
    });
    setIsSubmitting(true);
    try {
      const attendanceData = Object.entries(finalAttendance).map(([entityId, status]) => ({
        entityId,
        status,
      }));
      await attendanceAPI.submitSlotAttendance(activeSlot.id, attendanceData);
      toast.success(`Attendance saved for ${attendanceData.length} entries`);
      fetchSlots();
      setActiveSlot((prev: any) => prev ? { ...prev, status: 'COMPLETED' } : null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Stats computed from local state ────────────────────────────────────

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter((s) => s === 'PRESENT').length,
    absent: Object.values(attendance).filter((s) => s === 'ABSENT').length,
  };

  // Filter slots by section
  const filteredSlots = selectedSection && attendeeType === 'STUDENT'
    ? slots.filter((s) => s.sectionId === selectedSection || !s.sectionId)
    : slots;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground">Create a daily attendance slot and mark attendance for students</p>
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardHeader>
          <CardTitle>Select Type & Date</CardTitle>
          <CardDescription>Choose user type, class, and date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="attendeeType">User Type</Label>
              <select
                id="attendeeType"
                value={attendeeType}
                onChange={(e) => {
                  setAttendeeType(e.target.value as any);
                  setSelectedClass('');
                  setSelectedSection('');
                  setActiveSlot(null);
                  setStudents([]);
                }}
                className={selectClass}
              >
                <option value="STUDENT">Students</option>
                <option value="TEACHER">Teachers</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>
            {attendeeType === 'STUDENT' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <select
                    id="class"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section (Optional)</Label>
                  <select
                    id="section"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All Sections</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="md:col-span-2 flex items-end pb-1 text-sm text-muted-foreground italic">
                Manage attendance for all active {attendeeType.toLowerCase()}s
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={selectClass}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Slots ── */}
      {(attendeeType !== 'STUDENT' || selectedClass) && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Attendance Slots
                </CardTitle>
                <CardDescription>
                  {selectedDate === new Date().toISOString().split('T')[0] ? "Today's" : selectedDate} attendance slots
                </CardDescription>
              </div>
              {canMarkAttendance && (
                <Button onClick={handleCreateSlot} disabled={isCreating}>
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Create Slot
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isSlotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No attendance slot for this date</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click &quot;Create Slot&quot; to create an attendance slot and start marking
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredSlots.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => openSlot(slot)}
                    className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${activeSlot?.id === slot.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {slot.attendeeType === 'STUDENT' ? slot.class?.name : slot.attendeeType}
                        </span>
                        {slot.section && (
                          <span className="text-sm text-muted-foreground">- Section {slot.section.name}</span>
                        )}
                      </div>
                      <Badge
                        className={
                          slot.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }
                      >
                        {slot.status === 'COMPLETED' ? '✅ Completed' : '🟡 Open'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{slot._count?.records || 0} records</span>
                      {canMarkAttendance && slot.status === 'OPEN' && slot._count?.records === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingSlot(slot);
                            setDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Active Slot — Student List ── */}
      {activeSlot && (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Total {activeSlot.attendeeType.toLowerCase()}s</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Present</p>
                  <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Absent</p>
                  <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>{activeSlot.attendeeType === 'STUDENT' ? 'Student' : activeSlot.attendeeType} List</CardTitle>
                  <CardDescription>
                    {activeSlot.attendeeType === 'STUDENT' ? `${activeSlot.class?.name}${activeSlot.section ? ` - Section ${activeSlot.section.name}` : ''}` : `All active ${activeSlot.attendeeType.toLowerCase()}s`}
                    {' · '}
                    {activeSlot.status === 'COMPLETED' ? 'Submitted' : 'Mark attendance'}
                  </CardDescription>
                </div>
                {canMarkAttendance && activeSlot.status === 'OPEN' && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleMarkAll('PRESENT')}>
                      <Check className="mr-2 h-4 w-4" />
                      Mark All Present
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleMarkAll('ABSENT')}>
                      <X className="mr-2 h-4 w-4" />
                      Mark All Absent
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isStudentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No students found</p>
                  <p className="text-sm text-muted-foreground">No students enrolled in this class/section</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {student.name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.identifier}</p>
                        </div>
                      </div>

                      {canMarkAttendance && activeSlot.status === 'OPEN' ? (
                        <div className="flex gap-2">
                          <Button
                            variant={attendance[student.id] === 'PRESENT' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleAttendanceChange(student.id, 'PRESENT')}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Present
                          </Button>
                          <Button
                            variant={attendance[student.id] === 'ABSENT' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleAttendanceChange(student.id, 'ABSENT')}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Absent
                          </Button>
                        </div>
                      ) : (
                        <Badge
                          className={
                            attendance[student.id] === 'PRESENT'
                              ? 'bg-green-100 text-green-700'
                              : attendance[student.id] === 'ABSENT'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {attendance[student.id] || 'UNMARKED'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit button */}
              {canMarkAttendance && activeSlot.status === 'OPEN' && students.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSubmit} disabled={isSubmitting || students.length === 0} size="lg">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Submit Attendance ({stats.total} entries)
                      </>
                    )}
                  </Button>
                </div>
              )}

              {activeSlot.status === 'COMPLETED' && (
                <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
                  ✅ Attendance has been submitted for this slot.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Today's overview when no specific selection active */}
      {!selectedClass && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today&apos;s Attendance Overview
                </CardTitle>
                <CardDescription>
                  {attendeeType.toLowerCase()} slots created for today ({todayStr})
                </CardDescription>
              </div>
              {isOverviewLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent>
            {isOverviewLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : todayOverview.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No attendance slots created today</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a class above and create a slot to start marking attendance
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {todayOverview.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => openOverviewDetail(slot)}
                    className="flex items-center justify-between rounded-lg border p-4 bg-muted/30 cursor-pointer hover:bg-muted/60 hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${slot.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                        }`}>
                        {slot.status === 'COMPLETED' ? '✅' : '🟡'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {slot.attendeeType === 'STUDENT' ? slot.class?.name : slot.attendeeType}
                        </p>
                        {slot.section && (
                          <p className="text-xs text-muted-foreground">Section {slot.section.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{slot._count?.records || 0} records marked</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        slot.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }
                    >
                      {slot.status === 'COMPLETED' ? 'Done' : 'Open'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Select a class above to create a new slot or view/update existing attendance
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Detail Modal (overview click) */}
      <Dialog open={overviewDetailOpen} onOpenChange={setOverviewDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {overviewDetailSlot?.attendeeType === 'STUDENT'
                ? `${overviewDetailSlot?.class?.name}${overviewDetailSlot?.section ? ` — Section ${overviewDetailSlot.section.name}` : ''}`
                : overviewDetailSlot?.attendeeType
              }
            </DialogTitle>
            <DialogDescription>
              Attendance for {todayStr}
              {overviewDetailSlot?.status === 'COMPLETED' && ' · ✅ Submitted'}
              {overviewDetailSlot?.status === 'OPEN' && ' · 🟡 In Progress'}
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : overviewDetailData ? (
            <>
              {/* Summary counts */}
              {(() => {
                const att = overviewDetailData.attendance;
                const presentCount = Object.values(att).filter(s => s === 'PRESENT').length;
                const absentCount = Object.values(att).filter(s => s === 'ABSENT').length;
                return (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
                      <p className="text-xl font-bold text-green-700">{presentCount}</p>
                      <p className="text-xs text-green-600 font-medium">Present</p>
                    </div>
                    <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
                      <p className="text-xl font-bold text-red-700">{absentCount}</p>
                      <p className="text-xs text-red-600 font-medium">Absent</p>
                    </div>
                  </div>
                );
              })()}

              {/* Entity list */}
              <div className="space-y-2">
                {overviewDetailData.entities.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No records found
                  </div>
                ) : (
                  overviewDetailData.entities.map((entity: any) => {
                    const status = overviewDetailData.attendance[entity.id];
                    return (
                      <div
                        key={entity.id}
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 ${status === 'PRESENT' ? 'bg-green-50/60 border-green-100' :
                          status === 'ABSENT' ? 'bg-red-50/60 border-red-100' :
                            'bg-gray-50 border-gray-200'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {entity.name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {entity.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{entity.identifier}</p>
                          </div>
                        </div>
                        <Badge
                          className={
                            status === 'PRESENT' ? 'bg-green-100 text-green-700 border-green-200' :
                              status === 'ABSENT' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                          }
                        >
                          {status === 'PRESENT' ? '✅ Present' :
                            status === 'ABSENT' ? '❌ Absent' :
                              '— Unmarked'}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Slot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance slot for{' '}
              {deletingSlot?.class?.name}
              {deletingSlot?.section ? ` - Section ${deletingSlot.section.name}` : ''}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSlot}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
