import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditResult, ScraperAudit } from "@/lib/audit/types";

export async function SiteTreeSection({ result }: { result: AuditResult }) {
	const t = await getTranslations("Audit.Result.Intelligence");

	if (!result.scraper) {
		return (
			<Card className="border-destructive">
				<CardContent className="p-4 text-sm">
					{t("structure.unavailable")}
				</CardContent>
			</Card>
		);
	}

	const structure = result.scraper.siteStructure;
	const crawl = result.scraper.crawl;

	if (!structure || structure.nodes.length === 0) {
		return (
			<Card>
				<CardContent className="p-4 text-sm text-muted-foreground">
					{t("structure.empty")}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-wrap items-center gap-2">
					<CardTitle>{t("structure.title")}</CardTitle>
					{crawl ? (
						<CrawlSummary
							crawl={crawl}
							labels={{
								pages: t("structure.pages"),
								depth: t("structure.depth"),
								truncated: t("structure.truncated"),
							}}
						/>
					) : null}
				</div>
			</CardHeader>
			<CardContent>
				<SiteTree
					nodes={structure.nodes}
					childrenLabel={t("structure.children")}
				/>
			</CardContent>
		</Card>
	);
}

function CrawlSummary({
	crawl,
	labels,
}: {
	crawl: NonNullable<ScraperAudit["crawl"]>;
	labels: { pages: string; depth: string; truncated: string };
}) {
	return (
		<>
			<Badge variant="outline">
				{crawl.pagesVisited}/{crawl.maxPages} {labels.pages}
			</Badge>
			<Badge variant="outline">
				{labels.depth}: {crawl.maxDepth}
			</Badge>
			{crawl.truncated ? (
				<Badge className="bg-amber-500/20 text-amber-200">
					{labels.truncated}
				</Badge>
			) : null}
		</>
	);
}

function SiteTree({
	nodes,
	childrenLabel,
}: {
	nodes: NonNullable<NonNullable<ScraperAudit["siteStructure"]>["nodes"]>;
	childrenLabel: string;
}) {
	const byId = new Map(nodes.map((n) => [n.id, n]));
	const root = nodes.find((n) => n.depth === 0) ?? nodes[0];
	if (!root) return null;

	return (
		<ul className="space-y-2 text-sm">
			<TreeNode
				node={root}
				byId={byId}
				visited={new Set<string>()}
				childrenLabel={childrenLabel}
			/>
		</ul>
	);
}

function TreeNode({
	node,
	byId,
	visited,
	childrenLabel,
}: {
	node: NonNullable<
		NonNullable<ScraperAudit["siteStructure"]>["nodes"]
	>[number];
	byId: Map<
		string,
		NonNullable<NonNullable<ScraperAudit["siteStructure"]>["nodes"]>[number]
	>;
	visited: Set<string>;
	childrenLabel: string;
}) {
	if (visited.has(node.id)) return null;
	const nextVisited = new Set(visited);
	nextVisited.add(node.id);

	const children = node.children
		.map((childId) => byId.get(childId))
		.filter(
			(
				child,
			): child is NonNullable<
				NonNullable<ScraperAudit["siteStructure"]>["nodes"]
			>[number] => Boolean(child),
		);

	const hasChildren = children.length > 0;

	return (
		<li>
			{hasChildren ? (
				<details open={node.depth < 1} className="group">
					<summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-surface-1/50 px-2 py-1 marker:hidden hover:bg-surface-2/60">
						<span className="font-mono text-xs text-primary">{node.label}</span>
						<span className="text-[10px] uppercase tracking-wide text-muted-foreground">
							{children.length} {childrenLabel}
						</span>
					</summary>
					<ul className="mt-2 space-y-2 border-l border-border/60 pl-4">
						{children.map((child) => (
							<TreeNode
								key={child.id}
								node={child}
								byId={byId}
								visited={nextVisited}
								childrenLabel={childrenLabel}
							/>
						))}
					</ul>
				</details>
			) : (
				<div className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-surface-1/50 px-2 py-1">
					<span className="font-mono text-xs text-primary">{node.label}</span>
				</div>
			)}
		</li>
	);
}
