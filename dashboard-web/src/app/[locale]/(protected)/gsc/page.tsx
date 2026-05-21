import { ScanLine } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/app/PageHeader";
import {
	DataConfidenceBadge,
	DataConfidenceNotice,
} from "@/components/app/DataConfidence";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGscDataset } from "@/lib/gsc/generator";
import { PropertyCard } from "./_components/PropertyCard";
import { listUserProperties } from "./_lib/properties";

export default async function GscLandingPage() {
	const user = await getCurrentUser();
	const t = await getTranslations("GSC.Landing");

	// If the user somehow lands here unauthenticated, the protected layout
	// already redirected; this is just a defensive guard.
	if (!user) return null;

	const properties = await listUserProperties(user.id);

	return (
		<div className="space-y-8">
			<PageHeader
				title={t("title")}
				description={t("subtitle")}
				size="sm"
				actions={<DataConfidenceBadge source="simulated" />}
			/>

			<DataConfidenceNotice
				title={t("simulated.title")}
				body={t("simulated.body")}
			/>

			{properties.length === 0 ? (
				<EmptyState t={t} />
			) : (
				<PropertyGrid properties={properties} />
			)}
		</div>
	);
}

async function PropertyGrid({ properties }: { properties: string[] }) {
	const rangeLabel = await (await getTranslations("GSC.Common"))("range28d");
	// Resolve datasets in parallel — each call is just CPU work, no I/O.
	const datasets = await Promise.all(
		properties.map((p) => getGscDataset(p, 28)),
	);
	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{datasets.map((d) => (
				<PropertyCard
					key={d.property}
					property={d.property}
					totals={d.totals}
					rangeLabel={rangeLabel}
				/>
			))}
		</div>
	);
}

function EmptyState({ t }: { t: (key: string) => string }) {
	return (
		<div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
			<p className="text-sm text-muted-foreground">{t("empty.body")}</p>
			<Button asChild className="mt-4">
				<Link href="/audit">
					<ScanLine className="mr-2 size-4" /> {t("empty.cta")}
				</Link>
			</Button>
		</div>
	);
}
