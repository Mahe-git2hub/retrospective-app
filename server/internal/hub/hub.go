package hub

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/google/uuid"
	"live-retro-server/internal/logger"
	"live-retro-server/internal/models"
	"live-retro-server/internal/monitoring"
	"live-retro-server/internal/store"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	boardID  string
	userID   string
	isAdmin  bool
}

type Hub struct {
	clients    map[string]map[*Client]bool // boardID -> clients
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	store      *store.RedisStore
}

func NewHub(store *store.RedisStore) *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		store:      store,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			if h.clients[client.boardID] == nil {
				h.clients[client.boardID] = make(map[*Client]bool)
			}
			h.clients[client.boardID][client] = true
			
			// Send current board state to new client
			board, err := h.store.GetBoard(client.boardID)
			if err != nil {
				log.Printf("Error getting board %s: %v", client.boardID, err)
				continue
			}
			
			boardStateMsg := models.WebSocketMessage{
				Type:    "server:board:state_update",
				Payload: board,
			}
			
			data, err := json.Marshal(boardStateMsg)
			if err != nil {
				log.Printf("Error marshaling board state: %v", err)
				continue
			}
			
			select {
			case client.send <- data:
			default:
				close(client.send)
				delete(h.clients[client.boardID], client)
			}

		case client := <-h.unregister:
			if clients, ok := h.clients[client.boardID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.send)
					if len(clients) == 0 {
						delete(h.clients, client.boardID)
					}
				}
			}
		}
	}
}

func (h *Hub) BroadcastToBoard(boardID string, message []byte) {
	if clients, ok := h.clients[boardID]; ok {
		for client := range clients {
			select {
			case client.send <- message:
			default:
				close(client.send)
				delete(clients, client)
			}
		}
	}
}

func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request, boardID, adminKey string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Errorf("WebSocket upgrade error: %v", err)
		return
	}

	// Track connection metrics
	monitoring.IncrementConnections()

	// Check if board exists
	if !h.store.BoardExists(boardID) {
		logger.Warnf("WebSocket connection attempted for non-existent board: %s", boardID)
		conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"error","payload":{"message":"Board not found"}}`))
		conn.Close()
		monitoring.DecrementConnections()
		return
	}

	// Generate user ID and check if admin
	userID := generateUserID()
	isAdmin := adminKey != "" && h.isValidAdmin(boardID, adminKey)

	logger.Debugf("New WebSocket connection: board=%s, user=%s, admin=%t", boardID, userID, isAdmin)

	client := &Client{
		hub:     h,
		conn:    conn,
		send:    make(chan []byte, 256),
		boardID: boardID,
		userID:  userID,
		isAdmin: isAdmin,
	}

	h.register <- client

	go client.writePump()
	go client.readPump()
}

func (h *Hub) isValidAdmin(boardID, adminKey string) bool {
	board, err := h.store.GetBoard(boardID)
	if err != nil {
		return false
	}
	return board.AdminKey == adminKey
}

func generateUserID() string {
	return "user_" + uuid.New().String()[:8]
}