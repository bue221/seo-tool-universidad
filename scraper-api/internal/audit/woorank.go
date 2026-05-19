package audit

// WooRank-style technical SEO checker.
//
// Replicates the verifiable subset of WooRank's on-page checklist using the
// HTML/DOM already loaded by Playwright. 12 checks are synchronous over the
// in-memory document; 3 (robots.txt, sitemap.xml, favicon) issue parallel
// sub-requests with a strict timeout.
//
// Contract: see openspec/specs/audit-contract/spec.md (v0.2.0+) and
// openspec/changes/woorank-checker/.

import (
	"context"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// WoorankInput is everything the checker needs. It is decoupled from
// Playwright so tests can drive it with arbitrary HTML + httptest servers.
type WoorankInput struct {
	// FinalURL is the URL after redirects (used for https + same-origin sub-requests).
	FinalURL string
	// Document is the parsed DOM, reused across runners.
	Document *goquery.Document
	// RawHTML is the original HTML body, used for fast substring checks
	// (e.g. JSON-LD parseability) where re-serializing the DOM is wasteful.
	RawHTML string
	// HTTPClient drives the sub-requests. If nil, a sane default is used.
	HTTPClient *http.Client
	// AltCoverage is the already-computed image alt coverage from on-page.
	AltCoverage float64
}

// Per-check weight. Sum = 22.0. Critical-SEO checks weigh 2.0,
// indexing/mobile/a11y 1.5, the rest 1.0, vanity 0.5.
var woorankWeights = map[string]float64{
	"title":             2.0,
	"metaDescription":   2.0,
	"h1Single":          2.0,
	"https":             2.0,
	"viewport":          1.5,
	"canonical":         1.5,
	"robotsTxt":         1.5,
	"sitemapXml":        1.5,
	"structuredData":    1.5,
	"imageAltCoverage":  1.5,
	"headingHierarchy":  1.0,
	"charset":           1.0,
	"langAttr":          1.0,
	"openGraph":         1.0,
	"favicon":           0.5,
	"twitterCard":       0.5,
}

// RunWoorank executes all 16 checks and aggregates the score.
// It never returns an error: sub-request failures collapse into "fail"/"warn"
// checks with evidence describing the cause.
func RunWoorank(ctx context.Context, in WoorankInput) *WoorankResult {
	client := in.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: 5 * time.Second}
	}

	origin := originOf(in.FinalURL)

	// 12 synchronous checks against the in-memory DOM/HTML.
	syncChecks := []WoorankCheck{
		checkTitle(in.Document),
		checkMetaDescription(in.Document),
		checkH1Single(in.Document),
		checkHeadingHierarchy(in.Document),
		checkViewport(in.Document),
		checkCharset(in.Document),
		checkHTTPS(in.FinalURL),
		checkLangAttr(in.Document),
		checkCanonical(in.Document),
		checkOpenGraph(in.Document),
		checkTwitterCard(in.Document),
		checkStructuredData(in.RawHTML),
		checkImageAltCoverage(in.AltCoverage),
	}

	// 3 parallel sub-requests with a hard timeout. We never bubble the
	// context error: the worst case is a "warn" check with evidence.
	var (
		wg                              sync.WaitGroup
		robotsRes, sitemapRes, favIcon  WoorankCheck
	)
	wg.Add(3)
	go func() { defer wg.Done(); robotsRes = checkRobotsTxt(ctx, client, origin) }()
	go func() { defer wg.Done(); sitemapRes = checkSitemapXml(ctx, client, origin) }()
	go func() { defer wg.Done(); favIcon = checkFavicon(ctx, client, in.Document, origin) }()
	wg.Wait()

	all := append(syncChecks, robotsRes, sitemapRes, favIcon)

	// Apply canonical weights and compute the aggregate score.
	for i, c := range all {
		all[i].Weight = woorankWeights[c.ID]
	}

	return &WoorankResult{
		Score:  computeWoorankScore(all),
		Checks: all,
	}
}

// computeWoorankScore is Σ(weight × outcome) / Σ(weight).
// outcome: pass = 1.0, warn = 0.5, fail = 0.0.
func computeWoorankScore(checks []WoorankCheck) float64 {
	var num, den float64
	for _, c := range checks {
		den += c.Weight
		switch c.Status {
		case WoorankPass:
			num += c.Weight * 1.0
		case WoorankWarn:
			num += c.Weight * 0.5
		case WoorankFail:
			// 0
		}
	}
	if den == 0 {
		return 0
	}
	return num / den
}

// originOf returns scheme://host (no path, no trailing slash). Falls back to
// the input when parsing fails — sub-request checks will then degrade to warn.
func originOf(raw string) string {
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" {
		return raw
	}
	return u.Scheme + "://" + u.Host
}
