package audit

import (
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestValidURL(t *testing.T) {
	cases := []struct {
		input string
		want  bool
	}{
		{"https://example.com", true},
		{"http://example.com/path", true},
		{"https://sub.domain.com:8080/foo?bar=1", true},
		{"example.com", false},
		{"ftp://example.com", false},
		{"", false},
		{"file:///etc/passwd", false},
	}
	for _, tc := range cases {
		t.Run(tc.input, func(t *testing.T) {
			got := validURL(tc.input)
			if got != tc.want {
				t.Errorf("validURL(%q) = %v, want %v", tc.input, got, tc.want)
			}
		})
	}
}

// newTestApp creates a minimal Fiber app with POST /api/audit wired to Handler{Pool: nil}.
// Pool nil is safe because invalid-body and invalid-URL paths return before Pool is used.
func newTestApp() *fiber.App {
	app := fiber.New()
	h := &Handler{Pool: nil}
	app.Post("/api/audit", h.PostAudit)
	return app
}

func TestPostAudit_InvalidBody(t *testing.T) {
	app := newTestApp()
	req := httptest.NewRequest("POST", "/api/audit", strings.NewReader("not-json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 400 {
		t.Errorf("status = %d, want 400", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if !strings.Contains(string(body), "INVALID_BODY") {
		t.Errorf("body %q should contain INVALID_BODY", string(body))
	}
}

func TestPostAudit_InvalidURL(t *testing.T) {
	app := newTestApp()
	req := httptest.NewRequest("POST", "/api/audit", strings.NewReader(`{"url":"not-a-url"}`))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 400 {
		t.Errorf("status = %d, want 400", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if !strings.Contains(string(body), "INVALID_URL") {
		t.Errorf("body %q should contain INVALID_URL", string(body))
	}
}

func TestPostAudit_EmptyURL(t *testing.T) {
	app := newTestApp()
	req := httptest.NewRequest("POST", "/api/audit", strings.NewReader(`{"url":""}`))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 400 {
		t.Errorf("status = %d, want 400", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if !strings.Contains(string(body), "INVALID_URL") {
		t.Errorf("body %q should contain INVALID_URL", string(body))
	}
}
