import { ScoreEngine } from './score.engine';
import { ScoreGrade, RiskLevel } from '@prisma/client';

describe('ScoreEngine', () => {
  let engine: ScoreEngine;

  beforeEach(() => {
    engine = new ScoreEngine();
  });

  const baseFinancialData = {
    incomes: [{ category: 'SALARY', amount: '100000' }],
    expenses: [{ amount: '30000' }],
    loans: [],
    assets: [],
    investments: [],
    insurances: [{ insuranceType: 'HEALTH' }, { insuranceType: 'LIFE' }],
    retirement: { monthlyContribution: '5000' },
    accounts: [{ currentBalance: '300000' }],
    goals: [{ id: '1' }],
  };

  describe('calculateScore()', () => {
    it('should return a score object with all required fields', () => {
      const result = engine.calculateScore(baseFinancialData);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('risk');
      expect(result).toHaveProperty('factors');
      expect(result.factors).toHaveLength(10);
    });

    it('should return a high score (A+ grade) for excellent financial health', () => {
      const result = engine.calculateScore(baseFinancialData);
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect([ScoreGrade.A_PLUS, ScoreGrade.A]).toContain(result.grade);
      expect([RiskLevel.VERY_LOW, RiskLevel.LOW]).toContain(result.risk);
    });

    it('should return a low score for poor financial data', () => {
      const poorData = {
        incomes: [],
        expenses: [{ amount: '50000' }],
        loans: [{ status: 'ACTIVE', emiAmount: '40000' }, { status: 'DEFAULTED', emiAmount: '10000' }],
        assets: [],
        investments: [],
        insurances: [],
        retirement: null,
        accounts: [{ currentBalance: '5000' }],
        goals: [],
      };
      const result = engine.calculateScore(poorData);
      expect(result.score).toBeLessThan(45);
      expect([ScoreGrade.D, ScoreGrade.E]).toContain(result.grade);
      expect(result.risk).toBe(RiskLevel.CRITICAL);
    });

    it('should correctly score Income Stability pillar', () => {
      const result = engine.calculateScore(baseFinancialData);
      const incomePillar = result.factors.find(f => f.pillar === 'Income Stability');
      expect(incomePillar).toBeDefined();
      expect(incomePillar!.score).toBe(100);
    });

    it('should give debt health score of 100 with no loans', () => {
      const result = engine.calculateScore({ ...baseFinancialData, loans: [] });
      const debtPillar = result.factors.find(f => f.pillar === 'Debt Health');
      expect(debtPillar!.score).toBe(100);
    });

    it('should penalize for DEFAULTED loans in Credit Health pillar', () => {
      const data = {
        ...baseFinancialData,
        loans: [{ status: 'DEFAULTED', emiAmount: '5000' }],
      };
      const result = engine.calculateScore(data);
      const creditPillar = result.factors.find(f => f.pillar === 'Credit Health');
      expect(creditPillar!.score).toBe(10);
    });

    it('should give full Insurance Coverage score for health + life insurance', () => {
      const result = engine.calculateScore(baseFinancialData);
      const insurancePillar = result.factors.find(f => f.pillar === 'Insurance Coverage');
      expect(insurancePillar!.score).toBe(100);
    });

    it('should give 0 insurance score with no policies', () => {
      const result = engine.calculateScore({ ...baseFinancialData, insurances: [] });
      const insurancePillar = result.factors.find(f => f.pillar === 'Insurance Coverage');
      expect(insurancePillar!.score).toBe(0);
    });

    it('should score Emergency Fund correctly (6+ months coverage = 100)', () => {
      // Account has 300000, expenses 30000 => 10 months of emergency coverage
      const result = engine.calculateScore(baseFinancialData);
      const emergencyPillar = result.factors.find(f => f.pillar === 'Emergency Fund');
      expect(emergencyPillar!.score).toBe(100);
    });

    it('should return a low score for empty financial data (no income, no savings)', () => {
      const emptyData = {
        incomes: [],
        expenses: [],
        loans: [],
        assets: [],
        investments: [],
        insurances: [],
        retirement: null,
        accounts: [],
        goals: [],
      };
      const result = engine.calculateScore(emptyData);
      // With no loans, credit+debt health default to 100 (30 pts combined).
      // All other pillars score 0. Total = 30.
      expect(result.score).toBe(30);
      expect([ScoreGrade.D, ScoreGrade.C]).toContain(result.grade);
    });
  });
});
