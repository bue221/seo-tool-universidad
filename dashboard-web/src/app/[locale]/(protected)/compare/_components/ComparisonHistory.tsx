import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComparisonHistoryRow } from "../_lib/persistence";

export function ComparisonHistory({
	rows,
	labels,
}: {
	rows: ComparisonHistoryRow[];
	labels: {
		title: string;
		empty: string;
		ranAt: string;
	};
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{labels.title}</CardTitle>
			</CardHeader>
			<CardContent>
				{rows.length === 0 ? (
					<p className="text-sm text-muted-foreground">{labels.empty}</p>
				) : (
					<ul className="space-y-2">
						{rows.map((row) => (
							<li
								key={row.id}
								className="rounded-md border border-border/60 bg-surface-1/50 px-3 py-2 text-sm"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<span className="font-medium text-foreground">
										{row.input.yours}
									</span>
									<span className="text-xs text-muted-foreground">
										{labels.ranAt}: {new Date(row.fetched_at).toLocaleString()}
									</span>
								</div>
								<p className="mt-1 text-xs text-muted-foreground">
									{row.input.competitors.length} competitors ·{" "}
									{row.result.entries.length} entries
								</p>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
