import { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditResult } from "@/lib/audit/types";

export async function ObservabilitySection({
	result,
}: {
	result: AuditResult;
}) {
	const t = await getTranslations("Audit.Result.Intelligence");

	if (!result.scraper) {
		return (
			<Card className="border-destructive">
				<CardContent className="p-4 text-sm">
					{t("observability.unavailable")}
				</CardContent>
			</Card>
		);
	}

	const observability = result.scraper.observability;
	if (!observability || observability.stages.length === 0) {
		return (
			<Card>
				<CardContent className="p-4 text-sm text-muted-foreground">
					{t("observability.empty")}
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-3">
			<Card>
				<CardContent className="flex flex-wrap items-center gap-2 p-4 text-sm">
					<span className="text-muted-foreground">
						{t("observability.totalDuration")}
					</span>
					<Badge variant="outline" className="font-mono">
						{observability.totalDurationMs} ms
					</Badge>
				</CardContent>
			</Card>

			<div className="grid gap-2">
				{observability.stages.map((stage) => (
					<Card key={`${stage.name}-${stage.code ?? "ok"}`}>
						<CardContent className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
							<div className="flex items-center gap-2">
								<span className="font-medium">{stage.name}</span>
								<StatusBadge status={stage.status} />
								{stage.code ? (
									<Badge variant="outline">{stage.code}</Badge>
								) : null}
							</div>
							<span className="font-mono text-muted-foreground">
								{stage.durationMs} ms
							</span>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

function StatusBadge({
	status,
}: {
	status: "ok" | "warn" | "error" | "skipped";
}) {
	if (status === "ok") {
		return <Badge className="bg-emerald-500/20 text-emerald-200">ok</Badge>;
	}
	if (status === "warn") {
		return <Badge className="bg-amber-500/20 text-amber-200">warn</Badge>;
	}
	if (status === "error") {
		return <Badge className="bg-rose-500/20 text-rose-200">error</Badge>;
	}
	return <Badge variant="outline">skipped</Badge>;
}
