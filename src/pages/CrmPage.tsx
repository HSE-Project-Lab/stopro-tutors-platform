import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { CrmDashboard } from '@/components/crm/CrmDashboard';
import { StudentTable } from '@/components/crm/StudentTable';
import { LogPaymentModal } from '@/components/crm/LogPaymentModal';
import { getStatusVariant, useCrmStore } from '@/store/crmStore';
import { useAppStore } from '@/store/appStore';
import type { PaymentFilters, PaymentStatus } from '@/types/crm';
import { AlertTriangle, HandCoins, Info } from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value || 0);

type CrmTab = 'overview' | 'students' | 'finance' | 'tax';

export function CrmPage() {
  const {
    students,
    payments,
    summary,
    taxRate,
    taxReminders,
    isLoadingSummary,
    isLoadingStudents,
    isLoadingPayments,
    isSavingPayment,
    paymentFilters,
    refreshCrm,
    fetchPayments,
    createPayment,
    markPaymentAsPaid,
    updateTaxRate,
    setStudentNote,
  } = useCrmStore();

  const { setActiveTab: setAppTab } = useAppStore();

  const [activeTab, setActiveTab] = useState<CrmTab>('overview');
  const [showLogPayment, setShowLogPayment] = useState(false);
  const [presetStudentId, setPresetStudentId] = useState<string | null>(null);
  const [localTaxRate, setLocalTaxRate] = useState(String(taxRate));
  const [filterStudentId, setFilterStudentId] = useState(paymentFilters.studentId || '');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>(
    paymentFilters.status || 'all'
  );
  const [filterFrom, setFilterFrom] = useState(paymentFilters.from || '');
  const [filterTo, setFilterTo] = useState(paymentFilters.to || '');

  useEffect(() => {
    void refreshCrm();
  }, [refreshCrm]);

  useEffect(() => {
    setLocalTaxRate(String(taxRate));
  }, [taxRate]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (filterStudentId && payment.studentId !== filterStudentId) return false;
      if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
      if (filterFrom && payment.dueDate < filterFrom) return false;
      if (filterTo && payment.dueDate > filterTo) return false;
      return true;
    });
  }, [payments, filterFrom, filterStatus, filterStudentId, filterTo]);

  const applyFinanceFilters = async () => {
    const filters: PaymentFilters = {
      studentId: filterStudentId || undefined,
      status: filterStatus,
      from: filterFrom || undefined,
      to: filterTo || undefined,
    };
    await fetchPayments(filters);
  };

  const openLogPayment = (studentId?: string) => {
    setPresetStudentId(studentId || null);
    setShowLogPayment(true);
  };

  const tabButton = (key: CrmTab, label: string) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        activeTab === key
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM репетитора</h1>
          <p className="text-slate-500 mt-1">
            Доходы, платежи, ученики и налоги в одном рабочем месте
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabButton('overview', 'Обзор')}
          {tabButton('students', 'Ученики')}
          {tabButton('finance', 'Финансы')}
          {tabButton('tax', 'Налоги')}
        </div>
      </div>

      {activeTab === 'overview' && (
        <CrmDashboard
          summary={summary}
          isLoading={isLoadingSummary || isLoadingPayments}
          onLogPayment={openLogPayment}
          onMarkPaid={(paymentId) => void markPaymentAsPaid(paymentId)}
        />
      )}

      {activeTab === 'students' && (
        <StudentTable
          students={students}
          payments={payments}
          isLoading={isLoadingStudents}
          onLogPayment={(studentId) => openLogPayment(studentId)}
          onOpenAnalytics={() => setAppTab('analytics')}
          onSaveNote={(studentId, note) => setStudentNote(studentId, note)}
        />
      )}

      {activeTab === 'finance' && (
        <Card>
          <CardHeader
            title="Финансы"
            subtitle="Все транзакции, фильтры и быстрые отметки оплаты"
            action={
              <Button onClick={() => openLogPayment()}>
                <HandCoins size={16} className="mr-2" />
                Добавить платёж
              </Button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-5">
            <Select
              value={filterStudentId}
              onChange={setFilterStudentId}
              options={[
                { value: '', label: 'Все ученики' },
                ...students.map((student) => ({ value: student.id, label: student.fullName })),
              ]}
            />
            <Select
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as PaymentStatus | 'all')}
              options={[
                { value: 'all', label: 'Все статусы' },
                { value: 'paid', label: 'paid' },
                { value: 'unpaid', label: 'unpaid' },
                { value: 'overdue', label: 'overdue' },
              ]}
            />
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            <Button variant="outline" onClick={() => void applyFinanceFilters()}>
              Применить фильтры
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 pr-3 font-medium">Ученик</th>
                  <th className="py-3 pr-3 font-medium">Тип</th>
                  <th className="py-3 pr-3 font-medium">Сумма</th>
                  <th className="py-3 pr-3 font-medium">Срок</th>
                  <th className="py-3 pr-3 font-medium">Оплата</th>
                  <th className="py-3 pr-3 font-medium">Статус</th>
                  <th className="py-3 font-medium text-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingPayments ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      Загрузка платежей...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      По заданным фильтрам платежей не найдено.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const student = students.find((item) => item.id === payment.studentId);
                    const canMarkPaid = payment.status === 'unpaid' || payment.status === 'overdue';
                    return (
                      <tr
                        key={payment.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                      >
                        <td className="py-3 pr-3 text-slate-900 font-semibold">
                          {student?.fullName || 'Ученик'}
                        </td>
                        <td className="py-3 pr-3 text-slate-600">{payment.lessonType}</td>
                        <td className="py-3 pr-3 text-slate-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 pr-3 text-slate-600">
                          {new Date(payment.dueDate).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="py-3 pr-3 text-slate-600">
                          {payment.paymentDate
                            ? new Date(payment.paymentDate).toLocaleDateString('ru-RU')
                            : '—'}
                        </td>
                        <td className="py-3 pr-3">
                          <Badge size="sm" variant={getStatusVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            size="sm"
                            variant={canMarkPaid ? 'primary' : 'outline'}
                            disabled={!canMarkPaid}
                            onClick={() => void markPaymentAsPaid(payment.id)}
                          >
                            {canMarkPaid ? 'Отметить как paid' : 'Уже paid'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'tax' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Налоговый ассистент" subtitle="Прогноз и напоминания по налогам" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <Input
                label="Ставка налога, %"
                type="number"
                min={0}
                max={100}
                value={localTaxRate}
                onChange={(e) => setLocalTaxRate(e.target.value)}
              />
              <Button
                onClick={() => void updateTaxRate(Number(localTaxRate || 0))}
                isLoading={isSavingPayment}
              >
                Сохранить ставку
              </Button>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700">Налог к уплате (прогноз)</p>
                <p className="text-xl font-bold text-amber-800 mt-1">
                  {formatCurrency(summary?.estimatedTaxDue || 0)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 flex gap-3">
              <Info size={18} className="text-blue-700 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Это предварительный расчёт для вашего удобства. Проконсультируйтесь с бухгалтером
                для точной отчётности.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Напоминания" subtitle="Система подскажет важные дедлайны" />
            <div className="space-y-2">
              {taxReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 flex items-center justify-between"
                >
                  <p className="text-sm text-slate-800">{reminder.title}</p>
                  <Badge variant="warning" size="sm">
                    {new Date(reminder.dueDate).toLocaleDateString('ru-RU')}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {(summary?.overduePayments || 0) > 0 && (
            <Card className="border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-600" />
                <p className="text-sm text-red-800">
                  У вас есть просроченные платежи на сумму{' '}
                  {formatCurrency(summary?.overduePayments || 0)}.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      <LogPaymentModal
        open={showLogPayment}
        students={students}
        presetStudentId={presetStudentId}
        isLoading={isSavingPayment}
        onClose={() => setShowLogPayment(false)}
        onSubmit={createPayment}
      />
    </div>
  );
}
