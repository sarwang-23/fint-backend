// Central definition of the FINT Score engine's weighting model.
// Source of truth: Phase 4 — FINT Score & AI Engine SRS document.
// Keeping this here (instead of inline in calculation.service.ts) means the
// weights can be tuned/audited in one place without touching calculation logic.

export const PILLAR_WEIGHTS = {
  INCOME_STABILITY: 10,
  CASH_FLOW: 15,
  DEBT_HEALTH: 15,
  CREDIT_HEALTH: 15,
  SAVINGS: 10,
  EMERGENCY_FUND: 10,
  INSURANCE: 10,
  INVESTMENTS: 5,
  RETIREMENT_READINESS: 5,
  FINANCIAL_BEHAVIOUR: 5,
} as const;

// Sanity check note: weights must sum to 100. Enforced at runtime in
// calculation.service.ts (throws on module init if this ever drifts).

export const SCORE_GRADE_THRESHOLDS = [
  { min: 900, grade: 'A_PLUS' as const, status: 'Wealth Ready' },
  { min: 800, grade: 'A' as const, status: 'Financially Healthy' },
  { min: 700, grade: 'B' as const, status: 'Stable' },
  { min: 600, grade: 'C' as const, status: 'Needs Attention' },
  { min: 500, grade: 'D' as const, status: 'Financially Vulnerable' },
  { min: 0, grade: 'E' as const, status: 'Financial Distress' },
];

export const RISK_THRESHOLDS = [
  { min: 850, risk: 'VERY_LOW' as const },
  { min: 700, risk: 'LOW' as const },
  { min: 550, risk: 'MEDIUM' as const },
  { min: 400, risk: 'HIGH' as const },
  { min: 0, risk: 'CRITICAL' as const },
];

// Pillars healthier than this don't get an improvement tip.
export const HEALTHY_PILLAR_THRESHOLD = 75;

// Emergency fund: months of expenses considered "fully funded" (Phase 4 doc: 6 months).
export const EMERGENCY_FUND_TARGET_MONTHS = 6;
