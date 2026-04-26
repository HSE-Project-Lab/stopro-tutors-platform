import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { StudentHeatmapDto } from '@/types/analytics';
import { FileText, TrendingDown, TrendingUp, X } from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

interface StudentDrilldownModalProps {
  student: StudentHeatmapDto | null;
  open: boolean;
  onClose: () => void;
}

export function StudentDrilldownModal({ student, open, onClose }: StudentDrilldownModalProps) {
  if (!open || !student) return null;

  const handleDownloadReport = () => {
    const content = [
      `Отчет ученика: ${student.studentName}`,
      `Группа: ${student.groupName}`,
      `Прогноз ЕГЭ: ${student.predictedEgeScore}`,
      `Выполнение ДЗ: ${student.homeworkCompletionRate}%`,
      `Пропусков ДЗ: ${student.missedHomeworkCount}`,
      `Статус риска: ${student.atRisk ? 'At Risk' : 'Stable'}`,
      '',
      'Профиль навыков:',
      ...student.radarSkills.map((item) => `${item.subject}: ${item.value}%`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${student.studentName.replace(/\s+/g, '_')}_report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{student.studentName}</h3>
            <p className="text-sm text-slate-500 mt-1">{student.groupName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs text-indigo-700">Прогноз ЕГЭ</p>
            <p className="text-2xl font-bold text-indigo-900 mt-1">{student.predictedEgeScore}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs text-emerald-700">Выполнение ДЗ</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">
              {student.homeworkCompletionRate}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Статус</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={student.atRisk ? 'danger' : 'success'}>
                {student.atRisk ? 'At Risk' : 'Stable'}
              </Badge>
              {student.trend === 'down' ? (
                <TrendingDown size={16} className="text-red-500" />
              ) : (
                <TrendingUp size={16} className="text-emerald-500" />
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Профиль навыков (Radar)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={student.radarSkills}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#475569' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar
                  name="Навык"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.28}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleDownloadReport}>
            <FileText size={16} className="mr-2" />
            Скачать отчет
          </Button>
        </div>
      </Card>
    </div>
  );
}
