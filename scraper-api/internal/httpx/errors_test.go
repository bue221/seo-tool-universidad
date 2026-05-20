package httpx

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestError(t *testing.T) {
	cases := []struct {
		status int
		code   string
	}{
		{400, "INVALID_URL"},
		{500, "INTERNAL"},
		{504, "TIMEOUT"},
	}
	for _, tc := range cases {
		t.Run(tc.code, func(t *testing.T) {
			app := fiber.New()
			status := tc.status
			code := tc.code
			app.Get("/test", func(c *fiber.Ctx) error {
				return Error(c, status, code)
			})

			req := httptest.NewRequest("GET", "/test", nil)
			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("app.Test: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tc.status {
				t.Errorf("status = %d, want %d", resp.StatusCode, tc.status)
			}

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				t.Fatalf("read body: %v", err)
			}

			var payload map[string]string
			if err := json.Unmarshal(body, &payload); err != nil {
				t.Fatalf("unmarshal: %v — raw: %s", err, string(body))
			}
			if payload["error"] != tc.code {
				t.Errorf("error = %q, want %q", payload["error"], tc.code)
			}
		})
	}
}
