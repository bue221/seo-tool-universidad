import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditResult } from "@/lib/audit/types";

export async function RecommendationsSection({
	result,
}: {
	result: AuditResult;
}) {
	const t = await getTranslations("Audit.Result.Intelligence");

	if (!result.scraper) {
		return (
			<Card className="border-destructive">
				<CardContent className="p-4 text-sm">
					{t("recommendations.unavailable")}
				</CardContent>
			</Card>
		);
	}

	const recs = result.scraper.recommendations ?? [];
	if (recs.length === 0) {
		return (
			<Card>
				<CardContent className="p-4 text-sm text-muted-foreground">
					{t("recommendations.empty")}
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-3">
			{recs.map((rec) => (
				<Card key={rec.id}>
					<CardHeader className="pb-2">
						<div className="flex flex-wrap items-center gap-2">
							<CardTitle className="text-base">{rec.title}</CardTitle>
							<ImpactBadge
								impact={rec.impact}
								label={t("recommendations.impact")}
							/>
							<EffortBadge
								effort={rec.effort}
								label={t("recommendations.effort")}
							/>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">{rec.reason}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function ImpactBadge({
	impact,
	label,
}: {
	impact: "low" | "medium" | "high";
	label: string;
}) {
	const className =
		impact === "high"
			? "border-rose-500/30 bg-rose-500/10 text-rose-300"
			: impact === "medium"
				? "border-amber-500/30 bg-amber-500/10 text-amber-300"
				: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
	return (
		<Badge variant="outline" className={className}>
			{label}: {impact}
		</Badge>
	);
}

function EffortBadge({
	effort,
	label,
}: {
	effort: "low" | "medium" | "high";
	label: string;
}) {
	const className =
		effort === "low"
			? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
			: effort === "medium"
				? "border-amber-500/30 bg-amber-500/10 text-amber-300"
				: "border-rose-500/30 bg-rose-500/10 text-rose-300";
	return (
		<Badge variant="outline" className={className}>
			{label}: {effort}
		</Badge>
	);
}
