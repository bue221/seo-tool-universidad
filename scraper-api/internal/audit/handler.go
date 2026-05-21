package audit

import (
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/cplaza/seo-custom-tool/scraper-api/internal/browser"
	"github.com/cplaza/seo-custom-tool/scraper-api/internal/httpx"
	"github.com/gofiber/fiber/v2"
	"github.com/playwright-community/playwright-go"
)

type Handler struct {
	Pool          *browser.Pool
	MaxCrawlPages int
}

func NewHandler(pool *browser.Pool) *Handler {
	return &Handler{Pool: pool, MaxCrawlPages: crawlMaxPages}
}

func validURL(raw string) bool {
	u, err := url.Parse(raw)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https")
}

func (h *Handler) PostAudit(c *fiber.Ctx) error {
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "INVALID_BODY")
	}
	if !validURL(req.URL) {
		return httpx.Error(c, fiber.StatusBadRequest, "INVALID_URL")
	}

	recorder := newStageRecorder()

	ctx, err := h.Pool.Acquire(c.Context())
	if err != nil {
		return httpx.Error(c, fiber.StatusInternalServerError, "INTERNAL")
	}
	defer h.Pool.Release(ctx)

	page, err := ctx.NewPage()
	if err != nil {
		return httpx.Error(c, fiber.StatusInternalServerError, "INTERNAL")
	}
	defer page.Close()

	var (
		html     string
		doc      *goquery.Document
		finalURL = req.URL
	)

	recorder.measure("fetch", func() (StageStatus, string) {
		_, gotoErr := page.Goto(req.URL, playwright.PageGotoOptions{Timeout: playwright.Float(25000), WaitUntil: playwright.WaitUntilStateDomcontentloaded})
		if gotoErr != nil {
			return StageStatusError, "TIMEOUT"
		}
		content, contentErr := page.Content()
		if contentErr != nil {
			return StageStatusError, "INTERNAL"
		}
		html = content
		if page.URL() != "" {
			finalURL = page.URL()
		}
		return StageStatusOK, ""
	})
	if html == "" {
		return httpx.Error(c, fiber.StatusGatewayTimeout, "TIMEOUT")
	}

	recorder.measure("parse", func() (StageStatus, string) {
		parsedDoc, parseErr := goquery.NewDocumentFromReader(strings.NewReader(html))
		if parseErr != nil {
			return StageStatusError, "INTERNAL"
		}
		doc = parsedDoc
		return StageStatusOK, ""
	})
	if doc == nil {
		return httpx.Error(c, fiber.StatusInternalServerError, "INTERNAL")
	}

	title := strings.TrimSpace(doc.Find("title").First().Text())
	metaDesc, _ := doc.Find("meta[name='description']").Attr("content")
	h1s := []string{}
	doc.Find("h1").Each(func(_ int, s *goquery.Selection) {
		h1s = append(h1s, strings.TrimSpace(s.Text()))
	})
	total, withAlt := 0, 0
	doc.Find("img").Each(func(_ int, s *goquery.Selection) {
		total++
		if alt, ok := s.Attr("alt"); ok && strings.TrimSpace(alt) != "" {
			withAlt++
		}
	})
	text := strings.TrimSpace(doc.Text())

	resp, _ := Run(c.Context(), RawInput{
		URL:       req.URL,
		Text:      text,
		HTML:      html,
		OnPageRaw: OnPageRaw{Title: title, MetaDescription: metaDesc, H1Values: h1s, ImagesTotal: total, ImagesWithAlt: withAlt},
	})
	resp.FetchedAt = time.Now().UTC().Format(time.RFC3339)

	recorder.measure("woorank", func() (StageStatus, string) {
		resp.Woorank = RunWoorank(c.Context(), WoorankInput{
			FinalURL:    finalURL,
			Document:    doc,
			RawHTML:     html,
			AltCoverage: resp.OnPage.Images.AltCoverage,
		})
		return StageStatusOK, ""
	})

	recorder.measure("crawl", func() (StageStatus, string) {
		crawl, tree, crawlErr := buildSiteTree(c.Context(), finalURL, doc, h.MaxCrawlPages)
		if crawlErr != nil {
			return StageStatusWarn, "CRAWL_PARTIAL"
		}
		resp.Crawl = crawl
		resp.SiteStructure = tree
		if crawl.Truncated {
			return StageStatusWarn, "CRAWL_TRUNCATED"
		}
		return StageStatusOK, ""
	})

	recorder.measure("recommendations", func() (StageStatus, string) {
		resp.Recommendations = BuildRecommendations(resp)
		return StageStatusOK, ""
	})

	resp.Observability = recorder.build()

	return c.JSON(resp)
}
