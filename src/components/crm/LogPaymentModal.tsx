import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { CreatePaymentPayload, CrmStudent, LessonType, PaymentStatus } from '@/types/crm';
import { X } from 'lucide-react';

interface LogPaymentModalProps {
  open: boolean;
  students: CrmStudent[];
  presetStudentId?: string | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePaymentPayload) => Promise<void>;
}

const lessonTypeOptions: { value: LessonType; label: string }[] = [
  { value: 'single_lesson', label: 'Разовый урок' },
  { value: 'monthly_subscription', label: 'Месячный абонемент' },
  { value: 'package_10_lessons', label: 'Пакет 10 уроков' },
];

const statusOptions: { value: PaymentStatus; label: string }[] = [
  { value: 'paid', label: 'Оплачен' },
  { value: 'unpaid', label: 'Не оплачен' },
  { value: 'overdue', label: 'Просрочен' },
];

const today = () => new Date().toISOString().slice(0, 10);

export function LogPaymentModal({
  open,
  students,
  presetStudentId,
  isLoading = false,
  onClose,
  onSubmit,
}: LogPaymentModalProps) {
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('unpaid');
  const [dueDate, setDueDate] = useState(today());
  const [paymentDate, setPaymentDate] = useState(today());
  const [lessonType, setLessonType] = useState<LessonType>('single_lesson');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStudentId(presetStudentId || '');
    setAmount('');
    setStatus('unpaid');
    setDueDate(today());
    setPaymentDate(today());
    setLessonType('single_lesson');
    setError(null);
  }, [open, presetStudentId]);

  const studentOptions = useMemo(
    () => students.map((student) => ({ value: student.id, label: student.fullName })),
    [students]
  );

  if (!open) return null;

  const submit = async () => {
    setError(null);
    const parsedAmount = Number(amount);

    if (!studentId) {
      setError('Выберите ученика');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Укажите корректную сумму');
      return;
    }

    const payload: CreatePaymentPayload = {
      studentId,
      amount: parsedAmount,
      status,
      dueDate,
      paymentDate: status === 'paid' ? paymentDate : undefined,
      lessonType,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch {
      setError('Не удалось сохранить платёж');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Добавить платёж</h3>
            <p className="text-sm text-slate-500 mt-1">Заполните данные счета или оплаты</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Select
            label="Ученик"
            value={studentId}
            onChange={setStudentId}
            options={studentOptions}
            placeholder="Выберите ученика"
          />
          <Input
            label="Сумма, ₽"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={0}
            step="100"
            placeholder="Например, 3000"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Статус"
              value={status}
              onChange={(value) => setStatus(value as PaymentStatus)}
              options={statusOptions}
            />
            <Select
              label="Тип оплаты"
              value={lessonType}
              onChange={(value) => setLessonType(value as LessonType)}
              options={lessonTypeOptions}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Срок оплаты"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Input
              label="Дата оплаты"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={status !== 'paid'}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
          <Button className="flex-1" onClick={submit} isLoading={isLoading}>
            Сохранить платёж
          </Button>
        </div>
      </Card>
    </div>
  );
}
