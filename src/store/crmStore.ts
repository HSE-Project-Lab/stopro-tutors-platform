import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';
import type {
  CreatePaymentPayload,
  CrmDebtorItem,
  CrmStudent,
  CrmSummary,
  CrmTaxReminder,
  IncomeHistoryPoint,
  Payment,
  PaymentFilters,
  PaymentStatus,
  UpdatePaymentPayload,
} from '@/types/crm';

const toDateOnly = (value: Date) => value.toISOString().slice(0, 10);

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const isWithinMonth = (value: string | undefined | null, monthDate: Date) => {
  const parsed = parseDate(value);
  if (!parsed) return false;
  return parsed >= startOfMonth(monthDate) && parsed <= endOfMonth(monthDate);
};

const getLastSixMonthHistory = (payments: Payment[]): IncomeHistoryPoint[] => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const monthLabel = monthDate.toLocaleDateString('ru-RU', { month: 'short' });

    const income = payments
      .filter(
        (payment) => payment.status === 'paid' && isWithinMonth(payment.paymentDate, monthDate)
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    const expected = payments
      .filter(
        (payment) =>
          (payment.status === 'unpaid' || payment.status === 'overdue') &&
          isWithinMonth(payment.dueDate, monthDate)
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      income,
      expected,
    };
  });
};

const buildDebtors = (payments: Payment[], students: CrmStudent[]): CrmDebtorItem[] => {
  const studentNameMap = new Map(students.map((student) => [student.id, student.fullName]));
  return payments
    .filter((payment) => payment.status === 'unpaid' || payment.status === 'overdue')
    .sort((a, b) => (parseDate(a.dueDate)?.getTime() ?? 0) - (parseDate(b.dueDate)?.getTime() ?? 0))
    .map((payment) => ({
      paymentId: payment.id,
      studentId: payment.studentId,
      studentName: studentNameMap.get(payment.studentId) || 'Ученик',
      amount: payment.amount,
      dueDate: payment.dueDate,
      status: payment.status,
    }))
    .slice(0, 8);
};

const generateTaxReminders = (year: number): CrmTaxReminder[] => [
  {
    id: `${year}-q1`,
    title: 'Не забудьте уплатить налог за 1 квартал до 25 апреля',
    dueDate: `${year}-04-25`,
  },
  {
    id: `${year}-q2`,
    title: 'Не забудьте уплатить налог за 2 квартал до 25 июля',
    dueDate: `${year}-07-25`,
  },
  {
    id: `${year}-q3`,
    title: 'Не забудьте уплатить налог за 3 квартал до 25 октября',
    dueDate: `${year}-10-25`,
  },
  {
    id: `${year + 1}-q4`,
    title: `Не забудьте уплатить налог за 4 квартал до 25 января ${year + 1}`,
    dueDate: `${year + 1}-01-25`,
  },
];

const deriveSummary = (
  payments: Payment[],
  students: CrmStudent[],
  taxRate: number,
  incoming?: Partial<CrmSummary>
): CrmSummary => {
  const now = new Date();

  const monthlyIncome = payments
    .filter((payment) => payment.status === 'paid' && isWithinMonth(payment.paymentDate, now))
    .reduce((sum, payment) => sum + payment.amount, 0);

  const expectedThisMonth = payments
    .filter(
      (payment) =>
        (payment.status === 'unpaid' || payment.status === 'overdue') &&
        isWithinMonth(payment.dueDate, now)
    )
    .reduce((sum, payment) => sum + payment.amount, 0);

  const overduePayments = payments
    .filter((payment) => {
      const due = parseDate(payment.dueDate);
      if (!due) return false;
      return payment.status === 'overdue' || (payment.status === 'unpaid' && due < now);
    })
    .reduce((sum, payment) => sum + payment.amount, 0);

  const calculatedTax = monthlyIncome * (taxRate / 100);

  return {
    monthlyIncome: incoming?.monthlyIncome ?? monthlyIncome,
    expectedThisMonth: incoming?.expectedThisMonth ?? expectedThisMonth,
    overduePayments: incoming?.overduePayments ?? overduePayments,
    estimatedTaxDue: incoming?.estimatedTaxDue ?? calculatedTax,
    taxRate,
    incomeHistory: incoming?.incomeHistory?.length
      ? incoming.incomeHistory
      : getLastSixMonthHistory(payments),
    debtors: incoming?.debtors?.length ? incoming.debtors : buildDebtors(payments, students),
    upcomingLessons: incoming?.upcomingLessons ?? [],
  };
};

interface CrmState {
  students: CrmStudent[];
  payments: Payment[];
  summary: CrmSummary | null;
  taxRate: number;
  taxReminders: CrmTaxReminder[];
  studentNotes: Record<string, string>;
  isLoadingSummary: boolean;
  isLoadingStudents: boolean;
  isLoadingPayments: boolean;
  isSavingPayment: boolean;
  error: string | null;
  selectedStudentId: string | null;
  paymentFilters: PaymentFilters;
  setSelectedStudentId: (studentId: string | null) => void;
  setPaymentFilters: (filters: PaymentFilters) => void;
  setStudentNote: (studentId: string, note: string) => void;
  hydrateSummary: () => void;
  fetchSummary: () => Promise<void>;
  fetchStudents: () => Promise<void>;
  fetchPayments: (filters?: PaymentFilters) => Promise<void>;
  refreshCrm: () => Promise<void>;
  createPayment: (payload: CreatePaymentPayload) => Promise<void>;
  updatePayment: (paymentId: string, payload: UpdatePaymentPayload) => Promise<void>;
  markPaymentAsPaid: (paymentId: string) => Promise<void>;
  updateTaxRate: (taxRate: number) => Promise<void>;
}

export const useCrmStore = create<CrmState>()(
  persist(
    (set, get) => ({
      students: [],
      payments: [],
      summary: null,
      taxRate: 6,
      taxReminders: generateTaxReminders(new Date().getFullYear()),
      studentNotes: {},
      isLoadingSummary: false,
      isLoadingStudents: false,
      isLoadingPayments: false,
      isSavingPayment: false,
      error: null,
      selectedStudentId: null,
      paymentFilters: {},

      setSelectedStudentId: (studentId) => set({ selectedStudentId: studentId }),

      setPaymentFilters: (filters) => set({ paymentFilters: filters }),

      setStudentNote: (studentId, note) => {
        set((state) => ({
          studentNotes: { ...state.studentNotes, [studentId]: note },
          students: state.students.map((student) =>
            student.id === studentId ? { ...student, notes: note } : student
          ),
        }));
      },

      hydrateSummary: () => {
        const state = get();
        set({
          summary: deriveSummary(
            state.payments,
            state.students,
            state.taxRate,
            state.summary ?? undefined
          ),
        });
      },

      fetchSummary: async () => {
        set({ isLoadingSummary: true, error: null });
        try {
          const { taxRate, payments, students } = get();
          const response = await api.get<Partial<CrmSummary>>('/crm/summary');
          set({ summary: deriveSummary(payments, students, taxRate, response.data) });
        } catch {
          const { payments, students, taxRate } = get();
          set({ summary: deriveSummary(payments, students, taxRate) });
        } finally {
          set({ isLoadingSummary: false });
        }
      },

      fetchStudents: async () => {
        set({ isLoadingStudents: true, error: null });
        try {
          const response = await api.get<CrmStudent[]>('/crm/students');
          const notes = get().studentNotes;
          const students = response.data.map((student) => ({
            ...student,
            notes: notes[student.id] ?? student.notes ?? '',
          }));
          set({ students });
          get().hydrateSummary();
        } catch (error: any) {
          set({ error: error?.response?.data?.message || 'Не удалось загрузить учеников' });
        } finally {
          set({ isLoadingStudents: false });
        }
      },

      fetchPayments: async (filters = {}) => {
        set({ isLoadingPayments: true, error: null, paymentFilters: filters });
        try {
          const response = await api.get<Payment[]>('/crm/payments', { params: filters });
          set({ payments: response.data });
          get().hydrateSummary();
        } catch (error: any) {
          set({ error: error?.response?.data?.message || 'Не удалось загрузить платежи' });
        } finally {
          set({ isLoadingPayments: false });
        }
      },

      refreshCrm: async () => {
        await Promise.all([get().fetchStudents(), get().fetchPayments(get().paymentFilters)]);
        await get().fetchSummary();
      },

      createPayment: async (payload) => {
        set({ isSavingPayment: true, error: null });
        try {
          const response = await api.post<Payment>('/crm/payments', payload);
          const created = response.data;
          set((state) => ({
            payments: [created, ...state.payments],
          }));
          get().hydrateSummary();
          await get().fetchSummary();
        } catch (error: any) {
          set({ error: error?.response?.data?.message || 'Не удалось добавить платеж' });
          throw error;
        } finally {
          set({ isSavingPayment: false });
        }
      },

      updatePayment: async (paymentId, payload) => {
        set({ isSavingPayment: true, error: null });
        const prevPayments = get().payments;
        set((state) => ({
          payments: state.payments.map((payment) =>
            payment.id === paymentId ? { ...payment, ...payload } : payment
          ),
        }));
        get().hydrateSummary();

        try {
          const response = await api.patch<Payment>(`/crm/payments/${paymentId}`, payload);
          set((state) => ({
            payments: state.payments.map((payment) =>
              payment.id === paymentId ? response.data : payment
            ),
          }));
          get().hydrateSummary();
          await get().fetchSummary();
        } catch (error: any) {
          set({
            payments: prevPayments,
            error: error?.response?.data?.message || 'Не удалось обновить платеж',
          });
          get().hydrateSummary();
          throw error;
        } finally {
          set({ isSavingPayment: false });
        }
      },

      markPaymentAsPaid: async (paymentId) => {
        const today = toDateOnly(new Date());
        await get().updatePayment(paymentId, { status: 'paid', paymentDate: today });
      },

      updateTaxRate: async (taxRate) => {
        const nextTaxRate = Number.isFinite(taxRate) ? Math.max(0, Math.min(100, taxRate)) : 0;
        const previous = get().taxRate;
        set({ taxRate: nextTaxRate });
        get().hydrateSummary();

        try {
          await api.put('/crm/settings', { taxRate: nextTaxRate });
          await get().fetchSummary();
        } catch (error: any) {
          set({
            taxRate: previous,
            error: error?.response?.data?.message || 'Не удалось сохранить налоговую ставку',
          });
          get().hydrateSummary();
          throw error;
        }
      },
    }),
    {
      name: 'stopro-crm-store',
      partialize: (state) => ({
        taxRate: state.taxRate,
        studentNotes: state.studentNotes,
      }),
    }
  )
);

export const getStatusVariant = (status: PaymentStatus): 'success' | 'warning' | 'danger' => {
  if (status === 'paid') return 'success';
  if (status === 'overdue') return 'danger';
  return 'warning';
};
