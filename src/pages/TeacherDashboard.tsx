import { useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import {
  PlusCircle,
  UserPlus,
  CheckCircle,
  Clock3,
  FileText,
  Users2,
  ArrowRight,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

type ActiveHomeworkItem = {
  id: string;
  title: string;
  group: string;
  dueLabel: 'Сегодня' | 'Завтра' | 'Просрочено';
  submittedCount: number;
  totalCount: number;
};

type ActivityEvent = {
  id: string;
  type: 'completion' | 'join' | 'deadline';
  text: string;
  time: string;
};

export function TeacherDashboard() {
  const { user } = useAuthStore();
  const { setActiveTab } = useAppStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const motivationalText = useMemo(() => {
    const phrases = [
      'Сегодня отличный день, чтобы поднять сдаваемость по ключевым темам.',
      'Небольшой ежедневный фокус на слабых местах даёт большой прирост к экзамену.',
      'Одна сильная домашка сегодня — более уверенный результат завтра.',
      'Держите ритм: регулярная практика групп уже даёт заметный прогресс.',
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }, []);

  const quickStats = [
    {
      label: 'Активные ученики',
      value: 42,
      hint: '+3 за неделю',
      icon: <Users2 size={18} className="text-indigo-600" />,
    },
    {
      label: 'Домашек задано (за неделю)',
      value: 18,
      hint: '4 группы в работе',
      icon: <FileText size={18} className="text-amber-600" />,
    },
    {
      label: 'Средняя сдаваемость',
      value: '85%',
      hint: 'Стабильно высокий темп',
      icon: <CheckCircle size={18} className="text-emerald-600" />,
    },
  ];

  const activeAssignments: ActiveHomeworkItem[] = [
    {
      id: 'hw-1',
      title: 'Параметры: базовые методы',
      group: 'ЕГЭ Профиль • Группа А',
      dueLabel: 'Сегодня',
      submittedCount: 8,
      totalCount: 12,
    },
    {
      id: 'hw-2',
      title: 'Тригонометрия: уравнения и отбор корней',
      group: 'ЕГЭ Профиль • Группа B',
      dueLabel: 'Завтра',
      submittedCount: 5,
      totalCount: 14,
    },
    {
      id: 'hw-3',
      title: 'Геометрия №14: углы и расстояния',
      group: 'ОГЭ Интенсив',
      dueLabel: 'Просрочено',
      submittedCount: 9,
      totalCount: 11,
    },
    {
      id: 'hw-4',
      title: 'Производная и исследование функции',
      group: 'ЕГЭ Профиль • Группа С',
      dueLabel: 'Завтра',
      submittedCount: 3,
      totalCount: 10,
    },
  ];

  const recentActivity: ActivityEvent[] = [
    {
      id: 'evt-1',
      type: 'completion',
      text: 'Алексей В. сдал ДЗ «Параметры» (Результат: 90%)',
      time: '5 минут назад',
    },
    {
      id: 'evt-2',
      type: 'join',
      text: 'Анна С. присоединилась к группе «ОГЭ Интенсив»',
      time: '22 минуты назад',
    },
    {
      id: 'evt-3',
      type: 'deadline',
      text: 'Дедлайн ДЗ «Геометрия» истек 2 часа назад',
      time: '2 часа назад',
    },
    {
      id: 'evt-4',
      type: 'completion',
      text: 'Мария К. завершила ДЗ «Тригонометрия» (Результат: 84%)',
      time: '3 часа назад',
    },
  ];

  const dueBadgeMap: Record<ActiveHomeworkItem['dueLabel'], { text: string; className: string }> = {
    Сегодня: {
      text: 'Сегодня',
      className: 'bg-amber-100 text-amber-700',
    },
    Завтра: {
      text: 'Завтра',
      className: 'bg-sky-100 text-sky-700',
    },
    Просрочено: {
      text: 'Просрочено',
      className: 'bg-red-100 text-red-700',
    },
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-7 text-white">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-28 h-28 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-white/10 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-yellow-300" />
                <span className="text-indigo-100 text-sm font-medium">СТОПРО • Панель учителя</span>
              </div>
              <h1 className="text-[27px] lg:text-[34px] font-bold mb-2">
                {getGreeting()}, {user?.fullName}! 👋
              </h1>
              <p className="text-indigo-100 text-[17px]">{motivationalText}</p>
            </div>

            <div className="hidden lg:flex flex-col gap-2.5">
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-none rounded-xl h-[50px] px-7 text-[15px]"
                onClick={() => setActiveTab('homework')}
              >
                <PlusCircle size={18} className="mr-2" />
                Создать ДЗ
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-xl h-[50px] px-7 text-[15px]"
                onClick={() => setActiveTab('students')}
              >
                <UserPlus size={18} className="mr-2" />
                Добавить ученика
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          size="lg"
          className="w-full rounded-xl h-[47px] px-6 text-[15px] shadow-none"
          onClick={() => setActiveTab('homework')}
        >
          <PlusCircle size={18} className="mr-2" />
          Создать ДЗ
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full rounded-xl h-[47px] px-6 text-[15px]"
          onClick={() => setActiveTab('students')}
        >
          <UserPlus size={18} className="mr-2" />
          Добавить ученика
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border-slate-200 p-5" padding="sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.hint}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          <Card padding="sm" className="p-5">
            <CardHeader
              title="Текущие домашние задания"
              subtitle="Краткий статус активных заданий"
              className="mb-3"
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('homework')}>
                  Все задания
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              }
            />
            <div className="space-y-2.5 max-h-[390px] overflow-y-auto pr-1">
              {activeAssignments.map((assignment) => {
                const completionPercent = Math.round(
                  (assignment.submittedCount / assignment.totalCount) * 100
                );
                return (
                  <div
                    key={assignment.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-base truncate">
                          {assignment.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">{assignment.group}</p>
                      </div>
                      <Badge
                        className={dueBadgeMap[assignment.dueLabel].className}
                        variant="default"
                        size="sm"
                      >
                        {dueBadgeMap[assignment.dueLabel].text}
                      </Badge>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>
                          Сдали {assignment.submittedCount} из {assignment.totalCount}
                        </span>
                        <span className="font-semibold text-slate-700">{completionPercent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 px-3 text-sm"
                        onClick={() => setActiveTab('homework')}
                      >
                        Сводка
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="mt-5 bg-gradient-to-r from-indigo-50 to-violet-50 p-5" padding="sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-2xl shadow-sm">
                  <ClipboardList size={22} className="text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-base">Фокус недели</h4>
                  <p className="text-sm text-slate-600">
                    Завершите проверку просроченных ДЗ и отправьте короткий фидбек по группам.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="rounded-xl h-[42px] px-5 text-sm"
                onClick={() => setActiveTab('homework')}
              >
                Открыть ДЗ
              </Button>
            </div>
          </Card>
        </div>

        <div className="h-full">
          <Card className="h-full flex flex-col p-5" padding="sm">
            <CardHeader
              title="Лента событий"
              subtitle="Последние изменения по ученикам и ДЗ"
              className="mb-3"
            />
            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              {recentActivity.map((event, idx) => (
                <div key={event.id} className="relative pl-8 pb-3 last:pb-0">
                  {idx !== recentActivity.length - 1 && (
                    <span className="absolute left-[11px] top-7 h-[calc(100%-12px)] w-px bg-slate-200" />
                  )}
                  <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                    {event.type === 'deadline' ? (
                      <Clock3 size={14} className="text-amber-600" />
                    ) : event.type === 'completion' ? (
                      <CheckCircle size={14} className="text-emerald-600" />
                    ) : (
                      <Users2 size={14} className="text-indigo-600" />
                    )}
                  </span>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-sm text-slate-800">{event.text}</p>
                    <p className="text-xs text-slate-500 mt-1">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
