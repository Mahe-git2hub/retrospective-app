package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"live-retro-server/internal/models"
)

type RedisStore struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisStore(redisURL string) *RedisStore {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		panic(fmt.Sprintf("Failed to parse Redis URL: %v", err))
	}

	client := redis.NewClient(opts)
	
	// Test connection
	ctx := context.Background()
	_, err = client.Ping(ctx).Result()
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to Redis: %v", err))
	}

	return &RedisStore{
		client: client,
		ctx:    ctx,
	}
}

func (r *RedisStore) SaveBoard(board *models.Board) error {
	board.UpdatedAt = time.Now()
	
	data, err := json.Marshal(board)
	if err != nil {
		return fmt.Errorf("failed to marshal board: %v", err)
	}

	key := fmt.Sprintf("board:%s", board.ID)
	
	// Save board and reset TTL to 30 minutes
	err = r.client.Set(r.ctx, key, data, 30*time.Minute).Err()
	if err != nil {
		return fmt.Errorf("failed to save board to Redis: %v", err)
	}

	return nil
}

func (r *RedisStore) GetBoard(boardID string) (*models.Board, error) {
	key := fmt.Sprintf("board:%s", boardID)
	
	data, err := r.client.Get(r.ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("board not found")
		}
		return nil, fmt.Errorf("failed to get board from Redis: %v", err)
	}

	var board models.Board
	err = json.Unmarshal([]byte(data), &board)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal board: %v", err)
	}

	return &board, nil
}

func (r *RedisStore) BoardExists(boardID string) bool {
	key := fmt.Sprintf("board:%s", boardID)
	exists, err := r.client.Exists(r.ctx, key).Result()
	if err != nil {
		return false
	}
	return exists > 0
}

func (r *RedisStore) DeleteBoard(boardID string) error {
	key := fmt.Sprintf("board:%s", boardID)
	err := r.client.Del(r.ctx, key).Err()
	if err != nil {
		return fmt.Errorf("failed to delete board from Redis: %v", err)
	}
	return nil
}

func (r *RedisStore) Close() error {
	return r.client.Close()
}