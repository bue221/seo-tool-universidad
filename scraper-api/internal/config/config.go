package config

import "os"

type Config struct {
	Port             string
	PlaywrightHeadless bool
	AllowedOrigin    string
	BrowserPoolSize  int
	LogLevel         string
	Version          string
}

func Load() Config {
	return Config{
		Port:              getEnv("PORT", "9743"),
		PlaywrightHeadless: getEnv("PLAYWRIGHT_HEADLESS", "true") != "false",
		AllowedOrigin:     getEnv("ALLOWED_ORIGIN", "*"),
		BrowserPoolSize:   3,
		LogLevel:          getEnv("LOG_LEVEL", "info"),
		Version:           getEnv("VERSION", "v0.1.0"),
	}
}

func getEnv(k, fallback string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return fallback
}
