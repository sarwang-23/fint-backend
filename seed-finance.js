/**
 * seed-finance.js
 * Run: node seed-finance.js <userEmail>
 * Example: node seed-finance.js sarwangagarwal240@gmail.com
 *
 * Seeds realistic dummy finance data for a given user.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userEmail = process.argv[2];
if (!userEmail) {
  console.error('Usage: node seed-finance.js <userEmail>');
  process.exit(1);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  // 1. Find user
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    console.error(`User not found: ${userEmail}`);
    process.exit(1);
  }
  const userId = user.id;
  console.log(`✅ Found user: ${user.fullName || user.name || userEmail} (${userId})`);

  // 2. Financial Accounts
  const accounts = await Promise.all([
    prisma.financialAccount.create({ data: {
      userId, bankName: 'HDFC Bank', accountName: 'Savings Account',
      accountNumber: '50100234821', accountType: 'SAVINGS',
      currency: 'INR', openingBalance: 800000, currentBalance: 842000, status: 'ACTIVE'
    }}),
    prisma.financialAccount.create({ data: {
      userId, bankName: 'ICICI Bank', accountName: 'Salary Account',
      accountNumber: '00770734', accountType: 'SALARY',
      currency: 'INR', openingBalance: 290000, currentBalance: 315400, status: 'ACTIVE'
    }}),
    prisma.financialAccount.create({ data: {
      userId, bankName: 'HDFC Bank', accountName: 'Credit Card',
      accountNumber: '42292290', accountType: 'CREDIT',
      currency: 'INR', openingBalance: 0, currentBalance: -18600, status: 'ACTIVE'
    }}),
    prisma.financialAccount.create({ data: {
      userId, bankName: 'Paytm', accountName: 'Wallet',
      accountNumber: '9876543210', accountType: 'WALLET',
      currency: 'INR', openingBalance: 5000, currentBalance: 3200, status: 'ACTIVE'
    }}),
  ]);
  console.log(`✅ Created ${accounts.length} financial accounts`);

  // 3. Incomes
  await Promise.all([
    prisma.income.create({ data: {
      userId, title: 'Salary — TechCorp', source: 'SALARY', category: 'EMPLOYMENT',
      amount: 125000, frequency: 'MONTHLY', startDate: daysAgo(14),
    }}),
    prisma.income.create({ data: {
      userId, title: 'Freelance — Website Project', source: 'FREELANCE', category: 'BUSINESS',
      amount: 22000, frequency: 'ONE_TIME', startDate: daysAgo(10),
    }}),
    prisma.income.create({ data: {
      userId, title: 'Salary — TechCorp', source: 'SALARY', category: 'EMPLOYMENT',
      amount: 125000, frequency: 'MONTHLY', startDate: daysAgo(45),
    }}),
    prisma.income.create({ data: {
      userId, title: 'Interest — HDFC FD', source: 'INVESTMENT', category: 'INVESTMENT',
      amount: 4200, frequency: 'MONTHLY', startDate: daysAgo(5),
    }}),
  ]);
  console.log('✅ Created income records');

  // 4. Expenses
  const expenseData = [
    { title: 'Rent — House owner',    category: 'RENT',          amount: 24000, date: daysAgo(5),  paymentMethod: 'BANK_TRANSFER' },
    { title: 'Groceries — Big Bazaar',category: 'FOOD',          amount: 3200,  date: daysAgo(3),  paymentMethod: 'UPI' },
    { title: 'Swiggy — Dinner',       category: 'FOOD',          amount: 840,   date: daysAgo(2),  paymentMethod: 'UPI' },
    { title: 'HDFC Credit Card EMI',  category: 'EMI',           amount: 9500,  date: daysAgo(7),  paymentMethod: 'BANK_TRANSFER' },
    { title: 'Amazon — Headphones',   category: 'SHOPPING',      amount: 4999,  date: daysAgo(12), paymentMethod: 'CREDIT_CARD' },
    { title: 'Electricity Bill',      category: 'UTILITIES',     amount: 1850,  date: daysAgo(8),  paymentMethod: 'UPI' },
    { title: 'Petrol — HPCL',         category: 'TRANSPORT',     amount: 2200,  date: daysAgo(6),  paymentMethod: 'CARD' },
    { title: 'Netflix Subscription',  category: 'ENTERTAINMENT', amount: 649,   date: daysAgo(1),  paymentMethod: 'CARD' },
    { title: 'Doctor Visit — Apollo', category: 'HEALTH',        amount: 1500,  date: daysAgo(15), paymentMethod: 'CARD' },
    { title: 'Zomato — Lunch',        category: 'FOOD',          amount: 560,   date: daysAgo(4),  paymentMethod: 'UPI' },
    { title: 'Myntra — Clothes',      category: 'SHOPPING',      amount: 3199,  date: daysAgo(20), paymentMethod: 'CARD' },
    { title: 'Metro Recharge',        category: 'TRANSPORT',     amount: 500,   date: daysAgo(9),  paymentMethod: 'UPI' },
    { title: 'Internet — Airtel',     category: 'UTILITIES',     amount: 1199,  date: daysAgo(11), paymentMethod: 'UPI' },
    { title: 'Jio Recharge',          category: 'UTILITIES',     amount: 299,   date: daysAgo(13), paymentMethod: 'UPI' },
    { title: 'SIP — Zerodha',         category: 'INVESTMENT',    amount: 10000, date: daysAgo(3),  paymentMethod: 'BANK_TRANSFER' },
  ];
  await Promise.all(expenseData.map(e =>
    prisma.expense.create({ data: {
      userId, title: e.title, category: e.category,
      amount: e.amount, expenseDate: e.date,
      paymentMethod: e.paymentMethod,
    }})
  ));
  console.log(`✅ Created ${expenseData.length} expense records`);

  // 5. Investments
  const investments = [
    { name: 'Reliance Industries', investmentType: 'STOCKS', quantity: 25, buyPrice: 2450, currentPrice: 2810 },
    { name: 'HDFC Nifty 50 Index Fund', investmentType: 'MUTUAL_FUND', quantity: 100, buyPrice: 180, currentPrice: 210 },
    { name: 'Tata Consultancy Services', investmentType: 'STOCKS', quantity: 10, buyPrice: 3600, currentPrice: 3920 },
    { name: 'SBI Gold ETF', investmentType: 'ETF', quantity: 50, buyPrice: 580, currentPrice: 640 },
    { name: 'Zerodha Nifty Next 50', investmentType: 'MUTUAL_FUND', quantity: 80, buyPrice: 220, currentPrice: 245 },
  ];
  await Promise.all(investments.map(inv =>
    prisma.investment.create({ data: { userId, ...inv, broker: 'Zerodha', purchaseDate: daysAgo(120) } })
  ));
  console.log(`✅ Created ${investments.length} investment records`);

  // 6. Financial Goals
  await Promise.all([
    prisma.financialGoal.create({ data: {
      userId, title: 'Emergency Fund', goalType: 'EMERGENCY_FUND',
      targetAmount: 375000, currentAmount: 280000,
      deadline: new Date('2025-12-31'), priority: 1, status: 'IN_PROGRESS'
    }}),
    prisma.financialGoal.create({ data: {
      userId, title: 'Europe Trip 2026', goalType: 'TRAVEL',
      targetAmount: 200000, currentAmount: 82000,
      deadline: new Date('2026-06-30'), priority: 2, status: 'ON_TRACK'
    }}),
    prisma.financialGoal.create({ data: {
      userId, title: 'MacBook Pro', goalType: 'PURCHASE',
      targetAmount: 180000, currentAmount: 180000,
      deadline: new Date('2025-09-01'), priority: 3, status: 'COMPLETED'
    }}),
  ]);
  console.log('✅ Created financial goals');

  // 7. Assets
  await Promise.all([
    prisma.asset.create({ data: {
      userId, name: '2BHK Flat — Pune', assetType: 'REAL_ESTATE',
      purchaseValue: 4500000, currentValue: 5200000, purchaseDate: daysAgo(730)
    }}),
    prisma.asset.create({ data: {
      userId, name: 'Honda City 2022', assetType: 'VEHICLE',
      purchaseValue: 1200000, currentValue: 950000, purchaseDate: daysAgo(500)
    }}),
  ]);
  console.log('✅ Created assets');

  // 8. Loans
  await prisma.loan.create({ data: {
    userId, loanType: 'HOME_LOAN', lenderName: 'HDFC Bank',
    principalAmount: 3500000, interestRate: 8.5,
    emiAmount: 30000, remainingBalance: 3100000,
    startDate: daysAgo(730), nextEmiDate: daysAgo(-5), status: 'ACTIVE'
  }});
  console.log('✅ Created loan record');

  // 9. Calculate & save FINT Score
  try {
    const res = await fetch(`http://localhost:3000/api/v1/score/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // We can't easily get a token here, so just note this needs to be done via API
      }
    });
    console.log('ℹ️  Score calculation needs to be triggered via API after login');
  } catch {
    console.log('ℹ️  Score will auto-calculate on first dashboard load');
  }

  console.log('\n🎉 Seed complete! Open http://localhost:3001/finance to see the data.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
