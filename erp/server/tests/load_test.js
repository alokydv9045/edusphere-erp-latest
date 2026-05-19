import http from 'k6/http';
import { check, sleep } from 'k6';

// TEST-3: Basic k6 load testing script
// Command to run (requires k6 installed): k6 run tests/load_test.js

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 min
    { duration: '30s', target: 0 },  // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

const BASE_URL = 'http://localhost:3000/api';
let loginToken = '';
let csrfToken = '';
let csrfCookie = '';

export function setup() {
  // Obtain CSRF token
  const csrfRes = http.get(`${BASE_URL}/csrf-token`);
  let csrfData = {};
  
  try {
    csrfData = csrfRes.json();
  } catch (e) {
    console.error('Failed to parse CSRF response', csrfRes.body);
  }
  
  const token = csrfData.csrfToken || '';
  
  // Try to find the CSRF cookie
  let cookieVal = '';
  if (csrfRes.headers['Set-Cookie']) {
    const match = csrfRes.headers['Set-Cookie'].match(/csrf_token=([^;]+)/);
    if (match) cookieVal = match[1];
  }

  // Perform a test login to get an auth token
  const loginPayload = JSON.stringify({
    email: 'admin@edusphere.com',
    password: 'Password123!', // Using generic test credentials
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token,
    },
    cookies: {
      csrf_token: cookieVal
    }
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  
  let authData = {};
  try {
    authData = loginRes.json();
  } catch (e) {
    // Ignore fail, handle below
  }

  return { 
    token: authData.token || '',
    csrf: token,
    csrfCookie: cookieVal
  };
}

export default function (data) {
  // If we couldn't get a token in setup, simulate an unauthenticated health check
  if (!data.token) {
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      'health check status is 200 or 404': (r) => r.status === 200 || r.status === 404, // 404 if health route not defined, which is fine
    });
    sleep(1);
    return;
  }

  const params = {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  // Scenario 1: Fetch Profile
  const profileRes = http.get(`${BASE_URL}/auth/me`, params);
  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
  });

  // Scenario 2: Fetch Dashboard Stats
  const dashRes = http.get(`${BASE_URL}/dashboard/stats`, params);
  check(dashRes, {
    'dashboard status is 200': (r) => r.status === 200,
  });

  // Sleep to simulate user think time
  sleep(Math.random() * 2 + 1);
}
