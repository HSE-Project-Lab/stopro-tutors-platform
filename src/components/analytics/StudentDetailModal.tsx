import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { StudentAnalyticsDto } from '@/types/analytics';
import { FileText, X } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface StudentDetailModalProps {
  student: StudentAnalyticsDto | null;
  open: boolean;
  onClose: () => void;
}

const formatDateRu = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export function StudentDetailModal({ student, open, onClose }: StudentDetailModalProps) {
  if (!open || !student) return null;

  const scoreGap = student.predictedEgeScore - student.targetScore;
  const gapLabel = scoreGap >= 0 ? `+${scoreGap} к цели` : `${scoreGap} баллов до цели`;

  const weakTopicsChartData = student.weakTopics
    .slice()
    .sort((a, b) => {
      const aRate = a.successRate ?? 0;
      const bRate = b.successRate ?? 0;
      return aRate - bRate;
    })
    .slice(0, 3)
    .map((item) => ({
      тема: `№${item.taskNumber} ${item.topicName}`,
      успешность: item.successRate ?? 0,
      попытки: item.practiceCount,
    }));

  const reportLines = [
    `Ученик: ${student.studentName}`,
    `Группа: ${student.groupName}`,
    `Целевой балл: ${student.targetScore}`,
    `Прогноз: ${student.predictedEgeScore}`,
    `Разрыв: ${gapLabel}`,
    `ДЗ в срок: ${student.discipline.homeworkOnTimeRate}%`,
    `Последняя активность: ${formatDateRu(student.discipline.lastActiveAt)}`,
    '',
    'Топ-3 западающие темы:',
    ...weakTopicsChartData.map(
      (item) => `${item.тема}: ${item.успешность}% (попыток: ${item.попытки})`
    ),
  ];

  const handleDownloadReport = () => {
    const blob = new Blob([reportLines.join('\n')], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${student.studentName.replace(/\s+/g, '_')}_детальный_отчет.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <Card className="w-full max-w-6xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{student.studentName}</h3>
            <p className="text-sm text-slate-500 mt-1">{student.groupName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="info" size="sm">
                Цель: {student.targetScore}
              </Badge>
              <Badge variant="info" size="sm">
                Прогноз: {student.predictedEgeScore}
              </Badge>
              <Badge variant={scoreGap >= 0 ? 'success' : 'danger'} size="sm">
                {gapLabel}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Профиль навыков</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={student.radarSkills}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#475569' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Radar
                    name="Уровень"
                    dataKey="value"
                    stroke="#4f46e5"
                    fill="#4f46e5"
                    fillOpacity={0.3}
                  />
                  <Tooltip formatter={(value) => [`${value}%`, 'Уровень навыка']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Топ-3 западающие темы</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weakTopicsChartData}
                  layout="vertical"
                  margin={{ left: 24, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="тема"
                    width={140}
                    tick={{ fill: '#475569', fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value, key) => {
                      if (key === 'успешность') return [`${value}%`, 'Успешность'];
                      return [String(value), 'Попытки'];
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="успешность"
                    fill="#f97316"
                    name="Успешность"
                    radius={[0, 8, 8, 0]}
                  />
                  <Bar dataKey="попытки" fill="#0ea5e9" name="Попытки" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-2">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Динамика прогресса</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={student.progressHistory} margin={{ left: 12, right: 24, top: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="monthLabel" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis domain={[40, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value} баллов`, 'Прогноз']} />
                  <Legend />
                  <ReferenceLine
                    y={student.targetScore}
                    stroke="#ef4444"
                    strokeDasharray="6 6"
                    label={{
                      value: 'Целевой балл',
                      fill: '#ef4444',
                      fontSize: 12,
                      position: 'insideTopRight',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedScore"
                    name="Прогнозируемый балл"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h5 className="text-sm font-semibold text-slate-700 mb-2">Дисциплина</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
            <p>
              ДЗ сдано в срок:{' '}
              <span className="font-semibold">{student.discipline.homeworkOnTimeRate}%</span>
            </p>
            <p>
              Последняя активность:{' '}
              <span className="font-semibold">{formatDateRu(student.discipline.lastActiveAt)}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleDownloadReport}>
            <FileText size={16} className="mr-2" />
            Скачать подробный отчёт
          </Button>
        </div>
      </Card>
    </div>
  );
}
