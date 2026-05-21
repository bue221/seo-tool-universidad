import { z } from "zod";
import { serverEnv } from "@/lib/env";
import type { PartialFailureCode, ScraperAudit } from "./types";

const scraperSchema: z.ZodType<ScraperAudit> = z.object({
	url: z.string().url(),
	fetchedAt: z.string(),
	onPage: z.object({
		title: z.object({ value: z.string(), lengthScore: z.number() }),
		metaDescription: z.object({ value: z.string(), lengthScore: z.number() }),
		h1: z.object({ count: z.number(), value: z.string() }),
		images: z.object({
			total: z.number(),
			withAlt: z.number(),
			altCoverage: z.number(),
		}),
	}),
	tracking: z.object({
		gtm: z.object({ detected: z.boolean(), ids: z.array(z.string()) }),
		ga4: z.object({ detected: z.boolean(), ids: z.array(z.string()) }),
		googleAds: z.object({ detected: z.boolean(), ids: z.array(z.string()) }),
	}),
	keywords: z.object({
		top: z.array(z.object({ term: z.string(), density: z.number() })),
	}),
	sentiment: z.object({
		polarity: z.enum(["positive", "neutral", "negative"]),
		score: z.number(),
	}),
	// Optional: present from audit-contract v0.2.0 onwards.
	woorank: z
		.object({
			score: z.number(),
			checks: z.array(
				z.object({
					id: z.string(),
					label: z.string(),
					category: z.enum([
						"meta",
						"headings",
						"mobile",
						"indexing",
						"security",
						"social",
						"schema",
						"a11y",
					]),
					status: z.enum(["pass", "warn", "fail"]),
					evidence: z.string().optional(),
					weight: z.number(),
				}),
			),
		})
		.optional(),
	crawl: z
		.object({
			pagesVisited: z.number(),
			maxPages: z.number(),
			truncated: z.boolean(),
			maxDepth: z.number(),
		})
		.optional(),
	siteStructure: z
		.object({
			root: z.string(),
			nodes: z.array(
				z.object({
					id: z.string(),
					label: z.string(),
					depth: z.number(),
					children: z.array(z.string()),
				}),
			),
		})
		.optional(),
	observability: z
		.object({
			stages: z.array(
				z.object({
					name: z.string(),
					status: z.enum(["ok", "warn", "error", "skipped"]),
					durationMs: z.number(),
					code: z.string().optional(),
				}),
			),
			totalDurationMs: z.number(),
		})
		.optional(),
	recommendations: z
		.array(
			z.object({
				id: z.string(),
				title: z.string(),
				impact: z.enum(["low", "medium", "high"]),
				effort: z.enum(["low", "medium", "high"]),
				reason: z.string(),
			}),
		)
		.optional(),
});

function mapStatus(status: number): PartialFailureCode {
	if (status >= 500) return "UPSTREAM_5XX";
	return "UNREACHABLE";
}

export async function fetchScraper(
	url: string,
): Promise<
	{ ok: true; data: ScraperAudit } | { ok: false; error: PartialFailureCode }
> {
	try {
		if (!serverEnv.SCRAPER_API_URL) {
			return { ok: false, error: "UNREACHABLE" };
		}

		const response = await fetch(`${serverEnv.SCRAPER_API_URL}/api/audit`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ url }),
			cache: "no-store",
		});

		if (!response.ok) {
			return { ok: false, error: mapStatus(response.status) };
		}

		const json = await response.json();
		const parsed = scraperSchema.safeParse(json);

		if (!parsed.success) {
			return { ok: false, error: "INVALID_RESPONSE" };
		}

		return { ok: true, data: parsed.data };
	} catch {
		return { ok: false, error: "UNREACHABLE" };
	}
}
