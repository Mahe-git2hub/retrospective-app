package monitoring

import (
	"encoding/json"
	"net/http"
	"runtime"
	"sync/atomic"
	"time"
)

type Metrics struct {
	// Connection metrics
	ActiveConnections int64 `json:"active_connections"`
	TotalConnections  int64 `json:"total_connections"`
	
	// Board metrics
	ActiveBoards int64 `json:"active_boards"`
	TotalBoards  int64 `json:"total_boards"`
	
	// Message metrics
	MessagesProcessed int64 `json:"messages_processed"`
	MessageErrors     int64 `json:"message_errors"`
	
	// System metrics
	Uptime         time.Duration `json:"uptime"`
	MemoryUsage    uint64        `json:"memory_usage_bytes"`
	Goroutines     int           `json:"goroutines"`
	
	// Timestamps
	StartTime time.Time `json:"start_time"`
	LastCheck time.Time `json:"last_check"`
}

var (
	globalMetrics = &Metrics{
		StartTime: time.Now(),
	}
)

// Connection tracking
func IncrementConnections() {
	atomic.AddInt64(&globalMetrics.TotalConnections, 1)
	atomic.AddInt64(&globalMetrics.ActiveConnections, 1)
}

func DecrementConnections() {
	atomic.AddInt64(&globalMetrics.ActiveConnections, -1)
}

// Board tracking
func IncrementBoards() {
	atomic.AddInt64(&globalMetrics.TotalBoards, 1)
	atomic.AddInt64(&globalMetrics.ActiveBoards, 1)
}

func DecrementBoards() {
	atomic.AddInt64(&globalMetrics.ActiveBoards, -1)
}

// Message tracking
func IncrementMessages() {
	atomic.AddInt64(&globalMetrics.MessagesProcessed, 1)
}

func IncrementMessageErrors() {
	atomic.AddInt64(&globalMetrics.MessageErrors, 1)
}

// Get current metrics
func GetMetrics() *Metrics {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	return &Metrics{
		ActiveConnections: atomic.LoadInt64(&globalMetrics.ActiveConnections),
		TotalConnections:  atomic.LoadInt64(&globalMetrics.TotalConnections),
		ActiveBoards:      atomic.LoadInt64(&globalMetrics.ActiveBoards),
		TotalBoards:       atomic.LoadInt64(&globalMetrics.TotalBoards),
		MessagesProcessed: atomic.LoadInt64(&globalMetrics.MessagesProcessed),
		MessageErrors:     atomic.LoadInt64(&globalMetrics.MessageErrors),
		Uptime:           time.Since(globalMetrics.StartTime),
		MemoryUsage:      m.Alloc,
		Goroutines:       runtime.NumGoroutine(),
		StartTime:        globalMetrics.StartTime,
		LastCheck:        time.Now(),
	}
}

// HTTP handler for metrics endpoint
func MetricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	metrics := GetMetrics()
	if err := json.NewEncoder(w).Encode(metrics); err != nil {
		http.Error(w, "Failed to encode metrics", http.StatusInternalServerError)
		return
	}
}

// Health check handler
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	metrics := GetMetrics()
	
	status := "healthy"
	code := http.StatusOK
	
	// Simple health checks
	if metrics.ActiveConnections > 10000 {
		status = "overloaded"
		code = http.StatusServiceUnavailable
	} else if metrics.MemoryUsage > 1024*1024*1024 { // 1GB
		status = "high_memory_usage"
		code = http.StatusServiceUnavailable
	}
	
	response := map[string]interface{}{
		"status":     status,
		"timestamp":  time.Now(),
		"uptime":     metrics.Uptime.String(),
		"connections": metrics.ActiveConnections,
		"memory_mb":  metrics.MemoryUsage / 1024 / 1024,
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(response)
}