"use client";

const DEFAULT_MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export type WebLLMInitProgress = {
	/** 0..1 */
	progress: number;
	text?: string;
	loadedBytes?: number;
	totalBytes?: number;
};

type InitProgressReport = {
	progress?: number;
	text?: string;
	loaded?: number;
	total?: number;
	loadedBytes?: number;
	totalBytes?: number;
};

type ChatCompletionChunk = {
	choices?: Array<{
		delta?: { content?: string };
		message?: { content?: string };
	}>;
};

type MlcEngine = {
	chat: {
		completions: {
			create: (req: {
				stream: true;
				messages: Array<{
					role: "system" | "user" | "assistant";
					content: string;
				}>;
				temperature?: number;
				max_tokens?: number;
			}) =>
				| Promise<AsyncIterable<ChatCompletionChunk>>
				| AsyncIterable<ChatCompletionChunk>;
		};
	};
};

let enginePromise: Promise<MlcEngine> | null = null;
let engineModelId: string | null = null;

export function getDefaultWebLLMModelId() {
	return DEFAULT_MODEL_ID;
}

export function isWebGPUAvailable() {
	return (
		typeof navigator !== "undefined" &&
		!!(navigator as unknown as { gpu?: unknown }).gpu
	);
}

export function resetWebLLMEngine() {
	enginePromise = null;
	engineModelId = null;
}

async function importWebLLM() {
	// HARD REQUIREMENT: no SSR import. Keep it fully dynamic.
	return (await import("@mlc-ai/web-llm")) as unknown as {
		CreateMLCEngine: (
			modelId: string,
			opts: { initProgressCallback?: (report: InitProgressReport) => void },
		) => Promise<MlcEngine>;
	};
}

function toProgress(report: InitProgressReport): WebLLMInitProgress {
	const rawProgress =
		typeof report?.progress === "number" ? report.progress : 0;
	const loaded =
		typeof report?.loaded === "number"
			? report.loaded
			: typeof report?.loadedBytes === "number"
				? report.loadedBytes
				: undefined;
	const total =
		typeof report?.total === "number"
			? report.total
			: typeof report?.totalBytes === "number"
				? report.totalBytes
				: undefined;

	return {
		progress: Math.max(0, Math.min(1, rawProgress)),
		text: typeof report?.text === "string" ? report.text : undefined,
		loadedBytes: loaded,
		totalBytes: total,
	};
}

export async function getOrCreateWebLLMEngine({
	modelId = DEFAULT_MODEL_ID,
	onInitProgress,
}: {
	modelId?: string;
	onInitProgress?: (p: WebLLMInitProgress) => void;
} = {}) {
	if (enginePromise && engineModelId === modelId) return await enginePromise;

	engineModelId = modelId;
	enginePromise = (async () => {
		const { CreateMLCEngine } = await importWebLLM();
		const engine = await CreateMLCEngine(modelId, {
			initProgressCallback: (report) => {
				onInitProgress?.(toProgress(report));
			},
		});
		return engine;
	})();

	try {
		return await enginePromise;
	} catch (err) {
		resetWebLLMEngine();
		throw err;
	}
}

export async function* streamChatCompletion({
	engine,
	messages,
	temperature = 0.2,
	maxTokens,
}: {
	engine: MlcEngine;
	messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
	temperature?: number;
	maxTokens?: number;
}): AsyncGenerator<string, void, void> {
	const stream = await engine.chat.completions.create({
		stream: true,
		messages,
		temperature,
		...(typeof maxTokens === "number" ? { max_tokens: maxTokens } : null),
	});

	for await (const chunk of stream) {
		const delta =
			chunk.choices?.[0]?.delta?.content ??
			chunk.choices?.[0]?.message?.content ??
			"";
		if (delta) yield String(delta);
	}
}

const DB_NAME_MATCHERS = [/webllm/i, /mlc/i, /tvm/i];
const CACHE_NAME_MATCHERS = [/webllm/i, /mlc/i, /tvm/i];

export async function clearWebLLMCaches() {
	const deletedIndexedDB: string[] = [];
	const deletedCaches: string[] = [];

	// IndexedDB best-effort (Chrome/Edge).
	try {
		if (typeof indexedDB !== "undefined" && "databases" in indexedDB) {
			const dbs = await (
				indexedDB as unknown as {
					databases: () => Promise<Array<{ name?: string }>>;
				}
			).databases();
			await Promise.all(
				(dbs ?? []).map((db) => {
					const name = String(db?.name ?? "");
					if (!name) return;
					if (!DB_NAME_MATCHERS.some((m) => m.test(name))) return;

					return new Promise<void>((resolve) => {
						const req = indexedDB.deleteDatabase(name);
						req.onsuccess = () => {
							deletedIndexedDB.push(name);
							resolve();
						};
						req.onerror = () => resolve();
						req.onblocked = () => resolve();
					});
				}),
			);
		}
	} catch {
		// ignore
	}

	// CacheStorage best-effort.
	try {
		if (typeof caches !== "undefined") {
			const keys = await caches.keys();
			await Promise.all(
				keys.map(async (key) => {
					if (!CACHE_NAME_MATCHERS.some((m) => m.test(key))) return;
					const ok = await caches.delete(key);
					if (ok) deletedCaches.push(key);
				}),
			);
		}
	} catch {
		// ignore
	}

	// NOTE: WebLLM also caches weights in IndexedDB; clearing above is best-effort.
	resetWebLLMEngine();

	return { deletedIndexedDB, deletedCaches };
}
