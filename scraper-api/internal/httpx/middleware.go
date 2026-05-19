package httpx

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		rid := c.Get("X-Request-Id")
		if rid == "" {
			rid = uuid.NewString()
		}
		c.Set("X-Request-Id", rid)
		return c.Next()
	}
}

func Logger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		_ = time.Since(start)
		return err
	}
}
