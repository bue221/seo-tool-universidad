import { SignUp } from '@clerk/nextjs';

type Props = { params: Promise<{ locale: string }> };

/**
 * Signup page — delegada a Clerk.
 * Ver `login/page.tsx` para notas sobre routing y providers OAuth.
 */
export default async function SignupPage({ params }: Props) {
  const { locale } = await params;
  return (
    <SignUp
      path={`/${locale}/signup`}
      routing="path"
      signInUrl={`/${locale}/login`}
      forceRedirectUrl={`/${locale}/dashboard`}
    />
  );
}
