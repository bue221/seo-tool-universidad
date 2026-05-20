package httpx

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestRequestID_Generated(t *testing.T) {
	app := fiber.New()
	app.Use(RequestID())
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	rid := resp.Header.Get("X-Request-Id")
	if rid == "" {
		t.Error("X-Request-Id header should be generated when not provided")
	}
}

func TestRequestID_Forwarded(t *testing.T) {
	app := fiber.New()
	app.Use(RequestID())
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("X-Request-Id", "my-request-id")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	rid := resp.Header.Get("X-Request-Id")
	if rid != "my-request-id" {
		t.Errorf("X-Request-Id = %q, want %q", rid, "my-request-id")
	}
}

func TestLogger_PassesThrough(t *testing.T) {
	app := fiber.New()
	app.Use(Logger())
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Errorf("Logger altered status code: got %d, want 200", resp.StatusCode)
	}
}
