package health

import "github.com/gofiber/fiber/v2"

func Get(version string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "playwright": true, "version": version})
	}
}
