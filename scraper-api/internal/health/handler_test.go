package health

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestGet(t *testing.T) {
	app := fiber.New()
	app.Get("/health", Get("v9.9.9"))

	req := httptest.NewRequest("GET", "/health", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Errorf("status = %d, want 200", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("unmarshal body: %v — raw: %s", err, string(body))
	}

	if payload["status"] != "ok" {
		t.Errorf("status = %v, want \"ok\"", payload["status"])
	}
	if payload["version"] != "v9.9.9" {
		t.Errorf("version = %v, want \"v9.9.9\"", payload["version"])
	}
	playwright, ok := payload["playwright"].(bool)
	if !ok || !playwright {
		t.Errorf("playwright = %v, want true", payload["playwright"])
	}
}
