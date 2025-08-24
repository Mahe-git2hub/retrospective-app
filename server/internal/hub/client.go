package hub

import (
	"encoding/json"
	"time"

	"github.com/gorilla/websocket"
	"github.com/google/uuid"
	"live-retro-server/internal/logger"
	"live-retro-server/internal/models"
	"live-retro-server/internal/monitoring"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
		monitoring.DecrementConnections()
		logger.Debugf("WebSocket connection closed: board=%s, user=%s", c.boardID, c.userID)
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logger.Errorf("WebSocket unexpected close: %v", err)
			}
			break
		}

		monitoring.IncrementMessages()

		var wsMsg models.WebSocketMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			logger.Errorf("Error unmarshaling WebSocket message: %v", err)
			monitoring.IncrementMessageErrors()
			continue
		}

		logger.Debugf("Received message: type=%s, board=%s, user=%s", wsMsg.Type, c.boardID, c.userID)
		c.handleMessage(wsMsg)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Batch additional messages if any are queued
			n := len(c.send)
			for i := 0; i < n; i++ {
				select {
				case additionalMsg := <-c.send:
					w.Write([]byte{'\n'})
					w.Write(additionalMsg)
				default:
					break
				}
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(msg models.WebSocketMessage) {
	switch msg.Type {
	case "client:tile:create":
		c.handleCreateTile(msg.Payload)
	case "client:tile:reveal":
		if c.isAdmin {
			c.handleRevealTile(msg.Payload)
		}
	case "client:board:reveal_all":
		if c.isAdmin {
			c.handleRevealAll(msg.Payload)
		}
	case "client:tile:vote":
		c.handleVoteTile(msg.Payload)
	case "client:column:create":
		if c.isAdmin {
			c.handleCreateColumn(msg.Payload)
		}
	case "client:column:update":
		if c.isAdmin {
			c.handleUpdateColumn(msg.Payload)
		}
	case "client:column:delete":
		if c.isAdmin {
			c.handleDeleteColumn(msg.Payload)
		}
	case "client:user:typing_start":
		c.handleTypingStart(msg.Payload)
	case "client:user:typing_stop":
		c.handleTypingStop(msg.Payload)
	case "client:thread:create":
		c.handleCreateThread(msg.Payload)
	}
}

func (c *Client) handleCreateTile(payload interface{}) {
	data, _ := json.Marshal(payload)
	var createPayload models.CreateTilePayload
	if err := json.Unmarshal(data, &createPayload); err != nil {
		logger.Errorf("Error unmarshaling create tile payload: %v", err)
		c.sendErrorMessage("Invalid tile data")
		return
	}

	// Validate payload
	if err := models.ValidateCreateTilePayload(&createPayload); err != nil {
		logger.Errorf("Invalid create tile payload: %v", err)
		c.sendErrorMessage(err.Error())
		return
	}

	// Sanitize input
	createPayload.Content = models.SanitizeString(createPayload.Content)
	createPayload.Author = models.SanitizeString(createPayload.Author)

	board, err := c.hub.store.GetBoard(c.boardID)
	if err != nil {
		logger.Errorf("Error getting board: %v", err)
		return
	}

	column, exists := board.Columns[createPayload.ColumnID]
	if !exists {
		logger.Errorf("Column %s not found", createPayload.ColumnID)
		return
	}

	newTile := &models.Tile{
		ID:        uuid.New().String(),
		Content:   createPayload.Content,
		Author:    createPayload.Author,
		IsHidden:  true,
		VoterIDs:  []string{},
		Threads:   []*models.Thread{},
		CreatedAt: time.Now(),
	}

	column.Tiles = append(column.Tiles, newTile)

	if err := c.hub.store.SaveBoard(board); err != nil {
		logger.Errorf("Error saving board: %v", err)
		return
	}

	c.broadcastBoardState()
}

func (c *Client) handleRevealTile(payload interface{}) {
	data, _ := json.Marshal(payload)
	var revealPayload models.RevealTilePayload
	if err := json.Unmarshal(data, &revealPayload); err != nil {
		logger.Errorf("Error unmarshaling reveal tile payload: %v", err)
		return
	}

	board, err := c.hub.store.GetBoard(c.boardID)
	if err != nil {
		logger.Errorf("Error getting board: %v", err)
		return
	}

	// Find and reveal the tile
	for _, column := range board.Columns {
		for _, tile := range column.Tiles {
			if tile.ID == revealPayload.TileID {
				tile.IsHidden = false
				if err := c.hub.store.SaveBoard(board); err != nil {
					logger.Errorf("Error saving board: %v", err)
					return
				}
				c.broadcastBoardState()
				return
			}
		}
	}
}

func (c *Client) handleRevealAll(payload interface{}) {
	board, err := c.hub.store.GetBoard(c.boardID)
	if err != nil {
		logger.Errorf("Error getting board: %v", err)
		return
	}

	// Reveal all hidden tiles across all columns
	tilesRevealed := 0
	for _, column := range board.Columns {
		for _, tile := range column.Tiles {
			if tile.IsHidden {
				tile.IsHidden = false
				tilesRevealed++
			}
		}
	}

	if tilesRevealed > 0 {
		if err := c.hub.store.SaveBoard(board); err != nil {
			logger.Errorf("Error saving board: %v", err)
			return
		}
		logger.Infof("Admin revealed %d tiles on board %s", tilesRevealed, c.boardID)
		c.broadcastBoardState()
	} else {
		logger.Debugf("No hidden tiles to reveal on board %s", c.boardID)
	}
}

func (c *Client) handleVoteTile(payload interface{}) {
	data, _ := json.Marshal(payload)
	var votePayload models.VoteTilePayload
	if err := json.Unmarshal(data, &votePayload); err != nil {
		logger.Errorf("Error unmarshaling vote tile payload: %v", err)
		return
	}

	board, err := c.hub.store.GetBoard(c.boardID)
	if err != nil {
		logger.Errorf("Error getting board: %v", err)
		return
	}

	// Find the tile and toggle vote
	for _, column := range board.Columns {
		for _, tile := range column.Tiles {
			if tile.ID == votePayload.TileID {
				// Check if user already voted
				voted := false
				for i, voterID := range tile.VoterIDs {
					if voterID == c.userID {
						// Remove vote
						tile.VoterIDs = append(tile.VoterIDs[:i], tile.VoterIDs[i+1:]...)
						voted = true
						break
					}
				}
				
				if !voted {
					// Add vote
					tile.VoterIDs = append(tile.VoterIDs, c.userID)
				}

				if err := c.hub.store.SaveBoard(board); err != nil {
					logger.Errorf("Error saving board: %v", err)
					return
				}
				c.broadcastBoardState()
				return
			}
		}
	}
}

func (c *Client) handleCreateColumn(payload interface{}) {
	data, _ := json.Marshal(payload)
	var createPayload models.CreateColumnPayload
	if err := json.Unmarshal(data, &createPayload); err != nil {
		logger.Errorf("Error unmarshaling create column payload: %v", err)
		c.sendErrorMessage("Invalid column data")
		return
	}

	// Validate payload
	if err := models.ValidateCreateColumnPayload(&createPayload); err != nil {
		logger.Errorf("Invalid create column payload: %v", err)
		c.sendErrorMessage(err.Error())
		return
	}

	// Sanitize input
	createPayload.Title = models.SanitizeString(createPayload.Title)

	board, err := c.hub.store.GetBoard(c.boardID)
	if err != nil {
		logger.Errorf("Error getting board: %v", err)
		return
	}

	newColumn := &models.Column{
		ID:    uuid.New().String(),
		Title: createPayload.Title,
		Order: len(board.Columns),
		Tiles: []*models.Tile{},
	}

	board.Columns[newColumn.ID] = newColumn

	if err := c.hub.store.SaveBoard(board); err != nil {
		logger.Errorf("Error saving board: %v", err)
		return
	}

	c.broadcastBoardState()
}

func (c *Client) handleUpdateColumn(payload interface{}) {
	data, _ := json.Marshal(payload)
	var updatePayload models.UpdateColumnPayload
	if err := json.Unmarshal(data, &updatePayload); err != nil {
		logger.Errorf("Error unmarshaling update column payload: %v", err)
		c.sendErrorMessage("Invalid column update data")
		return
	}

	// Validate payload
	if err := models.ValidateUpdateColumnPayload(&updatePayload); err != nil {
		logger.Errorf("Invalid update column payload: %v", err)
		c.sendErrorMessage(err.Error())
		return
	}

	// Sanitize input
	updatePayload.Title = models.SanitizeString(updatePayload.Title)

	board, err := c.hub.store.GetBoard(c.boardID)
	if err != nil {
		logger.Errorf("Error getting board: %v", err)
		return
	}

	if column, exists := board.Columns[updatePayload.ColumnID]; exists {
		column.Title = updatePayload.Title

		if err := c.hub.store.SaveBoard(board); err != nil {
			logger.Errorf("Error saving board: %v", err)
			return
		}

		c.broadcastBoardState()
	} else {
		logger.Errorf("Column %s not found for update", updatePayload.ColumnID)
		c.sendErrorMessage("Column not found")
	}
}

func (c *Client) handleDeleteColumn(payload interface{}) {
	data, _ := json.Marshal(payload)
	var deletePayload models.DeleteColumnPayload
	if err := json.Unmarshal(data, &deletePayload); err != nil {
		logger.Errorf("Error unmarshaling delete column payload: %v", err)
		c.sendErrorMessage("Invalid column delete data")
		return
	}

	// Validate payload
	if err := models.ValidateDeleteColumnPayload(&deletePayload); err != nil {
		logger.Errorf("Invalid delete column payload: %v", err)
		c.sendErrorMessage(err.Error())
		return
	}

	board, err := c.hub.store.GetBoard(c.boardID)
	if err != nil {
		logger.Errorf("Error getting board: %v", err)
		return
	}

	if _, exists := board.Columns[deletePayload.ColumnID]; exists {
		delete(board.Columns, deletePayload.ColumnID)

		if err := c.hub.store.SaveBoard(board); err != nil {
			logger.Errorf("Error saving board: %v", err)
			return
		}

		c.broadcastBoardState()
	} else {
		logger.Errorf("Column %s not found for deletion", deletePayload.ColumnID)
		c.sendErrorMessage("Column not found")
	}
}

func (c *Client) handleTypingStart(payload interface{}) {
	typingMsg := models.WebSocketMessage{
		Type: "server:user:is_typing",
		Payload: map[string]interface{}{
			"userId":  c.userID,
			"boardId": c.boardID,
			"typing":  true,
		},
	}

	data, _ := json.Marshal(typingMsg)
	c.hub.BroadcastToBoard(c.boardID, data)
}

func (c *Client) handleTypingStop(payload interface{}) {
	typingMsg := models.WebSocketMessage{
		Type: "server:user:is_typing",
		Payload: map[string]interface{}{
			"userId":  c.userID,
			"boardId": c.boardID,
			"typing":  false,
		},
	}

	data, _ := json.Marshal(typingMsg)
	c.hub.BroadcastToBoard(c.boardID, data)
}

func (c *Client) handleCreateThread(payload interface{}) {
	data, _ := json.Marshal(payload)
	var createPayload models.CreateThreadPayload
	if err := json.Unmarshal(data, &createPayload); err != nil {
		logger.Errorf("Error unmarshaling create thread payload: %v", err)
		c.sendErrorMessage("Invalid thread data")
		return
	}

	// Validate payload
	if err := models.ValidateCreateThreadPayload(&createPayload); err != nil {
		logger.Errorf("Invalid create thread payload: %v", err)
		c.sendErrorMessage(err.Error())
		return
	}

	// Sanitize input
	createPayload.Content = models.SanitizeString(createPayload.Content)
	createPayload.Author = models.SanitizeString(createPayload.Author)

	board, err := c.hub.store.GetBoard(c.boardID)
	if err != nil {
		logger.Errorf("Error getting board: %v", err)
		return
	}

	// Find the tile and add thread
	for _, column := range board.Columns {
		for _, tile := range column.Tiles {
			if tile.ID == createPayload.TileID {
				newThread := &models.Thread{
					ID:        uuid.New().String(),
					Content:   createPayload.Content,
					Author:    createPayload.Author,
					CreatedAt: time.Now(),
				}

				tile.Threads = append(tile.Threads, newThread)

				if err := c.hub.store.SaveBoard(board); err != nil {
					logger.Errorf("Error saving board: %v", err)
					return
				}
				c.broadcastBoardState()
				return
			}
		}
	}
}

func (c *Client) broadcastBoardState() {
	board, err := c.hub.store.GetBoard(c.boardID)
	if err != nil {
		logger.Errorf("Error getting board for broadcast: %v", err)
		return
	}

	// Sanitize board data before broadcasting
	models.SanitizeBoard(board)

	boardStateMsg := models.WebSocketMessage{
		Type:    "server:board:state_update",
		Payload: board,
	}

	data, err := json.Marshal(boardStateMsg)
	if err != nil {
		logger.Errorf("Error marshaling board state for broadcast: %v", err)
		return
	}

	c.hub.BroadcastToBoard(c.boardID, data)
}

func (c *Client) sendErrorMessage(message string) {
	errorMsg := models.WebSocketMessage{
		Type: "error",
		Payload: map[string]interface{}{
			"message": message,
		},
	}

	data, err := json.Marshal(errorMsg)
	if err != nil {
		logger.Errorf("Error marshaling error message: %v", err)
		return
	}

	select {
	case c.send <- data:
	default:
		logger.Errorf("Failed to send error message to client")
	}
}