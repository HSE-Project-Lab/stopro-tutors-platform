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
  egeNumber: number;
  topic: string;
  difficulty: TaskDifficulty;
  content: string;
  solution?: string;
  answer: string;
  imageUrls?: string[];
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

// Каталог тем ЕГЭ по номерам заданий
export const EGE_TOPICS: Record<number, string[]> = {
  1: [
    'Целые числа и дроби',
    'Проценты и пропорции',
    'Единицы измерения',
    'Округление и оценка',
  ],
  2: [
    'Чтение графиков функций',
    'Графики производной',
    'Графики первообразной',
    'Диаграммы и таблицы',
  ],
  3: [
    'Треугольники',
    'Четырёхугольники',
    'Окружность и круг',
    'Площади фигур',
    'Координатная плоскость',
  ],
  4: [
    'Классическая вероятность',
    'Теоремы сложения и умножения',
    'Независимые события',
    'Противоположные события',
  ],
  5: [
    'Линейные уравнения',
    'Квадратные уравнения',
    'Рациональные уравнения',
    'Иррациональные уравнения',
    'Показательные уравнения',
    'Логарифмические уравнения',
  ],
  6: [
    'Призма',
    'Пирамида',
    'Цилиндр',
    'Конус',
    'Шар и сфера',
    'Комбинации тел',
  ],
  7: [
    'Физический смысл производной',
    'Геометрический смысл производной',
    'Касательная к графику',
    'Монотонность и экстремумы',
    'Исследование функции',
  ],
  8: [
    'Задачи на движение',
    'Задачи на работу',
    'Задачи на смеси и сплавы',
    'Задачи на проценты',
    'Задачи на прогрессии',
  ],
  9: [
    'Тригонометрические преобразования',
    'Логарифмические преобразования',
    'Степенные выражения',
    'Рациональные преобразования',
  ],
  10: [
    'Наибольшее значение функции',
    'Наименьшее значение функции',
    'Оптимизация на отрезке',
    'Применение производной',
  ],
  11: [
    'Формула Бернулли',
    'Условная вероятность',
    'Формула полной вероятности',
    'Математическое ожидание',
    'Дисперсия и отклонение',
  ],
  12: [
    'Тригонометрические уравнения',
    'Показательные уравнения с отбором',
    'Логарифмические уравнения с отбором',
    'Комбинированные уравнения',
    'Отбор корней',
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