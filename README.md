# Live Retro

A real-time, ephemeral retrospective web application built with Go backend and Next.js frontend. Boards automatically delete after 30 minutes of inactivity.

## Features

- **Real-time collaboration** via WebSocket connections
- **Admin/Participant roles** with different permissions
- **Ephemeral boards** that auto-delete after 30 minutes
- **Hidden tiles** that require admin reveal
- **Anonymous submissions** with optional names
- **Typing indicators** for active users
- **Upvoting system** with toggle mechanics
- **Export to image** functionality
- **Dark/light theme** support
- **Responsive design** for mobile and desktop

## Technology Stack

**Backend:**
- Go 1.21 with standard library HTTP server
- Gorilla WebSocket for real-time communication
- Redis for in-memory storage with TTL
- Docker for containerization

**Frontend:**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Zustand for state management
- html2canvas for image export

**Infrastructure:**
- Docker and Docker Compose for development
- Kubernetes manifests for production deployment
- AWS-ready configuration

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd live-retro
```

2. Start all services:
```bash
docker-compose up --build
```

3. Open your browser:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

### Manual Development Setup

**Prerequisites:**
- Go 1.21 or later
- Node.js 18 or later
- Redis server

**Backend Setup:**
```bash
cd server
go mod tidy
REDIS_URL=redis://localhost:6379 go run cmd/server/main.go
```

**Frontend Setup:**
```bash
cd client
npm install
npm run dev
```

## Usage

1. **Create a Board**: Visit the homepage and click "Create New Board"
2. **Admin Access**: You'll be redirected to the admin view with full controls
3. **Share with Team**: Use the "Share Link" button to copy the participant URL
4. **Add Columns**: Create columns for different retrospective categories
5. **Add Cards**: Team members add anonymous feedback cards
6. **Reveal & Discuss**: Admin reveals cards for discussion
7. **Vote & Prioritize**: Team votes on important items
8. **Export Results**: Download the board as an image

## API Endpoints

- `POST /api/boards` - Create a new board
- `GET /api/boards/{id}` - Get board data
- `GET /ws?boardId={id}&adminKey={key}` - WebSocket connection

## WebSocket Events

**Client Events:**
- `client:tile:create` - Add new tile
- `client:tile:reveal` - Admin reveals tile
- `client:tile:vote` - Toggle vote on tile
- `client:column:create/update/delete` - Column management
- `client:user:typing_start/stop` - Typing indicators
- `client:thread:create` - Add comment to tile

**Server Events:**
- `server:board:state_update` - Complete board state
- `server:user:is_typing` - Typing indicator broadcast

## Environment Variables

**Backend:**
- `REDIS_URL` - Redis connection string (default: redis://localhost:6379)
- `PORT` - Server port (default: 8080)

**Frontend:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8080)
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (default: ws://localhost:8080)

## Production Deployment

### Kubernetes

1. Build and push Docker images:
```bash
docker build -t your-registry/live-retro-server:latest ./server
docker build -t your-registry/live-retro-client:latest ./client
docker push your-registry/live-retro-server:latest
docker push your-registry/live-retro-client:latest
```

2. Update image references in `k8s/*.yaml` files

3. Deploy to Kubernetes:
```bash
kubectl apply -f k8s/
```

### AWS Deployment

The application includes configurations for:
- **EKS** (Elastic Kubernetes Service)
- **Application Load Balancer** for ingress
- **ElastiCache Redis** for production Redis

## Development Commands

**Go Backend:**
```bash
cd server
go mod tidy          # Install dependencies
go run cmd/server/main.go  # Run development server
go build cmd/server/main.go  # Build binary
```

**Next.js Frontend:**
```bash
cd client
npm install          # Install dependencies
npm run dev         # Development server
npm run build       # Production build
npm run start       # Start production server
npm run lint        # Run ESLint
npm run typecheck   # TypeScript checking
```

## Architecture

The application follows a clean architecture pattern:

```
/server/
├── cmd/server/          # Application entry point
├── internal/
│   ├── api/            # HTTP handlers
│   ├── hub/            # WebSocket hub and client management
│   ├── models/         # Data structures
│   └── store/          # Redis operations

/client/
├── app/
│   ├── _components/    # Reusable UI components
│   ├── _hooks/         # Custom React hooks
│   ├── [boardId]/      # Participant board page
│   └── admin/[adminKey]/  # Admin board page
```

## Security Considerations

- All user content is sanitized before storage
- Admin keys use secure UUID generation
- WebSocket connections validate board access
- CORS is configured for production use
- No sensitive data is logged or exposed

## License

This project is licensed under the MIT License with attribution requirements.

**Copyright (c) 2024 Mahe-git2hub**

### Usage Requirements

This software may be used freely for both personal and commercial purposes, but **ALL USES MUST INCLUDE ATTRIBUTION** to Mahe-git2hub.

**Required Attribution:**
- Credit to: **Mahe-git2hub** 
- License notice: "Used under MIT License"
- Attribution must be visible to end users (About page, credits, etc.)

**❌ Using this software without proper attribution is NOT acceptable and constitutes license violation.**

See the [LICENSE](LICENSE) file for full terms and conditions.

## Contributing

[Add contributing guidelines here]