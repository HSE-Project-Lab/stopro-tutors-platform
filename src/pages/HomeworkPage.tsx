import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LaTeX } from '@/components/ui/LaTeX';
import { AnimatedToast, type ToastType } from '@/components/ui/AnimatedToast';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Calendar,
  Users,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Trash2,
  User as UserIcon,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings,
  AlertTriangle,
  Info,
  HelpCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { EgeTask, EgeTaskPage } from '@/types';

interface GroupDto {
  id: string;
  name: string;
}
interface StudentDto {
  id: string;
  fullName: string;
}

interface HomeworkQuestionResult {
  questionId: string;
  index: number;
  egeNumber?: number;
  topicName?: string;
  content?: string;
  userAnswer?: string;
  isCorrect: boolean;
  correctAnswer?: string;
  solution?: string;
}

interface HomeworkSubmissionResult {
  assignmentId: string;
  assignmentTitle: string;
  status: string;
  submittedAt: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  questionResults: HomeworkQuestionResult[];
}

const parseBackendError = (error: any): string => {
  if (error.response?.data?.fieldErrors) {
    const fields = error.response.data.fieldErrors;
    const firstError = Object.values(fields)[0];
    if (typeof firstError === 'string') return firstError;
  }
  return error.response?.data?.message || 'Произошла неизвестная ошибка';
};

function HomeworkDetail({
  homeworkId,
  onBack,
  onSubmitted,
  isTeacher,
  onDeleted,
  groups,
  students,
}: {
  homeworkId: string;
  onBack: () => void;
  onSubmitted: () => void;
  isTeacher: boolean;
  onDeleted: () => void;
  groups: any[];
  students: any[];
}) {
  const [hw, setHw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'EDIT' | 'PREVIEW'>('PREVIEW');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSubmittingHomework, setIsSubmittingHomework] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToRemove, setTaskToRemove] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [availableTasks, setAvailableTasks] = useState<EgeTask[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [isSearchingTasks, setIsSearchingTasks] = useState(false);
  const [assignType, setAssignType] = useState<'GROUP' | 'STUDENT'>('GROUP');

  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<HomeworkSubmissionResult | null>(null);
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  const answersStorageKey = `student-homework-answers:${homeworkId}`;

  const showToast = (message: string, type: ToastType) => setToast({ message, type });

  const fetchDetail = useCallback(async () => {
    try {
      const res = await api.get(`/assignments/${homeworkId}`);
      const hwData = res.data;
      if (!hwData.questions || hwData.questions.length === 0) {
        hwData.questions = hwData.egeTasks || [];
      }
      setHw(hwData);
      setAssignType(hwData.studentId ? 'STUDENT' : 'GROUP');

      if (!isTeacher && hwData.status === 'COMPLETED') {
        try {
          const resultRes = await api.get<HomeworkSubmissionResult>(
            `/student/assignments/${homeworkId}/result`
          );
          const result = resultRes.data;
          setSubmissionResult(result);

          const restoredAnswers: Record<string, string> = {};
          for (const item of result.questionResults || []) {
            restoredAnswers[item.questionId] = item.userAnswer || '';
          }
          setStudentAnswers(restoredAnswers);
        } catch {
          setSubmissionResult(null);
        }
      } else {
        setSubmissionResult(null);
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }, [homeworkId, isTeacher]);

  useEffect(() => {
    if (isTeacher) setViewMode('EDIT');
    fetchDetail();
  }, [fetchDetail, isTeacher]);

  useEffect(() => {
    if (isTeacher) return;
    try {
      const saved = localStorage.getItem(answersStorageKey);
      if (saved) {
        setStudentAnswers(JSON.parse(saved));
      }
    } catch {}
  }, [answersStorageKey, isTeacher]);

  useEffect(() => {
    if (isTeacher) return;
    try {
      localStorage.setItem(answersStorageKey, JSON.stringify(studentAnswers));
    } catch {}
  }, [answersStorageKey, studentAnswers, isTeacher]);

  const fetchTasks = useCallback(async (query: string = '') => {
    setIsSearchingTasks(true);
    try {
      const response = await api.get<EgeTaskPage>('/ege-tasks', {
        params: { search: query, size: 20 },
      });
      setAvailableTasks(response.data.content);
    } catch (error) {
    } finally {
      setIsSearchingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'EDIT') fetchTasks();
  }, [viewMode, fetchTasks]);
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (viewMode === 'EDIT') fetchTasks(taskSearch);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [taskSearch, viewMode, fetchTasks]);

  const handlePublishFromTemplate = async () => {
    if (!hw) return;
    if (!hw.deadline) return showToast('Укажите дедлайн перед публикацией', 'error');
    if (!hw.groupId && !hw.studentId) return showToast('Выберите, кому назначить ДЗ', 'error');

    setIsPublishing(true);
    try {
      const deadlineRaw = hw.deadline;
      const deadlineFormatted =
        deadlineRaw && deadlineRaw.length === 16 ? `${deadlineRaw}:00` : deadlineRaw;

      const payload = {
        deadline: deadlineFormatted,
        groupId: hw.groupId || null,
        studentId: hw.studentId || null,
      };

      await api.post(`/assignments/${homeworkId}/publish-from-template`, payload);
      showToast('Задание успешно опубликовано из шаблона!', 'success');
      onBack();
    } catch (error: any) {
      showToast(parseBackendError(error), 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!hw) return;
    if (!hw.title.trim()) return showToast('Название не может быть пустым', 'error');
    if (!hw.isTemplate && !hw.deadline) return showToast('Укажите дедлайн', 'error');
    if (!hw.questions || hw.questions.length === 0)
      return showToast('В ДЗ должна быть хотя бы одна задача!', 'error');

    setIsSaving(true);
    try {
      const deadlineRaw = hw.deadline;
      let deadlineFormatted = null;
      if (deadlineRaw) {
        deadlineFormatted = deadlineRaw.length === 16 ? `${deadlineRaw}:00` : deadlineRaw;
      }

      const payload = {
        title: hw.title,
        description: hw.description || null,
        deadline: deadlineFormatted,
        questionIds: hw.questions.map((t: any) => t.id),
        groupId: hw.groupId || null,
        studentId: hw.studentId || null,
      };

      await api.put(`/assignments/${homeworkId}`, payload);
      showToast('Изменения успешно сохранены!', 'success');
    } catch (error: any) {
      showToast(parseBackendError(error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssignment = async () => {
    try {
      await api.delete(`/assignments/${homeworkId}`);
      onDeleted();
    } catch (error: any) {
      showToast('Ошибка при удалении', 'error');
    }
  };

  const handleCompleteHomework = async () => {
    if (!hw || isTeacher) return;
    if (hw.status === 'COMPLETED') return showToast('Это задание уже сдано', 'info');

    setIsSubmittingHomework(true);
    try {
      const response = await api.post<HomeworkSubmissionResult>(
        `/student/assignments/${homeworkId}/complete`,
        {
          answers: studentAnswers,
        }
      );
      const updated = response.data;
      setSubmissionResult(updated);
      setHw((prev: any) => ({ ...prev, status: updated?.status || 'COMPLETED' }));
      try {
        localStorage.removeItem(answersStorageKey);
      } catch {}
      onSubmitted();
    } catch (error: any) {
      showToast(parseBackendError(error), 'error');
    } finally {
      setIsSubmittingHomework(false);
    }
  };

  const moveTask = (index: number, direction: 'UP' | 'DOWN') => {
    if (!hw) return;
    const newTasks = [...hw.questions];
    if (direction === 'UP' && index > 0) {
      [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
    } else if (direction === 'DOWN' && index < newTasks.length - 1) {
      [newTasks[index + 1], newTasks[index]] = [newTasks[index], newTasks[index + 1]];
    }
    setHw({ ...hw, questions: newTasks });
  };

  const confirmRemoveTask = () => {
    if (!taskToRemove || !hw) return;
    setHw({ ...hw, questions: hw.questions.filter((t: any) => t.id !== taskToRemove) });
    setTaskToRemove(null);
  };

  const requestRemoveTask = (taskId: string) => {
    if (!hw) return;
    if (hw.questions.length <= 1) {
      return showToast('Нельзя удалить последнюю задачу. ДЗ не может быть пустым.', 'error');
    }
    setTaskToRemove(taskId);
  };

  const addTask = (task: EgeTask) => {
    if (!hw) return;
    if (!hw.questions.find((t: any) => t.id === task.id)) {
      setHw({ ...hw, questions: [...hw.questions, task] });
    }
  };

  if (loading || !hw)
    return <div className="text-center py-12 text-slate-500">Загрузка задания...</div>;

  const solvedCount = Object.keys(studentAnswers).filter((k) => studentAnswers[k].trim()).length;
  const answeredCount = submissionResult?.answeredQuestions ?? solvedCount;
  const progressPercent = Math.round((answeredCount / (hw.questions?.length || 1)) * 100);
  const resultByQuestionId = new Map(
    (submissionResult?.questionResults ?? []).map((result) => [result.questionId, result])
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <AnimatePresence>
        {toast && (
          <AnimatedToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="text-slate-500 hover:text-slate-900">
          ← Назад к списку
        </Button>
        {isTeacher && (
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode('EDIT')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${viewMode === 'EDIT' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Settings size={16} /> Настройки
            </button>
            <button
              onClick={() => setViewMode('PREVIEW')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${viewMode === 'PREVIEW' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Eye size={16} /> Глазами ученика
            </button>
          </div>
        )}
      </div>

      {viewMode === 'EDIT' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            <div className="space-y-6">
              <Card className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Настройки {hw.isTemplate && <Badge variant="warning">Шаблон</Badge>}
                  </h3>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg"
                  >
                    <Trash2 size={16} /> Удалить
                  </button>
                </div>

                <Input
                  label={
                    <>
                      Название задания <span className="text-red-500">*</span>
                    </>
                  }
                  value={hw.title}
                  onChange={(e) => setHw({ ...hw, title: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Описание
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                    value={hw.description || ''}
                    onChange={(e) => setHw({ ...hw, description: e.target.value })}
                  />
                </div>
                <Input
                  label={
                    <>
                      Дедлайн{' '}
                      {hw.isTemplate ? (
                        <span className="text-slate-400 font-normal ml-1">(для публикации)</span>
                      ) : (
                        <span className="text-red-500">*</span>
                      )}
                    </>
                  }
                  type="datetime-local"
                  value={hw.deadline ? hw.deadline.slice(0, 16) : ''}
                  onChange={(e) => setHw({ ...hw, deadline: e.target.value })}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Кому назначить задание?{' '}
                    {!hw.isTemplate && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                    <button
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${assignType === 'GROUP' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => {
                        setAssignType('GROUP');
                        setHw({ ...hw, groupId: '', studentId: null });
                      }}
                    >
                      <Users size={16} /> Группе
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${assignType === 'STUDENT' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => {
                        setAssignType('STUDENT');
                        setHw({ ...hw, studentId: '', groupId: null });
                      }}
                    >
                      <UserIcon size={16} /> Ученику
                    </button>
                  </div>
                  <Select
                    options={
                      assignType === 'GROUP'
                        ? [
                            { value: '', label: 'Выберите группу...' },
                            ...groups.map((g) => ({ value: g.id, label: g.name })),
                          ]
                        : [
                            { value: '', label: 'Выберите ученика...' },
                            ...students.map((s) => ({ value: s.id, label: s.fullName })),
                          ]
                    }
                    value={assignType === 'GROUP' ? hw.groupId || '' : hw.studentId || ''}
                    onChange={(val) => {
                      if (assignType === 'GROUP') {
                        setHw({ ...hw, groupId: val, studentId: null });
                      } else {
                        setHw({ ...hw, studentId: val, groupId: null });
                      }
                    }}
                  />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Текущие задачи</h3>
                  <Badge variant="info">{hw.questions.length}</Badge>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 pb-4">
                  {hw.questions.map((task: any, index: number) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors group"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveTask(index, 'UP')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => moveTask(index, 'DOWN')}
                          disabled={index === hw.questions.length - 1}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                      <div className="w-8 h-8 shrink-0 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-500 mb-1">
                          №{task.egeNumber || '?'} • {task.topicName || task.topic || 'Тема'}
                        </div>
                        <div className="text-sm text-slate-800 line-clamp-2">
                          <LaTeX>{task.content}</LaTeX>
                        </div>
                      </div>
                      <button
                        onClick={() => requestRemoveTask(task.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="h-full flex flex-col">
                <h3 className="font-bold text-slate-900 mb-4">Добавить новые задачи</h3>
                <Input
                  placeholder="Поиск по тексту задачи или теме..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  icon={<Search size={18} />}
                />
                <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-2 min-h-[400px]">
                  {isSearchingTasks ? (
                    <p className="text-center text-slate-400 py-4 text-sm">Загрузка...</p>
                  ) : availableTasks.length > 0 ? (
                    availableTasks.map((task) => {
                      const isSelected = hw.questions.some((t: any) => t.id === task.id);
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-xl border transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Badge variant="default" size="sm">
                                  Задание {task.egeNumber}
                                </Badge>
                                <span className="text-xs text-slate-500 truncate">
                                  {task.topic}
                                </span>
                              </div>
                              <div className="text-sm text-slate-800 line-clamp-2">
                                <LaTeX>{task.content}</LaTeX>
                              </div>
                            </div>
                            <Button
                              variant={isSelected ? 'secondary' : 'primary'}
                              size="sm"
                              onClick={() =>
                                isSelected ? requestRemoveTask(task.id) : addTask(task)
                              }
                              className="shrink-0"
                            >
                              {isSelected ? <CheckCircle size={16} /> : <Plus size={16} />}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-slate-400 py-4 text-sm">Задачи не найдены</p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <div className="max-w-7xl mx-auto flex justify-center gap-4 mt-8 pb-8">
            {hw.isTemplate && (
              <Button
                onClick={handlePublishFromTemplate}
                disabled={isSaving || isPublishing}
                size="lg"
                className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
              >
                {isPublishing ? 'Публикация...' : 'Опубликовать'}
              </Button>
            )}
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving || isPublishing}
              size="lg"
              className="px-8 shadow-lg shadow-indigo-200"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">{hw.title}</h1>
            {hw.description && <p className="text-lg text-slate-600 max-w-3xl">{hw.description}</p>}
          </div>

          {submissionResult && (
            <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">Работа отправлена ✅</h3>
                  <p className="text-sm text-emerald-800 mt-1">
                    Правильно: {submissionResult.correctAnswers} из{' '}
                    {submissionResult.totalQuestions} ({submissionResult.scorePercent}%)
                  </p>
                </div>
                <Badge variant="success">Результат: {submissionResult.scorePercent}%</Badge>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <div className="lg:col-span-3 space-y-6">
              {hw.questions.map((task: any, index: number) => {
                const result = resultByQuestionId.get(task.id);
                const isExpanded = expandedSolutions[task.id] === true;

                return (
                  <Card
                    key={task.id}
                    className="border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            Задание №{task.egeNumber || '?'}
                          </span>
                          <span className="text-sm text-slate-500">
                            {task.topicName || task.topic || 'Без темы'}
                          </span>
                        </div>
                      </div>
                      {result && (
                        <Badge variant={result.isCorrect ? 'success' : 'danger'}>
                          {result.isCorrect
                            ? 'Правильно'
                            : result.userAnswer?.trim()
                              ? 'Неправильно'
                              : 'Нет ответа'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-slate-800 leading-relaxed mb-8 text-lg">
                      <LaTeX>{task.content}</LaTeX>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4">
                      <span className="font-semibold text-slate-700 shrink-0">Ваш ответ:</span>
                      <input
                        type="text"
                        value={studentAnswers[task.id] || ''}
                        onChange={(e) => {
                          if (isTeacher || hw.status === 'COMPLETED' || submissionResult) return;
                          setStudentAnswers({ ...studentAnswers, [task.id]: e.target.value });
                        }}
                        readOnly={
                          isTeacher || hw.status === 'COMPLETED' || Boolean(submissionResult)
                        }
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                        placeholder="Введите число, дробь или текст..."
                      />
                      {studentAnswers[task.id]?.trim() && (
                        <CheckCircle
                          size={24}
                          className="text-emerald-500 shrink-0 hidden sm:block"
                        />
                      )}
                    </div>

                    {result && (result.correctAnswer || result.solution) && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setExpandedSolutions((prev) => ({
                              ...prev,
                              [task.id]: !prev[task.id],
                            }))
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp size={16} className="mr-2" />
                          ) : (
                            <ChevronDown size={16} className="mr-2" />
                          )}
                          Посмотреть решение
                        </Button>

                        {isExpanded && (
                          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-1">
                                Правильный ответ
                              </p>
                              <div className="text-slate-900">
                                <LaTeX>{result.correctAnswer || '—'}</LaTeX>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-1">Решение</p>
                              <div className="text-slate-900">
                                <LaTeX>{result.solution || 'Решение не указано'}</LaTeX>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="lg:col-span-1 sticky top-24 space-y-6">
              <Card className="border-indigo-100 bg-indigo-50/30">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Info size={18} className="text-indigo-500" /> Информация
                </h3>
                {hw.deadline && (
                  <div className="mb-6">
                    <div className="text-sm text-slate-500 mb-1">Сдать до:</div>
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      <Calendar size={16} className="text-amber-500" />{' '}
                      {format(parseISO(hw.deadline), 'd MMMM yyyy, HH:mm', { locale: ru })}
                    </div>
                  </div>
                )}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Прогресс</span>
                    <span className="font-bold text-indigo-700">{progressPercent}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-2 text-right">
                    Решено {answeredCount} из {hw.questions.length}
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full shadow-lg shadow-indigo-200"
                  disabled={
                    isTeacher ||
                    isSubmittingHomework ||
                    hw.status === 'COMPLETED' ||
                    Boolean(submissionResult)
                  }
                  onClick={handleCompleteHomework}
                >
                  {isTeacher
                    ? 'Режим предпросмотра'
                    : submissionResult
                      ? 'Работа отправлена'
                      : hw.status === 'COMPLETED'
                        ? 'Сдано'
                        : isSubmittingHomework
                          ? 'Отправка...'
                          : 'Завершить и сдать'}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Удалить ДЗ полностью?</h3>
              <p className="text-slate-500 mb-6">
                Это действие необратимо. Ученики потеряют к нему доступ навсегда.
              </p>
              <div className="flex w-full gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeleteAssignment}
                >
                  Да, удалить
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {taskToRemove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Убрать задачу из ДЗ?</h3>
              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setTaskToRemove(null)}>
                  Отмена
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={confirmRemoveTask}
                >
                  Убрать
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export function HomeworkPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'TEMPLATES' | 'COMPLETED'>('ACTIVE');

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [assignType, setAssignType] = useState<'GROUP' | 'STUDENT'>('GROUP');
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    assigneeId: '',
    deadline: '',
    isTemplate: false,
    selectedTasks: [] as EgeTask[],
  });

  const [availableTasks, setAvailableTasks] = useState<EgeTask[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [isSearchingTasks, setIsSearchingTasks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message: string, type: ToastType) => setToast({ message, type });

  const fetchTeacherData = useCallback(async () => {
    try {
      const [groupsRes, studentsRes] = await Promise.all([
        api.get<GroupDto[]>('/teacher/groups'),
        api.get<StudentDto[]>('/teacher/students'),
      ]);
      setGroups(groupsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {}
  }, []);

  const fetchHomeworks = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const response = await api.get('/assignments/my');
        setHomeworks(response.data);
      } else {
        const [activeRes, completedRes] = await Promise.all([
          api.get('/student/assignments'),
          api.get('/student/assignments/completed'),
        ]);

        const merged = [...(activeRes.data || [])];
        const seen = new Set(merged.map((h: any) => h.id));
        for (const hw of completedRes.data || []) {
          if (!seen.has(hw.id)) {
            merged.push(hw);
          }
        }
        setHomeworks(merged);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => {
    fetchHomeworks();
    if (isTeacher) fetchTeacherData();
  }, [fetchHomeworks, fetchTeacherData, isTeacher]);

  const fetchTasks = useCallback(async (query: string = '') => {
    setIsSearchingTasks(true);
    try {
      const response = await api.get<EgeTaskPage>('/ege-tasks', {
        params: { search: query, size: 20 },
      });
      setAvailableTasks(response.data.content);
    } catch (error) {
    } finally {
      setIsSearchingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (showCreateModal) fetchTasks();
  }, [showCreateModal, fetchTasks]);
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (showCreateModal) fetchTasks(taskSearch);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [taskSearch, showCreateModal, fetchTasks]);

  const addTask = (task: EgeTask) => {
    if (!newHomework.selectedTasks.find((t) => t.id === task.id)) {
      setNewHomework((prev) => ({ ...prev, selectedTasks: [...prev.selectedTasks, task] }));
    }
  };

  const removeTask = (taskId: string) => {
    setNewHomework((prev) => ({
      ...prev,
      selectedTasks: prev.selectedTasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleCreateHomework = async () => {
    if (!newHomework.title.trim()) return showToast('Укажите название', 'error');
    if (!newHomework.isTemplate && !newHomework.assigneeId)
      return showToast('Выберите, кому назначить ДЗ', 'error');
    if (!newHomework.isTemplate && !newHomework.deadline)
      return showToast('Выберите дедлайн', 'error');
    if (newHomework.selectedTasks.length === 0) return showToast('Добавьте задачи', 'error');

    setIsSubmitting(true);
    try {
      let deadlineFormatted = null;
      if (!newHomework.isTemplate && newHomework.deadline) {
        deadlineFormatted =
          newHomework.deadline.length === 16 ? `${newHomework.deadline}:00` : newHomework.deadline;
      }

      const isGroup = assignType === 'GROUP';

      const payload = {
        title: newHomework.title,
        description: newHomework.description || null,
        deadline: deadlineFormatted,
        questionIds: newHomework.selectedTasks.map((t) => t.id),
        groupId: !newHomework.isTemplate && isGroup ? newHomework.assigneeId : null,
        studentId: !newHomework.isTemplate && !isGroup ? newHomework.assigneeId : null,
        isTemplate: newHomework.isTemplate,
      };

      await api.post('/assignments', payload);
      setShowCreateModal(false);
      setNewHomework({
        title: '',
        description: '',
        assigneeId: '',
        deadline: '',
        isTemplate: false,
        selectedTasks: [],
      });
      showToast(
        newHomework.isTemplate ? 'Шаблон успешно сохранен!' : 'Домашнее задание выдано!',
        'success'
      );
      fetchHomeworks();
    } catch (error: any) {
      showToast(parseBackendError(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFromList = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/assignments/${taskToDelete}`);
      setTaskToDelete(null);
      showToast('Удалено', 'success');
      fetchHomeworks();
    } catch (error: any) {
      showToast('Ошибка при удалении', 'error');
    }
  };

  if (selectedHomeworkId) {
    return (
      <HomeworkDetail
        homeworkId={selectedHomeworkId}
        onBack={() => {
          setSelectedHomeworkId(null);
          fetchHomeworks();
        }}
        onSubmitted={() => {
          showToast('Домашнее задание успешно отправлено', 'success');
          fetchHomeworks();
        }}
        isTeacher={isTeacher}
        onDeleted={() => {
          setSelectedHomeworkId(null);
          fetchHomeworks();
        }}
        groups={groups}
        students={students}
      />
    );
  }

  const filteredHomeworks = homeworks.filter((hw) => {
    if (searchQuery && !hw.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (isTeacher) {
      if (activeTab === 'TEMPLATES') return hw.isTemplate === true;
      if (activeTab === 'ACTIVE') return hw.isTemplate !== true;
      return true;
    }
    if (activeTab === 'COMPLETED') return hw.status === 'COMPLETED';
    if (activeTab === 'ACTIVE') return hw.status !== 'COMPLETED';
    return true;
  });

  const activeCount = homeworks.filter((h) => !h.isTemplate).length;
  const templateCount = homeworks.filter((h) => h.isTemplate).length;
  const studentActiveCount = homeworks.filter((h) => h.status !== 'COMPLETED').length;
  const studentCompletedCount = homeworks.filter((h) => h.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <AnimatePresence>
        {toast && (
          <AnimatedToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isTeacher ? 'Домашние задания' : 'Мои задания'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isTeacher
              ? 'Управляйте заданиями и шаблонами'
              : 'Текущие и выполненные домашние задания'}
          </p>
        </div>
        {isTeacher && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl h-[47px] px-6 text-[15px]"
          >
            <Plus size={18} className="mr-2" /> Создать ДЗ
          </Button>
        )}
      </div>

      {isTeacher && (
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'ACTIVE'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            Активные задания ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('TEMPLATES')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'TEMPLATES'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            Шаблоны ({templateCount})
          </button>
        </div>
      )}

      {!isTeacher && (
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'ACTIVE'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            Активные ({studentActiveCount})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'COMPLETED'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            Завершённые ({studentCompletedCount})
          </button>
        </div>
      )}

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
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Загрузка...</div>
      ) : filteredHomeworks.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">
            {isTeacher
              ? activeTab === 'TEMPLATES'
                ? 'У вас пока нет сохраненных шаблонов'
                : 'Домашних заданий пока нет'
              : activeTab === 'COMPLETED'
                ? 'У вас пока нет завершённых заданий'
                : 'Активных заданий пока нет'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHomeworks.map((hw) => (
            <Card
              key={hw.id}
              className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
              onClick={() => setSelectedHomeworkId(hw.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-slate-900 truncate">{hw.title}</h3>
                    {hw.isTemplate ? (
                      <Badge variant="warning">Шаблон</Badge>
                    ) : (
                      <Badge variant={hw.status === 'COMPLETED' ? 'success' : 'info'}>
                        {hw.status === 'COMPLETED' ? 'Сдано' : 'Активно'}
                      </Badge>
                    )}
                  </div>

                  {!hw.isTemplate && (
                    <p className="text-slate-500 mb-3 flex items-center gap-1.5 text-sm">
                      {hw.studentName ? (
                        <>
                          <UserIcon size={14} /> Ученик: {hw.studentName}
                        </>
                      ) : (
                        <>
                          <Users size={14} /> Группа: {hw.groupName}
                        </>
                      )}
                    </p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-slate-600 mt-2">
                    {!hw.isTemplate && hw.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />{' '}
                        {format(parseISO(hw.deadline), 'd MMM yyyy', { locale: ru })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText size={14} /> {hw.questionsCount || 0} задач{' '}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {isTeacher && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaskToDelete(hw.id);
                      }}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {taskToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Удалить ДЗ?</h3>
              <p className="text-slate-500 mb-6">Ученики потеряют к нему доступ навсегда.</p>
              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setTaskToDelete(null)}>
                  Отмена
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeleteFromList}
                >
                  Да, удалить
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="app-homework-constructor bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="shrink-0 border-b border-slate-100 p-6 flex items-center justify-between bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">Конструктор домашнего задания</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 pb-32">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Card className="space-y-5">
                    <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <label className="flex items-center gap-2 font-medium text-indigo-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newHomework.isTemplate}
                          onChange={(e) =>
                            setNewHomework({ ...newHomework, isTemplate: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        Сохранить как шаблон
                      </label>
                      <div className="group relative">
                        <HelpCircle size={18} className="text-indigo-400 cursor-help" />
                        <div className="absolute right-0 w-64 p-3 mt-2 bg-slate-800 text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          Шаблон сохраняется без привязки к ученику и без дедлайна. Вы сможете в
                          любой момент выдать этот шаблон любой группе.
                        </div>
                      </div>
                    </div>

                    <Input
                      label={
                        <>
                          Название задания <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Например: Тригонометрия - базовые уравнения"
                      value={newHomework.title}
                      onChange={(e) =>
                        setNewHomework((prev) => ({ ...prev, title: e.target.value }))
                      }
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Описание / Инструкция
                      </label>
                      <textarea
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows={3}
                        placeholder="Оставьте комментарий для учеников..."
                        value={newHomework.description}
                        onChange={(e) =>
                          setNewHomework((prev) => ({ ...prev, description: e.target.value }))
                        }
                      />
                    </div>
                  </Card>

                  {!newHomework.isTemplate && (
                    <Card className="animate-in fade-in slide-in-from-top-4">
                      <Input
                        label={
                          <>
                            Дедлайн <span className="text-red-500">*</span>
                          </>
                        }
                        type="datetime-local"
                        value={newHomework.deadline}
                        onChange={(e) =>
                          setNewHomework((prev) => ({ ...prev, deadline: e.target.value }))
                        }
                        className="mb-5"
                      />

                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Кому назначить задание? <span className="text-red-500">*</span>
                      </label>
                      <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                        <button
                          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${assignType === 'GROUP' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                          onClick={() => {
                            setAssignType('GROUP');
                            setNewHomework((p) => ({ ...p, assigneeId: '' }));
                          }}
                        >
                          <Users size={16} /> Группе
                        </button>
                        <button
                          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${assignType === 'STUDENT' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                          onClick={() => {
                            setAssignType('STUDENT');
                            setNewHomework((p) => ({ ...p, assigneeId: '' }));
                          }}
                        >
                          <UserIcon size={16} /> Ученику
                        </button>
                      </div>
                      <Select
                        options={
                          assignType === 'GROUP'
                            ? [
                                { value: '', label: 'Выберите группу...' },
                                ...groups.map((g) => ({ value: g.id, label: g.name })),
                              ]
                            : [
                                { value: '', label: 'Выберите ученика...' },
                                ...students.map((s) => ({ value: s.id, label: s.fullName })),
                              ]
                        }
                        value={newHomework.assigneeId}
                        onChange={(val) => setNewHomework((prev) => ({ ...prev, assigneeId: val }))}
                      />
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <Card className="border-indigo-100 shadow-sm shadow-indigo-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        Выбранные задачи <span className="text-red-500 text-sm">*</span>
                      </h3>
                      <Badge variant="info">{newHomework.selectedTasks.length}</Badge>
                    </div>
                    {newHomework.selectedTasks.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {newHomework.selectedTasks.map((task, index) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl group"
                          >
                            <div className="mt-0.5 w-6 h-6 shrink-0 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-slate-500 mb-1">
                                №{task.egeNumber} • {task.topic}
                              </div>
                              <div className="text-sm text-slate-700 line-clamp-2">
                                <LaTeX>{task.content}</LaTeX>
                              </div>
                            </div>
                            <button
                              onClick={() => removeTask(task.id)}
                              className="p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-sm text-slate-400">Выберите задачи из списка ниже</p>
                      </div>
                    )}
                  </Card>
                  <Card>
                    <h3 className="font-bold text-slate-900 mb-4">Добавить из базы ЕГЭ</h3>
                    <Input
                      placeholder="Поиск по тексту задачи или теме..."
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      icon={<Search size={18} />}
                    />
                    <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {isSearchingTasks ? (
                        <p className="text-center text-slate-400 py-4 text-sm">Загрузка...</p>
                      ) : availableTasks.length > 0 ? (
                        availableTasks.map((task) => {
                          const isSelected = newHomework.selectedTasks.some(
                            (t) => t.id === task.id
                          );
                          return (
                            <div
                              key={task.id}
                              className={`p-3 rounded-xl border transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <Badge variant="default" size="sm">
                                      Задание {task.egeNumber}
                                    </Badge>
                                    <span className="text-xs text-slate-500 truncate">
                                      {task.topic}
                                    </span>
                                  </div>
                                  <div className="text-sm text-slate-800 line-clamp-2">
                                    <LaTeX>{task.content}</LaTeX>
                                  </div>
                                </div>
                                <Button
                                  variant={isSelected ? 'secondary' : 'primary'}
                                  size="sm"
                                  onClick={() => (isSelected ? removeTask(task.id) : addTask(task))}
                                  className="shrink-0"
                                >
                                  {isSelected ? <CheckCircle size={16} /> : <Plus size={16} />}
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center text-slate-400 py-4 text-sm">Задачи не найдены</p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-slate-100 p-6 flex justify-end gap-3 bg-white z-10">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateHomework} disabled={isSubmitting}>
                {isSubmitting
                  ? 'Сохранение...'
                  : newHomework.isTemplate
                    ? 'Сохранить шаблон'
                    : 'Опубликовать задание'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
