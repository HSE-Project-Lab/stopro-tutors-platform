export type PaymentStatus = 'paid' | 'unpaid' | 'overdue';

export type LessonType = 'single_lesson' | 'monthly_subscription' | 'package_10_lessons';

export type CrmStudentPaymentStatus = 'paid' | 'upcoming' | 'overdue' | 'unknown';

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paymentDate?: string | null;
  lessonType: LessonType;
}

export interface CrmStudent {
  id: string;
  fullName: string;
  groupName?: string;
  email?: string;
  phone?: string;
  parentPhone?: string;
  parentEmail?: string;
  paymentStatus: CrmStudentPaymentStatus;
  nextPaymentDueDate?: string | null;
  balanceDue?: number;
  notes?: string;
}

export interface IncomeHistoryPoint {
  month: string;
  income: number;
  expected: number;
}

export interface CrmDebtorItem {
  paymentId: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
}

export interface UpcomingLesson {
  id: string;
  studentId: string;
  studentName: string;
  startsAt: string;
  lessonType?: LessonType;
}

export interface CrmSummary {
  monthlyIncome: number;
  expectedThisMonth: number;
  overduePayments: number;
  estimatedTaxDue: number;
  taxRate: number;
  incomeHistory: IncomeHistoryPoint[];
  debtors: CrmDebtorItem[];
  upcomingLessons: UpcomingLesson[];
}

export interface PaymentFilters {
  studentId?: string;
  status?: PaymentStatus | 'all';
  from?: string;
  to?: string;
}

export interface CreatePaymentPayload {
  studentId: string;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paymentDate?: string;
  lessonType: LessonType;
}

export interface UpdatePaymentPayload {
  status?: PaymentStatus;
  paymentDate?: string | null;
  dueDate?: string;
  amount?: number;
  lessonType?: LessonType;
}

export interface CrmTaxReminder {
  id: string;
  title: string;
  dueDate: string;
}
