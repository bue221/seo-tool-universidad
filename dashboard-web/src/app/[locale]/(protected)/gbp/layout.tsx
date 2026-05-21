import { getTranslations } from "next-intl/server";

import {
	DataConfidenceBadge,
	DataConfidenceNotice,
} from "@/components/app/DataConfidence";
import { Link } from "@/i18n/navigation";

export default async function GbpLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const t = await getTranslations("GBP");
	const tabs = [
		{ href: "/gbp/profile", label: t("tabs.profile") },
		{ href: "/gbp/posts", label: t("tabs.posts") },
		{ href: "/gbp/reviews", label: t("tabs.reviews") },
		{ href: "/gbp/insights", label: t("tabs.insights") },
	];

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						{t("title")}
					</h1>
					<DataConfidenceBadge source="simulated" />
				</div>
				<p className="text-sm text-muted-foreground">{t("description")}</p>
				<DataConfidenceNotice
					title={t("simulated.title")}
					body={t("simulated.body")}
				/>
			</div>
			<nav className="flex flex-wrap gap-2 text-sm">
				{tabs.map((tab) => (
					<Link
						key={tab.href}
						href={tab.href}
						className="rounded-md border px-3 py-1.5 hover:bg-muted"
					>
						{tab.label}
					</Link>
				))}
			</nav>
			{children}
		</div>
	);
}
