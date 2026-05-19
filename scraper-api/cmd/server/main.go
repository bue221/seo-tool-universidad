package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/cplaza/seo-custom-tool/scraper-api/internal/audit"
	"github.com/cplaza/seo-custom-tool/scraper-api/internal/browser"
	"github.com/cplaza/seo-custom-tool/scraper-api/internal/config"
	"github.com/cplaza/seo-custom-tool/scraper-api/internal/health"
	"github.com/cplaza/seo-custom-tool/scraper-api/internal/httpx"
)

func main() {
	cfg := config.Load()
	pool, err := browser.NewPool(cfg.BrowserPoolSize, cfg.PlaywrightHeadless)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	auditHandler := audit.NewHandler(pool)

	app := fiber.New()
	app.Use(cors.New(cors.Config{AllowOrigins: cfg.AllowedOrigin}))
	app.Use(httpx.RequestID())
	app.Use(httpx.Logger())

	app.Get("/health", health.Get(cfg.Version))
	app.Post("/api/audit", auditHandler.PostAudit)

	log.Fatal(app.Listen(":" + cfg.Port))
}
