"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bot, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	getDefaultWebLLMModelId,
	getOrCreateWebLLMEngine,
	isWebGPUAvailable,
	streamChatCompletion,
	type WebLLMInitProgress,
} from "@/lib/ai/webllm";

function formatBytes(bytes?: number) {
	if (typeof bytes !== "number" || Number.isNaN(bytes)) return "";
	const units = ["B", "KB", "MB", "GB"];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function AiExplainButton({
	siteUrl,
	rec,
	context,
	modelId,
}: {
	siteUrl: string;
	rec: {
		title: string;
		reason: string;
		impact: "low" | "medium" | "high";
		effort: "low" | "medium" | "high";
	};
	context?: {
		globalScore?: number;
		pagespeed?: {
			performance: number;
			accessibility: number;
			bestPractices: number;
			seo: number;
		};
		onPage?: {
			title?: string;
			metaDescription?: string;
			h1Count?: number;
			imageAltCoverage?: number;
		};
	};
	modelId?: string;
}) {
	const t = useTranslations("Audit.Result.Intelligence");
	const locale = useLocale();
	const webgpu = isWebGPUAvailable();

	const [answer, setAnswer] = useState<string>("");
	const [busy, setBusy] = useState(false);
	const [loading, setLoading] = useState<WebLLMInitProgress | null>(null);
	const [open, setOpen] = useState(false);
	const cancelledRef = useRef(false);

	useEffect(() => {
		cancelledRef.current = false;
		return () => {
			cancelledRef.current = true;
		};
	}, []);

	const prompt = useMemo(() => {
		const lines: string[] = [];
		lines.push(`Website: ${siteUrl}`);
		if (typeof context?.globalScore === "number") {
			lines.push(`Global score: ${context.globalScore.toFixed(2)}`);
		}
		if (context?.pagespeed) {
			lines.push(
				`PageSpeed: perf ${context.pagespeed.performance}, a11y ${context.pagespeed.accessibility}, bp ${context.pagespeed.bestPractices}, seo ${context.pagespeed.seo}`,
			);
		}
		if (context?.onPage) {
			lines.push(
				`On-page: title "${context.onPage.title ?? ""}" | meta "${context.onPage.metaDescription ?? ""}" | h1 ${context.onPage.h1Count ?? 0} | img alt ${(context.onPage.imageAltCoverage ?? 0).toFixed(2)}`,
			);
		}
		lines.push("");
		lines.push(`Recommendation: ${rec.title}`);
		lines.push(`Reason: ${rec.reason}`);
		lines.push(`Impact: ${rec.impact}`);
		lines.push(`Effort: ${rec.effort}`);
		return lines.join("\n");
	}, [context, rec, siteUrl]);

	return (
		<div className="mt-4 space-y-2">
			<div className="flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					variant="secondary"
					disabled={!webgpu || busy}
					onClick={async () => {
						if (!webgpu) {
							toast.error(t("ai.errors.webgpuRequired"));
							return;
						}

						setOpen(true);
						setBusy(true);
						setAnswer("");

						try {
							setLoading({ progress: 0, text: t("ai.loading.start") });
							const engine = await getOrCreateWebLLMEngine({
								modelId: modelId ?? getDefaultWebLLMModelId(),
								onInitProgress: (p) => {
									if (cancelledRef.current) return;
									setLoading(p);
								},
							});

							if (!cancelledRef.current) setLoading(null);

							const language = locale.startsWith("es") ? "Spanish" : "English";
							const messages = [
								{
									role: "system" as const,
									content: `You are a practical SEO auditor assistant. Respond in ${language}. Use Markdown. Give: (1) why it matters, (2) step-by-step fix, (3) how to verify, (4) quick win vs deeper work. Keep it concise.`,
								},
								{
									role: "user" as const,
									content: prompt,
								},
							];

							for await (const delta of streamChatCompletion({
								engine,
								messages,
							})) {
								if (cancelledRef.current) break;
								setAnswer((prev) => prev + delta);
							}
						} catch (err) {
							if (!cancelledRef.current) setLoading(null);
							toast.error(t("ai.errors.generic"));
							console.error(err);
						} finally {
							if (!cancelledRef.current) setBusy(false);
						}
					}}
				>
					{busy ? <Loader2 className="size-4 animate-spin" /> : <Bot />}
					{busy ? t("ai.explain.running") : t("ai.explain.button")}
				</Button>

				<Button
					size="sm"
					variant="ghost"
					disabled={!open && !answer && !loading}
					onClick={() => setOpen((v) => !v)}
				>
					{open ? t("ai.explain.hide") : t("ai.explain.show")}
				</Button>
			</div>

			{loading ? (
				<div className="rounded-md border border-border/60 bg-surface-1/30 p-3">
					<div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
						<span>{loading.text ?? t("ai.loading.downloading")}</span>
						<span className="nums-tabular">
							{Math.round(loading.progress * 100)}%
							{typeof loading.loadedBytes === "number"
								? ` • ${formatBytes(loading.loadedBytes)}${typeof loading.totalBytes === "number" ? ` / ${formatBytes(loading.totalBytes)}` : ""}`
								: ""}
						</span>
					</div>
					<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border/60">
						<div
							className="h-full bg-primary"
							style={{ width: `${Math.round(loading.progress * 100)}%` }}
						/>
					</div>
				</div>
			) : null}

			{open && (answer || busy) ? (
				<div className="rounded-md border border-border/60 bg-surface-1/30 p-3">
					<div className="text-xs font-medium text-muted-foreground">
						{t("ai.explain.outputTitle")}
					</div>
					<pre className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
						{answer || (busy ? t("ai.explain.streaming") : "")}
					</pre>
				</div>
			) : null}
		</div>
	);
}
