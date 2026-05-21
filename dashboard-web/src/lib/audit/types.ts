export type PartialFailureCode =
	| "TIMEOUT"
	| "RATE_LIMIT"
	| "INVALID_RESPONSE"
	| "UNREACHABLE"
	| "UPSTREAM_5XX";

export type PartialFailure = {
	pagespeed?: PartialFailureCode;
	scraper?: PartialFailureCode;
};

export type PageSpeedScores = {
	performance: number;
	accessibility: number;
	bestPractices: number;
	seo: number;
	fcp?: string;
	lcp?: string;
	cls?: string;
	tbt?: string;
};

export type ScraperAudit = {
	url: string;
	fetchedAt: string;
	onPage: {
		title: { value: string; lengthScore: number };
		metaDescription: { value: string; lengthScore: number };
		h1: { count: number; value: string };
		images: { total: number; withAlt: number; altCoverage: number };
	};
	tracking: {
		gtm: { detected: boolean; ids: string[] };
		ga4: { detected: boolean; ids: string[] };
		googleAds: { detected: boolean; ids: string[] };
	};
	keywords: { top: Array<{ term: string; density: number }> };
	sentiment: { polarity: "positive" | "neutral" | "negative"; score: number };
	/** WooRank-style technical SEO checks. Optional: contract v0.2.0+. */
	woorank?: WoorankResult;
	crawl?: {
		pagesVisited: number;
		maxPages: number;
		truncated: boolean;
		maxDepth: number;
	};
	siteStructure?: {
		root: string;
		nodes: Array<{
			id: string;
			label: string;
			depth: number;
			children: string[];
		}>;
	};
	observability?: {
		stages: Array<{
			name: string;
			status: "ok" | "warn" | "error" | "skipped";
			durationMs: number;
			code?: string;
		}>;
		totalDurationMs: number;
	};
	recommendations?: Array<{
		id: string;
		title: string;
		impact: "low" | "medium" | "high";
		effort: "low" | "medium" | "high";
		reason: string;
	}>;
};

export type WoorankStatus = "pass" | "warn" | "fail";

export type WoorankCategory =
	| "meta"
	| "headings"
	| "mobile"
	| "indexing"
	| "security"
	| "social"
	| "schema"
	| "a11y";

export type WoorankCheck = {
	id: string;
	label: string;
	category: WoorankCategory;
	status: WoorankStatus;
	evidence?: string;
	weight: number;
};

export type WoorankResult = {
	/** Aggregated score in [0, 1]. */
	score: number;
	checks: WoorankCheck[];
};

export type AuditResult = {
	url: string;
	fetchedAt: string;
	pagespeed: PageSpeedScores | null;
	scraper: ScraperAudit | null;
	globalScore: number;
	partialFailure: PartialFailure | null;
};

export type SnapshotRow = {
	id: string;
	user_id: string;
	url: string;
	result: AuditResult;
	global_score: number;
	partial_failure: PartialFailure | null;
	fetched_at: string;
};
