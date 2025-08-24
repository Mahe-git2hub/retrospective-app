package middleware

import (
	"net/http"
	"strings"
	"time"
	
	"live-retro-server/internal/logger"
)

type responseWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func wrapResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{ResponseWriter: w}
}

func (rw *responseWriter) Status() int {
	return rw.status
}

func (rw *responseWriter) WriteHeader(code int) {
	if rw.wroteHeader {
		return
	}

	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
	rw.wroteHeader = true
}

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Skip wrapping for WebSocket endpoints to preserve http.Hijacker
		if strings.HasPrefix(r.URL.Path, "/ws") {
			next.ServeHTTP(w, r)
			
			// Log WebSocket connections differently since we can't capture status
			logger.Infof(
				"[%s] %s %s WebSocket %v %s",
				r.Method,
				r.RequestURI,
				r.RemoteAddr,
				time.Since(start),
				r.UserAgent(),
			)
			return
		}
		
		wrapped := wrapResponseWriter(w)
		next.ServeHTTP(wrapped, r)
		
		logger.Infof(
			"[%s] %s %s %d %v %s",
			r.Method,
			r.RequestURI,
			r.RemoteAddr,
			wrapped.status,
			time.Since(start),
			r.UserAgent(),
		)
	})
}

func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip security headers for WebSocket endpoints as they're not relevant
		if !strings.HasPrefix(r.URL.Path, "/ws") {
			// Security headers
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
		}
		
		next.ServeHTTP(w, r)
	})
}