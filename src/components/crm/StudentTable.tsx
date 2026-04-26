import { useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { CrmStudent, Payment } from '@/types/crm';
import { ExternalLink, HandCoins, Search, X } from 'lucide-react';

interface StudentTableProps {
  students: CrmStudent[];
  payments: Payment[];
  isLoading?: boolean;
  onLogPayment: (studentId: string) => void;
  onOpenAnalytics: (studentId: string) => void;
  onSaveNote: (studentId: string, note: string) => void;
}

const paymentBadgeByStudentStatus: Record<
  CrmStudent['paymentStatus'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }
> = {
  paid: { label: 'Paid', variant: 'success' },
  upcoming: { label: 'Upcoming', variant: 'warning' },
  overdue: { label: 'Overdue', variant: 'danger' },
  unknown: { label: 'Unknown', variant: 'default' },
};

export function StudentTable({
  students,
  payments,
  isLoading = false,
  onLogPayment,
  onOpenAnalytics,
  onSaveNote,
}: StudentTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CrmStudent['paymentStatus']>('all');
  const [activeStudent, setActiveStudent] = useState<CrmStudent | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((student) => {
      const bySearch =
        !q ||
        student.fullName.toLowerCase().includes(q) ||
        (student.groupName || '').toLowerCase().includes(q) ||
        (student.email || '').toLowerCase().includes(q);
      const byStatus = statusFilter === 'all' || student.paymentStatus === statusFilter;
      return bySearch && byStatus;
    });
  }, [search, statusFilter, students]);

  const studentPayments = useMemo(() => {
    if (!activeStudent) return [];
    return payments
      .filter((payment) => payment.studentId === activeStudent.id)
      .sort((a, b) => (new Date(b.dueDate).getTime() || 0) - (new Date(a.dueDate).getTime() || 0));
  }, [activeStudent, payments]);

  const openStudent = (student: CrmStudent) => {
    setActiveStudent(student);
    setNoteDraft(student.notes || '');
  };

  return (
    <>
      <Card>
        <CardHeader title="Ученики" subtitle="Single Source of Truth: контакты, статус, финансы" />
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[220px]">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, группе или email"
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-[220px]">
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as 'all' | CrmStudent['paymentStatus'])}
              options={[
                { value: 'all', label: 'Все статусы' },
                { value: 'paid', label: 'Paid' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'unknown', label: 'Unknown' },
              ]}
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Загрузка учеников...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-sm text-slate-500">Ничего не найдено по текущим фильтрам.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-3 pr-3 font-medium">Ученик</th>
                  <th className="py-3 pr-3 font-medium">Группа</th>
                  <th className="py-3 pr-3 font-medium">Контакты</th>
                  <th className="py-3 pr-3 font-medium">Статус оплаты</th>
                  <th className="py-3 pr-3 font-medium">Долг</th>
                  <th className="py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const badge = paymentBadgeByStudentStatus[student.paymentStatus];
                  return (
                    <tr
                      key={student.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="py-3 pr-3">
                        <button
                          onClick={() => openStudent(student)}
                          className="font-semibold text-slate-900 hover:text-indigo-600"
                        >
                          {student.fullName}
                        </button>
                      </td>
                      <td className="py-3 pr-3 text-slate-600">
                        {student.groupName || 'Без группы'}
                      </td>
                      <td className="py-3 pr-3 text-slate-600">
                        {student.phone || student.email || '—'}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-slate-900 font-medium">
                        {student.balanceDue || 0} ₽
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenAnalytics(student.id)}
                          >
                            <ExternalLink size={14} className="mr-1" />
                            Аналитика
                          </Button>
                          <Button size="sm" onClick={() => onLogPayment(student.id)}>
                            <HandCoins size={14} className="mr-1" />
                            Log Payment
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {activeStudent && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{activeStudent.fullName}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {activeStudent.groupName || 'Без группы'}
                </p>
              </div>
              <button
                onClick={() => setActiveStudent(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="border border-slate-200" padding="sm">
                <p className="text-xs text-slate-500 mb-2">Контакты ученика</p>
                <p className="text-sm text-slate-800">Телефон: {activeStudent.phone || '—'}</p>
                <p className="text-sm text-slate-800">Email: {activeStudent.email || '—'}</p>
              </Card>
              <Card className="border border-slate-200" padding="sm">
                <p className="text-xs text-slate-500 mb-2">Контакты родителей</p>
                <p className="text-sm text-slate-800">
                  Телефон: {activeStudent.parentPhone || '—'}
                </p>
                <p className="text-sm text-slate-800">Email: {activeStudent.parentEmail || '—'}</p>
              </Card>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-900 mb-2">Заметки</p>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                className="w-full min-h-[120px] rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Личные заметки о прогрессе, мотивации, предпочтениях..."
              />
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onSaveNote(activeStudent.id, noteDraft);
                    setActiveStudent({ ...activeStudent, notes: noteDraft });
                  }}
                >
                  Сохранить заметку
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenAnalytics(activeStudent.id)}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Открыть AnalyticsPage
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">История платежей</p>
              {studentPayments.length === 0 ? (
                <p className="text-sm text-slate-500">У этого ученика пока нет платежей.</p>
              ) : (
                <div className="space-y-2">
                  {studentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{payment.amount} ₽</p>
                        <p className="text-xs text-slate-500">
                          Срок: {new Date(payment.dueDate).toLocaleDateString('ru-RU')}
                          {payment.paymentDate
                            ? ` · Оплачено: ${new Date(payment.paymentDate).toLocaleDateString('ru-RU')}`
                            : ''}
                        </p>
                      </div>
                      <Badge
                        size="sm"
                        variant={
                          payment.status === 'paid'
                            ? 'success'
                            : payment.status === 'overdue'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
