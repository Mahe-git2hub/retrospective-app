# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real-time, ephemeral retrospective web application built as a monorepo with Go backend and Next.js frontend. The application features collaborative boards that auto-delete after 30 minutes of inactivity.

## Project Structure

The project follows a monorepo structure with three main directories:
- `/client/` - Next.js frontend with TypeScript and Tailwind CSS
- `/server/` - Go backend with WebSocket support using Gorilla WebSocket
- `/k8s/` - Kubernetes manifests for AWS deployment

## Technology Stack

**Backend:**
- Go (Golang) with standard library for HTTP
- Gorilla WebSocket for real-time communication
- Redis for in-memory storage with TTL capabilities
- go-redis client library

**Frontend:**
- React with Next.js (App Router) and TypeScript
- Tailwind CSS for styling
- html2canvas for export functionality
- WebSocket client for real-time updates

**Infrastructure:**
- Docker containers
- Kubernetes orchestration on AWS
- Redis deployment

## Key Architecture Components

**Backend (`/server/internal/`):**
- `/api/` - HTTP handlers for REST endpoints
- `/hub/` - WebSocket hub managing client connections and rooms
- `/models/` - Go structs (Board, Column, Tile, Thread)
- `/store/` - Redis interaction logic with 30-minute TTL

**Frontend (`/client/app/`):**
- `/_components/board/` - Core board components (Board, Column, Tile, TypingIndicator)
- `/_components/layout/` - UI components (AdminControls, ThemeSwitcher)
- `/_hooks/` - WebSocket connection management (`useBoardSocket.ts`)
- `/[boardId]/` - Participant view
- `/admin/[adminKey]/` - Admin view

## Core Features

- **Real-time collaboration** via WebSocket connections
- **Admin/Participant roles** with different permissions
- **Hidden tiles** that require admin reveal
- **Anonymous submissions** with optional names
- **Typing indicators** for active users
- **Upvoting system** with toggle mechanics
- **Export to image** functionality
- **Dark/light theme** support

## Development Commands

Since this is a fresh repository, the typical commands would be:

**Go Backend:**
```bash
cd server
go mod init
go mod tidy
go run cmd/server/main.go
```

**Next.js Frontend:**
```bash
cd client
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
```

**Docker Development:**
```bash
docker-compose up --build
```

**Kubernetes Deployment:**
```bash
kubectl apply -f k8s/
```

## WebSocket Message Protocol

The application uses a structured WebSocket message format:
```json
{"type": "event-name", "payload": {...}}
```

**Client Events:**
- `client:tile:create` - Add new hidden tile
- `client:tile:reveal` - Admin reveals tile
- `client:tile:vote` - Toggle vote on tile
- `client:column:create/update/delete` - Admin column management
- `client:user:typing_start/stop` - Typing indicators

**Server Events:**
- `server:board:state_update` - Complete board state broadcast
- `server:user:is_typing` - Typing indicator broadcast

## Security Considerations

- All user content must be sanitized before storage/broadcast
- Secure random UUID generation for board and admin keys
- WSS (WebSocket Secure) for production
- Content validation on backend before Redis storage

## Data Models

**Board Structure:**
- Board contains map of Columns
- Column contains slice of Tiles  
- Tile has Content, Author, Threads, VoterIDs, and IsHidden flag
- Thread has Content and Author

All data persists in Redis with automatic 30-minute expiration that resets on activity.