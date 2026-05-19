import { SignIn } from '@clerk/nextjs';

type Props = { params: Promise<{ locale: string }> };

/**
 * Login page — delegada a Clerk.
 *
 * `path` + `routing="path"` hace que Clerk maneje los sub-paths internos
 * (`/login/factor-one`, `/login/sso-callback`, etc.) sin que tengamos que
 * declarar route segments adicionales.
 *
 * Providers OAuth (Google, Microsoft, etc.) se configuran en Clerk dashboard
 * → User & Authentication → Social Connections. No requiere código acá.
 */
export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  return (
    <SignIn
      path={`/${locale}/login`}
      routing="path"
      signUpUrl={`/${locale}/signup`}
      forceRedirectUrl={`/${locale}/dashboard`}
    />
  );
}
