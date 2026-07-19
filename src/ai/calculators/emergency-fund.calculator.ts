import { Injectable } from '@nestjs/common';

@Injectable()
export class EmergencyFundCalculator {
  calculate(monthlyExpense: number, months: number = 6): number {
    return monthlyExpense * months;
  }
}
