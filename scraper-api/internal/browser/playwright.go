package browser

import (
	"context"
	"fmt"

	"github.com/playwright-community/playwright-go"
)

type Pool struct {
	pw      *playwright.Playwright
	browser playwright.Browser
	headless bool
}

func NewPool(_ int, headless bool) (*Pool, error) {
	pw, err := playwright.Run()
	if err != nil {
		return nil, err
	}
	b, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{Headless: playwright.Bool(headless)})
	if err != nil {
		return nil, err
	}
	return &Pool{pw: pw, browser: b, headless: headless}, nil
}

func (p *Pool) Acquire(ctx context.Context) (playwright.BrowserContext, error) {
	if p.browser == nil {
		return nil, fmt.Errorf("browser not initialized")
	}
	_ = ctx
	return p.browser.NewContext(playwright.BrowserNewContextOptions{})
}

func (p *Pool) Release(ctx playwright.BrowserContext) {
	_ = ctx.Close()
}

func (p *Pool) Close() {
	if p.browser != nil {
		_ = p.browser.Close()
	}
	if p.pw != nil {
		_ = p.pw.Stop()
	}
}
