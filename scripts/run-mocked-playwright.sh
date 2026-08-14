#!/bin/bash
# Exit on error
set -e

# Configuration
IMAGE_NAME="variamos-admin-frontend"
CONTAINER_NAME="admin-front-test"
PORT=3000

echo "Building frontend Docker image..."
docker build -t $IMAGE_NAME .

# Ensure old container is removed if it exists
docker rm -f $CONTAINER_NAME 2>/dev/null || true

echo "Starting frontend Docker container on port $PORT..."
docker run -d -p $PORT:3000 --name $CONTAINER_NAME $IMAGE_NAME

# Wait for container to be ready
echo "Waiting for frontend to be ready on port $PORT..."
# Disable exit-on-error temporarily for curl check loop
set +e
count=0
until $(curl --output /dev/null --silent --head --fail http://localhost:$PORT); do
    printf '.'
    sleep 1
    count=$((count+1))
    if [ $count -gt 30 ]; then
        echo "Error: Timeout waiting for frontend container to start!"
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
        exit 1
    fi
done
set -e
echo " Ready!"

# Run Playwright
echo "Running Playwright mocked tests..."
status=0
npx playwright test --grep .mocked. || status=$?

# Cleanup
echo "Cleaning up Docker container..."
docker stop $CONTAINER_NAME || true
docker rm $CONTAINER_NAME || true
docker image prune -f || true

# Exit with Playwright status
exit $status
