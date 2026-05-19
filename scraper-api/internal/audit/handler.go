package audit

import (
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/gofiber/fiber/v2"
	"github.com/playwright-community/playwright-go"
	"github.com/cplaza/seo-custom-tool/scraper-api/internal/browser"
	"github.com/cplaza/seo-custom-tool/scraper-api/internal/httpx"
)

type Handler struct {
	Pool *browser.Pool
}

func NewHandler(pool *browser.Pool) *Handler {
	return &Handler{Pool: pool}
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

	_, err = page.Goto(req.URL, playwright.PageGotoOptions{Timeout: playwright.Float(25000), WaitUntil: playwright.WaitUntilStateDomcontentloaded})
	if err != nil {
		return httpx.Error(c, fiber.StatusGatewayTimeout, "TIMEOUT")
	}

	html, err := page.Content()
	if err != nil {
		return httpx.Error(c, fiber.StatusInternalServerError, "INTERNAL")
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
	if err != nil {
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
		URL: req.URL,
		Text: text,
		HTML: html,
		OnPageRaw: OnPageRaw{Title: title, MetaDescription: metaDesc, H1Values: h1s, ImagesTotal: total, ImagesWithAlt: withAlt},
	})
	resp.FetchedAt = time.Now().UTC().Format(time.RFC3339)
	return c.JSON(resp)
}
