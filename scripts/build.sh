#!/bin/bash

# CoopSystem - Build Script
# Uso: ./scripts/build.sh [environment]

set -e

# Configurações
ENVIRONMENT=${1:-development}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/deploy/build"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 Iniciando build do CoopSystem"
echo "📁 Projeto: $PROJECT_ROOT"
echo "🌍 Ambiente: $ENVIRONMENT"
echo "⏰ Timestamp: $TIMESTAMP"
echo ""

# Criar diretório de build
mkdir -p "$BUILD_DIR"

# Build Backend
echo "📦 Build Backend (.NET)..."
cd "$PROJECT_ROOT/src/CoopSystem.API"

if [ "$ENVIRONMENT" = "production" ]; then
    dotnet publish -c Release -r linux-x64 --self-contained false -o "$BUILD_DIR/api"
else
    dotnet publish -c Debug -r linux-x64 --self-contained false -o "$BUILD_DIR/api"
fi

echo "✅ Backend build concluído"

# Build Frontend
echo "🎨 Build Frontend (React)..."
cd "$PROJECT_ROOT/frontend"

if [ "$ENVIRONMENT" = "production" ]; then
    npm ci --only=production
    npm run build
    cp -r build/* "$BUILD_DIR/frontend/"
else
    npm ci
    npm run build
    cp -r build/* "$BUILD_DIR/frontend/"
fi

echo "✅ Frontend build concluído"

# Copiar arquivos de configuração
echo "📋 Copiando configurações..."
cp "$PROJECT_ROOT/deploy/docker/docker-compose.yml" "$BUILD_DIR/"
cp "$PROJECT_ROOT/deploy/docker/.env.example" "$BUILD_DIR/.env"

# Copiar scripts de deploy
cp "$PROJECT_ROOT/scripts/deploy.sh" "$BUILD_DIR/"
cp "$PROJECT_ROOT/scripts/rollback.sh" "$BUILD_DIR/"

# Gerar checksum
echo "🔐 Gerando checksums..."
cd "$BUILD_DIR"
find . -type f \( -name "*.dll" -o -name "*.js" -o -name "*.css" \) -exec sha256sum {} \; > checksums.txt

echo "✅ Checksums gerados"

# Compactar build
echo "📦 Compactando build..."
cd "$PROJECT_ROOT/deploy"
tar -czf "coopsystem-$ENVIRONMENT-$TIMESTAMP.tar.gz" -C "build" .

echo "✅ Build compactado: coopsystem-$ENVIRONMENT-$TIMESTAMP.tar.gz"

# Limpar diretório temporário
rm -rf "$BUILD_DIR"

echo ""
echo "🎉 Build concluído com sucesso!"
echo "📦 Artefato: deploy/coopsystem-$ENVIRONMENT-$TIMESTAMP.tar.gz"
echo "🔐 Checksums disponíveis no artefato"
