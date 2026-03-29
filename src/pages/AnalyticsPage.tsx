import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import {
  buildScoreExplanation,
  calculateConfidenceInterval,
  predictEgeScore,
  type StudentTopicProgress,
} from '@/utils/scorePredictor';
import { useEffect, useMemo, useState } from 'react';
import { CircleHelp, TrendingUp, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'];

type AnalyticsPeriod = '7' | '30' | '90' | 'all';

interface TopicProgressDto {
  topicId: string;
  topicName: string;
  egeNumber?: number;
  successRate: number;
  totalCount: number;
}

interface DailyActivityDto {
  date: string;
  solved: number;
  correct: number;
}

interface ForecastPointDto {
  date: string;
  predictedScore: number;
}

interface StudentDashboardAnalyticsDto {
  solvedProblemsTotal?: number;
  completedTasksTotal?: number;
  correctAnswersTotal?: number;
  accuracyPercent?: number;
  topicProgress?: TopicProgressDto[];
  forecastHistory?: ForecastPointDto[];
}

export function AnalyticsPage() {
  const { user } = useAuthStore();
  const { setActiveTab, setPracticeFocusEgeNumber } = useAppStore();
  const [period, setPeriod] = useState<AnalyticsPeriod>('30');
  const [dashboard, setDashboard] = useState<StudentDashboardAnalyticsDto | null>(null);
  const [activity, setActivity] = useState<DailyActivityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'STUDENT') {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const days = period === 'all' ? 365 : Number(period);
        const [dashboardResponse, activityResponse] = await Promise.all([
          api.get<StudentDashboardAnalyticsDto>('/student/dashboard'),
          api.get<DailyActivityDto[]>('/student/activity', { params: { days } }),
        ]);

        if (!isMounted) {
          return;
        }

        setDashboard(dashboardResponse.data);
        setActivity(activityResponse.data ?? []);
      } catch {
        if (!isMounted) {
          return;
        }

        setError('Не удалось загрузить аналитику. Попробуйте обновить страницу.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [period, user?.role]);

  const topicStats = dashboard?.topicProgress ?? [];
  const solved = dashboard?.solvedProblemsTotal ?? 0;
  const correct = dashboard?.correctAnswersTotal ?? 0;
  const successRate =
    dashboard?.accuracyPercent ?? (solved > 0 ? Math.round((correct / solved) * 100) : 0);

  const monthlyData = useMemo(
    () =>
      (activity ?? []).map((item) => {
        const date = new Date(item.date);
        const label =
          period === '7'
            ? date.toLocaleDateString('ru-RU', { weekday: 'short' })
            : date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

        return {
          month: label,
          tasks: item.solved,
          correct: item.correct,
        };
      }),
    [activity, period]
  );

  const forecastHistoryData = useMemo(
    () =>
      (dashboard?.forecastHistory ?? []).map((point) => ({
        date: new Date(point.date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
        }),
        score: point.predictedScore,
      })),
    [dashboard?.forecastHistory]
  );

  const pieData = [
    { name: 'Отлично (80%+)', value: topicStats.filter((t) => t.successRate >= 80).length },
    {
      name: 'Хорошо (60-80%)',
      value: topicStats.filter((t) => t.successRate >= 60 && t.successRate < 80).length,
    },
    { name: 'Требует внимания (<60%)', value: topicStats.filter((t) => t.successRate < 60).length },
  ];

  const radarData = topicStats.slice(0, 6).map((t) => ({
    subject: `№${t.egeNumber ?? '—'}`,
    value: t.successRate,
    fullMark: 100,
  }));

  const predictorInput = useMemo<StudentTopicProgress[]>(
    () =>
      topicStats
        .filter((topic) => (topic.egeNumber ?? 0) > 0)
        .map((topic) => ({
          egeNumber: topic.egeNumber as number,
          successRate: topic.successRate,
          totalAttempts: topic.totalCount ?? 0,
        })),
    [topicStats]
  );

  const predictedScore = predictEgeScore(predictorInput);
  const targetScore = predictedScore < 80 ? 80 : 90;
  const confidence = calculateConfidenceInterval(predictorInput, predictedScore);
  const explanation = buildScoreExplanation(predictorInput, predictedScore, targetScore);
  const targetGap = Math.max(0, targetScore - predictedScore);
  const solvedAttemptsForPrediction = predictorInput.reduce(
    (sum, topic) => sum + Math.max(topic.totalAttempts, 0),
    0
  );

  const confidenceMessage =
    confidence.confidenceLabel === 'HIGH'
      ? 'Прогноз достаточно стабильный: текущих данных уже хватает для уверенной оценки.'
      : confidence.confidenceLabel === 'MEDIUM'
        ? 'Прогноз ориентировочный: он полезен для планирования, но может немного меняться по мере практики.'
        : 'Сейчас данных для точного прогноза ещё недостаточно — это нормально. Продолжай практику, и оценка станет стабильнее.';

  const confidenceHint =
    confidence.confidenceLabel === 'LOW'
      ? 'Это не «плохой результат», а ранняя стадия оценки. Чем больше решённых задач, тем точнее прогноз.'
      : `В расчёте учтено ${solvedAttemptsForPrediction} решённых задач — модель уже видит твой рабочий паттерн.`;

  const matrixItems = useMemo(() => {
    return Array.from({ length: 19 }, (_, index) => {
      const egeNumber = index + 1;
      const matched = topicStats.filter((topic) => topic.egeNumber === egeNumber);
      const success =
        matched.length > 0
          ? Math.round(matched.reduce((sum, topic) => sum + topic.successRate, 0) / matched.length)
          : null;

      const status =
        success === null ? 'none' : success >= 80 ? 'green' : success >= 50 ? 'yellow' : 'red';

      return {
        egeNumber,
        success,
        status,
      };
    });
  }, [topicStats]);

  const handleOpenPracticeByNumber = (egeNumber: number) => {
    setPracticeFocusEgeNumber(egeNumber);
    setActiveTab('practice');
  };

  if (user?.role !== 'STUDENT') {
    return (
      <Card>
        <p className="text-slate-700">
          Страница аналитики для учеников находится в разработке для вашей роли.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <p className="text-slate-600">Загружаем статистику…</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Аналитика</h1>
          <p className="text-slate-500 mt-1">Детальная статистика и динамика успеваемости</p>
        </div>
        <Select
          options={[
            { value: '7', label: 'Последние 7 дней' },
            { value: '30', label: 'Последний месяц' },
            { value: '90', label: 'Последние 3 месяца' },
            { value: 'all', label: 'Всё время' },
          ]}
          value={period}
          onChange={(value) => setPeriod(value as AnalyticsPeriod)}
          className="w-52"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <p className="text-indigo-100 text-sm">Всего задач решено</p>
          <p className="text-3xl font-bold mt-1">{solved}</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <p className="text-emerald-100 text-sm">Правильных ответов</p>
          <p className="text-3xl font-bold mt-1">{correct}</p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <p className="text-amber-100 text-sm">Средняя успешность</p>
          <p className="text-3xl font-bold mt-1">{successRate}%</p>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-violet-100 mb-2">
              <TrendingUp size={18} />
              <span className="text-sm font-semibold">Прогноз баллов ЕГЭ</span>
            </div>
            <h2 className="text-3xl font-bold">Твой прогнозируемый балл: {predictedScore}</h2>
            <p className="mt-2 text-violet-100">{explanation.message}</p>
            <p className="mt-2 text-violet-100/95 text-sm">{confidenceMessage}</p>
            <div className="mt-1 flex items-center gap-2 text-violet-100/85 text-sm">
              <span>
                Ожидаемый диапазон сейчас: {confidence.low}–{confidence.high} баллов.
              </span>
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-violet-100 transition hover:bg-white/25"
                  aria-label="Что означает диапазон прогноза"
                >
                  <CircleHelp size={14} />
                </button>
                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-72 -translate-x-1/2 rounded-lg border border-white/20 bg-slate-900/95 px-3 py-2 text-xs leading-relaxed text-slate-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {confidenceHint}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/15 rounded-2xl px-5 py-4 min-w-[220px]">
            <p className="text-violet-100 text-sm">До цели {targetScore}+</p>
            <p className="text-2xl font-bold mt-1">{targetGap} баллов</p>
            {explanation.weakTaskNumber ? (
              <Button
                variant="secondary"
                className="mt-3 w-full rounded-xl"
                onClick={() => handleOpenPracticeByNumber(explanation.weakTaskNumber as number)}
              >
                <Target size={16} className="mr-2" />
                Практика по №{explanation.weakTaskNumber}
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="История прогноза" subtitle="Как менялся прогнозируемый балл по датам" />
        {forecastHistoryData.length < 2 ? (
          <div className="h-[180px] flex items-center justify-center text-slate-500">
            Пока недостаточно точек. Прогноз будет накапливаться по дням.
          </div>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastHistoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
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
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Прогноз"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Матрица ЕГЭ"
          subtitle="Зелёные — стабильно, жёлтые — 50/50, красные — требуют внимания"
        />

        <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2">
          {matrixItems.map((item) => (
            <button
              key={item.egeNumber}
              type="button"
              onClick={() => handleOpenPracticeByNumber(item.egeNumber)}
              className={`h-11 rounded-xl text-sm font-semibold transition-all border ${
                item.status === 'green'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                  : item.status === 'yellow'
                    ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                    : item.status === 'red'
                      ? 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={
                item.success === null
                  ? `Задание №${item.egeNumber}: пока нет данных`
                  : `Задание №${item.egeNumber}: ${item.success}%`
              }
            >
              {item.egeNumber}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-300" />
            Стабильно
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-300" />
            Зона роста
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-300" />
            Западает — кликни для практики
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Динамика за месяц" subtitle="Решённые задачи и правильные ответы" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#818cf8"
                  strokeWidth={3}
                  dot={{ fill: '#818cf8', strokeWidth: 2, r: 4 }}
                  name="Решено"
                />
                <Line
                  type="monotone"
                  dataKey="correct"
                  stroke="#34d399"
                  strokeWidth={3}
                  dot={{ fill: '#34d399', strokeWidth: 2, r: 4 }}
                  name="Правильно"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Профиль навыков" subtitle="Успешность по заданиям ЕГЭ" />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Radar
                  name="Успешность"
                  dataKey="value"
                  stroke="#818cf8"
                  fill="#818cf8"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Распределение тем" />
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Детализация по темам" subtitle="Успешность и количество попыток" />
          {topicStats.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              Нет данных по темам — решите несколько задач, чтобы увидеть аналитику.
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="topicName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar
                    dataKey="successRate"
                    fill="#818cf8"
                    radius={[0, 4, 4, 0]}
                    name="Успешность %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
