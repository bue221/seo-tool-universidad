import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/app/PageHeader";
import { getCurrentUser } from "@/lib/auth";

import { CompareView } from "./_components/CompareView";
import { ComparisonHistory } from "./_components/ComparisonHistory";
import { listRecentComparisons } from "./_lib/persistence";

export default async function ComparePage() {
	const tForm = await getTranslations("Compare.Form");
	const tTable = await getTranslations("Compare.Table");
	const tRadar = await getTranslations("Compare.Radar");
	const tKeywords = await getTranslations("Compare.Keywords");
	const tCommon = await getTranslations("Compare.Common");
	const tTabs = await getTranslations("Compare.Tabs");
	const tHistory = await getTranslations("Compare.History");

	const user = await getCurrentUser();
	const history = user ? await listRecentComparisons(user.id, 6) : [];

	return (
		<div className="space-y-8">
			<PageHeader
				title={tCommon("title")}
				description={tCommon("subtitle")}
				size="sm"
			/>

			<CompareView
				formLabels={{
					yours: tForm("yours"),
					competitor: tForm("competitor"),
					submit: tForm("submit"),
					submitting: tForm("submitting"),
					errorInvalid: tForm("errors.invalid"),
					errorDuplicate: tForm("errors.duplicate"),
					errorUnauthorized: tForm("errors.unauthorized"),
				}}
				tableLabels={{
					metric: tTable("metric"),
					you: tTable("you"),
					error: tTable("error"),
					rows: {
						psiPerformance: tTable("rows.psiPerformance"),
						psiAccessibility: tTable("rows.psiAccessibility"),
						psiBestPractices: tTable("rows.psiBestPractices"),
						psiSeo: tTable("rows.psiSeo"),
						titleScore: tTable("rows.titleScore"),
						metaDescScore: tTable("rows.metaDescScore"),
						h1Count: tTable("rows.h1Count"),
						altCoverage: tTable("rows.altCoverage"),
						gtm: tTable("rows.gtm"),
						ga4: tTable("rows.ga4"),
						googleAds: tTable("rows.googleAds"),
						woorank: tTable("rows.woorank"),
						sentimentPolarity: tTable("rows.sentimentPolarity"),
						sentimentScore: tTable("rows.sentimentScore"),
						topKeyword: tTable("rows.topKeyword"),
					},
				}}
				radarLabels={{
					axes: {
						psiPerformance: tRadar("axes.psiPerformance"),
						psiSeo: tRadar("axes.psiSeo"),
						woorank: tRadar("axes.woorank"),
						altCoverage: tRadar("axes.altCoverage"),
						titleScore: tRadar("axes.titleScore"),
						metaDescScore: tRadar("axes.metaDescScore"),
					},
				}}
				keywordLabels={{
					title: tKeywords("title"),
					yoursOnly: tKeywords("yoursOnly"),
					shared: tKeywords("shared"),
					competitorsOnly: tKeywords("competitorsOnly"),
					empty: tKeywords("empty"),
				}}
				tabLabels={{
					table: tTabs("table"),
					radar: tTabs("radar"),
					keywords: tTabs("keywords"),
				}}
				ranAtLabel={tCommon("ranAt")}
			/>

			<ComparisonHistory
				rows={history}
				labels={{
					title: tHistory("title"),
					empty: tHistory("empty"),
					ranAt: tHistory("ranAt"),
				}}
			/>
		</div>
	);
}
