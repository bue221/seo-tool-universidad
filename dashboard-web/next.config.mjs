import path from "node:path";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// Bundle mínimo para Docker (genera .next/standalone con server.js).
	output: "standalone",
	// Monorepo root explícito para evitar inferencia incorrecta por lockfiles externos.
	outputFileTracingRoot: path.join(__dirname, ".."),

	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Content-Security-Policy",
						value:
							"frame-ancestors 'self' https://niixer.com https://www.niixer.com;",
					},
				],
			},
		];
	},
};

export default withNextIntl(nextConfig);
