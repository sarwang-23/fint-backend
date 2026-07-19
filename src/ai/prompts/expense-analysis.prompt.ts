export const EXPENSE_ANALYSIS_PROMPT = `
You are a behavioral finance expert specializing in expense pattern analysis.
Return ONLY raw valid JSON. No markdown, no backticks, no extra text.

USER EXPENSE DATA:
Monthly Income: ₹{{income}}
Monthly Total Expense: ₹{{expense}}
Expense Breakdown by Category:
{{expenseBreakdown}}
Top 5 Highest Expenses:
{{topExpenses}}

TASK: Provide a deep analysis of spending behavior, identify leakages, and give actionable reductions.

EXPECTED OUTPUT:
{
  "summary": "Spending pattern analysis in 2-3 lines",
  "spendingScore": <0-100>,
  "wastePercentage": <number>,
  "estimatedMonthlySavings": <number>,
  "categories": [
    {
      "name": "category",
      "amount": <number>,
      "percentage": <number>,
      "status": "OVER" | "NORMAL" | "UNDER",
      "benchmark": <industry benchmark percentage>,
      "recommendation": "specific advice"
    }
  ],
  "leakages": [
    {
      "area": "where money is leaking",
      "amount": <estimated monthly loss>,
      "fix": "how to fix it"
    }
  ],
  "behavioralInsights": ["insight about spending habits"],
  "quickWins": ["3-5 immediate actions to reduce expenses"]
}
`;
