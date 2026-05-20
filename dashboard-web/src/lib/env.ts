import { z } from "zod";

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

const publicEnvSchema = z
	.object({
		NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
		/** Supabase docs actuales: sb_publishable_... */
		NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20).optional(),
		/** Compat legacy (anon key). */
		NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
		/** Origin absoluto sin trailing slash, ej. https://seo-custom-tool.vercel.app */
		NEXT_PUBLIC_SITE_URL: z
			.string()
			.url()
			.refine((v) => !v.endsWith("/"), {
				message: 'NEXT_PUBLIC_SITE_URL no debe terminar en "/"',
			}),

		/** "true" habilita indexing (robots + meta). Cualquier otro valor → noindex. */
		NEXT_PUBLIC_ALLOW_INDEXING: z
			.enum(["true", "false"])
			.default("false")
			.transform((v) => v === "true"),

		/** Debe coincidir con `routing.defaultLocale` en src/i18n/routing.ts. */
		NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["es", "en"]).default("es"),

		/** Clerk publishable key (pk_test_/pk_live_). Inyectado al cliente. */
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(20),

		/** URLs de login/signup pre-localizadas. Si el usuario navega en otro locale,
		 *  next-intl corrige el redirect. Default `es` por ser locale primario. */
		NEXT_PUBLIC_CLERK_SIGN_IN_URL: z
			.string()
			.startsWith("/")
			.default("/es/login"),
		NEXT_PUBLIC_CLERK_SIGN_UP_URL: z
			.string()
			.startsWith("/")
			.default("/es/signup"),
	})
	.superRefine((data, ctx) => {
		if (
			!data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
			!data.NEXT_PUBLIC_SUPABASE_ANON_KEY
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
				message:
					"Definí NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (recomendado) o NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy).",
			});
		}
	})
	.transform((data) => {
		const supabasePublicKey =
			data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
			data.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

		return {
			...data,
			NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublicKey,
			NEXT_PUBLIC_SUPABASE_ANON_KEY: supabasePublicKey,
		};
	});

const serverEnvSchema = z.object({
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
	/** Clerk secret key (sk_test_/sk_live_). Server-only. */
	CLERK_SECRET_KEY: z.string().min(20),
	PAGESPEED_API_KEY: z.string().min(20).optional(),
	SCRAPER_API_URL: z
		.string()
		.url()
		.refine((v) => !v.endsWith("/"), {
			message: 'SCRAPER_API_URL no debe terminar en "/"',
		})
		.optional(),
});

function parseEnv() {
	const parsed = publicEnvSchema.safeParse({
		NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
		NEXT_PUBLIC_ALLOW_INDEXING: process.env.NEXT_PUBLIC_ALLOW_INDEXING,
		NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
		NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
		NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
	});

	if (!parsed.success) {
		// En build, Next.js mostrará este error y abortará — el comportamiento deseado.
		console.error(
			"\n❌ Variables de entorno inválidas:\n",
			parsed.error.flatten().fieldErrors,
			"\nVer dashboard-web/.env.local.example para los valores requeridos.\n",
		);
		throw new Error("Invalid environment variables");
	}

	return parsed.data;
}

function parseServerEnv() {
	const parsed = serverEnvSchema.safeParse({
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
		CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
		PAGESPEED_API_KEY: process.env.PAGESPEED_API_KEY,
		SCRAPER_API_URL: process.env.SCRAPER_API_URL,
	});

	if (!parsed.success) {
		console.error(
			"\n❌ Variables de entorno server inválidas:\n",
			parsed.error.flatten().fieldErrors,
			"\nVer dashboard-web/.env.local.example para los valores requeridos.\n",
		);
		throw new Error("Invalid server environment variables");
	}

	return parsed.data;
}

export const env = parseEnv();
export const serverEnv =
	typeof window === "undefined"
		? parseServerEnv()
		: ({} as z.infer<typeof serverEnvSchema>);

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
