"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isWebGPUAvailable } from "@/lib/ai/webllm";

export function AiPrivacyNotice({ className }: { className?: string }) {
	const t = useTranslations("Audit.Result.Intelligence");
	const webgpu = isWebGPUAvailable();

	return (
		<div
			className={cn(
				"rounded-lg border border-border bg-surface-2/40 p-3 text-sm",
				className,
			)}
		>
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="outline">{t("ai.badges.runsLocally")}</Badge>
				<Badge variant="outline">{t("ai.badges.noServerCalls")}</Badge>
				<Badge
					variant="outline"
					className={
						webgpu
							? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
							: "border-rose-500/30 bg-rose-500/10 text-rose-300"
					}
				>
					{webgpu ? t("ai.badges.webgpuReady") : t("ai.badges.webgpuMissing")}
				</Badge>
			</div>
			<p className="mt-2 text-xs text-muted-foreground">
				{t("ai.privacyBody")}
			</p>
		</div>
	);
}
