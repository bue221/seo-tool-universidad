import { z } from 'zod';

/**
 * Validación de variables de entorno al startup.
 *
 * Por qué validar acá y no solo confiar en `process.env`:
 *   - `process.env.X` es `string | undefined` siempre — sin runtime check, los
 *     `undefined` se cuelan hasta el browser y rompen en producción.
 *   - Zod hace el chequeo + coerción (ej. "true"/"false" → boolean) en un solo
 *     lugar y falla **al build** si algo falta, no en runtime con usuarios reales.
 *
 * Las variables públicas (`NEXT_PUBLIC_*`) se inlinea al bundle del cliente por
 * Next.js. NO incluir secretos acá; usar otro schema para vars server-only.
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  /** Origin absoluto sin trailing slash, ej. https://seo-custom-tool.vercel.app */
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .refine((v) => !v.endsWith('/'), {
      message: 'NEXT_PUBLIC_SITE_URL no debe terminar en "/"',
    }),

  /** "true" habilita indexing (robots + meta). Cualquier otro valor → noindex. */
  NEXT_PUBLIC_ALLOW_INDEXING: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  /** Debe coincidir con `routing.defaultLocale` en src/i18n/routing.ts. */
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(['es', 'en']).default('es'),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  PAGESPEED_API_KEY: z.string().min(20).optional(),
  SCRAPER_API_URL: z
    .string()
    .url()
    .refine((v) => !v.endsWith('/'), {
      message: 'SCRAPER_API_URL no debe terminar en "/"',
    }),
});

function parseEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_ALLOW_INDEXING: process.env.NEXT_PUBLIC_ALLOW_INDEXING,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    // En build, Next.js mostrará este error y abortará — el comportamiento deseado.
    console.error(
      '\n❌ Variables de entorno inválidas:\n',
      parsed.error.flatten().fieldErrors,
      '\nVer dashboard-web/.env.local.example para los valores requeridos.\n',
    );
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

function parseServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PAGESPEED_API_KEY: process.env.PAGESPEED_API_KEY,
    SCRAPER_API_URL: process.env.SCRAPER_API_URL,
  });

  if (!parsed.success) {
    console.error(
      '\n❌ Variables de entorno server inválidas:\n',
      parsed.error.flatten().fieldErrors,
      '\nVer dashboard-web/.env.local.example para los valores requeridos.\n',
    );
    throw new Error('Invalid server environment variables');
  }

  return parsed.data;
}

export const env = parseEnv();
export const serverEnv =
  typeof window === 'undefined'
    ? parseServerEnv()
    : ({} as z.infer<typeof serverEnvSchema>);

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
