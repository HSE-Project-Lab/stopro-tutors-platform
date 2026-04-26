export interface GroupInsightDto {
  groupId: string;
  groupName: string;
  lessonRecommendation: string;
  onTrackStudentsCount: number;
  fallingBehindStudentsCount: number;
  studentsTotal: number;
}

export interface TaskHeatmapCell {
  taskNumber: number;
  successRate: number | null;
  attempts: number;
}

export interface StudentSkillPoint {
  subject: string;
  value: number;
  fullMark: number;
}

export interface StudentProgressPoint {
  monthLabel: string;
  predictedScore: number;
}

export interface WeakTopicPoint {
  taskNumber: number;
  topicName: string;
  successRate: number | null;
  practiceCount: number;
}

export interface StudentDisciplineStats {
  homeworkOnTimeRate: number;
  lastActiveAt: string;
}

export interface StudentAnalyticsDto {
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  targetScore: number;
  predictedEgeScore: number;
  heatmap: TaskHeatmapCell[];
  radarSkills: StudentSkillPoint[];
  weakTopics: WeakTopicPoint[];
  progressHistory: StudentProgressPoint[];
  discipline: StudentDisciplineStats;
}
