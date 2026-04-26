import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
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

        // НЕТ FALLBACK НА MOCK! Показываем реальные данные или пустой список
        setStudents(fetchedStudents);
      } catch (err) {
        if (cancelled) return;
        setError('Не удалось загрузить аналитику. Проверьте подключение к серверу.');
        setStudents([]); // Пустой список, не моки!
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
        ) : students.length === 0 ? (
          <div className="p-6 text-center">
            <Info className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Аналитика пуста</h3>
            <p className="mt-2 text-slate-600">
              Данные появятся после того, как ученики начнут выполнять задания.
              Убедитесь, что вы создали группу и добавили в неё учеников.
            </p>
            <Button className="mt-4" onClick={() => (window.location.href = '/groups')}>
              Перейти к группам
            </Button>
          </div>
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
