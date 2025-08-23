package models

import (
	"time"
)

type Board struct {
	ID        string             `json:"id"`
	AdminKey  string             `json:"adminKey"`
	Columns   map[string]*Column `json:"columns"`
	CreatedAt time.Time          `json:"createdAt"`
	UpdatedAt time.Time          `json:"updatedAt"`
}

type Column struct {
	ID    string  `json:"id"`
	Title string  `json:"title"`
	Order int     `json:"order"`
	Tiles []*Tile `json:"tiles"`
}

type Tile struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	Author    string    `json:"author"`
	IsHidden  bool      `json:"isHidden"`
	VoterIDs  []string  `json:"voterIds"`
	Threads   []*Thread `json:"threads"`
	CreatedAt time.Time `json:"createdAt"`
}

type Thread struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	Author    string    `json:"author"`
	CreatedAt time.Time `json:"createdAt"`
}

type WebSocketMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type CreateTilePayload struct {
	ColumnID string `json:"columnId"`
	Content  string `json:"content"`
	Author   string `json:"author,omitempty"`
}

type RevealTilePayload struct {
	TileID string `json:"tileId"`
}

type VoteTilePayload struct {
	TileID string `json:"tileId"`
}

type CreateColumnPayload struct {
	Title string `json:"title"`
}

type UpdateColumnPayload struct {
	ColumnID string `json:"columnId"`
	Title    string `json:"title"`
}

type DeleteColumnPayload struct {
	ColumnID string `json:"columnId"`
}

type TypingPayload struct {
	UserID string `json:"userId"`
}

type CreateThreadPayload struct {
	TileID  string `json:"tileId"`
	Content string `json:"content"`
	Author  string `json:"author,omitempty"`
}