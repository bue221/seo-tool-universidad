import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./pagespeed", () => ({
	fetchPageSpeed: vi.fn(),
}));

vi.mock("./scraper", () => ({
	fetchScraper: vi.fn(),
}));

vi.mock("./score", () => ({
	calculateGlobalScore: vi.fn(),
}));

import { fetchPageSpeed } from "./pagespeed";
import { fetchScraper } from "./scraper";
import { calculateGlobalScore } from "./score";
import { runFullAudit } from "./run";

const pagespeedData = {
	performance: 80,
	accessibility: 90,
	bestPractices: 85,
	seo: 70,
};

const scraperData = {
	url: "https://example.com",
	fetchedAt: "2026-05-19T00:00:00.000Z",
	onPage: {
		title: { value: "Title", lengthScore: 0.9 },
		metaDescription: { value: "Description", lengthScore: 0.8 },
		h1: { count: 1, value: "Heading" },
		images: { total: 10, withAlt: 9, altCoverage: 0.9 },
	},
	tracking: {
		gtm: { detected: true, ids: ["GTM-XXX"] },
		ga4: { detected: true, ids: ["G-XXX"] },
		googleAds: { detected: false, ids: [] },
	},
	keywords: { top: [{ term: "seo", density: 0.1 }] },
	sentiment: { polarity: "neutral" as const, score: 0 },
};

describe("runFullAudit", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("returns null when both upstreams fail", async () => {
		vi.mocked(fetchPageSpeed).mockResolvedValueOnce({
			ok: false,
			error: "UPSTREAM_5XX",
		});
		vi.mocked(fetchScraper).mockResolvedValueOnce({
			ok: false,
			error: "UNREACHABLE",
		});

		const result = await runFullAudit("https://example.com");

		expect(result).toBeNull();
	});

	it("returns audit with partialFailure when only one source fails", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-19T10:30:00.000Z"));

		vi.mocked(fetchPageSpeed).mockResolvedValueOnce({
			ok: true,
			data: pagespeedData,
		});
		vi.mocked(fetchScraper).mockResolvedValueOnce({
			ok: false,
			error: "UPSTREAM_5XX",
		});
		vi.mocked(calculateGlobalScore).mockReturnValueOnce(77);

		const result = await runFullAudit("https://example.com");

		expect(result).toEqual({
			url: "https://example.com",
			fetchedAt: "2026-05-19T10:30:00.000Z",
			pagespeed: pagespeedData,
			scraper: null,
			globalScore: 77,
			partialFailure: { scraper: "UPSTREAM_5XX" },
		});
		expect(calculateGlobalScore).toHaveBeenCalledWith({
			pagespeed: pagespeedData,
			scraper: null,
		});
	});

	it("maps rejected upstream calls to TIMEOUT in partialFailure", async () => {
		vi.mocked(fetchPageSpeed).mockRejectedValueOnce(
			new Error("network timeout"),
		);
		vi.mocked(fetchScraper).mockResolvedValueOnce({
			ok: true,
			data: scraperData,
		});
		vi.mocked(calculateGlobalScore).mockReturnValueOnce(51);

		const result = await runFullAudit("https://example.com");

		expect(result?.partialFailure).toEqual({ pagespeed: "TIMEOUT" });
		expect(result?.scraper).toEqual(scraperData);
	});
});
