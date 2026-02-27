// src/types/index.ts

// ===== РОЛИ =====
export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

// ===== ПОЛЬЗОВАТЕЛИ =====
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Student extends User {
  role: 'STUDENT';
  grade: number;
  targetScore: number;
  groupId?: string;
  teacherId?: string;
}

export interface Teacher extends User {
  role: 'TEACHER';
  specialization: string;
  studentsCount: number;
  groupsCount: number;
}

// ===== ГРУППЫ =====
export interface Group {
  id: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  studentsCount: number;
  createdAt: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  teacherId: string;
  inviteCode: string;
  studentsCount: number;
}

export interface StudentCredentials {
  fullName: string;
  username: string;
  password: string;
}

export interface AddStudentsResponse {
  groupId: string;
  credentials: StudentCredentials[];
}

// ===== ТЕМЫ =====
export interface Topic {
  id: string;
  name: string;
  egeNumber?: number;
  parentId?: string;
  tasksCount: number;
}

// ===== ЗАДАЧИ =====
export type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Task {
  id: string;
  topicId: string;
  topicName: string;
  egeNumber: number;
  difficulty: TaskDifficulty;
  content: string;
  answer: string;
  solution?: string;
  points?: number;
  imageUrls?: string[];
}

export interface TaskResult {
  id: string;
  taskId: string;
  studentId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  aiFeedback?: string;
  createdAt: string;
}

// ===== КОНСТРУКТОР ЗАДАЧ ЕГЭ =====
export interface EgeTask {
  id: string;
  parentId?: string;
  egeNumber: number;
  topic: string;
  difficulty: TaskDifficulty;
  content: string;
  solution?: string;
  answer: string;
  imageUrls?: string[];
  variants?: EgeTask[];
  createdAt: string;
  updatedAt: string;
}

export interface EgeTaskCreateRequest {
  egeNumber: number;
  topic: string;
  difficulty: TaskDifficulty;
  content: string;
  solution?: string;
  answer: string;
  imageUrls?: string[];
}

export interface EgeTaskFilterParams {
  egeNumber?: number;
  topic?: string;
  difficulty?: TaskDifficulty;
  search?: string;
  page?: number;
  size?: number;
}

export interface EgeTaskPage {
  content: EgeTask[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const EGE_TOPICS: Record<number, string[]> = {
  1: ['Треугольники', 'Четырёхугольники', 'Окружность и круг', 'Площади фигур'],
  2: ['Векторы на плоскости', 'Координаты вектора', 'Скалярное произведение'],
  3: ['Призма', 'Пирамида', 'Цилиндр', 'Конус', 'Шар и сфера'],
  4: ['Классическая вероятность', 'Начала статистики'],
  5: ['Сложная вероятность', 'Теоремы сложения и умножения', 'Формула Бернулли'],
  6: [
    'Линейные уравнения',
    'Квадратные уравнения',
    'Рациональные уравнения',
    'Иррациональные уравнения',
    'Показательные уравнения',
    'Логарифмические уравнения',
    'Тригонометрические уравнения',
  ],
  7: [
    'Степенные выражения',
    'Рациональные выражения',
    'Иррациональные выражения',
    'Показательные выражения',
    'Логарифмические выражения',
    'Тригонометрические выражения',
  ],
  8: ['Физический смысл производной', 'Геометрический смысл производной', 'Первообразная'],
  9: [
    'Линейные уравнения',
    'Квадратные уравнения',
    'Рациональные уравнения',
    'Иррациональные уравнения',
    'Показательные уравнения',
    'Логарифмические уравнения',
    'Тригонометрические уравнения',
  ],
  10: ['Задачи на движение', 'Задачи на работу', 'Смеси и сплавы', 'Проценты'],
  11: [
    'Линейные функции',
    'Квадратичные функции',
    'Рациональные функции',
    'Показательные функции',
    'Логарифмические функции',
    'Тригонометрические функции',
  ],
  12: [
    'Производная полинома',
    'Производная произведения',
    'Производная дроби',
    'Экстремумы показательных функций',
    'Экстремумы логарифмических функций',
    'Экстремумы тригонометрических функций',
  ],
  13: [
    'Тригонометрические уравнения',
    'Показательные уравнения',
    'Логарифмические уравнения',
    'Смешанные уравнения',
    'Отбор корней',
  ],
  14: [
    'Сечения многогранников',
    'Углы в пространстве',
    'Расстояния в пространстве',
    'Объёмы многогранников и круглых тел',
    'Площади поверхностей',
    'Геометрические доказательства в стереометрии',
  ],
  15: [
    'Рациональные неравенства',
    'Показательные неравенства',
    'Логарифмические неравенства',
    'Неравенства с модулем',
    'Системы неравенств',
    'Метод интервалов',
    'Метод рационализации',
  ],
  16: [
    'Кредиты: аннуитетные платежи',
    'Кредиты: дифференцированные платежи',
    'Смешанные схемы кредитования',
    'Вклады и ценные бумаги',
    'Задачи на оптимизацию',
  ],
  17: [
    'Треугольники',
    'Четырёхугольники',
    'Окружности и их элементы',
    'Комбинации фигур (вписанные и описанные)',
    'Метод площадей',
    'Вспомогательная окружность',
    'Геометрические доказательства в планиметрии',
  ],
  18: [
    'Графический метод',
    'Аналитический метод',
    'Использование свойств функций',
    'Расположение корней квадратного трёхчлена',
    'Системы уравнений и неравенств с параметром',
  ],
  19: [
    'Свойства целых чисел',
    'Признаки делимости и остатки',
    'Последовательности и прогрессии',
    'Уравнения в целых числах (Диофантовы уравнения)',
    'Оценка и пример',
    'Сюжетные логические задачи',
  ],
};

export const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  EASY: 'Лёгкая',
  MEDIUM: 'Средняя',
  HARD: 'Сложная',
};

export const DIFFICULTY_COLORS: Record<TaskDifficulty, string> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

// ===== ДОМАШНИЕ ЗАДАНИЯ =====
export interface Question {
  id: string;
  content: string;
  answer?: string;
  solution?: string;
  difficulty: TaskDifficulty;
  egeNumber?: number;
  topicName?: string;
}

export interface Assignment {
  id: string;
  title: string;
  deadline?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
  completedCount: number;
  totalCount: number;
}

export interface Homework {
  id: string;
  teacherId: string;
  groupId: string;
  groupName: string;
  title: string;
  description?: string;
  deadline: string;
  tasks: Task[];
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
  completedCount: number;
  totalCount: number;
}

// ===== СТАТИСТИКА =====
export interface StudentProgress {
  studentId: string;
  studentName: string;
  topicId: string;
  topicName: string;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  lastAttempt: string;
}

export interface ProgressStats {
  totalTasks: number;
  completedTasks: number;
  correctAnswers: number;
  averageTime: number;
  weeklyProgress: WeeklyProgress[];
  topicStats: TopicStat[];
}

export interface WeeklyProgress {
  date: string;
  solved: number;
  correct: number;
}

export interface TopicStat {
  topicId: string;
  topicName: string;
  egeNumber: number;
  totalAttempts: number;
  successRate: number;
  status: 'WEAK' | 'NORMAL' | 'STRONG';
}

// ===== AI =====
export interface AIRecommendation {
  id: string;
  studentId?: string;
  type: 'FOCUS_TOPIC' | 'REVIEW' | 'PRACTICE' | 'TAKE_BREAK';
  title: string;
  description: string;
  topicId?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt?: string;
}

export interface AIAnalysis {
  id: string;
  imageUrl: string;
  recognizedText: string;
  errors: AnalysisError[];
  recommendations: string[];
  score: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface AnalysisError {
  type: 'CALCULATION' | 'CONCEPT' | 'LOGIC' | 'NOTATION';
  description: string;
  location?: string;
}

// ===== АВТОРИЗАЦИЯ =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  grade?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
