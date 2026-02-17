import { useState, useMemo, useEffect } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { HomeworkList } from '@/components/dashboard/HomeworkList';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

const teacherStatsDefault = {
  totalStudents: 0,
  activeHomeworks: 0,
  averageScore: 0,
  completionRate: 0,
  weeklyActivity: [] as any[],
  topPerformers: [] as any[],
  needsAttention: [] as any[],
};

const homeworks: any[] = [];
import {
  Users,
  ClipboardList,
  TrendingUp,
  CheckCircle,
  Plus,
  ArrowRight,
  AlertTriangle,
  Trophy,
  Sparkles,
  Calendar,
  Target,
  BookOpen,
  X,
  Mail,
  Pencil,
  Trash,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function TeacherDashboard() {
  const { user } = useAuthStore();
  const { setActiveTab } = useAppStore();
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showCreateHomeworkModal, setShowCreateHomeworkModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ email: '', firstName: '', lastName: '', groupId: '' });
  const [editGroupModal, setEditGroupModal] = useState<{ open: boolean; group: any | null }>({ open: false, group: null });
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [groupsState, setGroupsState] = useState<any[]>([]);
  const [teacherStats, setTeacherStats] = useState(() => ({ ...teacherStatsDefault }));
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [studentsForGroup, setStudentsForGroup] = useState<any[]>([]);
  const [showCredentialsModal, setShowCredentialsModal] = useState<{ open: boolean; creds: any[] }>({ open: false, creds: [] });
  const [addingStudent, setAddingStudent] = useState({ fullName: '', desiredScore: '' });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const motivationalText = useMemo(() => {
    const texts = [
      'Сегодня отличный день для новых достижений! 🚀',
      'Ваши ученики ждут новых знаний! 📚',
      'Каждый урок — шаг к успеху на ЕГЭ! 🎯',
      'Вместе мы достигнем высоких результатов! ⭐',
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  }, []);

  const handleAddStudent = async () => {
    try {
      const { default: api } = await import('@/lib/axios');
      await api.post('/teacher/students', {
        email: newStudent.email,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        grade: 11, // Default
        level: 'BEGINNER' // Default
      });
      
      alert(`Ученик ${newStudent.firstName} добавлен!`);
      setShowAddStudentModal(false);
      setNewStudent({ email: '', firstName: '', lastName: '', groupId: '' });

      try {
        const sres = await api.get('/teacher/students');
        const students: any[] = sres.data || [];
        setTeacherStats(prev => ({ ...prev, totalStudents: students.length }));
      } catch (err) {
        console.warn('Failed to refresh students after add', err);
      }
    } catch (error: any) {
      console.error('Failed to add student', error);
      alert(error.response?.data?.message || 'Ошибка при добавлении ученика');
    }
  };

  const handleCreateHomework = () => {
    setShowCreateHomeworkModal(false);
    setActiveTab('homework');
  };

  const handleEditGroup = (group: any) => {
    setEditGroupModal({ open: true, group });
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Удалить группу?')) return;
    try {
      const { default: api } = await import('@/lib/axios');
      await api.delete(`/groups/${groupId}`);
      setGroupsState(prev => prev.filter(g => g.id !== groupId));
      if (selectedGroup?.id === groupId) setSelectedGroup(null);
      alert('Группа удалена');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Ошибка при удалении группы');
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { default: api } = await import('@/lib/axios');
        const res = await api.get('/teacher/groups');
        if (mounted) setGroupsState(res.data || []);
      } catch (err) {
        console.error('Failed to load groups', err);
      }
    })();

    (async () => {
      try {
        const { default: api } = await import('@/lib/axios');
        const sres = await api.get('/teacher/students');
        const students: any[] = sres.data || [];
        if (mounted) setTeacherStats(prev => ({ ...prev, totalStudents: students.length }));
      } catch (err) {
        console.error('Failed to load students for stats', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openGroupDetails = async (group: any) => {
    setSelectedGroup(group);

    try {
      const { default: api } = await import('@/lib/axios');
      const res = await api.get('/teacher/students');
      const students: any[] = res.data || [];
      setStudentsForGroup(students.filter(s => s.groupId === group.id));
    } catch (err) {
      console.error('Failed to load students', err);
      setStudentsForGroup([]);
    }
  };

  const submitEditGroup = async (groupId: string, name: string) => {
    try {
      const { default: api } = await import('@/lib/axios');
      const res = await api.put(`/groups/${groupId}`, { name });
      const updated = res.data;
      setGroupsState(prev => prev.map(g => (g.id === updated.id ? updated : g)));
      setEditGroupModal({ open: false, group: null });
      alert('Группа обновлена');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при обновлении группы');
    }
  };

  const addStudentToGroup = async (groupId: string, fullName: string, desiredScore?: string) => {
    try {
      const { default: api } = await import('@/lib/axios');

      const res = await api.post(`/groups/${groupId}/students`, { studentNames: [fullName] });
      const creds = res.data?.credentials || [];

      const sres = await api.get('/teacher/students');
      const students: any[] = sres.data || [];
      setStudentsForGroup(students.filter(s => s.groupId === groupId));
      setShowCredentialsModal({ open: true, creds });
      setAddingStudent({ fullName: '', desiredScore: '' });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при добавлении ученика');
    }
  };

  const deleteStudent = async (studentId: string) => {
    if (!window.confirm('Удалить ученика?')) return;
    try {
      const { default: api } = await import('@/lib/axios');
      await api.delete(`/teacher/students/${studentId}`);

      if (selectedGroup) {
        const res = await api.get('/teacher/students');
        const students: any[] = res.data || [];
        setStudentsForGroup(students.filter(s => s.groupId === selectedGroup.id));
      }

      try {
        const sres = await api.get('/teacher/students');
        const students: any[] = sres.data || [];
        setTeacherStats(prev => ({ ...prev, totalStudents: students.length }));
      } catch (err) {
        console.warn('Failed to refresh students after delete', err);
      }
      alert('Ученик удалён');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при удалении ученика');
    }
  };

  const editStudent = async (studentId: string) => {
    const newName = window.prompt('Новое ФИО ученика');
    if (!newName) return;
    try {
      const { default: api } = await import('@/lib/axios');
      await api.put(`/teacher/students/${studentId}`, { fullName: newName });
      if (selectedGroup) {
        const res = await api.get('/teacher/students');
        const students: any[] = res.data || [];
        setStudentsForGroup(students.filter(s => s.groupId === selectedGroup.id));
      }
      alert('Данные ученика обновлены');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при обновлении ученика');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/10 rounded-full" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-yellow-300" />
              <span className="text-indigo-200 text-sm font-medium">СТОПРО • Панель учителя</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {getGreeting()}, {user?.fullName}! 👋
            </h1>
            <p className="text-indigo-100 text-lg mb-4">
              {motivationalText}
            </p>
            
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <Users size={18} />
                <span className="font-semibold">{teacherStats.totalStudents}</span>
                <span className="text-indigo-200">учеников</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <ClipboardList size={18} />
                <span className="font-semibold">{teacherStats.activeHomeworks}</span>
                <span className="text-indigo-200">активных ДЗ</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <Target size={18} />
                <span className="font-semibold">{teacherStats.averageScore}%</span>
                <span className="text-indigo-200">средний балл</span>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col gap-3">
            <Button 
              variant="secondary" 
              size="lg"
              className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
              onClick={() => setShowAddStudentModal(true)}
            >
              <Plus size={18} className="mr-2" />
              Добавить ученика
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => setShowCreateHomeworkModal(true)}
            >
              <BookOpen size={18} className="mr-2" />
              Создать ДЗ
            </Button>
          </div>
        </div>

        
        <div className="relative z-10 mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} />
            <div>
              <p className="font-medium">Сегодняшний план</p>
              <p className="text-sm text-indigo-200">2 урока • 5 ДЗ на проверке • 3 ученика ждут обратную связь</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10"
            onClick={() => setActiveTab('homework')}
          >
            Подробнее
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>

      
      <div className="lg:hidden grid grid-cols-2 gap-3">
        <Button onClick={() => setShowAddStudentModal(true)} className="w-full">
          <Plus size={18} className="mr-2" />
          Добавить ученика
        </Button>
        <Button variant="outline" onClick={() => setShowCreateHomeworkModal(true)} className="w-full">
          <BookOpen size={18} className="mr-2" />
          Создать ДЗ
        </Button>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => setActiveTab('students')} className="cursor-pointer">
          <StatsCard
            title="Всего учеников"
            value={teacherStats.totalStudents}
            change={{ value: 3, label: 'новых' }}
            icon={Users}
            color="indigo"
          />
        </div>
        <div onClick={() => setActiveTab('homework')} className="cursor-pointer">
          <StatsCard
            title="Активных ДЗ"
            value={teacherStats.activeHomeworks}
            icon={ClipboardList}
            color="amber"
          />
        </div>
        <div onClick={() => setActiveTab('analytics')} className="cursor-pointer">
          <StatsCard
            title="Средний балл"
            value={`${teacherStats.averageScore}%`}
            change={{ value: 2, label: 'рост' }}
            icon={TrendingUp}
            color="emerald"
          />
        </div>
        <div onClick={() => setActiveTab('homework')} className="cursor-pointer">
          <StatsCard
            title="Выполнение ДЗ"
            value={`${teacherStats.completionRate}%`}
            icon={CheckCircle}
            color="blue"
          />
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          
          <Card>
            <CardHeader
              title="Активность учеников"
              subtitle="Количество решённых задач за неделю"
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('analytics')}>
                  Подробнее
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              }
            />
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teacherStats.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar
                    dataKey="tasks"
                    fill="#818cf8"
                    radius={[4, 4, 0, 0]}
                    name="Задач решено"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          
          <HomeworkList homeworks={homeworks} viewType="teacher" />
        </div>

        
        <div className="space-y-6">
          
          <Card>
            <CardHeader
              title="Мои группы"
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('students')}>
                  Все
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              }
            />
            <div className="space-y-3">
              {groupsState.slice(0, 3).map((group) => (
                <div
                  key={group.id}
                  onClick={() => openGroupDetails(group)}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-slate-900">{group.name}</p>
                    <p className="text-sm text-slate-500">
                      {group.studentsCount} учеников
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        group.level === 'ADVANCED'
                          ? 'success'
                          : group.level === 'INTERMEDIATE'
                          ? 'info'
                          : 'default'
                      }
                    >
                      {group.level === 'ADVANCED'
                        ? 'Продвинутый'
                        : group.level === 'INTERMEDIATE'
                        ? 'Средний'
                        : 'Начальный'}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGroup(group);
                      }}
                      className="p-2 hover:bg-slate-200 rounded-full"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      className="p-2 hover:bg-red-100 rounded-full"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          
          {selectedGroup && (
            <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-6">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-auto">
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="text-lg font-bold">Группа: {selectedGroup.name}</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedGroup(null)}>Закрыть</Button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Ученики</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-sm text-slate-500">
                            <th className="py-2">ФИО</th>
                            <th className="py-2">Логин</th>
                            <th className="py-2">Группа</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsForGroup.map(s => (
                            <tr key={s.id} className="border-t">
                              <td className="py-2">{s.fullName}</td>
                              <td className="py-2">{s.username}</td>
                              <td className="py-2">{selectedGroup.name}</td>
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => editStudent(s.id)} className="p-1 rounded hover:bg-slate-100">Изменить</button>
                                  <button onClick={() => deleteStudent(s.id)} className="p-1 rounded hover:bg-red-100">Удалить</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {studentsForGroup.length === 0 && (
                            <tr><td colSpan={3} className="py-4 text-sm text-slate-500">Пока нет учеников в этой группе.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Добавить ученика</h4>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const name = (e.target as any).fullName.value;
                      const desired = (e.target as any).desiredScore.value;
                      await addStudentToGroup(selectedGroup.id, name, desired);
                    }} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <Input name="fullName" label="ФИО" required />
                      <Input name="desiredScore" label="Желаемый балл (опционально)" />
                      <div className="flex gap-2">
                        <Button type="submit">Добавить</Button>
                        <Button variant="outline" onClick={() => setSelectedGroup(null)} type="button">Отмена</Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          
          <Card>
            <CardHeader
              title="Лучшие результаты"
              action={<Trophy size={18} className="text-amber-500" />}
            />
            <div className="space-y-3">
              {teacherStats.topPerformers.map((student, index) => (
                <div
                  key={student.name}
                  onClick={() => setActiveTab('students')}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.group}</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">
                    {student.score}%
                  </span>
                </div>
              ))}
            </div>
          </Card>

          
          <Card>
            <CardHeader
              title="Требуют внимания"
              action={<AlertTriangle size={18} className="text-amber-500" />}
            />
            <div className="space-y-3">
              {teacherStats.needsAttention.map((student) => (
                <div
                  key={student.name}
                  onClick={() => setActiveTab('students')}
                  className="p-3 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <span className="text-sm font-bold text-red-600">
                      {student.score}%
                    </span>
                  </div>
                  <p className="text-sm text-red-600">{student.issue}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Добавить ученика</h2>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Input
                label="Email ученика"
                type="email"
                placeholder="student@example.com"
                value={newStudent.email}
                onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                icon={<Mail size={18} />}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Имя"
                  placeholder="Иван"
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                />
                <Input
                  label="Фамилия"
                  placeholder="Иванов"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <Select
                label="Группа"
                options={[
                  { value: '', label: 'Выберите группу' },
                  ...groupsState.map(g => ({ value: g.id, label: g.name }))
                ]}
                value={newStudent.groupId}
                onChange={(e) => setNewStudent(prev => ({ ...prev, groupId: e.target.value }))}
              />
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddStudentModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={handleAddStudent} disabled={!newStudent.email}>
                Отправить приглашение
              </Button>
            </div>
          </div>
        </div>
      )}

      
      {showCreateHomeworkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md text-center p-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Создать домашнее задание</h2>
            <p className="text-slate-500 mb-6">
              Перейдите в раздел "Домашние задания" для создания нового ДЗ с выбором задач и групп.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateHomeworkModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={handleCreateHomework}>
                Перейти
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      
      {editGroupModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Редактировать группу</h2>
              <button onClick={() => setEditGroupModal({ open: false, group: null })} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const name = (e.target as any).groupName.value;
              await submitEditGroup(editGroupModal.group.id, name);
            }}>
              <Input
                label="Название группы"
                name="groupName"
                defaultValue={editGroupModal.group?.name}
                required
              />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditGroupModal({ open: false, group: null })} type="button">
                  Отмена
                </Button>
                <Button className="flex-1" type="submit">
                  Сохранить
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showCredentialsModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Учётные данные</h3>
              <button onClick={() => setShowCredentialsModal({ open: false, creds: [] })} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {showCredentialsModal.creds.map((c, idx) => (
                <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.fullName}</div>
                    <div className="text-sm text-slate-500">{c.username} / {c.password}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(`${c.username}:${c.password}`); }} className="px-3 py-1 bg-slate-100 rounded">Копировать</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
