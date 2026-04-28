# CoopSystem - Deployment Guide

## 🚀 Visão Geral

Este guia cobre o deployment do CoopSystem em diferentes ambientes seguindo as melhores práticas de segurança e performance.

## 📋 Pré-requisitos

### Ambiente
- **.NET 8.0 SDK** ou Runtime
- **Node.js 18+** para frontend
- **SQL Server 2019+** ou PostgreSQL 13+
- **Redis** para cache (opcional)
- **Docker** e **Docker Compose** (recomendado)

### Ferramentas
- **Git** para controle de versão
- **PowerShell** ou **Bash** para scripts
- **SSL Certificate** para HTTPS

## 🏗️ Estrutura de Deploy

```
deploy/
├── 📁 docker/                    # Configurações Docker
│   ├── 📄 Dockerfile.api        # API Backend
│   ├── 📄 Dockerfile.frontend   # Frontend React
│   └── 📄 docker-compose.yml   # Stack completa
├── 📁 k8s/                      # Kubernetes (opcional)
│   ├── 📄 namespace.yaml
│   ├── 📄 configmap.yaml
│   └── 📄 deployment.yaml
├── 📁 iis/                       # IIS Deployment
│   ├── 📄 web.config
│   └── 📄 appsettings.json
└── 📁 nginx/                      # Nginx Config
    └── 📄 nginx.conf
```

## 🐳 Docker Deployment (Recomendado)

### 1. Build das Imagens

```bash
# Build API
docker build -t coopsystem-api:latest -f deploy/docker/Dockerfile.api .

# Build Frontend
docker build -t coopsystem-frontend:latest -f deploy/docker/Dockerfile.frontend .
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  api:
    image: coopsystem-api:latest
    container_name: coopsystem-api
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=${DB_CONNECTION}
      - Jwt__Key=${JWT_KEY}
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  frontend:
    image: coopsystem-frontend:latest
    container_name: coopsystem-frontend
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=http://api:8080
    depends_on:
      - api
    restart: unless-stopped

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: coopsystem-db
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=${DB_PASSWORD}
    volumes:
      - db_data:/var/opt/mssql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: coopsystem-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  db_data:
  redis_data:
```

### 3. Executar Deploy

```bash
# Copiar arquivos de configuração
cp deploy/docker/docker-compose.yml .

# Definir variáveis de ambiente
export DB_CONNECTION="Server=db;Database=CoopSystemNovo;User Id=sa;Password=${DB_PASSWORD};"
export JWT_KEY="SuaChaveSecretaSuperSegura123456789"

# Iniciar stack
docker-compose up -d
```

## 🌐 Traditional Deployment

### IIS (Windows Server)

#### 1. Publicar API
```bash
dotnet publish src/CoopSystem.API \
  -c Release \
  -r win-x64 \
  --self-contained false \
  -o deploy/iis/api
```

#### 2. Configurar IIS
```xml
<!-- deploy/iis/web.config -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    <aspNetCore processPath="dotnet" 
                  arguments=".\CoopSystem.API.dll" 
                  stdoutLogEnabled="false" 
                  stdoutLogFile=".\logs\stdout" 
                  hostingModel="inprocess">
      <environmentVariables>
        <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
      </environmentVariables>
    </aspNetCore>
  </system.webServer>
</configuration>
```

#### 3. Configurar Application Pool
- **.NET CLR Version**: No Managed Code
- **Managed Pipeline Mode**: Integrated
- **Identity**: ApplicationPoolIdentity

### Nginx (Linux)

#### 1. Build Frontend
```bash
cd frontend
npm run build
cp -r build/* /var/www/coopsystem/
```

#### 2. Configurar Nginx
```nginx
# deploy/nginx/nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /var/www/coopsystem;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # HTTPS Redirect
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Rest of configuration...
}
```

## 🔐 Security Configuration

### 1. SSL/TLS
```bash
# Gerar certificado (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deploy/ssl/private.key \
  -out deploy/ssl/certificate.crt

# Production: Usar Let's Encrypt ou certificado comercial
certbot --nginx -d your-domain.com
```

### 2. Environment Variables
```bash
# Production
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="Server=prod-server;Database=CoopSystemNovo;..."
export Jwt__Key="CHAVE-SEGURA-PRODUCAO-256-BITS"
export Jwt__Issuer="CoopSystem"
export Jwt__Audience="CoopSystem.Users"
```

### 3. Firewall Rules
```bash
# API Port
ufw allow 5000/tcp

# Frontend Port
ufw allow 80/tcp
ufw allow 443/tcp

# Database
ufw allow 1433/tcp  # SQL Server
# ufw allow 5432/tcp  # PostgreSQL
```

## 📊 Monitoramento e Logs

### 1. Application Logs
```bash
# Ver logs da API
docker logs coopsystem-api -f

# Ver logs do frontend
docker logs coopsystem-frontend -f
```

### 2. Health Checks
```bash
# API Health
curl https://your-domain.com/api/health

# Frontend Health
curl https://your-domain.com/health.html
```

### 3. Performance Monitoring
```bash
# Docker Stats
docker stats

# System Resources
htop
df -h
free -m
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy CoopSystem

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      - name: Test
        run: dotnet test
      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # Deploy commands
          docker-compose up -d
```

## 🚨 Troubleshooting

### Issues Comuns

#### 1. API não inicia
```bash
# Verificar logs
docker logs coopsystem-api

# Verificar variáveis de ambiente
docker exec coopsystem-api env | grep -E "(CONNECTION|JWT)"
```

#### 2. Frontend não conecta
```bash
# Verificar configuração de API
curl -I https://your-domain.com/api/health

# Verificar CORS
curl -H "Origin: https://your-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://your-domain.com/api/health
```

#### 3. Database Connection
```bash
# Testar conexão
docker exec coopsystem-api \
  dotnet CoopSystem.API.dll --test-connection

# Verificar string de conexão
docker exec coopsystem-db \
  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P $SA_PASSWORD
```

## 📱 Rollback

### 1. Docker Rollback
```bash
# Parar stack atual
docker-compose down

# Voltar para versão anterior
docker-compose up -d --force-recreate
```

### 2. Traditional Rollback
```bash
# Restaurar backup do IIS
%windir%\system32\inetsrv\appcmd restore backup "CoopSystem"

# Restaurar arquivos anteriores
cp -r backup/previous-version/* /var/www/coopsystem/
```

---

**CoopSystem** - Guia de Deployment Completo  
Versão: 2.0.0  
Atualizado: Março/2026
