const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { registerSchema, loginSchema } = require('../src/validators/userValidator');

describe('Auth & Security Validation Tests', () => {
  const sampleSecret = 'test-jwt-secret-key-super-secure';

  beforeAll(() => {
    process.env.JWT_SECRET = sampleSecret;
  });

  test('Should validate strong passwords correctly', () => {
    const valid = loginSchema.safeParse({ email: 'admin@edusphere.com', password: 'Password123!' });
    expect(valid.success).toBe(true);

    const invalid = loginSchema.safeParse({ email: 'not-an-email', password: '' });
    expect(invalid.success).toBe(false);
  });

  test('Should validate user registration schema requirements', () => {
    const validUser = registerSchema.safeParse({
      email: 'teacher@edusphere.com',
      password: 'SecurePassword123!',
      firstName: 'Alok',
      lastName: 'Yadav',
      role: 'TEACHER',
    });
    expect(validUser.success).toBe(true);
  });

  test('Should generate and verify JWT tokens accurately', () => {
    const payload = { userId: 'usr-123', role: 'ADMIN' };
    const token = jwt.sign(payload, sampleSecret, { expiresIn: '15m' });

    const decoded = jwt.verify(token, sampleSecret);
    expect(decoded.userId).toBe('usr-123');
    expect(decoded.role).toBe('ADMIN');
  });

  test('Should securely hash and verify passwords using bcrypt', async () => {
    const plainText = 'MySecretPass456!';
    const hash = await bcrypt.hash(plainText, 10);
    expect(hash).not.toBe(plainText);

    const match = await bcrypt.compare(plainText, hash);
    expect(match).toBe(true);

    const noMatch = await bcrypt.compare('WrongPassword!', hash);
    expect(noMatch).toBe(false);
  });
});
