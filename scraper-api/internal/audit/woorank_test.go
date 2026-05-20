package audit

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// ---- helpers ------------------------------------------------------------

func mustDoc(t *testing.T, html string) *goquery.Document {
	t.Helper()
	d, err := goquery.NewDocumentFromReader(strings.NewReader(html))
	if err != nil {
		t.Fatalf("parse html: %v", err)
	}
	return d
}

// ---- per-check truth table ---------------------------------------------

func TestCheckTitle(t *testing.T) {
	cases := []struct {
		name string
		html string
		want WoorankStatus
	}{
		{"missing", `<html></html>`, WoorankFail},
		{"too short", `<title>short</title>`, WoorankWarn},
		{"in range", `<title>` + strings.Repeat("a", 45) + `</title>`, WoorankPass},
		{"too long", `<title>` + strings.Repeat("a", 200) + `</title>`, WoorankWarn},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := checkTitle(mustDoc(t, tc.html)).Status
			if got != tc.want {
				t.Fatalf("got %s, want %s", got, tc.want)
			}
		})
	}
}

func TestCheckMetaDescription(t *testing.T) {
	good := strings.Repeat("a", 120)
	cases := []struct {
		name string
		html string
		want WoorankStatus
	}{
		{"missing", `<html></html>`, WoorankFail},
		{"good", `<meta name="description" content="` + good + `">`, WoorankPass},
		{"short", `<meta name="description" content="too short">`, WoorankWarn},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := checkMetaDescription(mustDoc(t, tc.html)).Status
			if got != tc.want {
				t.Fatalf("got %s, want %s", got, tc.want)
			}
		})
	}
}

func TestCheckH1Single(t *testing.T) {
	cases := map[string]struct {
		html string
		want WoorankStatus
	}{
		"none":     {`<html></html>`, WoorankFail},
		"single":   {`<h1>hi</h1>`, WoorankPass},
		"multiple": {`<h1>a</h1><h1>b</h1>`, WoorankWarn},
	}
	for n, tc := range cases {
		t.Run(n, func(t *testing.T) {
			if got := checkH1Single(mustDoc(t, tc.html)).Status; got != tc.want {
				t.Fatalf("got %s want %s", got, tc.want)
			}
		})
	}
}

func TestCheckHeadingHierarchy(t *testing.T) {
	cases := map[string]struct {
		html string
		want WoorankStatus
	}{
		"clean":  {`<h1>a</h1><h2>b</h2><h3>c</h3>`, WoorankPass},
		"1 jump": {`<h1>a</h1><h3>c</h3>`, WoorankWarn},
		"3 jumps": {
			`<h1>a</h1><h3>b</h3><h2>c</h2><h5>d</h5><h2>e</h2><h6>f</h6>`,
			WoorankFail,
		},
	}
	for n, tc := range cases {
		t.Run(n, func(t *testing.T) {
			if got := checkHeadingHierarchy(mustDoc(t, tc.html)).Status; got != tc.want {
				t.Fatalf("got %s want %s", got, tc.want)
			}
		})
	}
}

func TestCheckViewport(t *testing.T) {
	cases := map[string]struct {
		html string
		want WoorankStatus
	}{
		"missing": {`<html></html>`, WoorankFail},
		"good":    {`<meta name="viewport" content="width=device-width, initial-scale=1">`, WoorankPass},
		"weak":    {`<meta name="viewport" content="initial-scale=1">`, WoorankWarn},
	}
	for n, tc := range cases {
		t.Run(n, func(t *testing.T) {
			if got := checkViewport(mustDoc(t, tc.html)).Status; got != tc.want {
				t.Fatalf("got %s want %s", got, tc.want)
			}
		})
	}
}

func TestCheckCharset(t *testing.T) {
	cases := map[string]struct {
		html string
		want WoorankStatus
	}{
		"utf-8":   {`<meta charset="UTF-8">`, WoorankPass},
		"latin1":  {`<meta charset="ISO-8859-1">`, WoorankWarn},
		"missing": {`<html></html>`, WoorankFail},
	}
	for n, tc := range cases {
		t.Run(n, func(t *testing.T) {
			if got := checkCharset(mustDoc(t, tc.html)).Status; got != tc.want {
				t.Fatalf("got %s want %s", got, tc.want)
			}
		})
	}
}

func TestCheckHTTPS(t *testing.T) {
	if checkHTTPS("https://x.com").Status != WoorankPass {
		t.Fatal("https should pass")
	}
	if checkHTTPS("http://x.com").Status != WoorankFail {
		t.Fatal("http should fail")
	}
}

func TestCheckLangAttr(t *testing.T) {
	if checkLangAttr(mustDoc(t, `<html lang="es"><body></body></html>`)).Status != WoorankPass {
		t.Fatal("non-empty lang should pass")
	}
	if checkLangAttr(mustDoc(t, `<html lang=""><body></body></html>`)).Status != WoorankWarn {
		t.Fatal("empty lang should warn")
	}
	if checkLangAttr(mustDoc(t, `<html><body></body></html>`)).Status != WoorankFail {
		t.Fatal("missing lang should fail")
	}
}

func TestCheckCanonical(t *testing.T) {
	cases := map[string]struct {
		html string
		want WoorankStatus
	}{
		"absolute": {`<link rel="canonical" href="https://x.com/y">`, WoorankPass},
		"relative": {`<link rel="canonical" href="/y">`, WoorankWarn},
		"missing":  {`<html></html>`, WoorankFail},
	}
	for n, tc := range cases {
		t.Run(n, func(t *testing.T) {
			if got := checkCanonical(mustDoc(t, tc.html)).Status; got != tc.want {
				t.Fatalf("got %s want %s", got, tc.want)
			}
		})
	}
}

func TestCheckOpenGraph(t *testing.T) {
	full := `<meta property="og:title" content="t">
		<meta property="og:description" content="d">
		<meta property="og:image" content="i">`
	cases := map[string]struct {
		html string
		want WoorankStatus
	}{
		"all":     {full, WoorankPass},
		"partial": {`<meta property="og:title" content="t">`, WoorankWarn},
		"none":    {`<html></html>`, WoorankFail},
	}
	for n, tc := range cases {
		t.Run(n, func(t *testing.T) {
			if got := checkOpenGraph(mustDoc(t, tc.html)).Status; got != tc.want {
				t.Fatalf("got %s want %s", got, tc.want)
			}
		})
	}
}

func TestCheckTwitterCard(t *testing.T) {
	cases := map[string]struct {
		html string
		want WoorankStatus
	}{
		"valid":   {`<meta name="twitter:card" content="summary_large_image">`, WoorankPass},
		"unknown": {`<meta name="twitter:card" content="weird">`, WoorankWarn},
		"missing": {`<html></html>`, WoorankFail},
	}
	for n, tc := range cases {
		t.Run(n, func(t *testing.T) {
			if got := checkTwitterCard(mustDoc(t, tc.html)).Status; got != tc.want {
				t.Fatalf("got %s want %s", got, tc.want)
			}
		})
	}
}

func TestCheckStructuredData(t *testing.T) {
	cases := map[string]struct {
		html string
		want WoorankStatus
	}{
		"valid":   {`<script type="application/ld+json">{"@context":"https://schema.org"}</script>`, WoorankPass},
		"invalid": {`<script type="application/ld+json">{"@context": not json}</script>`, WoorankWarn},
		"missing": {`<html></html>`, WoorankFail},
	}
	for n, tc := range cases {
		t.Run(n, func(t *testing.T) {
			if got := checkStructuredData(tc.html).Status; got != tc.want {
				t.Fatalf("got %s want %s", got, tc.want)
			}
		})
	}
}

func TestCheckImageAltCoverage(t *testing.T) {
	if checkImageAltCoverage(0.95).Status != WoorankPass {
		t.Fatal("≥0.9 should pass")
	}
	if checkImageAltCoverage(0.75).Status != WoorankWarn {
		t.Fatal("[0.7,0.9) should warn")
	}
	if checkImageAltCoverage(0.30).Status != WoorankFail {
		t.Fatal("<0.7 should fail")
	}
}

// ---- sub-request checks (httptest) -------------------------------------

func TestCheckRobotsTxtPass(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/robots.txt" {
			_, _ = w.Write([]byte("User-agent: *\nDisallow: /private\n"))
			return
		}
		w.WriteHeader(404)
	}))
	defer srv.Close()
	got := checkRobotsTxt(context.Background(), srv.Client(), srv.URL)
	if got.Status != WoorankPass {
		t.Fatalf("got %+v", got)
	}
}

func TestCheckRobotsTxtDisallowAll(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("User-agent: *\nDisallow: /\n"))
	}))
	defer srv.Close()
	got := checkRobotsTxt(context.Background(), srv.Client(), srv.URL)
	if got.Status != WoorankWarn {
		t.Fatalf("got %+v", got)
	}
}

func TestCheckRobotsTxtUnreachable(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
	}))
	defer srv.Close()
	got := checkRobotsTxt(context.Background(), srv.Client(), srv.URL)
	if got.Status != WoorankWarn {
		t.Fatalf("got %+v", got)
	}
}

func TestCheckSitemapXmlPass(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/xml")
		_, _ = w.Write([]byte(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://x</loc></url></urlset>`))
	}))
	defer srv.Close()
	got := checkSitemapXml(context.Background(), srv.Client(), srv.URL)
	if got.Status != WoorankPass {
		t.Fatalf("got %+v", got)
	}
}

func TestCheckFaviconFromTag(t *testing.T) {
	doc := mustDoc(t, `<link rel="icon" href="/static/fav.ico">`)
	got := checkFavicon(context.Background(), &http.Client{Timeout: time.Second}, doc, "http://invalid.invalid")
	if got.Status != WoorankPass {
		t.Fatalf("expected tag-only path to pass without hitting network: %+v", got)
	}
}

// ---- aggregate scoring -------------------------------------------------

func TestComputeWoorankScore(t *testing.T) {
	checks := []WoorankCheck{
		{ID: "a", Status: WoorankPass, Weight: 2.0},
		{ID: "b", Status: WoorankWarn, Weight: 2.0},
		{ID: "c", Status: WoorankFail, Weight: 1.0},
	}
	// Σ outcome*weight = 2 + 1 + 0 = 3
	// Σ weight = 5
	got := computeWoorankScore(checks)
	want := 3.0 / 5.0
	if got != want {
		t.Fatalf("got %v want %v", got, want)
	}
}

func TestRunWoorankDeterministic(t *testing.T) {
	html := `<!doctype html><html lang="es"><head>
<meta charset="UTF-8">
<title>` + strings.Repeat("a", 45) + `</title>
<meta name="description" content="` + strings.Repeat("d", 120) + `">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="canonical" href="https://x.com/y">
<link rel="icon" href="/fav.ico">
<meta property="og:title" content="t">
<meta property="og:description" content="d">
<meta property="og:image" content="i">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">{"@context":"https://schema.org"}</script>
</head><body><h1>only</h1></body></html>`

	// Use an unreachable origin: robots/sitemap will warn, favicon passes from tag.
	in := WoorankInput{
		FinalURL:    "https://example.test/",
		Document:    mustDoc(t, html),
		RawHTML:     html,
		HTTPClient:  &http.Client{Timeout: 200 * time.Millisecond},
		AltCoverage: 0.95,
	}
	r1 := RunWoorank(context.Background(), in)
	r2 := RunWoorank(context.Background(), in)
	if r1.Score != r2.Score {
		t.Fatalf("non-deterministic score: %v vs %v", r1.Score, r2.Score)
	}
	if len(r1.Checks) != 16 {
		t.Fatalf("expected 16 checks, got %d", len(r1.Checks))
	}
	// Weights must be assigned.
	for _, c := range r1.Checks {
		if c.Weight == 0 {
			t.Fatalf("check %s has zero weight", c.ID)
		}
	}
	if r1.Score <= 0 || r1.Score > 1 {
		t.Fatalf("score out of range: %v", r1.Score)
	}
}

func TestOriginOf(t *testing.T) {
	if got := originOf("https://example.com/path?a=1"); got != "https://example.com" {
		t.Fatalf("got %q", got)
	}
	if got := originOf("not a url"); got != "not a url" {
		t.Fatalf("got %q", got)
	}
}

func TestFetchStringRespectsMaxBytes(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("abcdefghijklmnopqrstuvwxyz"))
	}))
	defer srv.Close()

	body, status, err := fetchString(context.Background(), srv.Client(), srv.URL, 5)
	if err != nil {
		t.Fatalf("fetchString err: %v", err)
	}
	if status != 200 {
		t.Fatalf("status = %d", status)
	}
	if body != "abcde" {
		t.Fatalf("body = %q, want %q", body, "abcde")
	}
}
