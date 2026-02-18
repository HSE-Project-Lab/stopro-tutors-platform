import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AnimatedToast } from '@/components/ui';
import {
  Users,
  Plus,
  Trash,
  X,
  Search,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from 'lucide-react';
import type { User as Student } from '@/types';
import api from '@/lib/axios';

export function StudentsPage(): JSX.Element {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [tab, setTab] = useState<'students' | 'groups'>('students');
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);

  const [newGroupName, setNewGroupName] = useState('');
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    grade: '',
    targetScore: '',
    groupId: '',
  });

  const PENDING_KEY = 'tutors.pendingStudentDeletion';
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const [pending, setPending] = useState<{ student: Student; expiresAt: number } | null>(null);
  const pendingTimer = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [sRes, gRes] = await Promise.all([
          api.get('/teacher/students'),
          api.get('/teacher/groups'),
        ]);
        if (mounted) {
          setStudents(sRes.data || []);
          setGroups(gRes.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    })();

    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (raw) {
        const obj = JSON.parse(raw) as { student: Student; expiresAt: number };
        const remaining = obj.expiresAt - Date.now();
        if (remaining > 0) {
          setPending(obj);
          pendingTimer.current = window.setTimeout(async () => {
            try {
              await api.delete(`/teacher/students/${obj.student.id}`);
            } catch (e) {}
            localStorage.removeItem(PENDING_KEY);
            const r = await api.get('/teacher/students');
            if (mounted) setStudents(r.data || []);
            setPending(null);
            pendingTimer.current = null;
          }, remaining);
        } else {
          (async () => {
            try {
              await api.delete(`/teacher/students/${obj.student.id}`);
            } catch (e) {}
            localStorage.removeItem(PENDING_KEY);
            const r = await api.get('/teacher/students');
            if (mounted) setStudents(r.data || []);
          })();
        }
      }
    } catch (e) {}

    return () => {
      mounted = false;
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
  }, []);

  const filtered = students.filter(
    (s) =>
      (s.fullName || s.username || '').toLowerCase().includes(query.toLowerCase()) &&
      (!selectedGroup || selectedGroup === '' || s.groupId === selectedGroup)
  );

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    try {
      await api.post('/groups', { name: newGroupName });
      setShowAddGroup(false);
      setNewGroupName('');
      const g = await api.get('/teacher/groups');
      setGroups(g.data || []);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Ошибка');
    }
  };
  const handleCreateStudent = async () => {
    try {
      await api.post('/teacher/students', {
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        grade: Number(newStudent.grade) || undefined,
        targetScore: Number(newStudent.targetScore) || undefined,
        groupId: newStudent.groupId || undefined,
      });
      setShowAddStudent(false);
      const r = await api.get('/teacher/students');
      setStudents(r.data || []);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Ошибка');
    }
  };

  const confirmDelete = (s: Student) => setToDelete(s);
  const scheduleDelete = () => {
    if (!toDelete) return;
    const s = toDelete;
    setStudents((prev) => prev.filter((p) => p.id !== s.id));
    const expiresAt = Date.now() + 5000;
    const obj = { student: s, expiresAt };
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(obj));
    } catch (e) {}
    setPending(obj);
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = window.setTimeout(async () => {
      try {
        await api.delete(`/teacher/students/${s.id}`);
      } catch (e) {}
      localStorage.removeItem(PENDING_KEY);
      const r = await api.get('/teacher/students');
      setStudents(r.data || []);
      setPending(null);
      pendingTimer.current = null;
    }, 5000);
    setToDelete(null);
  };
  const undoDelete = () => {
    if (!pending) return;
    if (pendingTimer.current) {
      clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch (e) {}
    setStudents((prev) => [pending.student, ...prev]);
    setPending(null);
  };

  const initials = (s: Student) =>
    (s.fullName || s.username || '')
      .split(' ')
      .map((p) => p[0] || '')
      .slice(0, 2)
      .join('');
  const getProgress = (id: string) => ({
    successRate: Math.floor(Math.random() * 100),
    trend: Math.random() > 0.5 ? 'up' : 'down',
    tasksCompleted: Math.floor(Math.random() * 30),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ученики и группы</h1>
          <p className="text-slate-500 mt-1">Управляйте учениками и распределяйте их по группам</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowAddGroup(true)} className="rounded-full">
            <Users size={18} className="mr-2" />
            Создать группу
          </Button>
          <Button onClick={() => setShowAddStudent(true)} className="rounded-full">
            <Plus size={18} className="mr-2" />
            Добавить ученика
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('students')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${tab === 'students' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
        >
          Ученики ({students.length})
        </button>
        <button
          onClick={() => setTab('groups')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${tab === 'groups' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
        >
          Группы ({groups.length})
        </button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder={tab === 'students' ? 'Поиск по имени...' : 'Поиск группы...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
          {tab === 'students' && (
            <div className="w-56">
              <Select
                options={[
                  { value: '', label: 'Все группы' },
                  ...groups.map((g) => ({ value: g.id, label: g.name })),
                ]}
                value={selectedGroup || ''}
                onChange={(e) => setSelectedGroup(e.target.value || null)}
              />
            </div>
          )}
        </div>
      </Card>

      {tab === 'students' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500">
              Список учеников пуст. Добавьте первого ученика!
            </div>
          )}
          {filtered.map((s) => {
            const p = getProgress(s.id);
            const g = groups.find((g) => g.id === s.groupId);
            return (
              <Card key={s.id} className="hover:shadow-md hover:border-indigo-200 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                      {initials(s)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{s.fullName || s.username}</h3>
                      <p className="text-sm text-slate-500">{s.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => confirmDelete(s)}
                      className="p-1 hover:bg-slate-100 rounded-md text-sm text-red-600"
                      title="Удалить ученика"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Группа</span>
                    <Badge variant="info">{g?.name || 'Без группы'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Класс</span>
                    <span className="font-medium text-slate-900">{s.grade ?? '—'}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">Успешность</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-900">{p.successRate}%</span>
                        {p.trend === 'up' ? (
                          <TrendingUpIcon size={14} className="text-emerald-500" />
                        ) : (
                          <TrendingDownIcon size={14} className="text-red-500" />
                        )}
                      </div>
                    </div>
                    <ProgressBar
                      value={p.successRate}
                      color={
                        p.successRate >= 80 ? 'success' : p.successRate >= 60 ? 'warning' : 'danger'
                      }
                      size="sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  Решено {p.tasksCompleted} задач
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Добавить ученика</h2>
              <button
                onClick={() => setShowAddStudent(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Имя"
                  value={newStudent.firstName}
                  onChange={(e) =>
                    setNewStudent((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                />
                <Input
                  label="Фамилия"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <Select
                label="Группа"
                options={[
                  { value: '', label: 'Без группы' },
                  ...groups.map((g) => ({ value: g.id, label: g.name })),
                ]}
                value={newStudent.groupId}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, groupId: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Класс"
                  value={newStudent.grade}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, grade: e.target.value }))}
                />
                <Input
                  label="Целевой балл"
                  type="number"
                  value={newStudent.targetScore}
                  onChange={(e) =>
                    setNewStudent((prev) => ({ ...prev, targetScore: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddStudent(false)}>
                Отмена
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateStudent}
                disabled={!(newStudent.firstName && newStudent.lastName)}
              >
                Создать ученика
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Создать группу</h2>
              <button
                onClick={() => setShowAddGroup(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Название группы"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddGroup(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={handleCreateGroup} disabled={!newGroupName}>
                Создать группу
              </Button>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg">
            <div className="mb-4">Удалить ученика «{toDelete.fullName || toDelete.username}»?</div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setToDelete(null)}>
                Отмена
              </Button>
              <Button variant="danger" onClick={scheduleDelete}>
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed right-6 bottom-6 z-50">
        <AnimatedToast show={!!pending}>
          <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-4">
            <div className="flex-1">
              Ученик «{pending?.student.fullName || pending?.student.username}» удалён
            </div>
            <div>
              <Button variant="ghost" size="sm" onClick={undoDelete}>
                Отменить
              </Button>
            </div>
          </div>
        </AnimatedToast>
      </div>
    </div>
  );
}
