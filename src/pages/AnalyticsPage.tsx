import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const studentProgress = {
  completedTasks: 0,
  correctAnswers: 0,
  averageTime: 0,
  weeklyProgress: [] as any[],
  topicStats: [] as any[],
};
import { Download, FileText } from 'lucide-react';
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

export function AnalyticsPage() {
  const { topicStats } = studentProgress;

  const pieData = [
    { name: 'Отлично (80%+)', value: topicStats.filter((t) => t.successRate >= 80).length },
    { name: 'Хорошо (60-80%)', value: topicStats.filter((t) => t.successRate >= 60 && t.successRate < 80).length },
    { name: 'Требует внимания (<60%)', value: topicStats.filter((t) => t.successRate < 60).length },
  ];

  const radarData = topicStats.slice(0, 6).map((t) => ({
    subject: `№${t.egeNumber}`,
    value: t.successRate,
    fullMark: 100,
  }));

  const monthlyData: { month: string; tasks: number; correct: number }[] = [];

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Аналитика</h1>
          <p className="text-slate-500 mt-1">
            Детальная статистика и динамика успеваемости
          </p>
        </div>
        <div className="flex gap-3">
          <Select
            options={[
              { value: '7', label: 'Последние 7 дней' },
              { value: '30', label: 'Последний месяц' },
              { value: '90', label: 'Последние 3 месяца' },
              { value: 'all', label: 'Всё время' },
            ]}
            defaultValue="30"
          />
          <Button variant="outline">
            <Download size={18} className="mr-2" />
            Экспорт PDF
          </Button>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <p className="text-indigo-100 text-sm">Всего задач решено</p>
          <p className="text-3xl font-bold mt-1">{studentProgress.completedTasks}</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <p className="text-emerald-100 text-sm">Правильных ответов</p>
          <p className="text-3xl font-bold mt-1">{studentProgress.correctAnswers}</p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <p className="text-amber-100 text-sm">Средняя успешность</p>
          <p className="text-3xl font-bold mt-1">
            {studentProgress.completedTasks
              ? Math.round((studentProgress.correctAnswers / studentProgress.completedTasks) * 100)
              : 0}
            %
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <p className="text-purple-100 text-sm">Среднее время</p>
          <p className="text-3xl font-bold mt-1">
            {Math.round(studentProgress.averageTime / 60)} мин
          </p>
        </Card>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card>
          <CardHeader
            title="Динамика за месяц"
            subtitle="Решённые задачи и правильные ответы"
          />
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
                <YAxis
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
          <CardHeader
            title="Профиль навыков"
            subtitle="Успешность по заданиям ЕГЭ"
          />
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
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
          <CardHeader
            title="Детализация по темам"
            subtitle="Успешность и количество попыток"
          />
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
                  width={100}
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
        </Card>
      </div>

      
      <Card className="bg-gradient-to-r from-slate-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <FileText size={24} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Экспорт отчёта</h3>
              <p className="text-sm text-slate-500">
                Скачайте детальный PDF-отчёт о вашем прогрессе
              </p>
            </div>
          </div>
          <Button>
            <Download size={18} className="mr-2" />
            Скачать PDF
          </Button>
        </div>
      </Card>
    </div>
  );
}
