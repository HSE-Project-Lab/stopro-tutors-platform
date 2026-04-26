import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { CrmSummary } from '@/types/crm';
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  HandCoins,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface CrmDashboardProps {
  summary: CrmSummary | null;
  isLoading?: boolean;
  onLogPayment: (studentId?: string) => void;
  onMarkPaid: (paymentId: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value || 0);

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentClass: string;
}

function MetricCard({ title, value, subtitle, icon: Icon, accentClass }: MetricCardProps) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentClass}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </Card>
  );
}

export function CrmDashboard({
  summary,
  isLoading = false,
  onLogPayment,
  onMarkPaid,
}: CrmDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-10 text-slate-500">Загрузка CRM-дашборда...</Card>
      </div>
    );
  }

  const debtors = summary?.debtors ?? [];
  const upcomingLessons = summary?.upcomingLessons ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Доход за месяц"
          value={formatCurrency(summary?.monthlyIncome ?? 0)}
          subtitle="Фактически оплачено"
          icon={TrendingUp}
          accentClass="bg-emerald-500"
        />
        <MetricCard
          title="Ожидается в этом месяце"
          value={formatCurrency(summary?.expectedThisMonth ?? 0)}
          subtitle="Неоплаченные счета"
          icon={Clock3}
          accentClass="bg-indigo-500"
        />
        <MetricCard
          title="Просроченные платежи"
          value={formatCurrency(summary?.overduePayments ?? 0)}
          subtitle="Требуют внимания"
          icon={AlertTriangle}
          accentClass="bg-red-500"
        />
        <MetricCard
          title="Налог к уплате (прогноз)"
          value={formatCurrency(summary?.estimatedTaxDue ?? 0)}
          subtitle={`Ставка: ${summary?.taxRate ?? 0}%`}
          icon={ReceiptText}
          accentClass="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Динамика дохода за 6 месяцев"
            subtitle="Доход и ожидаемые поступления"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.incomeHistory ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="income" name="Оплачено" radius={[8, 8, 0, 0]} fill="#10b981" />
                <Bar dataKey="expected" name="Ожидается" radius={[8, 8, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Быстрые действия" subtitle="Самое важное прямо сейчас" />
          <div className="space-y-3">
            <Button className="w-full justify-start" onClick={() => onLogPayment()}>
              <HandCoins size={16} className="mr-2" />
              Добавить платёж
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ReceiptText size={16} className="mr-2" />
              Посчитать итог месяца
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CalendarDays size={16} className="mr-2" />
              Проверить налоговый дедлайн
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Кто не заплатил?" subtitle="Просроченные и ближайшие платежи" />
          <div className="space-y-3">
            {debtors.length === 0 ? (
              <p className="text-sm text-slate-500">Все платежи в порядке.</p>
            ) : (
              debtors.map((item) => (
                <div
                  key={item.paymentId}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.studentName}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Срок: {new Date(item.dueDate).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(item.amount)}</p>
                      <Badge variant={item.status === 'overdue' ? 'danger' : 'warning'} size="sm">
                        {item.status === 'overdue' ? 'Просрочен' : 'Ожидается'}
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm" className="mt-3" onClick={() => onMarkPaid(item.paymentId)}>
                    Log Payment
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Ближайшие уроки" subtitle="Следующие 3 дня" />
          <div className="space-y-3">
            {upcomingLessons.length === 0 ? (
              <p className="text-sm text-slate-500">Нет уроков в ближайшие 3 дня.</p>
            ) : (
              upcomingLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{lesson.studentName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(lesson.startsAt).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge variant="info" size="sm">
                    Урок
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
