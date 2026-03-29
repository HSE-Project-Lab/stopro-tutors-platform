export const EGE_SCALE = [
  0, 5, 11, 17, 22, 27, 34, 40, 46, 52, 58, 64, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94,
  96, 98, 100, 100, 100, 100, 100, 100,
];

export const TASK_MAX_POINTS: Record<number, number> = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 1,
  6: 1,
  7: 1,
  8: 1,
  9: 1,
  10: 1,
  11: 1,
  12: 1,
  13: 2,
  14: 3,
  15: 2,
  16: 2,
  17: 3,
  18: 4,
  19: 4,
};

export interface StudentTopicProgress {
  egeNumber: number;
  successRate: number;
  totalAttempts: number;
}

export function predictEgeScore(progress: StudentTopicProgress[]): number {
  let expectedPrimaryScore = 0;

  for (let taskNumber = 1; taskNumber <= 19; taskNumber++) {
    const topicStat = progress.find((p) => p.egeNumber === taskNumber);
    const maxPoints = TASK_MAX_POINTS[taskNumber] || 0;

    if (!topicStat || topicStat.totalAttempts === 0) {
      continue;
    }

    let winProbability = topicStat.successRate / 100;

    if (topicStat.totalAttempts < 5) {
      const confidence = topicStat.totalAttempts / 5;
      winProbability = winProbability * confidence + 0.1 * (1 - confidence);
    }

    expectedPrimaryScore += winProbability * maxPoints;
  }

  const roundedPrimary = Math.round(expectedPrimaryScore);

  const safeIndex = Math.min(Math.max(roundedPrimary, 0), EGE_SCALE.length - 1);
  return EGE_SCALE[safeIndex];
}

export function getSmartRecommendations(progress: StudentTopicProgress[]): number[] {
  const currentScore = predictEgeScore(progress);

  const TIERS = {
    PART_1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    PART_2_BASE: [13, 15, 16],
    PART_2_HARD: [14, 17],
    PART_2_EXPERT: [18, 19],
  };

  let allowedTasks: number[] = [];

  if (currentScore < 70) {
    allowedTasks = [...TIERS.PART_1, 13];
  } else if (currentScore < 80) {
    allowedTasks = [...TIERS.PART_1, ...TIERS.PART_2_BASE];
  } else if (currentScore < 90) {
    allowedTasks = [...TIERS.PART_1, ...TIERS.PART_2_BASE, ...TIERS.PART_2_HARD, 18];
  } else {
    allowedTasks = [
      ...TIERS.PART_1,
      ...TIERS.PART_2_BASE,
      ...TIERS.PART_2_HARD,
      ...TIERS.PART_2_EXPERT,
    ];
  }

  const weakSpots = progress.filter(
    (p) => allowedTasks.includes(p.egeNumber) && (p.successRate < 85 || p.totalAttempts < 3)
  );

  weakSpots.sort((a, b) => a.egeNumber - b.egeNumber);

  if (weakSpots.length === 0) {
    const nextLevelTasks = allowedTasks
      .filter((task) => !progress.some((p) => p.egeNumber === task && p.successRate > 80))
      .sort((a, b) => a - b);

    return nextLevelTasks.slice(0, 3);
  }

  return weakSpots.map((p) => p.egeNumber).slice(0, 3);
}

export function calculateConfidenceInterval(
  progress: StudentTopicProgress[],
  predictedScore: number
): { low: number; high: number; width: number; confidenceLabel: 'LOW' | 'MEDIUM' | 'HIGH' } {
  const totalAttempts = progress.reduce((sum, item) => sum + Math.max(item.totalAttempts, 0), 0);
  const coveredTasks = progress.filter((item) => item.totalAttempts > 0).length;
  const coverageRatio = coveredTasks / 19;

  const width = Math.max(
    4,
    Math.min(18, Math.round(18 - Math.min(totalAttempts, 120) / 10 - coverageRatio * 6))
  );

  const low = Math.max(0, predictedScore - width);
  const high = Math.min(100, predictedScore + width);

  const confidenceLabel: 'LOW' | 'MEDIUM' | 'HIGH' =
    width <= 6 ? 'HIGH' : width <= 11 ? 'MEDIUM' : 'LOW';

  return { low, high, width, confidenceLabel };
}

export function buildScoreExplanation(
  progress: StudentTopicProgress[],
  predictedScore: number,
  targetScore: number
): { message: string; weakTaskNumber: number | null; weakTaskGap: number } {
  const recommendations = getSmartRecommendations(progress);
  const weakTaskNumber = recommendations.length > 0 ? recommendations[0] : null;
  const gap = Math.max(0, targetScore - predictedScore);

  if (!weakTaskNumber) {
    return {
      message: 'Недостаточно данных для объяснения прогноза. Реши больше задач по разным номерам.',
      weakTaskNumber: null,
      weakTaskGap: gap,
    };
  }

  return {
    message:
      gap > 0
        ? `Чтобы получить ${targetScore}+, начни с задания №${weakTaskNumber}. Сейчас это оптимальная зона роста.`
        : `Текущий прогноз уже на уровне ${predictedScore}. Для закрепления продолжай практику с №${weakTaskNumber}.`,
    weakTaskNumber,
    weakTaskGap: gap,
  };
}
