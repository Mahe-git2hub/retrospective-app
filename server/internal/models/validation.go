package models

import (
	"fmt"
	"html"
	"strings"
	"unicode/utf8"
)

const (
	MaxTileContentLength   = 1000
	MaxColumnTitleLength   = 100
	MaxAuthorNameLength    = 50
	MaxThreadContentLength = 500
)

func ValidateCreateTilePayload(payload *CreateTilePayload) error {
	if payload.ColumnID == "" {
		return fmt.Errorf("column ID is required")
	}

	if strings.TrimSpace(payload.Content) == "" {
		return fmt.Errorf("tile content is required")
	}

	if utf8.RuneCountInString(payload.Content) > MaxTileContentLength {
		return fmt.Errorf("tile content exceeds maximum length of %d characters", MaxTileContentLength)
	}

	if utf8.RuneCountInString(payload.Author) > MaxAuthorNameLength {
		return fmt.Errorf("author name exceeds maximum length of %d characters", MaxAuthorNameLength)
	}

	return nil
}

func ValidateCreateColumnPayload(payload *CreateColumnPayload) error {
	if strings.TrimSpace(payload.Title) == "" {
		return fmt.Errorf("column title is required")
	}

	if utf8.RuneCountInString(payload.Title) > MaxColumnTitleLength {
		return fmt.Errorf("column title exceeds maximum length of %d characters", MaxColumnTitleLength)
	}

	return nil
}

func ValidateUpdateColumnPayload(payload *UpdateColumnPayload) error {
	if payload.ColumnID == "" {
		return fmt.Errorf("column ID is required")
	}

	if strings.TrimSpace(payload.Title) == "" {
		return fmt.Errorf("column title is required")
	}

	if utf8.RuneCountInString(payload.Title) > MaxColumnTitleLength {
		return fmt.Errorf("column title exceeds maximum length of %d characters", MaxColumnTitleLength)
	}

	return nil
}

func ValidateCreateThreadPayload(payload *CreateThreadPayload) error {
	if payload.TileID == "" {
		return fmt.Errorf("tile ID is required")
	}

	if strings.TrimSpace(payload.Content) == "" {
		return fmt.Errorf("thread content is required")
	}

	if utf8.RuneCountInString(payload.Content) > MaxThreadContentLength {
		return fmt.Errorf("thread content exceeds maximum length of %d characters", MaxThreadContentLength)
	}

	if utf8.RuneCountInString(payload.Author) > MaxAuthorNameLength {
		return fmt.Errorf("author name exceeds maximum length of %d characters", MaxAuthorNameLength)
	}

	return nil
}

func SanitizeString(input string) string {
	// Remove excessive whitespace
	input = strings.TrimSpace(input)
	
	// Replace multiple consecutive spaces/newlines with single ones
	input = strings.Join(strings.Fields(input), " ")
	
	// HTML escape to prevent XSS
	input = html.EscapeString(input)
	
	return input
}

func SanitizeTile(tile *Tile) {
	tile.Content = SanitizeString(tile.Content)
	tile.Author = SanitizeString(tile.Author)
	
	for _, thread := range tile.Threads {
		thread.Content = SanitizeString(thread.Content)
		thread.Author = SanitizeString(thread.Author)
	}
}

func SanitizeColumn(column *Column) {
	column.Title = SanitizeString(column.Title)
	
	for _, tile := range column.Tiles {
		SanitizeTile(tile)
	}
}

func SanitizeBoard(board *Board) {
	for _, column := range board.Columns {
		SanitizeColumn(column)
	}
}