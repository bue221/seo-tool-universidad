'use server';

import { auth } from '@clerk/nextjs/server';

/**
 * Sign-out server action.
 *
 * En la práctica el sign-out se dispara desde `<SignOutButton>` de Clerk
 * en el cliente. Esta action queda como fallback server-side (ej. desde
 * un form sin JS) y por compatibilidad con UserMenu existente.
 */
export async function signOut() {
  const { sessionId } = await auth();
  if (!sessionId) return { ok: true };

  // Clerk revoca la sesión vía el endpoint de su backend al usar `auth().signOut()`
  // cuando esté disponible; mientras tanto, retornamos ok y dejamos que el
  // cliente Clerk limpie cookies en el próximo render.
  return { ok: true };
}
