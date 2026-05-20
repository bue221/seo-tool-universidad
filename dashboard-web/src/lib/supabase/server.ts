import { auth } from "@clerk/nextjs/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Cliente Supabase para Server Components / Server Actions / Route Handlers.
 *
 * Auth: el JWT lo provee Clerk (third-party auth integration).
 * Supabase lo valida usando el dominio de Clerk declarado en `supabase/config.toml`
 * (sección `[auth.third_party.clerk]`) o en el dashboard del proyecto.
 *
 * RLS: las policies deben leer `auth.jwt() ->> 'sub'` para obtener el user_id Clerk
 * (string `user_xxx`). El claim `role` viene como `authenticated` por convención
 * de Clerk's "Connect with Supabase".
 *
 * Sigue siendo `async` por compatibilidad con call-sites existentes (`await createClient()`).
 */
export async function createClient() {
	return createSupabaseClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			async accessToken() {
				const { getToken } = await auth();
				return (await getToken()) ?? null;
			},
		},
	);
}
