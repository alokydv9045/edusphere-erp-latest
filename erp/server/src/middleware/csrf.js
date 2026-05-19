const crypto = require('crypto');

/**
 * SEC-6: Lightweight Double Submit Cookie CSRF protection.
 *
 * How it works:
 * 1. On GET /api/csrf-token, the server generates a random token, sets it as a cookie
 *    (readable by JS), and returns it in the response body.
 * 2. On mutations (POST/PUT/PATCH/DELETE), the client must send the token
 *    in the X-CSRF-Token header. The middleware validates it against the cookie.
 *
 * This is effective because:
 * - An attacker's cross-origin form/request can't read our cookie value
 * - The attacker can't set the X-CSRF-Token header on cross-origin requests
 *
 * Note: Only enforced in production. Skipped in development for DX convenience.
 */

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Generate a CSRF token and return it + set cookie
 */
const generateCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,  // Must be readable by JavaScript
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });

  res.json({ success: true, csrfToken: token });
};

/**
 * Middleware to validate CSRF token on state-changing requests.
 * Skips validation for safe methods and when not in production.
 */
const validateCsrf = (req, res, next) => {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') return next();

  // Skip safe methods
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers?.[CSRF_HEADER];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing. Fetch a token from GET /api/csrf-token first.',
    });
  }

  // Constant-time comparison to prevent timing attacks
  try {
    const cookieBuf = Buffer.from(cookieToken, 'utf-8');
    const headerBuf = Buffer.from(headerToken, 'utf-8');
    
    if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token mismatch.',
      });
    }
  } catch {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token.',
    });
  }

  next();
};

module.exports = {
  generateCsrfToken,
  validateCsrf,
  CSRF_COOKIE,
  CSRF_HEADER,
};
