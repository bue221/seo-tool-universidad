import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    env: {
      // Defaults para que los tests que importen `@/lib/env` no exploten
      // al evaluar parseEnv() en tiempo de import del módulo.
      NEXT_PUBLIC_SITE_URL: 'https://test.example.com',
      NEXT_PUBLIC_ALLOW_INDEXING: 'false',
      NEXT_PUBLIC_DEFAULT_LOCALE: 'es',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
