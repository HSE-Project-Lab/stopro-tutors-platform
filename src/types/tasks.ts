export type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface TaskPrototype {
  id: string;
  egeNumber: number;
  difficulty: TaskDifficulty;
  title: string;
  topic: string;
  contentLatex: string;
  answer: string;
  solutionLatex: string;
  hint?: string;
}

export interface TaskVariation {
  id: string;
  prototypeId: string;
  egeNumber: number;
  title: string;
  contentLatex: string;
  answer: string;
  solutionLatex?: string;
  hint?: string;
}
