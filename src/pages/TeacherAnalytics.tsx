import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { GroupHeatmap } from '@/components/analytics/GroupHeatmap';
import { StudentDetailModal } from '@/components/analytics/StudentDetailModal';
import type {
  StudentAnalyticsDto,
  StudentDisciplineStats,
  StudentProgressPoint,
  StudentSkillPoint,
  TaskHeatmapCell,
  WeakTopicPoint,
} from '@/types/analytics';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const темыЕгэ = [
  'Планиметрия',
  'Векторы',
  'Стереометрия',
  'Вероятность',
  'Логарифмы',
  'Тригонометрия',
  'Производная',
  'Первообразная',
  'Текстовые задачи',
  'Параметры',
  'Неравенства',
  'Экономические задачи',
  'Графики функций',
  'Системы уравнений',
  'Задача №15',
  'Задача №16',
  'Задача №17',
  'Задача №18',
  'Задача №19',
] as const;

const buildHeatmap = (baseShift: number): TaskHeatmapCell[] =>
  Array.from({ length: 19 }, (_, index) => {
    const taskNumber = index + 1;
    const attempts = randomInt(2, 16);
    const raw = randomInt(38, 94) - baseShift + (taskNumber % 5 === 0 ? -8 : 0);
    const successRate = Math.max(22, Math.min(96, raw));

    return {
      taskNumber,
      successRate,
      attempts,
    };
  });

const buildRadar = (profileShift: number): StudentSkillPoint[] => {
  const предметы = [
    'Алгебра',
    'Геометрия',
    'Тригонометрия',
    'Параметры',
    'Вероятность',
    'Стереометрия',
  ];

  return предметы.map((subject, index) => ({
    subject,
    value: Math.max(35, Math.min(98, randomInt(50, 90) - profileShift + (index % 2 ? 4 : -2))),
    fullMark: 100,
  }));
};

const buildProgress = (
  start: number,
  trend: 'рост' | 'стабильно' | 'снижение'
): StudentProgressPoint[] => {
  const месяцы = ['Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар'];
  return месяцы.map((monthLabel, index) => {
    const delta =
      trend === 'рост'
        ? index * randomInt(1, 2)
        : trend === 'снижение'
          ? -index * randomInt(1, 2)
          : randomInt(-2, 2);
    return {
      monthLabel,
      predictedScore: Math.max(42, Math.min(98, start + delta)),
    };
  });
};

const buildWeakTopics = (heatmap: TaskHeatmapCell[]): WeakTopicPoint[] =>
  heatmap
    .map((item) => ({
      taskNumber: item.taskNumber,
      topicName: темыЕгэ[item.taskNumber - 1],
      successRate: item.successRate,
      practiceCount: item.attempts,
    }))
    .sort((a, b) => (a.successRate ?? 0) - (b.successRate ?? 0));

const buildDiscipline = (offsetDays: number): StudentDisciplineStats => ({
  homeworkOnTimeRate: randomInt(61, 96),
  lastActiveAt: new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000).toISOString(),
});

const mockStudents = (): StudentAnalyticsDto[] => {
  const source = [
    {
      groupId: 'g11a',
      groupName: '11А Профиль',
      studentName: 'Иван Смирнов',
      targetScore: 84,
      predicted: 76,
      shift: 4,
      trend: 'рост' as const,
    },
    {
      groupId: 'g11a',
      groupName: '11А Профиль',
      studentName: 'Мария Захарова',
      targetScore: 90,
      predicted: 86,
      shift: 1,
      trend: 'стабильно' as const,
    },
    {
      groupId: 'g11a',
      groupName: '11А Профиль',
      studentName: 'Лев Кузнецов',
      targetScore: 78,
      predicted: 69,
      shift: 7,
      trend: 'снижение' as const,
    },
    {
      groupId: 'g11a',
      groupName: '11А Профиль',
      studentName: 'София Романова',
      targetScore: 82,
      predicted: 80,
      shift: 2,
      trend: 'рост' as const,
    },
    {
      groupId: 'g10b',
      groupName: '10Б База+',
      studentName: 'Алина Петрова',
      targetScore: 74,
      predicted: 66,
      shift: 6,
      trend: 'снижение' as const,
    },
    {
      groupId: 'g10b',
      groupName: '10Б База+',
      studentName: 'Егор Орлов',
      targetScore: 70,
      predicted: 71,
      shift: 3,
      trend: 'стабильно' as const,
    },
    {
      groupId: 'g10b',
      groupName: '10Б База+',
      studentName: 'Никита Журавлёв',
      targetScore: 76,
      predicted: 68,
      shift: 8,
      trend: 'снижение' as const,
    },
    {
      groupId: 'g10b',
      groupName: '10Б База+',
      studentName: 'Артём Белов',
      targetScore: 72,
      predicted: 74,
      shift: 2,
      trend: 'рост' as const,
    },
  ];

  return source.map((item, index) => {
    const heatmap = buildHeatmap(item.shift);

    return {
      studentId: `student-${index + 1}`,
      studentName: item.studentName,
      groupId: item.groupId,
      groupName: item.groupName,
      targetScore: item.targetScore,
      predictedEgeScore: item.predicted,
      heatmap,
      radarSkills: buildRadar(item.shift),
      weakTopics: buildWeakTopics(heatmap),
      progressHistory: buildProgress(item.predicted - 6, item.trend),
      discipline: buildDiscipline(index + 1),
    };
  });
};

export function TeacherAnalytics() {
  const [students, setStudents] = useState<StudentAnalyticsDto[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const studentsResp = await api.get<StudentAnalyticsDto[]>(
          '/analytics/teacher/students-heatmap'
        );

        if (cancelled) return;

        const fetchedStudents = studentsResp.data ?? [];

        if (fetchedStudents.length === 0) {
          const fallbackStudents = mockStudents();
          setStudents(fallbackStudents);
          return;
        }

        setStudents(fetchedStudents);
      } catch {
        if (cancelled) return;
        const fallbackStudents = mockStudents();
        setStudents(fallbackStudents);
        setError('API аналитики недоступен — показаны демо-данные.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const studentsByGroup = useMemo(() => {
    if (selectedGroupId === 'all') return students;
    return students.filter((student) => student.groupId === selectedGroupId);
  }, [students, selectedGroupId]);

  const groupOptions = useMemo(() => {
    const fromStudents = Array.from(
      new Map(students.map((student) => [student.groupId, student.groupName])).entries()
    ).map(([groupId, groupName]) => ({ value: groupId, label: groupName }));

    const merged = [
      { value: 'all', label: 'Все группы' },
      ...fromStudents.filter((option) => option.value !== 'all'),
    ];

    return merged;
  }, [students]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Аналитика преподавателя</h1>
          <p className="text-slate-500 mt-1">
            Фокус на персональных целях и точках роста каждого ученика
          </p>
        </div>

        <div className="w-full md:w-80">
          <Select value={selectedGroupId} onChange={setSelectedGroupId} options={groupOptions} />
        </div>
      </div>

      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-2 text-amber-800 text-sm">
            <AlertTriangle size={16} className="mt-0.5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Тепловая карта группы"
          subtitle="Красный/желтый/зеленый/серый по успешности задач №1–19"
        />

        {loading ? (
          <p className="text-sm text-slate-500">Загрузка тепловой карты...</p>
        ) : (
          <GroupHeatmap students={studentsByGroup} onStudentClick={setSelectedStudent} />
        )}
      </Card>

      <Card>
        <CardHeader
          title="Ученики с наибольшим разрывом до цели"
          subtitle="Нажмите на ученика, чтобы открыть детальный профиль"
        />

        {studentsByGroup.length === 0 ? (
          <p className="text-sm text-slate-500">В выбранной группе пока нет данных.</p>
        ) : (
          <div className="space-y-2">
            {studentsByGroup
              .slice()
              .sort(
                (a, b) =>
                  a.predictedEgeScore - a.targetScore - (b.predictedEgeScore - b.targetScore)
              )
              .slice(0, 4)
              .map((student) => {
                const gap = student.predictedEgeScore - student.targetScore;

                return (
                  <div
                    key={student.studentId}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        className="text-sm font-semibold text-red-800 hover:underline"
                      >
                        {student.studentName}
                      </button>
                      <p className="text-xs text-red-700 mt-0.5">
                        Цель: {student.targetScore} · Прогноз: {student.predictedEgeScore} · Разрыв:{' '}
                        {gap >= 0 ? `+${gap}` : gap}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(student)}>
                      Детали
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      <StudentDetailModal
        open={Boolean(selectedStudent)}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => window.print()}>
          Подготовить сводный отчет для родителей
        </Button>
      </div>
    </div>
  );
}
