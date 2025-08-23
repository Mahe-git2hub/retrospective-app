# Live Retro Deployment Guide

This document provides detailed instructions for deploying Live Retro in various environments.

## Table of Contents

1. [Quick Start with Docker Compose](#quick-start-with-docker-compose)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Environment Variables](#environment-variables)
6. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)

## Quick Start with Docker Compose

The fastest way to get Live Retro running locally:

```bash
# Clone the repository
git clone <your-repo-url>
cd live-retro

# Start all services
docker-compose up --build

# Or use the development script
chmod +x scripts/dev.sh
./scripts/dev.sh
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Redis: localhost:6379

## Local Development Setup

### Prerequisites

- Go 1.21 or later
- Node.js 18 or later
- Redis server
- Docker (for Redis if not installed locally)

### Backend Development

```bash
cd server

# Install dependencies
go mod tidy

# Start Redis (if using Docker)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run the server
REDIS_URL=redis://localhost:6379 PORT=8080 go run cmd/server/main.go
```

### Frontend Development

```bash
cd client

# Install dependencies
npm install

# Set environment variables
export NEXT_PUBLIC_API_URL=http://localhost:8080
export NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Run development server
npm run dev
```

## Production Deployment

### Docker Images

Build production-ready Docker images:

```bash
# Build server image
docker build -t live-retro-server:latest ./server

# Build client image
docker build -t live-retro-client:latest ./client

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

1. **Prepare Images**

```bash
# Tag and push to your registry
docker tag live-retro-server:latest your-registry/live-retro-server:v1.0.0
docker tag live-retro-client:latest your-registry/live-retro-client:v1.0.0

docker push your-registry/live-retro-server:v1.0.0
docker push your-registry/live-retro-client:v1.0.0
```

2. **Update Kubernetes Manifests**

Edit the image references in `k8s/*.yaml` files:

```yaml
# In k8s/server-deployment.yaml
containers:
- name: server
  image: your-registry/live-retro-server:v1.0.0

# In k8s/client-deployment.yaml  
containers:
- name: client
  image: your-registry/live-retro-client:v1.0.0
```

3. **Deploy to Kubernetes**

```bash
# Create namespace
kubectl create namespace live-retro

# Apply all manifests
kubectl apply -f k8s/ -n live-retro

# Check deployment status
kubectl get pods -n live-retro
kubectl get services -n live-retro
```

4. **Configure Ingress**

Update `k8s/ingress-service.yaml` with your domain:

```yaml
spec:
  rules:
  - host: your-domain.com  # Replace with your actual domain
```

## AWS Deployment

### Prerequisites

- AWS CLI configured
- eksctl installed
- kubectl installed
- Docker installed

### Step 1: Create EKS Cluster

```bash
# Create EKS cluster
eksctl create cluster \
  --name live-retro-cluster \
  --region us-west-2 \
  --nodegroup-name live-retro-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed
```

### Step 2: Setup ECR Repository

```bash
# Create ECR repositories
aws ecr create-repository --repository-name live-retro-server --region us-west-2
aws ecr create-repository --repository-name live-retro-client --region us-west-2

# Get login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com
```

### Step 3: Build and Push Images

```bash
# Build and tag images
docker build -t <account-id>.dkr.ecr.us-west-2.amazonaws.com/live-retro-server:latest ./server
docker build -t <account-id>.dkr.ecr.us-west-2.amazonaws.com/live-retro-client:latest ./client

# Push to ECR
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/live-retro-server:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/live-retro-client:latest
```

### Step 4: Setup ElastiCache Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id live-retro-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --region us-west-2
```

### Step 5: Deploy Application

```bash
# Update image references in k8s manifests to use ECR URLs
# Then deploy
kubectl apply -f k8s/ -n live-retro
```

### Step 6: Setup Load Balancer

```bash
# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

# Create service account
eksctl create iamserviceaccount \
  --cluster=live-retro-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess \
  --override-existing-serviceaccounts \
  --approve
```

## Environment Variables

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `8080` | No |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | Yes |
| `GIN_MODE` | Gin mode (release/debug) | `debug` | No |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8080` | Yes |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8080` | Yes |

### Production Environment Variables

Create a `.env.production` file:

```bash
# Backend
REDIS_URL=redis://your-redis-host:6379
PORT=8080

# Frontend  
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
```

## Monitoring and Troubleshooting

### Health Checks

The application provides basic health check endpoints:

```bash
# Backend health
curl http://localhost:8080/api/boards

# Frontend health  
curl http://localhost:3000
```

### Logs

```bash
# Docker Compose logs
docker-compose logs -f

# Kubernetes logs
kubectl logs -f deployment/server-deployment -n live-retro
kubectl logs -f deployment/client-deployment -n live-retro
```

### Common Issues

1. **WebSocket Connection Failed**
   - Check CORS settings in backend
   - Verify WebSocket URL is correct
   - Ensure no proxy blocking WebSocket connections

2. **Redis Connection Failed**
   - Verify Redis is running and accessible
   - Check Redis URL format
   - Ensure network connectivity

3. **Build Failures**
   - Check Node.js and Go versions
   - Clear caches: `npm clean-install` or `go clean -modcache`
   - Verify all dependencies are available

### Scaling

To scale the application:

```bash
# Scale server replicas
kubectl scale deployment/server-deployment --replicas=5 -n live-retro

# Scale client replicas  
kubectl scale deployment/client-deployment --replicas=3 -n live-retro
```

### Backup and Recovery

Since the application uses ephemeral storage (Redis with TTL), regular backups aren't typically needed. However, for Redis persistence:

```bash
# Enable Redis persistence in production
docker run -d --name redis -v redis-data:/data redis:7-alpine redis-server --appendonly yes
```

### Security Considerations

1. **Network Security**
   - Use HTTPS/WSS in production
   - Configure proper firewall rules
   - Use VPC for AWS deployments

2. **Access Control**
   - Implement proper RBAC for Kubernetes
   - Use least privilege principles
   - Regular security audits

3. **Data Protection**
   - All data is ephemeral (auto-deleted)
   - No persistent sensitive data storage
   - Input sanitization on backend