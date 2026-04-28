#!/bin/bash

# CoopSystem - Rollback Script
# Uso: ./scripts/rollback.sh [backup_name]

set -e

# Configurações
BACKUP_NAME=${1:-latest}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="/opt/coopsystem"
BACKUP_DIR="/opt/backups/coopsystem"

echo "🔄 Iniciando rollback do CoopSystem"
echo "📦 Backup: $BACKUP_NAME"
echo "📁 Diretório: $DEPLOY_DIR"
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script precisa ser executado como root"
    exit 1
fi

# Encontrar backup mais recente
if [ "$BACKUP_NAME" = "latest" ]; then
    BACKUP_NAME=$(ls -t "$BACKUP_DIR" | head -n 1)
    echo "📦 Usando backup mais recente: $BACKUP_NAME"
fi

# Verificar se backup existe
if [ ! -d "$BACKUP_DIR/$BACKUP_NAME" ]; then
    echo "❌ Backup não encontrado: $BACKUP_DIR/$BACKUP_NAME"
    exit 1
fi

# Parar serviços
echo "⏹️ Parando serviços..."
systemctl stop nginx || true
systemctl stop coopsystem-api || true
docker-compose down || true

# Limpar deploy atual
echo "🧹 Limpando deploy atual..."
rm -rf "$DEPLOY_DIR"/*
mkdir -p "$DEPLOY_DIR"

# Restaurar backup
echo "💾 Restaurando backup..."
cp -r "$BACKUP_DIR/$BACKUP_NAME"/* "$DEPLOY_DIR/"
chown -R coopsystem:coopsystem "$DEPLOY_DIR/"
chmod -R 755 "$DEPLOY_DIR/"

# Iniciar serviços
echo "▶️ Iniciando serviços..."
if [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
    cd "$DEPLOY_DIR"
    docker-compose up -d
else
    systemctl start coopsystem-api
    systemctl start nginx
fi

# Verificar rollback
echo "🔍 Verificando rollback..."
sleep 10

# Health check API
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || echo "000")
if [ "$API_HEALTH" = "200" ]; then
    echo "✅ API restaurada com sucesso"
else
    echo "❌ API não respondendo após rollback (HTTP $API_HEALTH)"
    exit 1
fi

# Health check Frontend
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "000")
if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo "✅ Frontend restaurado com sucesso"
else
    echo "❌ Frontend não respondendo após rollback (HTTP $FRONTEND_HEALTH)"
    exit 1
fi

echo ""
echo "🎉 Rollback concluído com sucesso!"
echo "📦 Backup restaurado: $BACKUP_NAME"
echo "⏰ Data: $(date)"
