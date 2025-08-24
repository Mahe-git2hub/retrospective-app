package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"live-retro-server/internal/hub"
	"live-retro-server/internal/models"
	"live-retro-server/internal/store"
)

type Server struct {
	store *store.RedisStore
	hub   *hub.Hub
}

func NewServer(store *store.RedisStore, hub *hub.Hub) *Server {
	return &Server{
		store: store,
		hub:   hub,
	}
}

func (s *Server) CreateBoard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	boardID := uuid.New().String()
	adminKey := uuid.New().String()

	// Create default columns
	col1ID := uuid.New().String()
	col2ID := uuid.New().String()
	col3ID := uuid.New().String()
	
	columns := map[string]*models.Column{
		col1ID: {
			ID:    col1ID,
			Title: "What went well?",
			Order: 0,
			Tiles: []*models.Tile{},
		},
		col2ID: {
			ID:    col2ID,
			Title: "What could be improved?",
			Order: 1,
			Tiles: []*models.Tile{},
		},
		col3ID: {
			ID:    col3ID,
			Title: "Action items",
			Order: 2,
			Tiles: []*models.Tile{},
		},
	}

	board := &models.Board{
		ID:        boardID,
		AdminKey:  adminKey,
		Columns:   columns,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.store.SaveBoard(board); err != nil {
		http.Error(w, "Failed to create board", http.StatusInternalServerError)
		return
	}

	response := map[string]string{
		"boardId":  boardID,
		"adminKey": adminKey,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) GetBoard(w http.ResponseWriter, r *http.Request) {
	boardID := r.URL.Path[len("/api/boards/"):]
	if boardID == "" {
		http.Error(w, "Board ID required", http.StatusBadRequest)
		return
	}

	board, err := s.store.GetBoard(boardID)
	if err != nil {
		http.Error(w, "Board not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(board)
}

func (s *Server) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	boardID := r.URL.Query().Get("boardId")
	adminKey := r.URL.Query().Get("adminKey")

	if boardID == "" {
		http.Error(w, "boardId parameter required", http.StatusBadRequest)
		return
	}

	s.hub.HandleWebSocket(w, r, boardID, adminKey)
}

func (s *Server) EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}