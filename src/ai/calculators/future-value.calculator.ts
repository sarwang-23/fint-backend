import { Injectable } from '@nestjs/common';

@Injectable()
export class FutureValueCalculator {
  // FV = P × (1+r)^n + SIP × [((1+r)^n)-1]/r × (1+r)
  calculate(currentInvestment: number, monthlySip: number, annualReturnRate: number, years: number): number {
    const r = annualReturnRate / 100 / 12; // Monthly return rate
    const n = years * 12; // Total months
    
    // Lump sum compounding
    const lumpSumFv = currentInvestment * Math.pow(1 + r, n);
    
    // SIP compounding
    let sipFv = 0;
    if (monthlySip > 0 && r > 0) {
      sipFv = monthlySip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    } else if (monthlySip > 0 && r === 0) {
      sipFv = monthlySip * n;
    }
    
    return Math.round(lumpSumFv + sipFv);
  }
}
