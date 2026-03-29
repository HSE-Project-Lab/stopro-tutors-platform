import { HomeworkList } from '@/components/dashboard/HomeworkList';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import api from '@/lib/axios';
import { useEffect, useMemo, useState } from 'react';
import type { AIRecommendation, Homework } from '@/types';
import { predictEgeScore, type StudentTopicProgress } from '@/utils/scorePredictor';
import { Check, Sparkles, Flame, Trophy, Brain, Calendar, Zap, Target, Gift } from 'lucide-react';

interface DashboardTopicProgressDto {
  topicId: string;
  topicName: string;
  egeNumber?: number;
  successRate?: number;
  status?: 'WEAK' | 'NORMAL' | 'STRONG';
  totalCount?: number;
}

interface DashboardRecommendationDto {
  id: string;
  title: string;
  description: string;
  type?: string;
  priority?: string;
}

interface DashboardAssignmentDto {
  id: string;
  title: string;
  deadline?: string;
  subject?: string;
  tasksCount?: number;
  isOverdue?: boolean;
}

interface StudentDashboardDto {
  daysStreak?: number;
  solvedProblemsTotal?: number;
  correctAnswersTotal?: number;
  topicProgress?: DashboardTopicProgressDto[];
  recommendations?: DashboardRecommendationDto[];
  activeAssignments?: DashboardAssignmentDto[];
  achievements?: Array<{
    id: string;
    title: string;
    unlocked?: boolean;
    progressValue?: number;
    targetValue?: number;
  }>;
}

interface DailyChallengeDto {
  id: string;
  egeNumber: number;
  topic: string;
  content?: string;
  rewardXp?: number;
  rewardAchievementTitle?: string;
  challengeDate?: string;
}

interface EgeTaskDto {
  id: string;
  egeNumber: number;
  topic: string;
  content?: string;
}

interface EgeTaskPageDto {
  content?: EgeTaskDto[];
}

const recommendationTypeMap: Record<string, AIRecommendation['type']> = {
  WEAK_TOPIC: 'FOCUS_TOPIC',
  STRONG_TOPIC: 'PRACTICE',
  STREAK: 'PRACTICE',
  TARGET_SCORE: 'PRACTICE',
  PRACTICE: 'PRACTICE',
  REVIEW: 'REVIEW',
  NEW_TOPIC: 'PRACTICE',
};

const studentMotivationPhrases = [
  'Сегодня отличный день, чтобы стать увереннее в математике! ✨',
  'Маленький шаг каждый день даёт большой результат к экзамену 💪',
  'Ты на правильном пути — продолжай в том же ритме! 🚀',
  'Фокус на слабых темах сегодня — твоя сила завтра 🎯',
  'Каждая решённая задача делает тебя спокойнее на ЕГЭ 📚',
];

const DAILY_CHALLENGE_COMPLETED_STORAGE_KEY = 'dailyChallengeCompletedDate';

const formatDailyTasksWord = (count: number) => {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;

  if (abs >= 11 && abs <= 14) {
    return 'задач';
  }
  if (last === 1) {
    return 'задачу';
  }
  if (last >= 2 && last <= 4) {
    return 'задачи';
  }
  return 'задач';
};

export function StudentDashboard() {
  const { user } = useAuthStore();
  const { activeTab, setActiveTab, setPracticeFocusEgeNumber, setPracticeDailyChallengeTaskId } =
    useAppStore();

  const [dashboard, setDashboard] = useState<StudentDashboardDto | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallengeDto | null>(null);
  const [dailyChallengeCompletedToday, setDailyChallengeCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'STUDENT') {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setChallengeLoading(true);
      setError(null);

      const pickDeterministicTask = (tasks: EgeTaskDto[]): EgeTaskDto | null => {
        if (!tasks.length) {
          return null;
        }

        const dateKey = new Date().toISOString().slice(0, 10);
        const seedBase = `${user?.id || user?.username || 'student'}:${dateKey}`;
        const seed = Math.abs(
          seedBase.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        );
        return tasks[seed % tasks.length];
      };

      try {
        const dashboardResponse = await api.get<StudentDashboardDto>('/student/dashboard');

        if (!isMounted) {
          return;
        }

        setDashboard(dashboardResponse.data);

        try {
          const challengeResponse = await api.get<DailyChallengeDto>('/student/daily-challenge');
          if (!isMounted) {
            return;
          }
          setDailyChallenge(challengeResponse.data ?? null);
        } catch {
          const weakEgeNumber = [...(dashboardResponse.data.topicProgress ?? [])]
            .filter((topic) => (topic.egeNumber ?? 0) > 0)
            .sort((a, b) => (a.successRate ?? 0) - (b.successRate ?? 0))[0]?.egeNumber;

          try {
            const fallbackResponse = await api.get<EgeTaskPageDto>('/ege-tasks', {
              params: {
                page: 0,
                size: 20,
                ...(weakEgeNumber ? { egeNumber: weakEgeNumber } : {}),
              },
            });

            if (!isMounted) {
              return;
            }

            const selected = pickDeterministicTask(fallbackResponse.data.content ?? []);
            if (!selected) {
              setDailyChallenge(null);
            } else {
              setDailyChallenge({
                id: selected.id,
                egeNumber: selected.egeNumber,
                topic: selected.topic,
                content: selected.content,
                rewardXp: 50,
                rewardAchievementTitle: 'Задача дня',
                challengeDate: new Date().toISOString().slice(0, 10),
              });
            }
          } catch {
            if (!isMounted) {
              return;
            }
            setDailyChallenge(null);
          }
        }
      } catch {
        if (!isMounted) {
          return;
        }
        setError('Не удалось загрузить прогресс. Попробуйте обновить страницу.');
      } finally {
        if (isMounted) {
          setChallengeLoading(false);
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'STUDENT') {
      setDailyChallengeCompletedToday(false);
      return;
    }

    const todayKey = dailyChallenge?.challengeDate ?? new Date().toISOString().slice(0, 10);
    const completedDate =
      typeof window !== 'undefined'
        ? localStorage.getItem(DAILY_CHALLENGE_COMPLETED_STORAGE_KEY)
        : null;

    setDailyChallengeCompletedToday(Boolean(completedDate && completedDate === todayKey));
  }, [activeTab, dailyChallenge?.challengeDate, user?.role]);

  const homeworks = useMemo<Homework[]>(() => {
    return (dashboard?.activeAssignments ?? []).map((assignment) => {
      const tasksCount = assignment.tasksCount ?? 0;
      return {
        id: assignment.id,
        teacherId: '',
        groupId: '',
        groupName: assignment.subject || 'Профильная математика',
        title: assignment.title,
        description: '',
        deadline: assignment.deadline || new Date().toISOString(),
        tasks: Array.from({ length: tasksCount }, (_, index) => ({
          id: `${assignment.id}-${index}`,
          topicId: '',
          topicName: '',
          egeNumber: 0,
          difficulty: 'MEDIUM' as const,
          content: '',
          answer: '',
        })),
        status: assignment.isOverdue ? 'OVERDUE' : 'ACTIVE',
        completedCount: 0,
        totalCount: tasksCount,
      };
    });
  }, [dashboard?.activeAssignments]);

  const aiRecommendations = useMemo<AIRecommendation[]>(() => {
    return (dashboard?.recommendations ?? []).map((recommendation) => ({
      id: recommendation.id,
      type: recommendationTypeMap[recommendation.type || ''] || 'PRACTICE',
      title: recommendation.title,
      description: recommendation.description,
      priority:
        recommendation.priority === 'HIGH' ||
        recommendation.priority === 'MEDIUM' ||
        recommendation.priority === 'LOW'
          ? recommendation.priority
          : 'MEDIUM',
    }));
  }, [dashboard?.recommendations]);

  const urgentHomeworks = useMemo(() => {
    return [...homeworks]
      .filter(
        (homework) =>
          homework.status !== 'COMPLETED' && homework.completedCount < homework.totalCount
      )
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 3);
  }, [homeworks]);

  const topRecommendation = useMemo(() => {
    const priorityWeight: Record<AIRecommendation['priority'], number> = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return (
      [...aiRecommendations].sort(
        (a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]
      )[0] ?? null
    );
  }, [aiRecommendations]);

  const motivationalText = useMemo(() => {
    return studentMotivationPhrases[Math.floor(Math.random() * studentMotivationPhrases.length)];
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const getMonthsUntilEge = () => {
    const now = new Date();
    let examDate = new Date(now.getFullYear(), 5, 1);
    if (now > examDate) {
      examDate = new Date(now.getFullYear() + 1, 5, 1);
    }

    const monthsDiff =
      (examDate.getFullYear() - now.getFullYear()) * 12 +
      (examDate.getMonth() - now.getMonth()) +
      (examDate.getDate() > now.getDate() ? 1 : 0);

    return Math.max(0, monthsDiff);
  };

  const monthsUntilExam = getMonthsUntilEge();

  const currentStreak = dashboard?.daysStreak ?? 0;
  const dailyChallengeAchievement = (dashboard?.achievements ?? []).find(
    (achievement) =>
      achievement.id === 'DAILY_CHALLENGE_5' ||
      achievement.title.toLowerCase().includes('задача дня')
  );

  const hasDailyChallengeAchievement = Boolean(
    dailyChallengeAchievement?.unlocked ||
    ((dailyChallengeAchievement?.targetValue ?? 0) > 0 &&
      (dailyChallengeAchievement?.progressValue ?? 0) >=
        (dailyChallengeAchievement?.targetValue ?? 0))
  );

  const dailyChallengeTarget = Math.max(1, dailyChallengeAchievement?.targetValue ?? 5);
  const dailyChallengeProgress = Math.max(0, dailyChallengeAchievement?.progressValue ?? 0);
  const dailyChallengeRemaining = Math.max(0, dailyChallengeTarget - dailyChallengeProgress);

  const dailyChallengeBonusText = hasDailyChallengeAchievement
    ? 'Ты уже получил ачивку «Задача дня», но почему бы не попрактиковаться лишний раз?'
    : `До получения ачивки «Задача дня» осталось решить ${dailyChallengeRemaining} ежедневн${
        dailyChallengeRemaining === 1
          ? 'ую'
          : dailyChallengeRemaining >= 2 && dailyChallengeRemaining <= 4
            ? 'ые'
            : 'ых'
      } ${formatDailyTasksWord(dailyChallengeRemaining)}.`;

  if (loading) {
    return (
      <Card>
        <p className="text-slate-600">Загружаем ваш прогресс…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  const predictedScore = predictEgeScore(
    (dashboard?.topicProgress ?? [])
      .filter((topic) => (topic.egeNumber ?? 0) > 0)
      .map(
        (topic) =>
          ({
            egeNumber: topic.egeNumber as number,
            successRate: topic.successRate ?? 0,
            totalAttempts: topic.totalCount ?? 0,
          }) satisfies StudentTopicProgress
      )
  );

  return (
    <div className="app-student-dashboard space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-white/10 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-yellow-300" />
                <span className="text-emerald-100 text-sm font-medium">
                  СТОПРО • Профильная математика
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {getGreeting()}, {user?.fullName}! 👋
              </h1>
              <p className="text-emerald-100 text-lg mb-4">{motivationalText}</p>

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <Flame size={18} className="text-orange-300" />
                  <span className="font-semibold">{currentStreak}</span>
                  <span className="text-emerald-200">дней подряд</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <Calendar size={18} />
                  <span className="font-semibold">{monthsUntilExam}</span>
                  <span className="text-emerald-200">месяцев до ЕГЭ</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <Trophy size={18} className="text-yellow-300" />
                  <span className="font-semibold">~{predictedScore}</span>
                  <span className="text-emerald-200">прогноз балла</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg rounded-xl h-[50px] px-7 text-[15px]"
                onClick={() => setActiveTab('practice')}
              >
                <Zap size={18} className="mr-2" />
                Начать практику
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden grid grid-cols-1 gap-3">
        <Button
          onClick={() => setActiveTab('practice')}
          className="w-full rounded-xl h-[47px] px-6 text-[15px]"
        >
          <Zap size={18} className="mr-2" />
          Практика
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {urgentHomeworks.length > 0 ? (
          <div onClick={() => setActiveTab('homework')} className="cursor-pointer">
            <HomeworkList homeworks={urgentHomeworks} viewType="student" />
          </div>
        ) : (
          <Card>
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900">Горящие дедлайны</h3>
              <p className="text-slate-600">
                Нет срочных ДЗ — отличный момент потренироваться в практике.
              </p>
              <Button
                className="rounded-xl h-[50px] px-7 text-[15px]"
                onClick={() => setActiveTab('practice')}
              >
                Перейти к практике
              </Button>
            </div>
          </Card>
        )}

        <Card>
          {topRecommendation ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <Brain size={18} />
                <span className="text-sm font-semibold">Следующий шаг от ИИ</span>
              </div>
              <h3 className="font-bold text-slate-900">{topRecommendation.title}</h3>
              <p className="text-slate-600">{topRecommendation.description}</p>
              <Button
                className="rounded-xl h-[50px] px-7 text-[15px]"
                onClick={() => setActiveTab('practice')}
              >
                Начать
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900">Следующий шаг от ИИ</h3>
              <p className="text-slate-600">
                Реши ещё несколько задач — ИИ сформирует персональную рекомендацию.
              </p>
              <Button
                variant="outline"
                className="rounded-xl h-[50px] px-7 text-[15px]"
                onClick={() => setActiveTab('practice')}
              >
                Перейти к практике
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white rounded-2xl shadow-sm">
              <Target size={32} className="text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Задача дня</h3>
              {dailyChallenge ? (
                <p className="text-slate-600">
                  №{dailyChallenge.egeNumber} · {dailyChallenge.topic}
                </p>
              ) : (
                <p className="text-slate-600">Подбираем задачу под твой текущий уровень…</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-violet-700 text-sm font-medium">
                <Gift size={15} />
                {dailyChallengeBonusText}
              </div>
            </div>
          </div>

          {dailyChallengeCompletedToday ? (
            <div className="flex flex-col items-end gap-1">
              <div className="daily-challenge-complete-badge inline-flex h-[50px] items-center justify-center gap-2 rounded-xl bg-emerald-100 px-6 text-[15px] font-semibold text-emerald-700 border border-emerald-200">
                <Check size={18} />
                Выполнено
              </div>
              <p className="daily-challenge-complete-hint text-xs text-emerald-700/80">
                Возвращайся завтра за новой задачей дня
              </p>
            </div>
          ) : (
            <Button
              onClick={() => {
                if (dailyChallenge?.egeNumber) {
                  setPracticeFocusEgeNumber(dailyChallenge.egeNumber);
                }
                if (dailyChallenge?.id) {
                  setPracticeDailyChallengeTaskId(dailyChallenge.id);
                }
                setActiveTab('practice');
              }}
              size="lg"
              className="rounded-xl h-[50px] px-7 text-[15px]"
              disabled={challengeLoading}
            >
              {challengeLoading ? 'Подбираем…' : 'Решить задачу дня'}
            </Button>
          )}
        </div>
      </Card>

      <Card className="bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white rounded-2xl shadow-sm">
              <Zap size={32} className="text-violet-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Быстрая практика</h4>
              <p className="text-slate-600">Реши 5 случайных задач из твоих слабых тем</p>
            </div>
          </div>
          <Button
            size="lg"
            className="rounded-xl h-[50px] px-7 text-[15px]"
            onClick={() => setActiveTab('practice')}
          >
            Начать
          </Button>
        </div>
      </Card>
    </div>
  );
}
