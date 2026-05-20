import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const isPublicRoute = createRouteMatcher([
	"/",
	"/(es|en)",
	"/login(.*)",
	"/signup(.*)",
	"/(es|en)/login(.*)",
	"/(es|en)/signup(.*)",
]);

// Rutas de auth que un usuario ya autenticado NO debe ver
const isAuthRoute = createRouteMatcher([
	"/login(.*)",
	"/signup(.*)",
	"/(es|en)/login(.*)",
	"/(es|en)/signup(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
	const { userId } = await auth();

	// Usuario ya autenticado intentando entrar a login/signup → redirigir al dashboard
	if (userId && isAuthRoute(req)) {
		const firstSegment = req.nextUrl.pathname.split("/")[1] ?? "";
		const isKnownLocale = routing.locales.includes(
			firstSegment as (typeof routing.locales)[number],
		);
		const locale = isKnownLocale ? firstSegment : routing.defaultLocale;
		const dashboardPath =
			locale === routing.defaultLocale ? "/dashboard" : `/${locale}/dashboard`;
		return NextResponse.redirect(new URL(dashboardPath, req.url));
	}

	if (!isPublicRoute(req)) {
		await auth.protect();
	}
	return intlMiddleware(req);
});

export const config = {
	// Aplica a todo EXCEPTO:
	// - /api/*           (rutas no localizadas)
	// - /_next/*         (assets de Next)
	// - /_vercel/*       (telemetría)
	// - rutas con punto  (favicon.ico, sitemap.xml, robots.txt, og-image.png, etc.)
	//
	// EXCEPCIÓN: GSC usa [property] con dominios reales (incluyen puntos),
	// así que esas rutas deben pasar sí o sí por middleware para resolver locale+auth.
	matcher: [
		"/gsc/:path*",
		"/(es|en)/gsc/:path*",
		"/((?!api|_next|_vercel|.*\\..*).*)",
	],
};
