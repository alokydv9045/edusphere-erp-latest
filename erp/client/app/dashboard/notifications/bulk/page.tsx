'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''; }

const TARGETS = [
  { value: 'ALL_STUDENTS', label: 'All Students (all parent phones)' },
  { value: 'CLASS',        label: 'By Class' },
  { value: 'SECTION',      label: 'By Class & Section' },
  { value: 'INDIVIDUAL',   label: 'Individual Student' },
];

const NOTIF_TYPES = ['CUSTOM','ANNOUNCEMENT','FEE_REMINDER','HOMEWORK','ATTENDANCE'];

export default function BulkSendPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    target: 'ALL_STUDENTS', classId: '', sectionId: '', studentId: '',
    message: '', notifType: 'CUSTOM', scheduledAt: '',
  });
  const [classes, setClasses]   = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (user && !['SUPER_ADMIN','ADMIN','NOTIFICATION_MANAGER'].some(r => (user.roles||[user.role]).includes(r)))
      router.replace('/dashboard');
  }, [user, router]);

  // Load classes on mount
  useEffect(() => {
    fetch(`${API}/academic/classes`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(d => setClasses(d.classes || [])).catch(() => {});
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!form.classId) { setSections([]); return; }
    fetch(`${API}/academic/sections?classId=${form.classId}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(d => setSections(d.sections || [])).catch(() => {});
  }, [form.classId]);

  // Load students for INDIVIDUAL target
  useEffect(() => {
    if (form.target !== 'INDIVIDUAL') { setStudents([]); return; }
    fetch(`${API}/students?limit=200`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(d => setStudents(d.students || [])).catch(() => {});
  }, [form.target]);

  const send = async () => {
    if (!form.message.trim()) { toast.error('Message is empty', { description: 'Please type a message before sending.', duration: 3000 }); return; }
    setSending(true);
    try {
      const body: any = { target: form.target, message: form.message, notifType: form.notifType };
      if (form.scheduledAt) body.scheduledAt = form.scheduledAt;
      if (form.target === 'CLASS' && form.classId) body.classId = form.classId;
      if (form.target === 'SECTION' && form.sectionId) body.sectionId = form.sectionId;
      if (form.target === 'INDIVIDUAL' && form.studentId) body.studentId = form.studentId;

      const res = await fetch(`${API}/notifications/bulk-send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Messages Queued', {
          description: data.message || `Messages queued for ${form.target.replace('_', ' ').toLowerCase()}.`,
          duration: 4000,
        });
        setForm(f => ({ ...f, message: '', scheduledAt: '' }));
      } else {
        toast.error('Failed to send', {
          description: data.message || 'An unexpected error occurred.',
          duration: 4000,
        });
      }
    } catch { toast.error('Network error', { description: 'Could not reach the server.', duration: 4000 }); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2"><Send className="h-5 w-5 text-primary" />Bulk Messaging</h1>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Send To</label>
          <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value, classId: '', sectionId: '', studentId: '' }))}
            className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Class picker */}
        {(form.target === 'CLASS' || form.target === 'SECTION') && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Select Class</label>
            <select value={form.classId} onChange={e => setForm(f => ({...f, classId: e.target.value, sectionId: ''}))}
              className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Choose class —</option>
              {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Section picker */}
        {form.target === 'SECTION' && form.classId && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Select Section</label>
            <select value={form.sectionId} onChange={e => setForm(f => ({...f, sectionId: e.target.value}))}
              className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Choose section —</option>
              {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Student picker */}
        {form.target === 'INDIVIDUAL' && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Select Student</label>
            <select value={form.studentId} onChange={e => setForm(f => ({...f, studentId: e.target.value}))}
              className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Choose student —</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.user?.firstName} {s.user?.lastName} ({s.admissionNumber})</option>)}
            </select>
          </div>
        )}

        {/* Notification type */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Notification Type</label>
          <select value={form.notifType} onChange={e => setForm(f => ({...f, notifType: e.target.value}))}
            className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            {NOTIF_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Message</label>
          <textarea rows={5} value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}
            placeholder="Type your message here... Only phones registered in student profiles will receive this."
            className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          <p className="text-xs text-muted-foreground mt-1">⚠️ Messages are only sent to parent phone numbers stored in the student profile.</p>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Schedule (optional)</label>
          <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({...f, scheduledAt: e.target.value}))}
            className="w-full rounded border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          <p className="text-xs text-muted-foreground mt-1">Leave blank to queue immediately (sent within ~1 minute).</p>
        </div>

        <button onClick={send} disabled={sending}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Queuing...' : 'Send / Queue Messages'}
        </button>
      </div>
    </div>
  );
}
