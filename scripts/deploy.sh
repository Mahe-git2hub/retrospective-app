#!/bin/bash

# Deployment script for Live Retro

set -e

# Configuration
REGISTRY=${DOCKER_REGISTRY:-"your-registry"}
VERSION=${VERSION:-"latest"}
NAMESPACE=${KUBE_NAMESPACE:-"default"}

echo "🚀 Deploying Live Retro..."
echo "Registry: $REGISTRY"
echo "Version: $VERSION"
echo "Namespace: $NAMESPACE"

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found"
    exit 1
fi

# Check kubectl connection
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster"
    exit 1
fi

# Build and push images
echo "🏗️ Building Docker images..."

# Build server image
echo "📦 Building server image..."
docker build -t "$REGISTRY/live-retro-server:$VERSION" ./server
docker push "$REGISTRY/live-retro-server:$VERSION"

# Build client image
echo "📦 Building client image..."
docker build -t "$REGISTRY/live-retro-client:$VERSION" ./client
docker push "$REGISTRY/live-retro-client:$VERSION"

# Update Kubernetes manifests
echo "📝 Updating Kubernetes manifests..."

# Create temporary directory for updated manifests
TEMP_DIR=$(mktemp -d)
cp -r k8s/* "$TEMP_DIR/"

# Update image references in manifests
sed -i "s|live-retro-server:latest|$REGISTRY/live-retro-server:$VERSION|g" "$TEMP_DIR"/*.yaml
sed -i "s|live-retro-client:latest|$REGISTRY/live-retro-client:$VERSION|g" "$TEMP_DIR"/*.yaml

# Deploy to Kubernetes
echo "☸️ Deploying to Kubernetes..."

# Create namespace if it doesn't exist
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Apply manifests
kubectl apply -f "$TEMP_DIR/" -n "$NAMESPACE"

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/redis-deployment -n "$NAMESPACE"
kubectl wait --for=condition=available --timeout=300s deployment/server-deployment -n "$NAMESPACE"
kubectl wait --for=condition=available --timeout=300s deployment/client-deployment -n "$NAMESPACE"

# Get service information
echo "📋 Service information:"
kubectl get services -n "$NAMESPACE"

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🔗 To access the application:"
echo "   kubectl port-forward service/client-service 3000:3000 -n $NAMESPACE"
echo ""
echo "📊 To check status:"
echo "   kubectl get pods -n $NAMESPACE"
echo "   kubectl logs -f deployment/server-deployment -n $NAMESPACE"