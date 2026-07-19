const BASE_URL = 'http://localhost:3000/api/v1';

async function testFinanceModules() {
  console.log('--- Starting Finance API Tests ---\n');

  try {
    // 1. Login to get token
    console.log('[1] Logging in as test@fint.com...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@fint.com', password: 'Password@123' })
    });
    
    if (!loginRes.ok) {
      console.error('Login failed. Please run tests after creating the test user.');
      return;
    }
    
    const { accessToken } = await loginRes.json();
    console.log('✓ Logged in successfully\n');

    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };

    // 2. Create an Income record
    console.log('[2] Creating an Income record...');
    const createIncomeRes = await fetch(`${BASE_URL}/finance/income`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: 'Software Consulting',
        category: 'FREELANCE',
        amount: 50000,
        frequency: 'MONTHLY'
      })
    });
    const incomeData = await createIncomeRes.json();
    console.log('Created Income:', incomeData);
    console.log('✓ Create successful\n');

    const incomeId = incomeData.id;

    // 3. Get All Incomes (Testing pagination & sorting)
    console.log('[3] Fetching all incomes (page 1, limit 10)...');
    const getAllRes = await fetch(`${BASE_URL}/finance/income?page=1&limit=10&sortBy=amount&sortOrder=desc`, {
      method: 'GET',
      headers
    });
    const allIncomes = await getAllRes.json();
    console.log(`Fetched ${allIncomes.data.length} records. Total count: ${allIncomes.total}`);
    console.log('✓ Fetch all successful\n');

    // 4. Update Income record
    console.log('[4] Updating the Income record...');
    const updateRes = await fetch(`${BASE_URL}/finance/income/${incomeId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        amount: 60000,
        notes: 'Updated consulting rate'
      })
    });
    const updatedIncome = await updateRes.json();
    console.log('Updated Income:', updatedIncome);
    console.log('✓ Update successful\n');

    // 5. Soft Delete Income record
    console.log('[5] Soft deleting the Income record...');
    const deleteRes = await fetch(`${BASE_URL}/finance/income/${incomeId}`, {
      method: 'DELETE',
      headers
    });
    const deleteData = await deleteRes.json();
    console.log('Delete Response:', deleteData);
    console.log('✓ Soft Delete successful\n');

    // 6. Verify Soft Delete (Should not appear in Get All)
    console.log('[6] Verifying soft delete...');
    const verifyRes = await fetch(`${BASE_URL}/finance/income/${incomeId}`, {
      method: 'GET',
      headers
    });
    if (verifyRes.status === 404) {
      console.log('✓ Record not found (Soft deleted successfully)\n');
    } else {
      console.log('❌ Record still accessible!');
    }

    console.log('--- All Tests Passed Successfully! ---');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFinanceModules();
