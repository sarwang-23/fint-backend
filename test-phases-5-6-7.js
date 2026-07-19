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

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  FINT Phases 5, 6, 7 — Integration Tests (Dashboard)   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // 1. Login
  console.log('[1] Login...');
  const login = await req('POST', '/auth/login', null, { email: 'test@fint.com', password: 'Password@123' });
  if (!login.data.accessToken) { console.error('❌ Login failed:', login.data); return; }
  const token = login.data.accessToken;
  console.log('✅ Logged in\n');

  // 2. Test Analytics Dashboard (Phase 5)
  console.log('[2] Testing Analytics Dashboard...');
  const dashboard = await req('GET', '/analytics/dashboard?range=6M', token);
  if (dashboard.status === 200) {
    console.log('  ✅ Dashboard Data Fetched Successfully!');
    console.log(`     Cash Flow: ₹${dashboard.data.data.summary.cashFlow}`);
    console.log(`     Net Worth: ₹${dashboard.data.data.summary.netWorth}`);
    console.log(`     Goals Tracked: ${dashboard.data.data.goals.length}`);
    console.log(`     Charts Ready: ${Object.keys(dashboard.data.data.charts).join(', ')}`);
  } else {
    console.log('  ❌ Dashboard failed:', dashboard.status, dashboard.data);
  }

  // 3. Test Notifications (Phase 7)
  console.log('\n[3] Testing Notifications & Events...');
  const notifs = await req('GET', '/notifications', token);
  if (notifs.status === 200) {
    console.log(`  ✅ Notifications Fetched: ${notifs.data.data.length} found`);
    
    const readAll = await req('PATCH', '/notifications/read-all', token);
    console.log(`  ✅ Mark All as Read: ${readAll.status === 200 ? 'Success' : 'Failed'}`);
  } else {
    console.log('  ❌ Notifications failed:', notifs.status, notifs.data);
  }

  // 4. Test Report Generation (Phase 6)
  // We'll test it via the regular fetch and check headers since it returns a buffer
  console.log('\n[4] Testing Report Generation Downloads...');
  const reportFormats = ['CSV', 'EXCEL', 'PDF'];
  for (const format of reportFormats) {
    try {
      const res = await fetch(`${BASE_URL}/reports/download?type=monthly&format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 200) {
        const ct = res.headers.get('content-type');
        const cd = res.headers.get('content-disposition');
        console.log(`  ✅ ${format} Report Generated!`);
        console.log(`     Type: ${ct}`);
        console.log(`     File: ${cd}`);
      } else {
        console.log(`  ❌ ${format} Report Failed: HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`  ❌ ${format} Report Exception:`, e.message);
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                  Test Run Complete ✅                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
}

runTests().catch(console.error);
