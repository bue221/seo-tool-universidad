import { SignIn } from "@clerk/nextjs";

import { routing } from "@/i18n/routing";

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

	// With `localePrefix: 'as-needed'`, default locale paths are unprefixed.
	const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

	return (
		<SignIn
			path={`${prefix}/login`}
			routing="path"
			signUpUrl={`${prefix}/signup`}
			forceRedirectUrl={`${prefix}/dashboard`}
		/>
	);
}
