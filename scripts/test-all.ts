async function test() {
  // Test 1: Does /login render?
  const res = await fetch('http://localhost:3000/login');
  const html = await res.text();
  
  console.log('=== LOGIN PAGE TEST ===');
  console.log('Status:', res.status);
  console.log('Has Portal Login text:', html.includes('Portal Login'));
  console.log('Has email input:', html.includes('type="email"'));
  console.log('Has password input:', html.includes('type="password"'));
  console.log('Has Log In button:', html.includes('Log In'));
  
  // Test 2: Does landing page have working links?
  const landingRes = await fetch('http://localhost:3000');
  const landingHtml = await landingRes.text();
  
  console.log('\n=== LANDING PAGE TEST ===');
  console.log('Status:', landingRes.status);
  console.log('Has href="/login":', landingHtml.includes('href="/login"'));
  console.log('Has Sign In text:', landingHtml.includes('Sign In'));
  
  // Test 3: Try actual login
  console.log('\n=== LOGIN API TEST ===');
  
  // First get the Supabase URL from env
  const loginRes = await fetch('https://watyfgympouiyvfauorv.supabase.co/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdHlmZ3ltcG91aXl2ZmF1b3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzUwMDksImV4cCI6MjEwMTM1MTAwOX0.Q4OH5Fi6YwuLM283wxViBMCrL9IzuCIyPHU8qiZYWng'
    },
    body: JSON.stringify({ email: 'student1@imed.edu', password: 'password123' })
  });
  
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  if (loginData.access_token) {
    console.log('LOGIN WORKS! Got access token');
    console.log('User role:', loginData.user?.user_metadata?.role);
  } else {
    console.log('LOGIN FAILED:', loginData.error_description || loginData.msg || JSON.stringify(loginData));
  }
  
  // Test 4: Check all student feature pages
  console.log('\n=== ALL FEATURE ROUTES ===');
  const routes = [
    '/student', '/student/analyze', '/student/aptitude', '/student/technical-skills',
    '/student/interview', '/student/psychometric', '/student/resume-builder',
    '/student/leaderboard', '/student/soft-skills-analyzer', '/student/history',
    '/student/job-matches', '/student/referrals',
    '/admin', '/admin/jobs', '/admin/drives', '/admin/students',
    '/alumni'
  ];
  for (const r of routes) {
    const resp = await fetch('http://localhost:3000' + r);
    const status = resp.status;
    const marker = status === 200 ? '✅' : '❌';
    console.log(`  ${marker} ${status} ${r}`);
  }
}

test().catch(e => console.error('Error:', e.message));
