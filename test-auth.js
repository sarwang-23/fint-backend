const BASE_URL = 'http://localhost:3000/api/v1';

let passed = 0;
let failed = 0;
let tokens = {};

const TEST_EMAIL = `authtest_${Date.now()}@fint.com`;
const TEST_PASSWORD = 'Password@123';
const TEST_NAME = 'Auth Tester';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function pass(label) {
  console.log(`  ✅ PASS — ${label}`);
  passed++;
}

function fail(label, detail) {
  console.log(`  ❌ FAIL — ${label}`);
  if (detail) console.log(`          └─ ${JSON.stringify(detail)}`);
  failed++;
}

function section(title) {
  console.log(`\n┌─────────────────────────────────────────┐`);
  console.log(`│  ${title.padEnd(39)}│`);
  console.log(`└─────────────────────────────────────────┘`);
}

async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║        FINT Auth — Full Test Suite            ║');
  console.log(`║  Email: ${TEST_EMAIL.slice(0, 38).padEnd(38)}║`);
  console.log('╚═══════════════════════════════════════════════╝\n');

  // ────────────────────────────────────────────
  section('1. SIGNUP — Happy Path');
  // ────────────────────────────────────────────

  const signup = await req('POST', '/auth/signup', {
    name: TEST_NAME,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (signup.status === 201 && signup.data?.userId) {
    pass(`Signup with valid data → 201`);
    tokens.userId = signup.data.userId;
  } else {
    fail(`Signup with valid data → expected 201, got ${signup.status}`, signup.data);
  }

  // ────────────────────────────────────────────
  section('2. SIGNUP — Validation & Edge Cases');
  // ────────────────────────────────────────────

  // Duplicate email
  const dup = await req('POST', '/auth/signup', { name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD });
  if (dup.status === 409) pass('Duplicate email → 409 Conflict');
  else fail('Duplicate email should be 409', dup.data);

  // Weak password
  const weakPw = await req('POST', '/auth/signup', { name: 'X', email: `weak_${Date.now()}@fint.com`, password: '12345' });
  if (weakPw.status === 400) pass('Weak password → 400 Bad Request');
  else fail('Weak password should be 400', weakPw.data);

  // Missing name
  const noName = await req('POST', '/auth/signup', { email: `noname_${Date.now()}@fint.com`, password: TEST_PASSWORD });
  if (noName.status === 400) pass('Missing name → 400 Bad Request');
  else fail('Missing name should be 400', noName.data);

  // Missing email
  const noEmail = await req('POST', '/auth/signup', { name: 'X', password: TEST_PASSWORD });
  if (noEmail.status === 400) pass('Missing email → 400 Bad Request');
  else fail('Missing email should be 400', noEmail.data);

  // Invalid email format
  const badEmail = await req('POST', '/auth/signup', { name: 'X', email: 'not-an-email', password: TEST_PASSWORD });
  if (badEmail.status === 400) pass('Invalid email format → 400 Bad Request');
  else fail('Invalid email should be 400', badEmail.data);

  // ────────────────────────────────────────────
  section('3. LOGIN — Happy Path');
  // ────────────────────────────────────────────

  const login = await req('POST', '/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD });
  if (login.status === 200 && login.data?.accessToken && login.data?.refreshToken) {
    pass('Login with valid credentials → 200 + tokens');
    tokens.access = login.data.accessToken;
    tokens.refresh = login.data.refreshToken;
    const user = login.data.user;
    if (user?.id && user?.email === TEST_EMAIL && user?.name === TEST_NAME) {
      pass('Login response user object is correct');
    } else {
      fail('User object in login response incorrect', user);
    }
  } else {
    fail(`Login → expected 200, got ${login.status}`, login.data);
  }

  // ────────────────────────────────────────────
  section('4. LOGIN — Edge Cases');
  // ────────────────────────────────────────────

  const badPw = await req('POST', '/auth/login', { email: TEST_EMAIL, password: 'WrongPass@99' });
  if (badPw.status === 401) pass('Wrong password → 401 Unauthorized');
  else fail('Wrong password should be 401', badPw.data);

  const noUser = await req('POST', '/auth/login', { email: 'ghost@fint.com', password: TEST_PASSWORD });
  if (noUser.status === 401) pass('Non-existent user → 401 Unauthorized');
  else fail('Non-existent user should be 401', noUser.data);

  // ────────────────────────────────────────────
  section('5. PROTECTED ROUTE — GET Profile');
  // ────────────────────────────────────────────

  const profile = await req('GET', '/auth/profile', null, tokens.access);
  if (profile.status === 200 && profile.data?.email === TEST_EMAIL) {
    pass('GET /auth/profile with valid token → 200');
  } else {
    fail(`GET /auth/profile → expected 200, got ${profile.status}`, profile.data);
  }

  const noToken = await req('GET', '/auth/profile', null, null);
  if (noToken.status === 401) pass('GET /auth/profile without token → 401');
  else fail('Missing token should be 401', noToken.data);

  const badToken = await req('GET', '/auth/profile', null, 'invalid.jwt.token');
  if (badToken.status === 401) pass('GET /auth/profile with bad token → 401');
  else fail('Bad token should be 401', badToken.data);

  // ────────────────────────────────────────────
  section('6. REFRESH TOKEN');
  // ────────────────────────────────────────────

  const refreshed = await req('POST', '/auth/refresh', { refreshToken: tokens.refresh });
  if (refreshed.status === 200 && refreshed.data?.accessToken && refreshed.data?.refreshToken) {
    pass('Refresh token → 200 + new tokens');
    tokens.access = refreshed.data.accessToken;
    tokens.refresh = refreshed.data.refreshToken;
  } else {
    fail(`Refresh → expected 200, got ${refreshed.status}`, refreshed.data);
  }

  const badRefresh = await req('POST', '/auth/refresh', { refreshToken: 'bad-token-xyz' });
  if (badRefresh.status === 401) pass('Invalid refresh token → 401');
  else fail('Bad refresh token should be 401', badRefresh.data);

  // ────────────────────────────────────────────
  section('7. FORGOT PASSWORD');
  // ────────────────────────────────────────────

  const forgot = await req('POST', '/auth/forgot-password', { email: TEST_EMAIL });
  if (forgot.status === 200 && forgot.data?.message) {
    pass('Forgot password with known email → 200');
  } else {
    fail(`Forgot password → expected 200, got ${forgot.status}`, forgot.data);
  }

  // Security: should not reveal if email exists or not
  const forgotUnknown = await req('POST', '/auth/forgot-password', { email: 'nobody@fint.com' });
  if (forgotUnknown.status === 200) {
    pass('Forgot password with unknown email → 200 (no user enumeration)');
  } else {
    fail('Forgot unknown email should still return 200', forgotUnknown.data);
  }

  // ────────────────────────────────────────────
  section('8. LOGOUT');
  // ────────────────────────────────────────────

  const logout = await req('POST', '/auth/logout', null, tokens.access);
  if (logout.status === 200 && logout.data?.message?.includes('Logged out')) {
    pass('Logout with valid token → 200');
  } else {
    fail(`Logout → expected 200, got ${logout.status}`, logout.data);
  }

  // After logout, refresh token should be invalidated
  const postLogoutRefresh = await req('POST', '/auth/refresh', { refreshToken: tokens.refresh });
  if (postLogoutRefresh.status === 401) {
    pass('Refresh after logout → 401 (token invalidated)');
  } else {
    fail('Refresh after logout should be 401', postLogoutRefresh.data);
  }

  // ────────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║              TEST SUMMARY                     ║');
  console.log('╠═══════════════════════════════════════════════╣');
  console.log(`║  Total:   ${String(total).padEnd(36)}║`);
  console.log(`║  Passed:  ${String(passed).padEnd(36)}║`);
  console.log(`║  Failed:  ${String(failed).padEnd(36)}║`);
  console.log(`║  Status:  ${(failed === 0 ? '🎉 ALL PASSED' : `⚠️  ${failed} FAILURE(S)`).padEnd(36)}║`);
  console.log('╚═══════════════════════════════════════════════╝\n');
}

runTests().catch(console.error);
