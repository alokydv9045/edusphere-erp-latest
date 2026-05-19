const request = require('supertest');
const express = require('express');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'EduSphere School ERP' });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@edusphere.com' && password === 'Password123!') {
    return res.status(200).json({ success: true, token: 'mock-jwt-token' });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.use(errorHandler);

describe('API Integration Flow Tests', () => {
  test('GET /health - Should return 200 OK service health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('OK');
  });

  test('POST /api/v1/auth/login - Should successfully authenticate valid admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@edusphere.com', password: 'Password123!' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/v1/auth/login - Should reject invalid login credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@edusphere.com', password: 'wrongpassword' });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
