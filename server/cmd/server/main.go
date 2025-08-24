// Live Retro - Real-time ephemeral retrospective boards
// Copyright (c) 2024 Mahe-git2hub
// Licensed under MIT License - Attribution Required
// See LICENSE file for full terms

package main

import (
	"net/http"
	"time"

	"github.com/gorilla/handlers"
	"golang.org/x/time/rate"
	"live-retro-server/internal/api"
	"live-retro-server/internal/config"
	"live-retro-server/internal/hub"
	"live-retro-server/internal/logger"
	"live-retro-server/internal/middleware"
	"live-retro-server/internal/monitoring"
	"live-retro-server/internal/store"
	"strings"
)

// conditionalCompress applies compression to all requests except WebSocket endpoints
func conditionalCompress(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip compression for WebSocket endpoints
		if strings.HasPrefix(r.URL.Path, "/ws") {
			next.ServeHTTP(w, r)
			return
		}
		
		// Apply compression for all other endpoints
		handlers.CompressHandler(next).ServeHTTP(w, r)
	})
}

func main() {
	// Load configuration
	cfg := config.Load()
	
	// Initialize logger
	log := logger.New(cfg.LogLevel, cfg.LogFormat)
	logger.SetDefault(log)
	
	logger.Info("Starting Live Retro server")
	logger.Infof("Environment: %s", cfg.Environment)
	logger.Infof("Port: %s", cfg.Port)

	// Initialize Redis store
	redisStore := store.NewRedisStore(cfg.RedisURL)
	defer redisStore.Close()

	// Initialize WebSocket hub
	wsHub := hub.NewHub(redisStore)
	go wsHub.Run()

	// Initialize API server
	server := api.NewServer(redisStore, wsHub)

	// Setup routes
	mux := http.NewServeMux()
	
	// Monitoring endpoints
	mux.HandleFunc("/health", monitoring.HealthHandler)
	mux.HandleFunc("/metrics", monitoring.MetricsHandler)
	
	// API endpoints
	mux.HandleFunc("/api/boards", server.CreateBoard)
	mux.HandleFunc("/api/boards/", server.GetBoard)
	mux.HandleFunc("/ws", server.HandleWebSocket)

	// Create rate limiter
	rateLimiter := middleware.NewIPRateLimiter(
		rate.Every(time.Second/time.Duration(cfg.RateLimitRPS)), 
		cfg.RateLimitBurst,
	)

	// Build middleware chain
	var handler http.Handler = mux
	handler = server.EnableCORS(handler)
	handler = middleware.SecurityHeadersMiddleware(handler)
	handler = middleware.LoggingMiddleware(handler)
	handler = rateLimiter.Limit()(handler)
	
	// Add compression - exclude WebSocket endpoints
	handler = conditionalCompress(handler)

	logger.Infof("Rate limiting: %d req/sec with burst of %d", cfg.RateLimitRPS, cfg.RateLimitBurst)
	logger.Infof("CORS origins: %v", cfg.CORSOrigins)
	logger.Info("Server ready to accept connections")
	
	httpServer := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	
	if err := httpServer.ListenAndServe(); err != nil {
		logger.Fatalf("Server failed to start: %v", err)
	}
}