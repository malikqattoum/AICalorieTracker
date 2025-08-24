import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/schema.ts',
  out: './migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'calorie_tracker',
  },
  verbose: true,
  strict: true,
} satisfies Config;
