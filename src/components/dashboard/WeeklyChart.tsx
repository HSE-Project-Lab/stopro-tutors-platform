import { Card, CardHeader } from '@/components/ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { WeeklyProgress } from '@/types';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface WeeklyChartProps {
  data: WeeklyProgress[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    day: format(parseISO(item.date), 'EEE', { locale: ru }),
  }));

  return (
    <Card>
      <CardHeader title="Активность за неделю" subtitle="Решённые задачи и правильные ответы" />
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="day"
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
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => (value === 'solved' ? 'Решено' : 'Правильно')}
            />
            <Bar dataKey="solved" fill="#818cf8" radius={[4, 4, 0, 0]} name="solved" />
            <Bar dataKey="correct" fill="#34d399" radius={[4, 4, 0, 0]} name="correct" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
