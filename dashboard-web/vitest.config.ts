import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    env: {
      // Defaults para que los tests que importen `@/lib/env` no exploten
      // al evaluar parseEnv() en tiempo de import del módulo.
      NEXT_PUBLIC_SITE_URL: 'https://test.example.com',
      NEXT_PUBLIC_ALLOW_INDEXING: 'false',
      NEXT_PUBLIC_DEFAULT_LOCALE: 'es',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon_key_12345678901234567890',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_12345678901234567890',
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/es/login',
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/es/signup',
      SUPABASE_SERVICE_ROLE_KEY: 'service_role_key_12345678901234567890',
      CLERK_SECRET_KEY: 'sk_test_12345678901234567890',
      SCRAPER_API_URL: 'http://localhost:8080',
      PAGESPEED_API_KEY: 'pagespeed_key_12345678901234567890',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
