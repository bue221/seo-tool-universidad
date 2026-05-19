package audit

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// All check functions return a WoorankCheck without Weight set —
// RunWoorank applies the canonical weights afterwards. This keeps
// the check functions focused on rule evaluation.

// ----- meta --------------------------------------------------------------

func checkTitle(doc *goquery.Document) WoorankCheck {
	c := WoorankCheck{ID: "title", Label: "Title tag length", Category: "meta"}
	t := strings.TrimSpace(doc.Find("title").First().Text())
	if t == "" {
		c.Status, c.Evidence = WoorankFail, "missing"
		return c
	}
	n := len(t)
	switch {
	case n >= 30 && n <= 70:
		c.Status = WoorankPass
	default:
		c.Status, c.Evidence = WoorankWarn, "length: "+strconv.Itoa(n)
	}
	return c
}

func checkMetaDescription(doc *goquery.Document) WoorankCheck {
	c := WoorankCheck{ID: "metaDescription", Label: "Meta description length", Category: "meta"}
	d, ok := doc.Find("meta[name='description']").Attr("content")
	d = strings.TrimSpace(d)
	if !ok || d == "" {
		c.Status, c.Evidence = WoorankFail, "missing"
		return c
	}
	n := len(d)
	switch {
	case n >= 70 && n <= 160:
		c.Status = WoorankPass
	default:
		c.Status, c.Evidence = WoorankWarn, "length: "+strconv.Itoa(n)
	}
	return c
}

func checkCharset(doc *goquery.Document) WoorankCheck {
	c := WoorankCheck{ID: "charset", Label: "Charset declared", Category: "meta"}
	v, ok := doc.Find("meta[charset]").First().Attr("charset")
	if !ok || v == "" {
		c.Status, c.Evidence = WoorankFail, "missing"
		return c
	}
	if strings.EqualFold(strings.TrimSpace(v), "utf-8") {
		c.Status = WoorankPass
		return c
	}
	c.Status, c.Evidence = WoorankWarn, v
	return c
}

func checkLangAttr(doc *goquery.Document) WoorankCheck {
	c := WoorankCheck{ID: "langAttr", Label: "<html lang> attribute", Category: "meta"}
	v, ok := doc.Find("html").First().Attr("lang")
	v = strings.TrimSpace(v)
	switch {
	case !ok:
		c.Status, c.Evidence = WoorankFail, "missing"
	case v == "":
		c.Status, c.Evidence = WoorankWarn, "empty"
	default:
		c.Status = WoorankPass
	}
	return c
}

// ----- headings ----------------------------------------------------------

func checkH1Single(doc *goquery.Document) WoorankCheck {
	c := WoorankCheck{ID: "h1Single", Label: "Exactly one H1", Category: "headings"}
	n := doc.Find("h1").Length()
	switch {
	case n == 1:
		c.Status = WoorankPass
	case n == 0:
		c.Status, c.Evidence = WoorankFail, "count: 0"
	default:
		c.Status, c.Evidence = WoorankWarn, "count: "+strconv.Itoa(n)
	}
	return c
}

// checkHeadingHierarchy walks h1..h6 in document order and counts jumps > 1
// (h1 → h3 = a jump of 2). 0 jumps = pass, 1–2 = warn, 3+ = fail.
func checkHeadingHierarchy(doc *goquery.Document) WoorankCheck {
	c := WoorankCheck{ID: "headingHierarchy", Label: "Heading hierarchy", Category: "headings"}
	jumps := 0
	prev := 0
	doc.Find("h1, h2, h3, h4, h5, h6").Each(func(_ int, s *goquery.Selection) {
		name := goquery.NodeName(s)
		if len(name) != 2 {
			return
		}
		level := int(name[1] - '0')
		if prev > 0 && level-prev > 1 {
			jumps++
		}
		prev = level
	})
	switch {
	case jumps == 0:
		c.Status = WoorankPass
	case jumps <= 2:
		c.Status, c.Evidence = WoorankWarn, "jumps: "+strconv.Itoa(jumps)
	default:
		c.Status, c.Evidence = WoorankFail, "jumps: "+strconv.Itoa(jumps)
	}
	return c
}

// ----- mobile ------------------------------------------------------------

func checkViewport(doc *goquery.Document) WoorankCheck {
	c := WoorankCheck{ID: "viewport", Label: "Mobile viewport meta", Category: "mobile"}
	v, ok := doc.Find("meta[name='viewport']").Attr("content")
	if !ok {
		c.Status, c.Evidence = WoorankFail, "missing"
		return c
	}
	if strings.Contains(strings.ToLower(v), "width=device-width") {
		c.Status = WoorankPass
		return c
	}
	c.Status, c.Evidence = WoorankWarn, "no device-width"
	return c
}

// ----- security ----------------------------------------------------------

func checkHTTPS(finalURL string) WoorankCheck {
	c := WoorankCheck{ID: "https", Label: "Served over HTTPS", Category: "security"}
	if strings.HasPrefix(strings.ToLower(finalURL), "https://") {
		c.Status = WoorankPass
		return c
	}
	c.Status, c.Evidence = WoorankFail, "not https"
	return c
}

// ----- indexing ----------------------------------------------------------

func checkCanonical(doc *goquery.Document) WoorankCheck {
	c := WoorankCheck{ID: "canonical", Label: "Canonical link", Category: "indexing"}
	href, ok := doc.Find("link[rel='canonical']").Attr("href")
	href = strings.TrimSpace(href)
	switch {
	case !ok || href == "":
		c.Status, c.Evidence = WoorankFail, "missing"
	case !strings.HasPrefix(href, "http://") && !strings.HasPrefix(href, "https://"):
		c.Status, c.Evidence = WoorankWarn, "relative href"
	default:
		c.Status = WoorankPass
	}
	return c
}

var disallowAllRE = regexp.MustCompile(`(?im)^\s*user-agent:\s*\*\s*$\s*disallow:\s*/\s*$`)

func checkRobotsTxt(ctx context.Context, client *http.Client, origin string) WoorankCheck {
	c := WoorankCheck{ID: "robotsTxt", Label: "robots.txt available", Category: "indexing"}
	body, status, err := fetchString(ctx, client, origin+"/robots.txt", 8192)
	if err != nil || status >= 400 {
		c.Status, c.Evidence = WoorankWarn, "unreachable"
		return c
	}
	if disallowAllRE.MatchString(body) {
		c.Status, c.Evidence = WoorankWarn, "site blocks all crawlers"
		return c
	}
	c.Status = WoorankPass
	return c
}

func checkSitemapXml(ctx context.Context, client *http.Client, origin string) WoorankCheck {
	c := WoorankCheck{ID: "sitemapXml", Label: "sitemap.xml available", Category: "indexing"}
	body, status, err := fetchString(ctx, client, origin+"/sitemap.xml", 4096)
	if err != nil || status >= 400 {
		c.Status, c.Evidence = WoorankWarn, "unreachable"
		return c
	}
	if strings.Contains(body, "<urlset") || strings.Contains(body, "<sitemapindex") {
		c.Status = WoorankPass
		return c
	}
	c.Status, c.Evidence = WoorankWarn, "no urlset"
	return c
}

func checkFavicon(ctx context.Context, client *http.Client, doc *goquery.Document, origin string) WoorankCheck {
	c := WoorankCheck{ID: "favicon", Label: "Favicon declared", Category: "meta"}
	// 1) <link rel="icon"> with a non-empty href passes immediately.
	if href, ok := doc.Find("link[rel='icon'], link[rel='shortcut icon']").First().Attr("href"); ok && strings.TrimSpace(href) != "" {
		c.Status = WoorankPass
		return c
	}
	// 2) Fall back to a HEAD-equivalent GET on /favicon.ico.
	_, status, err := fetchString(ctx, client, origin+"/favicon.ico", 64)
	if err == nil && status < 400 {
		c.Status = WoorankPass
		return c
	}
	c.Status, c.Evidence = WoorankWarn, "missing"
	return c
}

// ----- social ------------------------------------------------------------

func checkOpenGraph(doc *goquery.Document) WoorankCheck {
	c := WoorankCheck{ID: "openGraph", Label: "Open Graph tags", Category: "social"}
	required := []string{"og:title", "og:description", "og:image"}
	missing := []string{}
	for _, key := range required {
		if v, ok := doc.Find("meta[property='" + key + "']").First().Attr("content"); !ok || strings.TrimSpace(v) == "" {
			missing = append(missing, key)
		}
	}
	switch len(missing) {
	case 0:
		c.Status = WoorankPass
	case 3:
		c.Status, c.Evidence = WoorankFail, "missing all og tags"
	default:
		c.Status, c.Evidence = WoorankWarn, "missing: "+strings.Join(missing, ",")
	}
	return c
}

var twitterCardValid = map[string]bool{
	"summary": true, "summary_large_image": true, "app": true, "player": true,
}

func checkTwitterCard(doc *goquery.Document) WoorankCheck {
	c := WoorankCheck{ID: "twitterCard", Label: "Twitter card", Category: "social"}
	v, ok := doc.Find("meta[name='twitter:card']").First().Attr("content")
	v = strings.TrimSpace(strings.ToLower(v))
	switch {
	case !ok || v == "":
		c.Status, c.Evidence = WoorankFail, "missing"
	case twitterCardValid[v]:
		c.Status = WoorankPass
	default:
		c.Status, c.Evidence = WoorankWarn, "unknown card: "+v
	}
	return c
}

// ----- schema ------------------------------------------------------------

var jsonLDBlockRE = regexp.MustCompile(`(?is)<script[^>]+type\s*=\s*["']application/ld\+json["'][^>]*>(.*?)</script>`)

func checkStructuredData(rawHTML string) WoorankCheck {
	c := WoorankCheck{ID: "structuredData", Label: "Structured data (JSON-LD)", Category: "schema"}
	matches := jsonLDBlockRE.FindAllStringSubmatch(rawHTML, -1)
	if len(matches) == 0 {
		c.Status, c.Evidence = WoorankFail, "missing"
		return c
	}
	for _, m := range matches {
		body := strings.TrimSpace(m[1])
		if body == "" {
			continue
		}
		if json.Valid([]byte(body)) {
			c.Status = WoorankPass
			return c
		}
	}
	c.Status, c.Evidence = WoorankWarn, "invalid JSON-LD"
	return c
}

// ----- a11y --------------------------------------------------------------

func checkImageAltCoverage(coverage float64) WoorankCheck {
	c := WoorankCheck{ID: "imageAltCoverage", Label: "Image alt coverage", Category: "a11y"}
	switch {
	case coverage >= 0.9:
		c.Status = WoorankPass
	case coverage >= 0.7:
		c.Status, c.Evidence = WoorankWarn, "coverage: "+strconv.FormatFloat(coverage, 'f', 2, 64)
	default:
		c.Status, c.Evidence = WoorankFail, "coverage: "+strconv.FormatFloat(coverage, 'f', 2, 64)
	}
	return c
}

// ----- helpers -----------------------------------------------------------

// fetchString performs a GET and returns up to maxBytes of body as string,
// along with the HTTP status code. Honors the request context (timeout).
func fetchString(ctx context.Context, client *http.Client, url string, maxBytes int64) (string, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", 0, err
	}
	req.Header.Set("User-Agent", "seo-custom-tool/woorank")
	resp, err := client.Do(req)
	if err != nil {
		return "", 0, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, maxBytes))
	return string(body), resp.StatusCode, nil
}
