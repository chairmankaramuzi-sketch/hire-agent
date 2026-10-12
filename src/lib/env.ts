import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1).default('postgresql://user:password@localhost:5432/hr_agent?schema=public'),
  DIRECT_URL: z.string().optional(),
  STORAGE_BUCKET_NAME: z.string().default('cv-documents'),
  STORAGE_REGION: z.string().default('us-east-1'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL_NAME: z.string().default('gemini-1.5-pro'),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (parsedEnv) return parsedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Invalid environment configuration: ${errorDetails}`);
  }

  parsedEnv = result.data;
  return parsedEnv;
}
