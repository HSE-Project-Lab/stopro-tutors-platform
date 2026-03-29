import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  Settings,
  Edit,
  Trash,
  Copy,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { AnimatedToast } from '@/components/ui/AnimatedToast';
import type { Student, StudyGroup as Group } from '@/types';
import api from '@/lib/axios';
import { AnimatePresence } from 'framer-motion';

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
        setTimeout(onClose, 180);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleOverlayClick = () => {
    setVisible(false);
    setTimeout(onClose, 180);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleOverlayClick}
      />
      <div
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

interface StudentCreateResponse {
  student: Student;
  credentials?: {
    fullName: string;
    username: string;
    password: string;
  };
}

export function StudentsPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'groups'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);

  const [showStudentDetail, setShowStudentDetail] = useState<Student | null>(null);
  const [showGroupDetail, setShowGroupDetail] = useState<Group | null>(null);

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    firstName: '',
    lastName: '',
    groupId: '',
    grade: '11',
    targetScore: '70',
  });

  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState<Group | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const [lastRemoval, setLastRemoval] = useState<{
    studentId: string;
    groupId: string | null;
    name: string;
  } | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  const [lastGroupDeletion, setLastGroupDeletion] = useState<{
    group: Group;
    studentIds: string[];
  } | null>(null);
  const groupUndoTimerRef = useRef<number | null>(null);

  const [pendingStudentDeletion, setPendingStudentDeletion] = useState<{
    student: Student;
  } | null>(null);
  const pendingDeleteTimerRef = useRef<number | null>(null);

  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState<string>('');
  const [addMode, setAddMode] = useState<'new' | 'existing'>('new');
  const [addOriginGroupId, setAddOriginGroupId] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    groupId: '',
    grade: '11',
    targetScore: '70',
  });
  const [newGroup, setNewGroup] = useState({ name: '' });
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    username: string;
    password: string;
  } | null>(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/teacher/students');
        setStudents(response.data);
      } catch (error) {
        console.error('Failed to fetch students', error);
      }
    };
    fetchStudents();
  }, [activeTab]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/teacher/groups');
        setGroups(response.data || []);
      } catch (error) {
        console.error('Failed to fetch groups', error);
      }
    };
    fetchGroups();
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (groupUndoTimerRef.current) clearTimeout(groupUndoTimerRef.current);
      if (pendingDeleteTimerRef.current) clearTimeout(pendingDeleteTimerRef.current);
    };
  }, []);

  const refreshData = async () => {
    try {
      const [sResp, gResp] = await Promise.all([
        api.get('/teacher/students'),
        api.get('/teacher/groups'),
      ]);
      setStudents(sResp.data);
      setGroups(gResp.data || []);
    } catch (err) {
      console.error('Failed to refresh data', err);
    }
  };

  const getStudentProgress = (_studentId: string) => ({
    successRate: 0,
    tasksCompleted: 0,
    trend: 'up' as const,
  });

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((s) => s[0] || '')
      .slice(0, 2)
      .join('');
  };

  const handleConfirmRemove = async () => {
    if (!studentToRemove) return;
    const sid = studentToRemove.id;
    const name = studentToRemove.fullName || studentToRemove.username || sid;
    const prevGroupId = studentToRemove.groupId || null;
    try {
      await api.put(`/teacher/students/${sid}`, { groupId: null });
      await refreshData();
      setStudentToRemove(null);
      setLastRemoval({ studentId: sid, groupId: prevGroupId, name });
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = window.setTimeout(() => {
        setLastRemoval(null);
        undoTimerRef.current = null;
      }, 5000);
    } catch (err: any) {
      console.error('Failed to remove student from group', err);
      alert(err?.response?.data?.message || 'Ошибка при удалении ученика из группы');
    }
  };

  const handleUndoRemoval = async () => {
    if (!lastRemoval) return;
    try {
      await api.put(`/teacher/students/${lastRemoval.studentId}`, {
        groupId: lastRemoval.groupId,
      });
      await refreshData();
      setLastRemoval(null);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    } catch (err: any) {
      console.error('Failed to undo removal', err);
      alert(err?.response?.data?.message || 'Ошибка при восстановлении ученика в группу');
    }
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const s = studentToDelete;
    setStudents((prev) => prev.filter((p) => p.id !== s.id));
    setPendingStudentDeletion({ student: s });
    setStudentToDelete(null);

    if (showStudentDetail?.id === s.id) setShowStudentDetail(null);

    if (pendingDeleteTimerRef.current) clearTimeout(pendingDeleteTimerRef.current);
    pendingDeleteTimerRef.current = window.setTimeout(async () => {
      try {
        await api.delete(`/teacher/students/${s.id}`);
      } catch (err) {
        console.warn('Failed finalizing student deletion', err);
      }
      setPendingStudentDeletion(null);
      pendingDeleteTimerRef.current = null;
    }, 5000);
  };

  const handleUndoStudentDelete = () => {
    if (!pendingStudentDeletion) return;
    const s = pendingStudentDeletion.student;
    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current);
      pendingDeleteTimerRef.current = null;
    }
    setStudents((prev) => [s, ...prev]);
    setPendingStudentDeletion(null);
  };

  const openEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setShowEditGroupModal(true);
  };

  const submitEditGroup = async () => {
    if (!editingGroup) return;
    const name = editGroupName.trim();
    if (!name) return alert('Название не может быть пустым');
    try {
      const resp = await api.put(`/groups/${editingGroup.id}`, { name });
      const updated = resp.data;
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));

      if (showGroupDetail?.id === updated.id) setShowGroupDetail(updated);
      setShowEditGroupModal(false);
      setEditingGroup(null);
    } catch (err: any) {
      console.error('Failed to update group', err);
      alert(err.response?.data?.message || 'Ошибка при обновлении группы');
    }
  };

  const confirmDeleteGroup = async () => {
    if (!showDeleteGroupModal) return;
    const group = showDeleteGroupModal;
    const studentIds = students.filter((s) => s.groupId === group.id).map((s) => s.id);
    try {
      await api.delete(`/groups/${group.id}`);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
      setShowDeleteGroupModal(null);
      if (showGroupDetail?.id === group.id) setShowGroupDetail(null);
      setLastGroupDeletion({ group, studentIds });
      if (groupUndoTimerRef.current) clearTimeout(groupUndoTimerRef.current);
      groupUndoTimerRef.current = window.setTimeout(() => {
        setLastGroupDeletion(null);
        groupUndoTimerRef.current = null;
      }, 5000);
      await refreshData();
    } catch (err: any) {
      console.error('Failed to delete group', err);
      alert(err.response?.data?.message || 'Ошибка при удалении группы');
    }
  };

  const handleUndoDeleteGroup = async () => {
    if (!lastGroupDeletion) return;
    try {
      const resp = await api.post('/groups', { name: lastGroupDeletion.group.name });
      const created = resp.data;
      for (const sid of lastGroupDeletion.studentIds) {
        try {
          await api.put(`/teacher/students/${sid}`, { groupId: created.id });
        } catch (err) {
          console.warn('Failed to reassign student', sid, err);
        }
      }
      await refreshData();
      setLastGroupDeletion(null);
      if (groupUndoTimerRef.current) {
        clearTimeout(groupUndoTimerRef.current);
        groupUndoTimerRef.current = null;
      }
    } catch (err: any) {
      console.error('Failed to undo group deletion', err);
      alert(err?.response?.data?.message || 'Ошибка при восстановлении группы');
    }
  };

  const openEditStudent = (student: Student) => {
    const nameParts = (student.fullName || '').split(' ');
    setEditingStudent(student);
    setEditStudentForm({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      groupId: student.groupId || '',
      grade: String(student.grade ?? '11'),
      targetScore: String(student.targetScore ?? '70'),
    });
    setShowEditStudentModal(true);
  };

  const submitEditStudent = async () => {
    if (!editingStudent) return;
    const fullName =
      `${editStudentForm.firstName.trim()} ${editStudentForm.lastName.trim()}`.trim();
    if (!fullName) return alert('Укажите имя');
    try {
      await api.put(`/teacher/students/${editingStudent.id}`, {
        fullName,
        groupId: editStudentForm.groupId || null,
        grade: parseInt(editStudentForm.grade) || 11,
        targetScore: parseInt(editStudentForm.targetScore) || 70,
      });
      await refreshData();

      const updated = (await api.get('/teacher/students')).data.find(
        (s: Student) => s.id === editingStudent.id
      );
      if (updated && showStudentDetail?.id === editingStudent.id) {
        setShowStudentDetail(updated);
      }
      setShowEditStudentModal(false);
      setEditingStudent(null);
    } catch (err: any) {
      console.error('Failed to update student', err);
      alert(err?.response?.data?.message || 'Ошибка при обновлении ученика');
    }
  };

  const handleAddStudent = async () => {
    try {
      const targetGroupId = addOriginGroupId || newStudent.groupId || '';
      if (addMode === 'existing') {
        if (!selectedExistingStudentId) return alert('Выберите ученика');
        await api.put(`/teacher/students/${selectedExistingStudentId}`, {
          groupId: targetGroupId || null,
        });
      } else {
        const fullName = `${newStudent.firstName.trim()} ${newStudent.lastName.trim()}`;
        if (!fullName.trim()) return alert('Укажите имя и фамилию');

        const response = await api.post<StudentCreateResponse>('/teacher/students', {
          fullName,
          groupId: targetGroupId || null,
        });

        if (response.data?.credentials) {
          setCreatedCredentials(response.data.credentials);
          setCredentialsCopied(false);
        }
      }

      setShowAddStudentModal(false);
      setAddOriginGroupId('');
      setNewStudent({ firstName: '', lastName: '', groupId: '', grade: '11', targetScore: '70' });
      setSelectedExistingStudentId('');
      await refreshData();
    } catch (e) {
      console.error('Error adding/assigning student', e);
      alert('Ошибка при добавлении/назначении');
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdCredentials) return;
    const text = `Логин: ${createdCredentials.username}\nПароль: ${createdCredentials.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCredentialsCopied(true);
      window.setTimeout(() => setCredentialsCopied(false), 1800);
    } catch {
      alert('Не удалось скопировать. Скопируйте данные вручную.');
    }
  };

  const handleAddGroup = async () => {
    const name = newGroup.name?.trim() || '';
    if (name.length < 2) {
      alert('Название группы должно быть от 2 до 255 символов');
      return;
    }
    try {
      const response = await api.post('/groups', { name });
      const created = response.data;
      setGroups((prev) => [
        {
          ...created,
          level: created.level || 'INTERMEDIATE',
          createdAt: created.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowAddGroupModal(false);
      setNewGroup({ name: '' });
    } catch (err: any) {
      console.error('Failed to create group', err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data?.error;
      if (status === 401) return alert('Сессия истекла. Войдите снова.');
      if (status === 403) return alert('Нет прав для создания группы.');
      if (status === 400 && msg) return alert(msg);
      if (err.code === 'ERR_NETWORK' || !status) return alert('Не удалось связаться с сервером.');
      alert(msg || `Ошибка создания группы${status ? ` (${status})` : ''}`);
    }
  };

  const filteredStudents = students.filter((student) => {
    const fullName = (student.fullName || '').toLowerCase();
    if (searchQuery && !fullName.includes(searchQuery.toLowerCase())) return false;
    if (selectedGroup && student.groupId !== selectedGroup) return false;
    return true;
  });

  const filteredGroups = groups.filter((group) => {
    if (searchQuery && !group.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderToasts = () => (
    <AnimatePresence>
      {lastRemoval && (
        <AnimatedToast
          key={`removal-${lastRemoval.studentId}`}
          message={`Ученик "${lastRemoval.name}" удалён из группы`}
          type="info"
          onClose={() => setLastRemoval(null)}
          duration={5000}
          action={{ label: 'Отменить', onClick: handleUndoRemoval }}
        />
      )}

      {lastGroupDeletion && (
        <AnimatedToast
          key={`groupdel-${lastGroupDeletion.group.id}`}
          message={`Группа "${lastGroupDeletion.group.name}" удалена`}
          type="info"
          onClose={() => setLastGroupDeletion(null)}
          duration={5000}
          action={{ label: 'Отменить', onClick: handleUndoDeleteGroup }}
        />
      )}

      {pendingStudentDeletion && (
        <AnimatedToast
          key={`pendingdel-${pendingStudentDeletion.student.id}`}
          message={`Ученик "${pendingStudentDeletion.student.fullName || pendingStudentDeletion.student.username}" удалён`}
          type="info"
          onClose={() => setPendingStudentDeletion(null)}
          duration={5000}
          action={{ label: 'Отменить', onClick: handleUndoStudentDelete }}
        />
      )}
    </AnimatePresence>
  );

  const renderModals = () => (
    <>
      {studentToRemove && (
        <Modal onClose={() => setStudentToRemove(null)}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Убрать из группы</h2>
            <button
              onClick={() => setStudentToRemove(null)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-700 mb-4">
              Убрать ученика &quot;{studentToRemove.fullName || studentToRemove.username}&quot; из
              группы?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStudentToRemove(null)}>
                Отмена
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleConfirmRemove}>
                Удалить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {studentToDelete && (
        <Modal onClose={() => setStudentToDelete(null)}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Удалить ученика</h2>
            <button
              onClick={() => setStudentToDelete(null)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-700 mb-4">
              Удалить ученика &quot;{studentToDelete.fullName || studentToDelete.username}&quot;
              навсегда? Вы сможете отменить это в течение нескольких секунд.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStudentToDelete(null)}>
                Отмена
              </Button>
              <Button variant="danger" className="flex-1" onClick={confirmDeleteStudent}>
                Удалить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteGroupModal && (
        <Modal onClose={() => setShowDeleteGroupModal(null)}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Удалить группу</h2>
            <button
              onClick={() => setShowDeleteGroupModal(null)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-600 mb-4">
              Удалить группу &quot;{showDeleteGroupModal.name}&quot;?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteGroupModal(null)}
              >
                Отмена
              </Button>
              <Button variant="danger" className="flex-1" onClick={confirmDeleteGroup}>
                Удалить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showEditGroupModal && editingGroup && (
        <Modal
          onClose={() => {
            setShowEditGroupModal(false);
            setEditingGroup(null);
          }}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Редактировать группу</h2>
            <button
              onClick={() => {
                setShowEditGroupModal(false);
                setEditingGroup(null);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <Input
              label="Название группы"
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
            />
          </div>
          <div className="p-6 border-t border-slate-100 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowEditGroupModal(false);
                setEditingGroup(null);
              }}
            >
              Отмена
            </Button>
            <Button className="flex-1" onClick={submitEditGroup}>
              Сохранить
            </Button>
          </div>
        </Modal>
      )}

      {showEditStudentModal && editingStudent && (
        <Modal
          onClose={() => {
            setShowEditStudentModal(false);
            setEditingStudent(null);
          }}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Редактировать ученика</h2>
            <button
              onClick={() => {
                setShowEditStudentModal(false);
                setEditingStudent(null);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Имя"
                value={editStudentForm.firstName}
                onChange={(e) =>
                  setEditStudentForm((prev) => ({ ...prev, firstName: e.target.value }))
                }
              />
              <Input
                label="Фамилия"
                value={editStudentForm.lastName}
                onChange={(e) =>
                  setEditStudentForm((prev) => ({ ...prev, lastName: e.target.value }))
                }
              />
            </div>
            <Select
              label="Группа"
              options={[
                { value: '', label: 'Без группы' },
                ...groups.map((g) => ({ value: g.id, label: g.name })),
              ]}
              value={editStudentForm.groupId}
              onChange={(value) => setEditStudentForm((prev) => ({ ...prev, groupId: value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Класс"
                options={[
                  { value: '10', label: '10 класс' },
                  { value: '11', label: '11 класс' },
                ]}
                value={editStudentForm.grade}
                onChange={(value) => setEditStudentForm((prev) => ({ ...prev, grade: value }))}
              />
              <Input
                label="Целевой балл"
                type="number"
                min={0}
                max={100}
                value={editStudentForm.targetScore}
                onChange={(e) =>
                  setEditStudentForm((prev) => ({ ...prev, targetScore: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowEditStudentModal(false);
                setEditingStudent(null);
              }}
            >
              Отмена
            </Button>
            <Button className="flex-1" onClick={submitEditStudent}>
              Сохранить
            </Button>
          </div>
        </Modal>
      )}

      {showAddStudentModal && (
        <Modal
          onClose={() => {
            setShowAddStudentModal(false);
            setAddOriginGroupId('');
          }}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Добавить ученика</h2>
            <button
              onClick={() => {
                setShowAddStudentModal(false);
                setAddOriginGroupId('');
              }}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={addMode === 'new' ? 'primary' : 'outline'}
                className="rounded-full"
                onClick={() => setAddMode('new')}
              >
                Создать нового
              </Button>
              <Button
                size="sm"
                variant={addMode === 'existing' ? 'primary' : 'outline'}
                className="rounded-full"
                onClick={() => setAddMode('existing')}
              >
                Добавить существующего
              </Button>
            </div>

            {addMode === 'new' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Имя"
                    placeholder="Иван"
                    value={newStudent.firstName}
                    onChange={(e) =>
                      setNewStudent((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                  />
                  <Input
                    label="Фамилия"
                    placeholder="Иванов"
                    value={newStudent.lastName}
                    onChange={(e) =>
                      setNewStudent((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                  />
                </div>
                {!addOriginGroupId && (
                  <Select
                    label="Группа"
                    options={[
                      { value: '', label: 'Без группы' },
                      ...groups.map((g) => ({ value: g.id, label: g.name })),
                    ]}
                    value={newStudent.groupId}
                    onChange={(value) => setNewStudent((prev) => ({ ...prev, groupId: value }))}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Класс"
                    options={[
                      { value: '10', label: '10 класс' },
                      { value: '11', label: '11 класс' },
                    ]}
                    value={newStudent.grade}
                    onChange={(value) => setNewStudent((prev) => ({ ...prev, grade: value }))}
                  />
                  <Input
                    label="Целевой балл"
                    type="number"
                    min={0}
                    max={100}
                    value={newStudent.targetScore}
                    onChange={(e) =>
                      setNewStudent((prev) => ({ ...prev, targetScore: e.target.value }))
                    }
                  />
                </div>
              </>
            ) : (
              <>
                {!addOriginGroupId && (
                  <Select
                    label="Группа (куда назначить)"
                    options={[
                      { value: '', label: 'Без группы' },
                      ...groups.map((g) => ({ value: g.id, label: g.name })),
                    ]}
                    value={newStudent.groupId}
                    onChange={(value) => setNewStudent((prev) => ({ ...prev, groupId: value }))}
                  />
                )}
                <Select
                  label="Ученик"
                  placeholder="Выберите ученика..."
                  options={students
                    .filter((s) => s.groupId !== (addOriginGroupId || newStudent.groupId))
                    .map((s) => ({
                      value: s.id,
                      label: s.fullName || s.username || 'Без имени',
                    }))}
                  value={selectedExistingStudentId}
                  onChange={(value) => setSelectedExistingStudentId(value)}
                />
              </>
            )}
          </div>
          <div className="p-6 border-t border-slate-100 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => {
                setShowAddStudentModal(false);
                setAddOriginGroupId('');
              }}
            >
              Отмена
            </Button>
            <Button
              className="flex-1 rounded-full"
              onClick={handleAddStudent}
              disabled={
                addMode === 'new'
                  ? !(newStudent.firstName && newStudent.lastName)
                  : !selectedExistingStudentId
              }
            >
              {addMode === 'new' ? 'Создать ученика' : 'Назначить'}
            </Button>
          </div>
        </Modal>
      )}

      {showAddGroupModal && (
        <Modal onClose={() => setShowAddGroupModal(false)}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Создать группу</h2>
            <button
              onClick={() => setShowAddGroupModal(false)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <Input
              label="Название группы"
              placeholder="Например: Группа 11А"
              value={newGroup.name}
              onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="p-6 border-t border-slate-100 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowAddGroupModal(false)}
            >
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleAddGroup} disabled={!newGroup.name}>
              Создать группу
            </Button>
          </div>
        </Modal>
      )}

      {createdCredentials && (
        <Modal
          onClose={() => {
            setCreatedCredentials(null);
            setCredentialsCopied(false);
          }}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Данные ученика для входа</h2>
            <button
              onClick={() => {
                setCreatedCredentials(null);
                setCredentialsCopied(false);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Ученик</p>
                <p className="font-semibold text-slate-900">{createdCredentials.fullName}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-1">Логин</p>
                  <p className="font-mono text-slate-900 break-all">
                    {createdCredentials.username}
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-1">Пароль</p>
                  <p className="font-mono text-slate-900 break-all">
                    {createdCredentials.password}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Сохраните эти данные сейчас — позже пароль в открытом виде не показывается.
            </p>
          </div>

          <div className="p-6 border-t border-slate-100 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCopyCredentials}>
              {credentialsCopied ? (
                <Check size={16} className="mr-2" />
              ) : (
                <Copy size={16} className="mr-2" />
              )}
              {credentialsCopied ? 'Скопировано' : 'Скопировать в буфер'}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setCreatedCredentials(null);
                setCredentialsCopied(false);
              }}
            >
              Готово
            </Button>
          </div>
        </Modal>
      )}
    </>
  );

  if (showStudentDetail) {
    const progress = getStudentProgress(showStudentDetail.id);
    const group = groups.find((g) => g.id === showStudentDetail.groupId);

    return (
      <>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setShowStudentDetail(null)}>
            ← Назад к списку
          </Button>

          <Card padding="lg">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(showStudentDetail.fullName || '')}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">{showStudentDetail.fullName}</h1>
                <p className="text-slate-500">{showStudentDetail.username}</p>
                {group && (
                  <Badge variant="info" className="mt-2">
                    {group.name}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditStudent(showStudentDetail)}
                >
                  <Edit size={16} className="mr-1" />
                  Редактировать
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setStudentToDelete(showStudentDetail)}
                >
                  <Trash size={16} className="mr-1" />
                  Удалить
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{progress.tasksCompleted}</p>
              <p className="text-slate-500">Задач решено</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-emerald-600">{progress.successRate}%</p>
              <p className="text-slate-500">Успешность</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-amber-600">
                {showStudentDetail.targetScore ?? '—'}
              </p>
              <p className="text-slate-500">Целевой балл</p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Прогресс по темам" />
            <div className="space-y-4">
              {[
                { name: 'Вычисления', rate: 95 },
                { name: 'Уравнения', rate: 88 },
                { name: 'Вероятности', rate: 75 },
                { name: 'Тригонометрия', rate: 62 },
                { name: 'Параметры', rate: 45 },
              ].map((topic) => (
                <div key={topic.name} className="flex items-center gap-4">
                  <span className="w-32 text-sm font-medium text-slate-700">{topic.name}</span>
                  <div className="flex-1">
                    <ProgressBar
                      value={topic.rate}
                      color={topic.rate >= 80 ? 'success' : topic.rate >= 60 ? 'warning' : 'danger'}
                      size="md"
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-slate-700">
                    {topic.rate}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {renderModals()}
        {renderToasts()}
      </>
    );
  }

  if (showGroupDetail) {
    const groupStudents = students.filter((s) => s.groupId === showGroupDetail.id);

    return (
      <>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setShowGroupDetail(null)}>
            ← Назад к списку
          </Button>

          <Card padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{showGroupDetail.name}</h1>
                <p className="text-slate-500 mt-1">{groupStudents.length} учеников</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditGroup(showGroupDetail)}>
                  <Settings size={16} className="mr-1" />
                  Редактировать
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAddMode('new');
                    setAddOriginGroupId(showGroupDetail.id);
                    setShowAddStudentModal(true);
                  }}
                >
                  <UserPlus size={16} className="mr-1" />
                  Добавить ученика
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Ученики группы" subtitle={`${groupStudents.length} учеников`} />
            <div className="space-y-3">
              {groupStudents.length === 0 && (
                <p className="text-center text-slate-400 py-8">В группе пока нет учеников</p>
              )}
              {groupStudents.map((student) => {
                const progress = getStudentProgress(student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() => setShowStudentDetail(student)}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                        {getInitials(student.fullName || '')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{student.fullName}</p>
                        <p className="text-sm text-slate-500">{student.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-900">
                            {progress.successRate}%
                          </span>
                          {progress.trend === 'up' ? (
                            <TrendingUp size={14} className="text-emerald-500" />
                          ) : (
                            <TrendingDown size={14} className="text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{progress.tasksCompleted} задач</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStudentToRemove(student);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-sm text-red-500 hover:text-red-700 transition-colors"
                        title="Удалить из группы"
                      >
                        <X size={16} />
                      </button>
                      <ChevronRight size={18} className="text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {renderModals()}
        {renderToasts()}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ученики и группы</h1>
            <p className="text-slate-500 mt-1">
              Управляйте учениками и распределяйте их по группам
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddGroupModal(true)}
              className="rounded-xl h-[47px] px-6 text-[15px]"
            >
              <Users size={18} className="mr-2" />
              Создать группу
            </Button>
            <Button
              onClick={() => {
                setAddMode('new');
                setAddOriginGroupId('');
                setShowAddStudentModal(true);
              }}
              className="rounded-xl h-[47px] px-6 text-[15px]"
            >
              <Plus size={18} className="mr-2" />
              Добавить ученика
            </Button>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'students'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            Ученики ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'groups'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            Группы ({groups.length})
          </button>
        </div>

        <Card>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={activeTab === 'students' ? 'Поиск по имени...' : 'Поиск группы...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>
            {activeTab === 'students' && (
              <div className="w-56">
                <Select
                  options={[
                    { value: '', label: 'Все группы' },
                    ...groups.map((g) => ({ value: g.id, label: g.name })),
                  ]}
                  value={selectedGroup}
                  onChange={(value) => setSelectedGroup(value)}
                />
              </div>
            )}
          </div>
        </Card>

        {activeTab === 'students' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500">
                Список учеников пуст. Добавьте первого ученика!
              </div>
            )}
            {filteredStudents.map((student) => {
              const progress = getStudentProgress(student.id);
              const group = groups.find((g) => g.id === student.groupId);

              return (
                <Card
                  key={student.id}
                  className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
                  onClick={() => setShowStudentDetail(student)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                        {getInitials(student.fullName || student.username || '')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {student.fullName || student.username || ''}
                        </h3>
                        <p className="text-sm text-slate-500">{student.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStudentToDelete(student);
                      }}
                      title="Удалить ученика"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Группа</span>
                      <Badge variant="info">{group?.name || 'Без группы'}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Класс</span>
                      <span className="font-medium text-slate-900">{student.grade ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Целевой балл</span>
                      <span className="font-medium text-slate-900">
                        {student.targetScore ?? '—'}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">Успешность</span>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-900">
                            {progress.successRate}%
                          </span>
                          {progress.trend === 'up' ? (
                            <TrendingUp size={14} className="text-emerald-500" />
                          ) : (
                            <TrendingDown size={14} className="text-red-500" />
                          )}
                        </div>
                      </div>
                      <ProgressBar
                        value={progress.successRate}
                        color={
                          progress.successRate >= 80
                            ? 'success'
                            : progress.successRate >= 60
                              ? 'warning'
                              : 'danger'
                        }
                        size="sm"
                      />
                    </div>
                    <p className="text-xs text-slate-400 text-center">
                      Решено {progress.tasksCompleted} задач
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500">
                Нет групп. Создайте первую!
              </div>
            )}
            {filteredGroups.map((group) => {
              const groupStudents = students.filter((s) => s.groupId === group.id);
              const avgSuccess =
                groupStudents.length > 0
                  ? Math.round(
                      groupStudents.reduce(
                        (acc, s) => acc + getStudentProgress(s.id).successRate,
                        0
                      ) / groupStudents.length
                    )
                  : 0;

              return (
                <Card
                  key={group.id}
                  className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
                  onClick={() => setShowGroupDetail(group)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white">
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{group.name}</h3>
                        <p className="text-sm text-slate-500">{groupStudents.length} учеников</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteGroupModal(group);
                      }}
                      title="Удалить группу"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Средний балл</span>
                      <span className="font-semibold text-slate-900">{avgSuccess}%</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditGroup(group);
                      }}
                    >
                      <Settings size={14} className="mr-1" />
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddMode('new');
                        setAddOriginGroupId(group.id);
                        setShowAddStudentModal(true);
                      }}
                    >
                      <UserPlus size={14} className="mr-1" />
                      Добавить
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {renderModals()}
      {renderToasts()}
    </>
  );
}
