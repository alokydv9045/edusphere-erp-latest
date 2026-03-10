'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState, useRef, useCallback } from 'react';
import { studentAPI, userAPI, documentAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
    User, Mail, Phone, Shield, Calendar, Loader2, Users, MapPin,
    FileText, Download, Trash2, Plus, File, HeartPulse, GraduationCap, Building2, Globe, Map
} from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    ADMIN: 'bg-purple-100 text-purple-700',
    TEACHER: 'bg-blue-100 text-blue-700',
    STUDENT: 'bg-green-100 text-green-700',
    PARENT: 'bg-teal-100 text-teal-700',
    ACCOUNTANT: 'bg-orange-100 text-orange-700',
    LIBRARIAN: 'bg-indigo-100 text-indigo-700',
    INVENTORY_MANAGER: 'bg-yellow-100 text-yellow-700',
    HR_MANAGER: 'bg-pink-100 text-pink-700',
    ADMISSION_MANAGER: 'bg-cyan-100 text-cyan-700',
};

export default function ProfilePage() {
    const { user } = useAuth();
    const { isAdmin, isTeacher, isStudent } = usePermissions();
    const [studentData, setStudentData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    const fetchDocuments = useCallback(async (studentId: string) => {
        try {
            const res = await documentAPI.getAll(studentId);
            setDocuments(res.documents || []);
        } catch (error) {
            console.error('Fetch documents error:', error);
            toast.error('Failed to load documents');
        }
    }, []);

    const fetchStudentProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await studentAPI.getMe();
            if (res && res.student) {
                setStudentData(res.student);
                fetchDocuments(res.student.id);
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    }, [fetchDocuments]);

    useEffect(() => {
        if (isStudent && user) {
            fetchStudentProfile();
        }
    }, [isStudent, user, fetchStudentProfile]);

    const handleAvatarClick = () => {
        avatarInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingAvatar(true);
        try {
            await userAPI.updateAvatar(user.id, file);
            toast.success('Profile picture updated!');
            window.location.reload(); // Refresh to update avatar everywhere
        } catch (error) {
            console.error('Avatar upload error:', error);
            toast.error('Failed to update profile picture');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !studentData) return;

        const docType = prompt('Enter document type (e.g., Aadhaar, TC, Results):');
        if (!docType) return;

        setUploadingDoc(true);
        try {
            await documentAPI.upload(studentData.id, {
                file,
                documentType: docType,
                documentName: file.name
            });
            toast.success('Document uploaded successfully!');
            fetchDocuments(studentData.id);
        } catch (error) {
            console.error('Document upload error:', error);
            toast.error('Failed to upload document');
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await documentAPI.delete(docId);
            toast.success('Document deleted');
            if (studentData) fetchDocuments(studentData.id);
        } catch (error) {
            console.error('Delete document error:', error);
            toast.error('Failed to delete document');
        }
    };

    if (!user) return null;

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
    const roles: string[] = user.roles || (user.role ? [user.role] : []);

    const renderBasicProfile = () => (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        Personal Information
                    </CardTitle>
                    <CardDescription>Your basic account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InfoRow icon={<User className="h-4 w-4" />} label="Full Name" value={fullName} />
                    <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email || '—'} />
                    <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone || '—'} />
                    <InfoRow icon={<Calendar className="h-4 w-4" />} label="Account Created" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        Role & Permissions
                    </CardTitle>
                    <CardDescription>Your access level in the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InfoRow icon={<Shield className="h-4 w-4" />} label="Primary Role" value={user.role || '—'} />
                    {isAdmin && (
                        <div className="rounded-md bg-purple-50 p-3 text-sm text-purple-700">
                            <strong>Admin Access:</strong> You have full access to all school management features.
                        </div>
                    )}
                    {isTeacher && (
                        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                            <strong>Teacher Access:</strong> You can manage attendance, grades, and exams.
                        </div>
                    )}
                    {isStudent && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                            <strong>Student Access:</strong> View your attendance, results, and fees.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    const renderStudentDashboard = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading profile...</span>
                </div>
            );
        }

        const father = studentData?.parents?.find((p: any) => p.relationship === 'FATHER')?.parent;
        const mother = studentData?.parents?.find((p: any) => p.relationship === 'MOTHER')?.parent;

        return (
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-12">
                    {/* Left Column: Academic & Personal */}
                    <div className="md:col-span-8 space-y-6">
                        {/* Header Info Card */}
                        <Card className="overflow-hidden border-none shadow-md bg-white">
                            <CardContent className="p-0">
                                <div className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-4 border-muted cursor-pointer transition-opacity group-hover:opacity-80" onClick={handleAvatarClick}>
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={fullName} className="h-full w-full object-cover" />
                                            ) : (
                                                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                                                    {initials}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <input
                                            type="file"
                                            ref={avatarInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                        {uploadingAvatar && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <Plus className="h-3 w-3" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex-1 text-center sm:text-left">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <h1 className="text-3xl font-bold text-slate-900">{fullName}</h1>
                                            <Badge variant="secondary" className="w-fit self-center sm:self-auto font-mono">
                                                {studentData?.admissionNumber || 'ADM-N/A'}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-muted-foreground">
                                            <span className="flex items-center gap-1 font-medium text-blue-600">
                                                {studentData?.currentClass?.name || 'Class —'} • {studentData?.section?.name || 'Sec —'}
                                            </span>
                                            <span className="hidden sm:inline text-slate-300">|</span>
                                            <Badge className="bg-green-100 text-green-700 border-none shadow-none">
                                                {studentData?.status || 'ACTIVE'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Personal Details */}
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-md flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" />
                                        Personal Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <div className="flex justify-between py-2 border-b border-muted/50">
                                        <span className="text-sm text-muted-foreground">DOB</span>
                                        <span className="text-sm font-medium">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-muted/50">
                                        <span className="text-sm text-muted-foreground">Gender</span>
                                        <span className="text-sm font-medium uppercase">{user.gender || '—'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-sm text-muted-foreground">Roll No</span>
                                        <span className="text-sm font-bold text-blue-600">{studentData?.rollNumber || '—'}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Family Information */}
                            <div className="grid gap-6 sm:grid-cols-2 col-span-full">
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-md flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            Father&apos;s Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between py-1 border-b border-muted/30">
                                            <span className="text-sm text-muted-foreground">Name</span>
                                            <span className="text-sm font-medium">{father ? `${father.firstName} ${father.lastName}` : '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-muted/30">
                                            <span className="text-sm text-muted-foreground">Phone</span>
                                            <span className="text-sm font-medium font-mono">{father?.phone || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-muted/30">
                                            <span className="text-sm text-muted-foreground">Email</span>
                                            <span className="text-sm font-medium break-all">{father?.email || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-muted/30">
                                            <span className="text-sm text-muted-foreground">Occupation</span>
                                            <span className="text-sm font-medium">{father?.occupation || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-muted/30 font-mono">
                                            <span className="text-sm text-muted-foreground">Aadhaar</span>
                                            <span className="text-sm">{father?.aadhaar || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 font-mono uppercase">
                                            <span className="text-sm text-muted-foreground">PAN</span>
                                            <span className="text-sm">{father?.pan || '—'}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-md flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            Mother&apos;s Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between py-1 border-b border-muted/30">
                                            <span className="text-sm text-muted-foreground">Name</span>
                                            <span className="text-sm font-medium">{mother ? `${mother.firstName} ${mother.lastName}` : '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-muted/30">
                                            <span className="text-sm text-muted-foreground">Phone</span>
                                            <span className="text-sm font-medium font-mono">{mother?.phone || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-muted/30">
                                            <span className="text-sm text-muted-foreground">Occupation</span>
                                            <span className="text-sm font-medium">{mother?.occupation || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-muted/30 font-mono">
                                            <span className="text-sm text-muted-foreground">Aadhaar</span>
                                            <span className="text-sm">{mother?.aadhaar || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 font-mono uppercase">
                                            <span className="text-sm text-muted-foreground">PAN</span>
                                            <span className="text-sm">{mother?.pan || '—'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Additional Personal Details */}
                            <Card className="shadow-sm col-span-full">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-md flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-primary" />
                                        Additional Personal Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Religion</p>
                                            <p className="text-sm font-medium">{studentData?.religion || '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Caste</p>
                                            <p className="text-sm font-medium">{studentData?.caste || '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Nationality</p>
                                            <p className="text-sm font-medium">{studentData?.nationality || '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Blood Group</p>
                                            <p className="text-sm font-medium">{user.bloodGroup || '—'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Academic Details */}
                            <Card className="shadow-sm col-span-full border-l-4 border-l-blue-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-md flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-primary" />
                                        Admission & Academic Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Admission Type</p>
                                            <p className="text-sm font-medium">{studentData?.admissionType || 'NEW'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Medium</p>
                                            <p className="text-sm font-medium">{studentData?.medium || 'ENGLISH'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Admission Date</p>
                                            <p className="text-sm font-medium">{studentData?.joiningDate ? new Date(studentData.joiningDate).toLocaleDateString() : '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Joining Date</p>
                                            <p className="text-sm font-medium">{studentData?.joiningDate ? new Date(studentData.joiningDate).toLocaleDateString() : '—'}</p>
                                        </div>
                                        <div className="space-y-1 col-span-full">
                                            <div className="border-t pt-2 mt-1">
                                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold italic">Previous School Background</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Previous School</p>
                                            <p className="text-sm font-medium">{studentData?.previousSchool || '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Previous Class</p>
                                            <p className="text-sm font-medium">{studentData?.previousClass || '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">TC Info</p>
                                            <p className="text-sm font-medium">
                                                {studentData?.tcNumber ? `TC No: ${studentData.tcNumber}` : 'TC Not Provided'}
                                                {studentData?.tcIssueDate && ` (${new Date(studentData.tcIssueDate).toLocaleDateString()})`}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Leaving Reason</p>
                                            <p className="text-sm font-medium">{studentData?.leavingReason || '—'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Medical & Health Details */}
                            <Card className="shadow-sm col-span-full border-l-4 border-l-red-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-md flex items-center gap-2">
                                        <HeartPulse className="h-4 w-4 text-primary" />
                                        Health & Emergency
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Medical Conditions</p>
                                            <p className="text-sm font-medium">{studentData?.medicalConditions || 'NONE'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Allergies</p>
                                            <p className="text-sm font-medium">{studentData?.allergies || 'NONE'}</p>
                                        </div>
                                        <div className="space-y-1 border-l sm:pl-4 border-muted">
                                            <p className="text-[11px] uppercase tracking-wider text-red-600 font-bold flex items-center gap-1">
                                                EMERGENCY CONTACT
                                            </p>
                                            <p className="text-sm font-bold">{studentData?.emergencyContact || '—'}</p>
                                            <p className="text-xs font-mono text-muted-foreground">{studentData?.emergencyPhone || '—'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Contact & Address */}
                    <div className="md:col-span-4 space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-md flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary" />
                                    Contact Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Email Address</p>
                                    <p className="text-sm font-medium break-all">{user.email || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Mobile Phone</p>
                                    <p className="text-sm font-medium">{user.phone || '—'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-md flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    Address Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Current Address</p>
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                        {user.address || 'Not provided.'}
                                    </p>
                                </div>
                                <div className="space-y-1 border-t pt-2">
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Permanent Address</p>
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                        {studentData?.permanentAddress || 'Not provided.'}
                                    </p>
                                    {(studentData?.city || studentData?.state) && (
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {[studentData.city, studentData.state, studentData.pincode].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Documents Section */}
                        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-md flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    My Documents
                                </CardTitle>
                                <button
                                    onClick={() => docInputRef.current?.click()}
                                    disabled={uploadingDoc}
                                    className="p-1.5 hover:bg-primary/10 rounded-full text-primary transition-colors disabled:opacity-50"
                                    title="Upload Document"
                                >
                                    {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </button>
                                <input
                                    type="file"
                                    ref={docInputRef}
                                    className="hidden"
                                    onChange={handleDocUpload}
                                />
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="space-y-2">
                                    {documents.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic text-center py-4">No documents uploaded yet.</p>
                                    ) : (
                                        documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 group hover:border-primary/30 transition-colors">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                                                        <File className="h-3 w-3" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-xs font-semibold truncate">{doc.documentType}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{doc.documentName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={doc.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 hover:bg-slate-100 rounded text-slate-600"
                                                        title="View"
                                                    >
                                                        <Download className="h-3 w-3" />
                                                    </a>
                                                    <button
                                                        onClick={() => handleDeleteDoc(doc.id)}
                                                        className="p-1 hover:bg-red-50 rounded text-red-500"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">
                    Manage your account and view your detailed information
                </p>
            </div>

            {isStudent ? renderStudentDashboard() : renderBasicProfile()}
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/50 transition-colors px-2 -mx-2 rounded-md">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="opacity-70">{icon}</span>
                <span>{label}</span>
            </div>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
