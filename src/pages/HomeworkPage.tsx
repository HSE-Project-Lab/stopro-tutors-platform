import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuthStore } from '@/store/authStore';

const homeworks: any[] = [];
const groups: any[] = [];
const tasks: any[] = [];
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  X,
  Trash2,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Homework, Task } from '@/types';

export function HomeworkPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    groupId: '',
    deadline: '',
    selectedTasks: [] as Task[],
  });

  const filteredHomeworks = homeworks.filter((hw) => {
    if (searchQuery && !hw.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedStatus && hw.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: Homework['status'], deadline: string) => {
    const daysLeft = differenceInDays(parseISO(deadline), new Date());

    if (status === 'COMPLETED') {
      return <Badge variant="success">Выполнено</Badge>;
    }
    if (status === 'OVERDUE') {
      return <Badge variant="danger">Просрочено</Badge>;
    }
    if (daysLeft <= 1) {
      return <Badge variant="warning">Срочно</Badge>;
    }
    return <Badge variant="info">Активно</Badge>;
  };

  const handleCreateHomework = () => {

    alert(`Создано ДЗ: ${newHomework.title}\nГруппа: ${newHomework.groupId}\nЗадач: ${newHomework.selectedTasks.length}`);
    setShowCreateModal(false);
    setNewHomework({ title: '', description: '', groupId: '', deadline: '', selectedTasks: [] });
  };

  const addTaskToHomework = (task: Task) => {
    if (!newHomework.selectedTasks.find(t => t.id === task.id)) {
      setNewHomework(prev => ({
        ...prev,
        selectedTasks: [...prev.selectedTasks, task]
      }));
    }
  };

  const removeTaskFromHomework = (taskId: string) => {
    setNewHomework(prev => ({
      ...prev,
      selectedTasks: prev.selectedTasks.filter(t => t.id !== taskId)
    }));
  };

  if (selectedHomework) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedHomework(null)}>
            ← Назад к списку
          </Button>
          {getStatusBadge(selectedHomework.status, selectedHomework.deadline)}
        </div>

        <Card padding="lg">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{selectedHomework.title}</h1>
              <p className="text-slate-500 mt-1">{selectedHomework.groupName}</p>
              {selectedHomework.description && (
                <p className="text-slate-600 mt-3">{selectedHomework.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={16} />
                <span>Дедлайн: {format(parseISO(selectedHomework.deadline), 'd MMMM yyyy', { locale: ru })}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {differenceInDays(parseISO(selectedHomework.deadline), new Date())} дней осталось
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{selectedHomework.tasks.length}</p>
              <p className="text-sm text-slate-500">Задач</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{selectedHomework.completedCount}</p>
              <p className="text-sm text-slate-500">Выполнили</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {Math.round((selectedHomework.completedCount / selectedHomework.totalCount) * 100)}%
              </p>
              <p className="text-sm text-slate-500">Выполнение</p>
            </div>
          </div>

          <h3 className="font-semibold text-slate-900 mb-4">Задачи в задании</h3>
          <div className="space-y-3">
            {selectedHomework.tasks.map((task, index) => (
              <div key={task.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default">№{task.egeNumber}</Badge>
                    <Badge 
                      variant={task.difficulty === 'EASY' ? 'success' : task.difficulty === 'MEDIUM' ? 'warning' : 'danger'}
                    >
                      {task.difficulty === 'EASY' ? 'Лёгкая' : task.difficulty === 'MEDIUM' ? 'Средняя' : 'Сложная'}
                    </Badge>
                  </div>
                  <p className="text-slate-700">{task.content}</p>
                </div>
              </div>
            ))}
          </div>

          {!isTeacher && selectedHomework.status === 'ACTIVE' && (
            <Button className="w-full mt-6" size="lg">
              Начать выполнение
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isTeacher ? 'Домашние задания' : 'Мои задания'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isTeacher 
              ? 'Управляйте домашними заданиями для ваших групп'
              : 'Текущие и выполненные домашние задания'
            }
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={18} className="mr-2" />
            Создать ДЗ
          </Button>
        )}
      </div>

      
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
          <div className="w-48">
            <Select
              options={[
                { value: '', label: 'Все статусы' },
                { value: 'ACTIVE', label: 'Активные' },
                { value: 'COMPLETED', label: 'Выполненные' },
                { value: 'OVERDUE', label: 'Просроченные' },
              ]}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
        </div>
      </Card>

      
      {isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <FileText size={24} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{homeworks.length}</p>
              <p className="text-sm text-slate-500">Всего ДЗ</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {homeworks.filter(h => h.status === 'ACTIVE').length}
              </p>
              <p className="text-sm text-slate-500">Активных</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {homeworks.filter(h => differenceInDays(parseISO(h.deadline), new Date()) <= 2 && h.status === 'ACTIVE').length}
              </p>
              <p className="text-sm text-slate-500">Срочных</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{groups.length}</p>
              <p className="text-sm text-slate-500">Групп</p>
            </div>
          </Card>
        </div>
      )}

      
      <div className="space-y-4">
        {filteredHomeworks.map((hw) => (
          <Card
            key={hw.id}
            className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
            onClick={() => setSelectedHomework(hw)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-slate-900">{hw.title}</h3>
                  {getStatusBadge(hw.status, hw.deadline)}
                </div>
                <p className="text-slate-500 mb-3">{hw.groupName}</p>
                
                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {format(parseISO(hw.deadline), 'd MMM yyyy', { locale: ru })}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                    {hw.tasks.length} задач
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {hw.completedCount}/{hw.totalCount} выполнили
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-32">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Прогресс</span>
                    <span className="font-medium">{Math.round((hw.completedCount / hw.totalCount) * 100)}%</span>
                  </div>
                  <ProgressBar
                    value={hw.completedCount}
                    max={hw.totalCount}
                    color={hw.completedCount === hw.totalCount ? 'success' : 'primary'}
                    size="sm"
                  />
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </div>
            </div>
          </Card>
        ))}

        {filteredHomeworks.length === 0 && (
          <Card className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Нет домашних заданий по выбранным фильтрам</p>
          </Card>
        )}
      </div>

      
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Создать домашнее задание</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Input
                label="Название"
                placeholder="Например: Тригонометрия - базовые уравнения"
                value={newHomework.title}
                onChange={(e) => setNewHomework(prev => ({ ...prev, title: e.target.value }))}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Описание</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                  placeholder="Инструкции для учеников..."
                  value={newHomework.description}
                  onChange={(e) => setNewHomework(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Группа"
                  options={[
                    { value: '', label: 'Выберите группу' },
                    ...groups.map(g => ({ value: g.id, label: g.name }))
                  ]}
                  value={newHomework.groupId}
                  onChange={(e) => setNewHomework(prev => ({ ...prev, groupId: e.target.value }))}
                />
                <Input
                  label="Дедлайн"
                  type="date"
                  value={newHomework.deadline}
                  onChange={(e) => setNewHomework(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Выбранные задачи ({newHomework.selectedTasks.length})
                </label>
                {newHomework.selectedTasks.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {newHomework.selectedTasks.map((task, index) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-indigo-600">#{index + 1}</span>
                          <span className="text-slate-700 line-clamp-1">{task.content}</span>
                        </div>
                        <button
                          onClick={() => removeTaskFromHomework(task.id)}
                          className="p-1 hover:bg-indigo-100 rounded"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm mb-4">Добавьте задачи из списка ниже</p>
                )}

                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => addTaskToHomework(task)}
                      disabled={newHomework.selectedTasks.some(t => t.id === task.id)}
                      className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="default">№{task.egeNumber}</Badge>
                        <span className="text-slate-700 line-clamp-1">{task.content}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Отмена
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleCreateHomework}
                disabled={!newHomework.title || !newHomework.groupId || newHomework.selectedTasks.length === 0}
              >
                Создать ДЗ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
