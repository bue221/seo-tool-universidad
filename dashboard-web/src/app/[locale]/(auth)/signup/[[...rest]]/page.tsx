import { SignUp } from "@clerk/nextjs";

import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

/**
 * Signup page — delegada a Clerk.
 * Ver `login/page.tsx` para notas sobre routing y providers OAuth.
 */
export default async function SignupPage({ params }: Props) {
	const { locale } = await params;

	// With `localePrefix: 'as-needed'`, default locale paths are unprefixed.
	const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

	return (
		<SignUp
			path={`${prefix}/signup`}
			routing="path"
			signInUrl={`${prefix}/login`}
			forceRedirectUrl={`${prefix}/dashboard`}
		/>
	);
}
