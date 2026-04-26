import { Card, CardHeader } from '@/components/ui/Card';
import type { HomeworkFunnelDto } from '@/types/analytics';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface HomeworkFunnelChartProps {
  data: HomeworkFunnelDto[];
  isLoading?: boolean;
}

export function HomeworkFunnelChart({ data, isLoading = false }: HomeworkFunnelChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader
          title="Воронка домашних заданий"
          subtitle="Assigned vs Completed on Time vs Overdue"
        />
        <p className="text-sm text-slate-500">Загрузка графика...</p>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Воронка домашних заданий"
          subtitle="Assigned vs Completed on Time vs Overdue"
        />
        <p className="text-sm text-slate-500">Недостаточно данных для отображения.</p>
      </Card>
    );
  }

  const chartData = data.slice(0, 5).map((item) => ({
    name: item.assignmentTitle,
    assigned: item.assignedCount,
    onTime: item.completedOnTimeCount,
    overdue: item.overdueCount,
  }));

  return (
    <Card>
      <CardHeader
        title="Воронка домашних заданий"
        subtitle="Последние 5 ДЗ: назначено, сдано вовремя, просрочено"
      />

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="assigned" name="Назначено" fill="#6366f1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="onTime" name="Сдано вовремя" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="overdue" name="Просрочено" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
