package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	// Server config
	Port        string
	Environment string
	
	// Redis config
	RedisURL string
	
	// Rate limiting
	RateLimitRPS   int
	RateLimitBurst int
	
	// Board settings
	DefaultBoardTTL      time.Duration
	MaxTilesPerColumn    int
	MaxColumnsPerBoard   int
	MaxConcurrentConns   int
	
	// Security
	CORSOrigins []string
	
	// Logging
	LogLevel  string
	LogFormat string
}

func Load() *Config {
	return &Config{
		Port:        getEnvOrDefault("PORT", "8080"),
		Environment: getEnvOrDefault("ENVIRONMENT", "development"),
		RedisURL:    getEnvOrDefault("REDIS_URL", "redis://localhost:6379"),
		
		RateLimitRPS:   getEnvIntOrDefault("RATE_LIMIT_REQUESTS_PER_SECOND", 10),
		RateLimitBurst: getEnvIntOrDefault("RATE_LIMIT_BURST", 20),
		
		DefaultBoardTTL:    time.Duration(getEnvIntOrDefault("DEFAULT_BOARD_TTL_MINUTES", 30)) * time.Minute,
		MaxTilesPerColumn:  getEnvIntOrDefault("MAX_TILES_PER_COLUMN", 100),
		MaxColumnsPerBoard: getEnvIntOrDefault("MAX_COLUMNS_PER_BOARD", 10),
		MaxConcurrentConns: getEnvIntOrDefault("MAX_CONCURRENT_CONNECTIONS", 1000),
		
		CORSOrigins: getEnvArrayOrDefault("CORS_ORIGINS", []string{"http://localhost:3000"}),
		
		LogLevel:  getEnvOrDefault("LOG_LEVEL", "info"),
		LogFormat: getEnvOrDefault("LOG_FORMAT", "text"),
	}
}

func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvIntOrDefault(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvArrayOrDefault(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}