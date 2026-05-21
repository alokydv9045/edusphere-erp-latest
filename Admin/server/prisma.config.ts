import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';

// Fallback to DATABASE_URL if DIRECT_URL is not set in the environment
const dbUrlVar = (globalThis as any).process?.env?.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env(dbUrlVar),
  },
});
