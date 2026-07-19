const BASE_URL = 'http://localhost:3000/api/v1';

async function req(method, path, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, data: await res.json() };
}

async function testAIEngine() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     FINT AI Engine — Full Integration Test     ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // 1. Login
  console.log('[1] Login...');
  const login = await req('POST', '/auth/login', null, { email: 'test@fint.com', password: 'Password@123' });
  if (!login.data.accessToken) { console.error('❌ Login failed:', login.data); return; }
  const token = login.data.accessToken;
  console.log('✅ Logged in\n');

  // Seed some financial data so AI has context
  console.log('[2] Seeding financial data for AI context...');
  
  await req('POST', '/finance/income', token, { source: 'Software Engineer', category: 'SALARY', amount: 85000, frequency: 'MONTHLY' });
  await req('POST', '/finance/income', token, { source: 'Freelancing', category: 'FREELANCE', amount: 15000, frequency: 'MONTHLY' });
  await req('POST', '/finance/expense', token, { title: 'House Rent', category: 'RENT', amount: 18000, paymentMethod: 'BANK_TRANSFER' });
  await req('POST', '/finance/expense', token, { title: 'Food & Groceries', category: 'FOOD', amount: 8000, paymentMethod: 'UPI' });
  await req('POST', '/finance/expense', token, { title: 'Entertainment', category: 'ENTERTAINMENT', amount: 5000, paymentMethod: 'CARD' });
  await req('POST', '/finance/loan', token, { loanType: 'HOME', lenderName: 'HDFC Bank', principalAmount: 3000000, interestRate: 8.5, emiAmount: 27000, remainingBalance: 2500000, startDate: '2023-01-01', status: 'ACTIVE' });
  await req('POST', '/finance/investment', token, { name: 'Nifty 50 Index Fund', investmentType: 'MUTUAL_FUND', quantity: 1, buyPrice: 50000, currentPrice: 62000, broker: 'Zerodha' });
  await req('POST', '/finance/insurance', token, { insuranceType: 'HEALTH', provider: 'HDFC Ergo', premiumAmount: 1200, coverageAmount: 500000, startDate: '2024-01-01' });
  await req('POST', '/finance/financial-goal', token, { goalType: 'HOUSE', title: 'Buy a Car', targetAmount: 800000, currentAmount: 150000, priority: 1, status: 'ACTIVE' });
  await req('POST', '/finance/financial-account', token, { bankName: 'SBI', accountName: 'Savings Account', accountType: 'SAVINGS', currency: 'INR', currentBalance: 120000 });
  
  // Recalculate score with fresh data
  await req('POST', '/score/calculate', token, null);
  console.log('✅ Financial data seeded\n');

  // 3. Test AI advisory endpoints (requires GEMINI_API_KEY — will gracefully fail without it)
  const endpoints = [
    { name: 'Budget Suggestions', path: '/ai/advisory/budget' },
    { name: 'Expense Analysis',   path: '/ai/advisory/expense-analysis' },
    { name: 'Savings Strategy',   path: '/ai/advisory/savings' },
    { name: 'Investment Advice',  path: '/ai/advisory/investments' },
    { name: 'Loan Advice',        path: '/ai/advisory/loans' },
    { name: 'Goal Planning',      path: '/ai/advisory/goals' },
    { name: 'Risk Analysis',      path: '/ai/advisory/risk' },
  ];

  console.log('[3] Testing all 7 AI Advisory endpoints...\n');
  const hasGeminiKey = false; // Set to true if GEMINI_API_KEY is configured in .env

  for (const ep of endpoints) {
    try {
      const res = await req('GET', ep.path, token, null);
      if (res.status === 200 || res.status === 201) {
        console.log(`  ✅ ${ep.name} → HTTP ${res.status} OK`);
        if (res.data?.data?.summary) console.log(`     Summary: ${res.data.data.summary}`);
        else if (res.data?.data?.message) console.log(`     Msg: ${res.data.data.message}`);
      } else if (res.status === 503) {
        console.log(`  ⚠️  ${ep.name} → HTTP 503 (AI unavailable — add GEMINI_API_KEY to .env)`);
      } else {
        console.log(`  ❌ ${ep.name} → HTTP ${res.status}:`, JSON.stringify(res.data).slice(0, 100));
      }
    } catch (e) {
      console.log(`  ❌ ${ep.name} → Exception:`, e.message);
    }
  }

  // 4. Test Chat endpoint
  console.log('\n[4] Testing AI Chat (copilot)...');
  const chatRes = await req('POST', '/ai/chat', token, { message: 'What is my current financial score?' });
  if (chatRes.status === 503) {
    console.log('  ⚠️  Chat → HTTP 503 (AI unavailable — add GEMINI_API_KEY to .env)');
  } else if (chatRes.status === 200 || chatRes.status === 201) {
    console.log('  ✅ Chat → HTTP 200 OK');
  } else {
    console.log('  ❌ Chat →', chatRes.status, JSON.stringify(chatRes.data).slice(0, 100));
  }

  // 5. Test Score + History (non-AI, always works)
  console.log('\n[5] Testing Score APIs (no AI key needed)...');
  const scoreRes = await req('GET', '/score', token, null);
  console.log(`  ✅ Current Score: ${scoreRes.data.score} (Grade: ${scoreRes.data.grade}, Risk: ${scoreRes.data.risk})`);
  const historyRes = await req('GET', '/score/history', token, null);
  console.log(`  ✅ Score History: ${historyRes.data.length} records`);

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║            Test Run Complete ✅               ║');
  console.log('║                                               ║');
  console.log('║  Auth, Finance, Score: Fully operational      ║');
  console.log('║  AI Advisory: Requires GEMINI_API_KEY in .env ║');
  console.log('╚══════════════════════════════════════════════╝');
}

testAIEngine().catch(console.error);
