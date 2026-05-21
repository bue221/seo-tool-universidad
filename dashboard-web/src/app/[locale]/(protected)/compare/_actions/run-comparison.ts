"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { runFullAudit } from "@/lib/audit/run";
import { normalizeUrl, withTimeout } from "../_lib/compare";
import { saveComparison } from "../_lib/persistence";
import type { ComparisonEntry, ComparisonResult } from "../_lib/types";

const PER_AUDIT_TIMEOUT_MS = 30_000;

const inputSchema = z.object({
	yours: z.string().url(),
	competitors: z
		.array(z.string().url())
		// We accept empty competitors[] from the form, but `runComparison`
		// requires at least one. Filtering empty inputs is the caller's job.
		.min(1)
		.max(3),
});

export type RunComparisonInput = z.input<typeof inputSchema>;

/**
 * Runs a parallel audit against the user's URL and up to 3 competitors.
 *
 * Contract:
 *   - URLs are deduplicated after normalization (case-insensitive,
 *     protocol/trailing-slash stripped). If fewer than 2 remain after
 *     dedup, the action returns the duplicate-error variant.
 *   - Each audit runs with a 30s hard timeout. Partial failures show up
 *     as `status: 'error'` entries; the rest still render.
 *   - The first entry (the user's URL) is marked `isYou: true`. The UI
 *     uses this to highlight the column and skew the keyword gap.
 *
 * No persistence: each call is a one-shot comparison.
 */
export async function runComparison(
	input: RunComparisonInput,
): Promise<
	| { ok: true; data: ComparisonResult }
	| { ok: false; code: "INVALID_INPUT" | "DUPLICATE_URLS" | "UNAUTHORIZED" }
> {
	// Authn: protected route only. We don't tie comparisons to the user
	// beyond this — there's no persistence — but we still require a
	// session to avoid turning this into an open audit proxy.
	const user = await getCurrentUser();
	if (!user) return { ok: false, code: "UNAUTHORIZED" };

	const parsed = inputSchema.safeParse(input);
	if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };

	const ordered = [parsed.data.yours, ...parsed.data.competitors];
	const normalized = ordered.map((u) => normalizeUrl(u));

	// Dedup but keep the first occurrence (your URL stays in position 0).
	const seen = new Set<string>();
	const dedup: { url: string; original: string; isYou: boolean }[] = [];
	for (let i = 0; i < ordered.length; i++) {
		const key = normalized[i]!;
		if (seen.has(key)) continue;
		seen.add(key);
		dedup.push({ url: key, original: ordered[i]!, isYou: i === 0 });
	}

	if (dedup.length < 2) return { ok: false, code: "DUPLICATE_URLS" };

	// Audits in parallel. We pass the original URL (with protocol) to the
	// pipeline — it needs that for PSI + the scraper — but we report the
	// normalized form in the result so columns line up cleanly.
	const settled = await Promise.allSettled(
		dedup.map((d) =>
			withTimeout(runFullAudit(d.original), PER_AUDIT_TIMEOUT_MS),
		),
	);

	const entries: ComparisonEntry[] = settled.map((res, i) => {
		const meta = dedup[i]!;
		if (res.status === "rejected") {
			return {
				url: meta.url,
				isYou: meta.isYou,
				status: "error",
				error: res.reason instanceof Error ? res.reason.message : "UNKNOWN",
			};
		}
		if (res.value === null) {
			return {
				url: meta.url,
				isYou: meta.isYou,
				status: "error",
				error: "UPSTREAM_BOTH_FAILED",
			};
		}
		return { url: meta.url, isYou: meta.isYou, status: "ok", audit: res.value };
	});

	const result = {
		ranAt: new Date().toISOString(),
		entries,
	} satisfies ComparisonResult;

	// Persistence is best-effort: comparison UX should not fail if DB insert fails.
	try {
		await saveComparison(
			user.id,
			{ yours: parsed.data.yours, competitors: parsed.data.competitors },
			result,
		);
	} catch {
		// Intentionally ignored.
	}

	return {
		ok: true,
		data: result,
	};
}
