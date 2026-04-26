import { cn } from '@/utils/cn';
import type { StudentAnalyticsDto } from '@/types/analytics';

interface GroupHeatmapProps {
  students: StudentAnalyticsDto[];
  onStudentClick?: (student: StudentAnalyticsDto) => void;
  className?: string;
}

const heatmapCellStyles = (successRate: number | null) => {
  if (successRate === null) {
    return 'bg-slate-100 text-slate-400 border-slate-200';
  }

  if (successRate < 50) {
    return 'bg-red-100 text-red-700 border-red-200';
  }

  if (successRate <= 80) {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }

  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
};

export function GroupHeatmap({ students, onStudentClick, className }: GroupHeatmapProps) {
  const taskNumbers = Array.from({ length: 19 }, (_, index) => index + 1);

  if (students.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Нет данных по группе для отображения тепловой карты.
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white', className)}>
      <div className="overflow-x-auto">
        <div className="min-w-[1120px]">
          <div className="sticky top-0 z-10 grid grid-cols-[360px_repeat(19,minmax(36px,1fr))] border-b border-slate-200 bg-slate-50">
            <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ученик
            </div>
            {taskNumbers.map((taskNumber) => (
              <div
                key={`head-${taskNumber}`}
                className="px-1 py-3 text-center text-xs font-semibold text-slate-500"
              >
                №{taskNumber}
              </div>
            ))}
          </div>

          {students.map((student) => (
            <div
              key={student.studentId}
              className="grid grid-cols-[360px_repeat(19,minmax(36px,1fr))] border-b border-slate-100 last:border-0"
            >
              <button
                type="button"
                onClick={() => onStudentClick?.(student)}
                className="px-4 py-3 text-left hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-800">{student.studentName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  [Цель: {student.targetScore} | Прогноз: {student.predictedEgeScore}]
                </p>
              </button>

              {taskNumbers.map((taskNumber) => {
                const metric = student.heatmap.find((cell) => cell.taskNumber === taskNumber);
                const successRate = metric?.successRate ?? null;

                return (
                  <div key={`${student.studentId}-${taskNumber}`} className="px-1 py-2">
                    <div
                      className={cn(
                        'h-9 rounded-md border text-[11px] font-semibold flex items-center justify-center',
                        heatmapCellStyles(successRate)
                      )}
                      title={
                        successRate === null
                          ? `№${taskNumber}: нет попыток`
                          : `№${taskNumber}: ${successRate}% (попыток: ${metric?.attempts ?? 0})`
                      }
                    >
                      {successRate === null ? '—' : `${Math.round(successRate)}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
        <span className="font-semibold">Легенда:</span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-200 border border-red-300" /> &lt; 50%
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-200 border border-amber-300" /> 50–80%
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300" /> &gt; 80%
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300" /> не решал
        </span>
      </div>
    </div>
  );
}
