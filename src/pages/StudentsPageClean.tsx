import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AnimatedToast } from '@/components/ui';
import { Trash } from 'lucide-react';
import type { User as Student } from '@/types';
import api from '@/lib/axios';

export function StudentsPage(): JSX.Element {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ student: Student } | null>(null);
  const timerRef = useRef<number | null>(null);
  const PENDING_KEY = 'tutors.pendingStudentDeletion';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await api.get('/teacher/students');
        if (mounted) setStudents(r.data || []);
      } catch (e) {
        console.warn('fetch students failed', e);
      }
    })();

    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (raw) {
        const obj = JSON.parse(raw) as { student: Student; expiresAt: number };
        const remaining = obj.expiresAt - Date.now();
        if (remaining > 0) {
          setPendingDelete({ student: obj.student });
          timerRef.current = window.setTimeout(async () => {
            try { await api.delete(`/teacher/students/${obj.student.id}`); } catch (e) { }
            localStorage.removeItem(PENDING_KEY);
            if (mounted) {
              const rr = await api.get('/teacher/students'); setStudents(rr.data || []);
              setPendingDelete(null);
            }
            timerRef.current = null;
          }, remaining);
        }
      }
    } catch (e) { }

    return () => { mounted = false; if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const visible = students.filter(s => (s.fullName || s.username || '').toLowerCase().includes(query.toLowerCase()));

  const scheduleDelete = (student: Student) => {
    setConfirmDelete(null);
    setStudents(prev => prev.filter(p => p.id !== student.id));
    setPendingDelete({ student });
    const expiresAt = Date.now() + 5000;
    try { localStorage.setItem(PENDING_KEY, JSON.stringify({ student, expiresAt })); } catch (e) { }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try { await api.delete(`/teacher/students/${student.id}`); } catch (e) { }
      localStorage.removeItem(PENDING_KEY);
      const rr = await api.get('/teacher/students'); setStudents(rr.data || []);
      setPendingDelete(null);
      timerRef.current = null;
    }, 5000);
  };

  const undo = () => {
    if (!pendingDelete) return;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    try { localStorage.removeItem(PENDING_KEY); } catch (e) { }
    setStudents(prev => [pendingDelete.student, ...prev]);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ученики (clean)</h1>
        <Input placeholder="Поиск..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Card>
        <div className="space-y-2">
          {visible.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <div className="font-medium">{s.fullName || s.username}</div>
                <div className="text-sm text-slate-500">{s.username}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-red-600" onClick={() => setConfirmDelete(s)} aria-label="Удалить">
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg">
            <div className="mb-4">Удалить ученика «{confirmDelete.fullName || confirmDelete.username}»?</div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Отмена</Button>
              <Button variant="danger" onClick={() => scheduleDelete(confirmDelete)}>Удалить</Button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed right-6 bottom-6 z-50">
        <AnimatedToast show={!!pendingDelete}>
          <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-4">
            <div className="flex-1">Ученик «{pendingDelete?.student.fullName || pendingDelete?.student.username}» удалён</div>
            <div><Button variant="ghost" size="sm" onClick={undo}>Отменить</Button></div>
          </div>
        </AnimatedToast>
      </div>
    </div>
  );
}
