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

// isValidUTF8 checks if the string is valid UTF-8
func isValidUTF8(s string) bool {
	return utf8.ValidString(s)
}

func ValidateCreateTilePayload(payload *CreateTilePayload) error {
	if payload.ColumnID == "" {
		return fmt.Errorf("column ID is required")
	}

	if strings.TrimSpace(payload.Content) == "" {
		return fmt.Errorf("tile content is required")
	}

	// Validate UTF-8 encoding
	if !isValidUTF8(payload.Content) {
		return fmt.Errorf("tile content contains invalid UTF-8 characters")
	}

	if !isValidUTF8(payload.Author) {
		return fmt.Errorf("author name contains invalid UTF-8 characters")
	}

	// Use rune count for proper UTF-8 character counting (includes emojis)
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

	// Validate UTF-8 encoding
	if !isValidUTF8(payload.Title) {
		return fmt.Errorf("column title contains invalid UTF-8 characters")
	}

	// Use rune count for proper UTF-8 character counting (includes emojis)
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

	// Validate UTF-8 encoding
	if !isValidUTF8(payload.Title) {
		return fmt.Errorf("column title contains invalid UTF-8 characters")
	}

	// Use rune count for proper UTF-8 character counting (includes emojis)
	if utf8.RuneCountInString(payload.Title) > MaxColumnTitleLength {
		return fmt.Errorf("column title exceeds maximum length of %d characters", MaxColumnTitleLength)
	}

	return nil
}

func ValidateDeleteColumnPayload(payload *DeleteColumnPayload) error {
	if payload.ColumnID == "" {
		return fmt.Errorf("column ID is required")
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

	// Validate UTF-8 encoding
	if !isValidUTF8(payload.Content) {
		return fmt.Errorf("thread content contains invalid UTF-8 characters")
	}

	if !isValidUTF8(payload.Author) {
		return fmt.Errorf("author name contains invalid UTF-8 characters")
	}

	// Use rune count for proper UTF-8 character counting (includes emojis)
	if utf8.RuneCountInString(payload.Content) > MaxThreadContentLength {
		return fmt.Errorf("thread content exceeds maximum length of %d characters", MaxThreadContentLength)
	}

	if utf8.RuneCountInString(payload.Author) > MaxAuthorNameLength {
		return fmt.Errorf("author name exceeds maximum length of %d characters", MaxAuthorNameLength)
	}

	return nil
}

func SanitizeString(input string) string {
	// Remove leading and trailing whitespace
	input = strings.TrimSpace(input)
	
	// Preserve line breaks but normalize excessive whitespace
	// Replace multiple consecutive spaces with single spaces, but preserve newlines
	lines := strings.Split(input, "\n")
	for i, line := range lines {
		// Trim each line and replace multiple spaces with single spaces
		line = strings.TrimSpace(line)
		// Replace multiple consecutive spaces with single space
		for strings.Contains(line, "  ") {
			line = strings.ReplaceAll(line, "  ", " ")
		}
		lines[i] = line
	}
	input = strings.Join(lines, "\n")
	
	// Remove excessive newlines (more than 2 consecutive)
	for strings.Contains(input, "\n\n\n") {
		input = strings.ReplaceAll(input, "\n\n\n", "\n\n")
	}
	
	// HTML escape to prevent XSS - this preserves UTF-8 characters including emojis
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