package httpx

import (
	"log"
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
		duration := time.Since(start)

		requestID := c.GetRespHeader("X-Request-Id")
		if requestID == "" {
			requestID = c.Get("X-Request-Id")
		}

		status := c.Response().StatusCode()
		if status == 0 {
			status = fiber.StatusOK
		}

		level := "INFO"
		switch {
		case err != nil || status >= fiber.StatusInternalServerError:
			level = "ERROR"
		case status >= fiber.StatusBadRequest:
			level = "WARN"
		}

		if err != nil {
			log.Printf(
				"[%s] request_id=%s method=%s path=%s status=%d duration_ms=%d ip=%s ua=%q error=%q",
				level,
				requestID,
				c.Method(),
				c.OriginalURL(),
				status,
				duration.Milliseconds(),
				c.IP(),
				c.Get("User-Agent"),
				err.Error(),
			)
			return err
		}

		log.Printf(
			"[%s] request_id=%s method=%s path=%s status=%d duration_ms=%d ip=%s ua=%q",
			level,
			requestID,
			c.Method(),
			c.OriginalURL(),
			status,
			duration.Milliseconds(),
			c.IP(),
			c.Get("User-Agent"),
		)

		return nil
	}
}
