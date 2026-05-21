"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearWebLLMCaches } from "@/lib/ai/webllm";

export function AiCacheControls() {
	const t = useTranslations("Audit.Result.Intelligence");
	const [pending, setPending] = useState(false);

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-1/30 px-3 py-2">
			<div>
				<div className="text-sm font-medium">{t("ai.cache.title")}</div>
				<div className="text-xs text-muted-foreground">
					{t("ai.cache.body")}
				</div>
			</div>
			<Button
				variant="outline"
				size="sm"
				disabled={pending}
				onClick={async () => {
					setPending(true);
					try {
						const { deletedCaches, deletedIndexedDB } =
							await clearWebLLMCaches();
						toast.success(
							t("ai.cache.cleared", {
								indexedDb: deletedIndexedDB.length,
								caches: deletedCaches.length,
							}),
						);
					} catch {
						toast.error(t("ai.cache.clearError"));
					} finally {
						setPending(false);
					}
				}}
			>
				<Trash2 className="size-4" />
				{pending ? t("ai.cache.clearing") : t("ai.cache.clearButton")}
			</Button>
		</div>
	);
}
