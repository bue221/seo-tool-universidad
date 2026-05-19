'use client';

import { useSession } from '@clerk/nextjs';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';
import { env } from '@/lib/env';

/**
 * Hook para obtener un cliente Supabase en Client Components.
 *
 * Adjunta el JWT de la sesión Clerk como `accessToken`, de modo que
 * Supabase aplique RLS con identidad Clerk (`sub` = user_xxx).
 *
 * Devuelve `null` mientras la sesión Clerk no está cargada — los
 * consumidores deben manejar el caso (loading / no-auth) antes de querear.
 */
export function useSupabase(): SupabaseClient | null {
  const { session } = useSession();

  return useMemo(() => {
    if (!session) return null;
    return createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        async accessToken() {
          return (await session.getToken()) ?? null;
        },
      },
    );
  }, [session]);
}
