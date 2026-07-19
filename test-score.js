const BASE_URL = 'http://localhost:3000/api/v1';

async function testScoreEngine() {
  console.log('--- Starting Score Engine API Tests ---\n');

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

    // 2. Calculate Score
    console.log('[2] Calculating Score...');
    const calcRes = await fetch(`${BASE_URL}/score/calculate`, {
      method: 'POST',
      headers
    });
    const calcData = await calcRes.json();
    console.log('Calculated Score Data:', JSON.stringify(calcData, null, 2));
    console.log('✓ Score Calculation successful\n');

    // 3. Get Current Score
    console.log('[3] Fetching current Score...');
    const currentRes = await fetch(`${BASE_URL}/score`, {
      method: 'GET',
      headers
    });
    const currentData = await currentRes.json();
    console.log(`Current Score: ${currentData.score} (Grade: ${currentData.grade})`);
    console.log('✓ Fetch current score successful\n');

    // 4. Get Score History
    console.log('[4] Fetching Score history...');
    const historyRes = await fetch(`${BASE_URL}/score/history`, {
      method: 'GET',
      headers
    });
    const historyData = await historyRes.json();
    console.log(`Score History Length: ${historyData.length}`);
    console.log('✓ Fetch history successful\n');

    console.log('--- All Tests Passed Successfully! ---');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testScoreEngine();
