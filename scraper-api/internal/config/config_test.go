package config

import (
	"os"
	"testing"
)

func TestGetEnv_Fallback(t *testing.T) {
	// Use a key that is definitely not set in the environment
	key := "SEO_TOOL_TEST_GETENV_NOTSET_12345"
	os.Unsetenv(key)
	got := getEnv(key, "default_value")
	if got != "default_value" {
		t.Errorf("getEnv unset key = %q, want %q", got, "default_value")
	}
}

func TestGetEnv_EnvSet(t *testing.T) {
	key := "SEO_TOOL_TEST_GETENV_SET_12345"
	t.Setenv(key, "custom_value")
	got := getEnv(key, "fallback")
	if got != "custom_value" {
		t.Errorf("getEnv set key = %q, want %q", got, "custom_value")
	}
}

func TestLoad_DefaultPort(t *testing.T) {
	os.Unsetenv("PORT")
	cfg := Load()
	if cfg.Port != "9743" {
		t.Errorf("default Port = %q, want %q", cfg.Port, "9743")
	}
}

func TestLoad_CustomPort(t *testing.T) {
	t.Setenv("PORT", "3000")
	cfg := Load()
	if cfg.Port != "3000" {
		t.Errorf("Port with env = %q, want %q", cfg.Port, "3000")
	}
}

func TestLoad_PlaywrightHeadlessDefault(t *testing.T) {
	os.Unsetenv("PLAYWRIGHT_HEADLESS")
	cfg := Load()
	if !cfg.PlaywrightHeadless {
		t.Error("default PlaywrightHeadless should be true")
	}
}

func TestLoad_PlaywrightHeadlessFalse(t *testing.T) {
	t.Setenv("PLAYWRIGHT_HEADLESS", "false")
	cfg := Load()
	if cfg.PlaywrightHeadless {
		t.Error("PlaywrightHeadless should be false when env=false")
	}
}

func TestLoad_LogLevelDefault(t *testing.T) {
	os.Unsetenv("LOG_LEVEL")
	cfg := Load()
	if cfg.LogLevel != "info" {
		t.Errorf("default LogLevel = %q, want %q", cfg.LogLevel, "info")
	}
}

func TestLoad_LogLevelCustom(t *testing.T) {
	t.Setenv("LOG_LEVEL", "debug")
	cfg := Load()
	if cfg.LogLevel != "debug" {
		t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, "debug")
	}
}
