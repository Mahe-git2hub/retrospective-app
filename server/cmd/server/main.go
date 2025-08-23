package main

import (
	"log"
	"net/http"
	"os"

	"live-retro-server/internal/api"
	"live-retro-server/internal/hub"
	"live-retro-server/internal/store"
)

func main() {
	// Get Redis URL from environment or use default
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize Redis store
	redisStore := store.NewRedisStore(redisURL)
	defer redisStore.Close()

	// Initialize WebSocket hub
	wsHub := hub.NewHub(redisStore)
	go wsHub.Run()

	// Initialize API server
	server := api.NewServer(redisStore, wsHub)

	// Setup routes
	mux := http.NewServeMux()
	mux.HandleFunc("/api/boards", server.CreateBoard)
	mux.HandleFunc("/api/boards/", server.GetBoard)
	mux.HandleFunc("/ws", server.HandleWebSocket)

	// Add CORS middleware
	handler := server.EnableCORS(mux)

	log.Printf("Server starting on port %s", port)
	log.Printf("Redis URL: %s", redisURL)
	
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}