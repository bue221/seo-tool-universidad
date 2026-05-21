import { createClient } from "@/lib/supabase/server";
import type { ComparisonResult } from "./types";

export type ComparisonInputPayload = {
	yours: string;
	competitors: string[];
};

export type ComparisonHistoryRow = {
	id: string;
	user_id: string;
	input: ComparisonInputPayload;
	result: ComparisonResult;
	fetched_at: string;
};

export async function saveComparison(
	userId: string,
	input: ComparisonInputPayload,
	result: ComparisonResult,
): Promise<string | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("seo_comparisons")
		.insert({
			user_id: userId,
			input,
			result,
			fetched_at: result.ranAt,
		})
		.select("id")
		.single();

	if (error || !data) return null;
	return data.id as string;
}

export async function listRecentComparisons(
	userId: string,
	limit = 8,
): Promise<ComparisonHistoryRow[]> {
	const supabase = await createClient();
	const { data } = await supabase
		.from("seo_comparisons")
		.select("*")
		.eq("user_id", userId)
		.order("fetched_at", { ascending: false })
		.limit(limit);

	return (data as ComparisonHistoryRow[] | null) ?? [];
}
