// Response shape returned by the Score API. Not a Prisma model — Prisma
// already generates the DB-level types (ScoreHistory, ScoreFactor); this is
// the shape ScoreService assembles for API consumers (score + factors +
// human-readable tips together in one payload).

export class ScoreFactorEntity {
  pillar: string;
  weight: number;
  score: number;
  remarks: string | null;
}

export class ScoreHistoryEntity {
  id: string;
  userId: string;
  score: number;
  grade: string;
  risk: string;
  calculatedAt: Date;
  factors: ScoreFactorEntity[];
  recommendations?: string[];
}
