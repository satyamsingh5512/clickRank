#!/bin/bash

echo "=== Verifying Build Prerequisites ==="

if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD=""
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✓ Docker is installed: $(docker --version)"
else
    echo "✗ Docker is not installed"
    exit 1
fi

# Check Docker permissions
if docker ps &> /dev/null; then
    echo "✓ Docker permissions are correct"
else
    echo "✗ Docker permission denied. Run: sudo usermod -aG docker $USER && newgrp docker"
    exit 1
fi

# Check Docker Compose
if [ -n "$COMPOSE_CMD" ]; then
    echo "✓ Docker Compose is available: $($COMPOSE_CMD version | head -n 1)"
else
    echo "✗ Docker Compose is not installed (docker compose / docker-compose not found)"
    exit 1
fi

# Check Maven
if command -v mvn &> /dev/null; then
    echo "✓ Maven is installed: $(mvn --version | head -n 1)"
else
    echo "✗ Maven is not installed"
    exit 1
fi

# Check Java
if command -v java &> /dev/null; then
    echo "✓ Java is installed: $(java -version 2>&1 | head -n 1)"
else
    echo "✗ Java is not installed"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js is installed: $(node --version)"
else
    echo "⚠ Node.js is not installed (only needed for frontend)"
fi

echo ""
echo "=== All prerequisites met! ==="
echo "You can now run: ./build-all.sh"
