/**
 * TEST-2: CSRF middleware unit tests
 * Validates the double-submit cookie CSRF protection logic.
 */

const { validateCsrf, generateCsrfToken } = require('../src/middleware/csrf');

// Mock Express req/res/next
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

describe('CSRF Middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('skips validation in development', () => {
    process.env.NODE_ENV = 'development';
    const req = { method: 'POST', cookies: {}, headers: {} };
    const res = mockRes();
    const next = mockNext();

    validateCsrf(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('skips validation for GET requests in production', () => {
    process.env.NODE_ENV = 'production';
    const req = { method: 'GET', cookies: {}, headers: {} };
    const res = mockRes();
    const next = mockNext();

    validateCsrf(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('rejects POST without CSRF token in production', () => {
    process.env.NODE_ENV = 'production';
    const req = { method: 'POST', cookies: {}, headers: {} };
    const res = mockRes();
    const next = mockNext();

    validateCsrf(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('rejects POST with mismatched tokens in production', () => {
    process.env.NODE_ENV = 'production';
    const req = {
      method: 'POST',
      cookies: { csrf_token: 'token-a' },
      headers: { 'x-csrf-token': 'token-b' }
    };
    const res = mockRes();
    const next = mockNext();

    validateCsrf(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('allows POST with matching tokens in production', () => {
    process.env.NODE_ENV = 'production';
    const token = 'valid-csrf-token-1234567890abcdef';
    const req = {
      method: 'POST',
      cookies: { csrf_token: token },
      headers: { 'x-csrf-token': token }
    };
    const res = mockRes();
    const next = mockNext();

    validateCsrf(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('generateCsrfToken sets cookie and returns token', () => {
    const req = {};
    const res = mockRes();

    generateCsrfToken(req, res);
    expect(res.cookie).toHaveBeenCalledWith('csrf_token', expect.any(String), expect.objectContaining({
      httpOnly: false,
      path: '/'
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      csrfToken: expect.any(String)
    }));
  });
});
