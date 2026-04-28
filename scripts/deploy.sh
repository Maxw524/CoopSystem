#!/bin/bash

# CoopSystem - Deploy Script
# Uso: ./scripts/deploy.sh [environment] [version]

set -e

# Configurações
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="/opt/coopsystem"
BACKUP_DIR="/opt/backups/coopsystem"
SERVICE_NAME="coopsystem"

echo "🚀 Iniciando deploy do CoopSystem"
echo "🌍 Ambiente: $ENVIRONMENT"
echo "📦 Versão: $VERSION"
echo "📁 Diretório: $DEPLOY_DIR"
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script precisa ser executado como root"
    exit 1
fi

# Criar diretórios
echo "📁 Criando diretórios..."
mkdir -p "$DEPLOY_DIR"
mkdir -p "$BACKUP_DIR"

# Backup da versão atual
if [ -d "$DEPLOY_DIR" ]; then
    echo "💾 Fazendo backup da versão atual..."
    BACKUP_NAME="backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    cp -r "$DEPLOY_DIR"/* "$BACKUP_DIR/$BACKUP_NAME/"
    echo "✅ Backup criado: $BACKUP_DIR/$BACKUP_NAME"
fi

# Extrair artefato
echo "📦 Extraindo artefato..."
ARTIFACT="coopsystem-$ENVIRONMENT-$VERSION.tar.gz"
if [ ! -f "$PROJECT_ROOT/deploy/$ARTIFACT" ]; then
    echo "❌ Artefato não encontrado: $ARTIFACT"
    exit 1
fi

cd "$DEPLOY_DIR"
tar -xzf "$PROJECT_ROOT/deploy/$ARTIFACT"
echo "✅ Artefato extraído"

# Verificar checksums
echo "🔐 Verificando integridade..."
if [ -f "checksums.txt" ]; then
    sha256sum -c checksums.txt
    if [ $? -eq 0 ]; then
        echo "✅ Integridade verificada"
    else
        echo "❌ Erro na verificação de integridade"
        exit 1
    fi
fi

# Parar serviços
echo "⏹️ Parando serviços..."
systemctl stop nginx || true
systemctl stop coopsystem-api || true
docker-compose down || true

# Deploy Frontend
echo "🎨 Deploy Frontend..."
if [ -d "frontend" ]; then
    rm -rf /var/www/coopsystem/*
    cp -r frontend/* /var/www/coopsystem/
    chown -R www-data:www-data /var/www/coopsystem/
    chmod -R 755 /var/www/coopsystem/
    echo "✅ Frontend deployado"
fi

# Deploy Backend
echo "📦 Deploy Backend..."
if [ -d "api" ]; then
    rm -rf "$DEPLOY_DIR/api"
    cp -r api "$DEPLOY_DIR/"
    chown -R coopsystem:coopsystem "$DEPLOY_DIR/api"
    chmod -R 755 "$DEPLOY_DIR/api"
    echo "✅ Backend deployado"
fi

# Configurar variáveis de ambiente
echo "⚙️ Configurando ambiente..."
if [ -f ".env" ]; then
    # Substituir variáveis de ambiente
    if [ "$ENVIRONMENT" = "production" ]; then
        sed -i 's/ASPNETCORE_ENVIRONMENT=.*/ASPNETCORE_ENVIRONMENT=Production/' .env
    else
        sed -i 's/ASPNETCORE_ENVIRONMENT=.*/ASPNETCORE_ENVIRONMENT=Staging/' .env
    fi
    echo "✅ Ambiente configurado"
fi

# Iniciar serviços
echo "▶️ Iniciando serviços..."
if [ -f "docker-compose.yml" ]; then
    docker-compose up -d
else
    systemctl start coopsystem-api
    systemctl start nginx
fi

# Verificar deploy
echo "🔍 Verificando deploy..."
sleep 10

# Health check API
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || echo "000")
if [ "$API_HEALTH" = "200" ]; then
    echo "✅ API saudável"
else
    echo "❌ API não respondendo (HTTP $API_HEALTH)"
    echo "🔄 Fazendo rollback..."
    "$PROJECT_ROOT/scripts/rollback.sh"
    exit 1
fi

# Health check Frontend
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "000")
if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo "✅ Frontend saudável"
else
    echo "❌ Frontend não respondendo (HTTP $FRONTEND_HEALTH)"
    echo "🔄 Fazendo rollback..."
    "$PROJECT_ROOT/scripts/rollback.sh"
    exit 1
fi

# Limpar artefatos antigos
echo "🧹 Limpando artefatos antigos..."
find "$PROJECT_ROOT/deploy" -name "coopsystem-$ENVIRONMENT-*.tar.gz" -mtime +7 -delete

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo "🌍 Ambiente: $ENVIRONMENT"
echo "📦 Versão: $VERSION"
echo "⏰ Data: $(date)"
echo "💾 Backup disponível em: $BACKUP_DIR"
