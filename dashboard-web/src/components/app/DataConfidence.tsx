import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DataSource = "real" | "simulated" | "heuristic";

export function DataConfidenceBadge({ source }: { source: DataSource }) {
	const styles: Record<DataSource, string> = {
		real: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
		simulated: "border-amber-500/30 bg-amber-500/10 text-amber-200",
		heuristic: "border-sky-500/30 bg-sky-500/10 text-sky-200",
	};

	return (
		<Badge
			variant="outline"
			className={cn("uppercase tracking-tracked-label", styles[source])}
		>
			{source}
		</Badge>
	);
}

export function DataConfidenceNotice({
	title,
	body,
}: {
	title: string;
	body: string;
}) {
	return (
		<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
			<p className="text-xs font-semibold uppercase tracking-tracked-label text-amber-200">
				{title}
			</p>
			<p className="mt-1 text-sm text-amber-100/90">{body}</p>
		</div>
	);
}
