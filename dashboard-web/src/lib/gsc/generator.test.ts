import { describe, expect, it } from "vitest";
import { getGscDataset, normalizeDomain } from "./generator";

describe("normalizeDomain", () => {
	it.each([
		["Example.com/", "example.com"],
		["https://example.com", "example.com"],
		["http://Example.COM/path/", "example.com"],
		[
			"seo-tool-universidad.vercel.app/en/overview",
			"seo-tool-universidad.vercel.app",
		],
		[
			"seo-tool-universidad.vercel.app%2Fen%2Foverview",
			"seo-tool-universidad.vercel.app",
		],
		["  spaced.com  ", "spaced.com"],
	])("normalizes %s → %s", (input, expected) => {
		expect(normalizeDomain(input)).toBe(expected);
	});
});

describe("getGscDataset", () => {
	it("is deterministic for the same (domain, range)", async () => {
		const a = await getGscDataset("example.com", 28);
		const b = await getGscDataset("example.com", 28);
		expect(a).toEqual(b);
	});

	it("honors the range length", async () => {
		for (const range of [7, 28, 90] as const) {
			const d = await getGscDataset("example.com", range);
			expect(d.series).toHaveLength(range);
			expect(d.range).toBe(range);
		}
	});

	it("returns the expected cardinalities", async () => {
		const d = await getGscDataset("example.com", 28);
		expect(d.queries).toHaveLength(50);
		expect(d.pages).toHaveLength(50);
		expect(d.devices).toHaveLength(3);
		expect(d.countries).toHaveLength(20);
	});

	it("keeps invariants on every row", async () => {
		const d = await getGscDataset("example.com", 28);
		const rows = [
			...d.series,
			...d.queries,
			...d.pages,
			...d.devices,
			...d.countries,
		];
		for (const r of rows) {
			expect(r.ctr).toBeGreaterThanOrEqual(0);
			expect(r.ctr).toBeLessThanOrEqual(1);
			expect(r.position).toBeGreaterThanOrEqual(1);
			expect(r.position).toBeLessThanOrEqual(100);
			expect(r.clicks).toBeGreaterThanOrEqual(0);
			expect(r.impressions).toBeGreaterThanOrEqual(0);
			expect(r.clicks).toBeLessThanOrEqual(r.impressions);
		}
	});

	it("produces different datasets for different domains", async () => {
		const a = await getGscDataset("example.com", 28);
		const b = await getGscDataset("competitor.io", 28);
		expect(a.totals.impressions).not.toBe(b.totals.impressions);
		// First query strings should diverge (brand is interpolated from domain).
		expect(a.queries[0]?.key).not.toBe(b.queries[0]?.key);
	});

	it("returns the TLD-dominant country first", async () => {
		const d = await getGscDataset("example.es", 28);
		expect(d.countries[0]?.countryCode).toBe("ES");
		const d2 = await getGscDataset("example.com", 28);
		expect(d2.countries[0]?.countryCode).toBe("US");
	});

	it("totals match the sum of the series", async () => {
		const d = await getGscDataset("example.com", 28);
		const clicksSum = d.series.reduce((acc, p) => acc + p.clicks, 0);
		const imprSum = d.series.reduce((acc, p) => acc + p.impressions, 0);
		expect(d.totals.clicks).toBe(clicksSum);
		expect(d.totals.impressions).toBe(imprSum);
	});

	it("series is in ascending date order", async () => {
		const d = await getGscDataset("example.com", 28);
		for (let i = 1; i < d.series.length; i++) {
			expect(d.series[i]!.date >= d.series[i - 1]!.date).toBe(true);
		}
	});

	it("matches snapshot for a known input", async () => {
		const d = await getGscDataset("example.com", 7);
		// Only snapshot stable scalar fields — series is large.
		expect({
			property: d.property,
			range: d.range,
			firstSeriesDate: d.series[0]?.date,
			lastSeriesDate: d.series.at(-1)?.date,
			seriesLen: d.series.length,
			topQuery: d.queries[0]?.key,
			topPage: d.pages[0]?.key,
			firstCountry: d.countries[0]?.countryCode,
		}).toMatchSnapshot();
	});
});
