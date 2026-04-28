#!/bin/bash

# CoopSystem - Test Script
# Uso: ./scripts/test.sh [unit|integration|e2e]

set -e

# Configurações
TEST_TYPE=${1:-all}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_RESULTS="$PROJECT_ROOT/test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🧪 Iniciando testes do CoopSystem"
echo "📁 Projeto: $PROJECT_ROOT"
echo "🧪 Tipo: $TEST_TYPE"
echo "⏰ Timestamp: $TIMESTAMP"
echo ""

# Criar diretório de resultados
mkdir -p "$TEST_RESULTS"

# Testes Unitários
if [ "$TEST_TYPE" = "all" ] || [ "$TEST_TYPE" = "unit" ]; then
    echo "🔬 Executando testes unitários..."
    
    # Testar API
    cd "$PROJECT_ROOT/src/CoopSystem.API"
    dotnet test --logger "console;verbosity=detailed" \
        --results-directory "$TEST_RESULTS/unit-api" \
        --collect:"XPlat Code Coverage"
    
    # Testar Módulos
    for module in modules/*; do
        if [ -d "$module" ] && [ -f "$module/*.csproj" ]; then
            echo "🧪 Testando módulo: $(basename $module)"
            cd "$module"
            dotnet test --logger "console;verbosity=detailed" \
                --results-directory "$TEST_RESULTS/unit-$(basename $module)" \
                --collect:"XPlat Code Coverage"
            cd "$PROJECT_ROOT"
        fi
    done
    
    echo "✅ Testes unitários concluídos"
fi

# Testes de Integração
if [ "$TEST_TYPE" = "all" ] || [ "$TEST_TYPE" = "integration" ]; then
    echo "🔗 Executando testes de integração..."
    
    # Iniciar dependências
    docker-compose -f "$PROJECT_ROOT/deploy/docker-compose.test.yml" up -d
    
    # Esperar serviços
    sleep 30
    
    # Executar testes
    cd "$PROJECT_ROOT/tests/Integration"
    dotnet test --logger "console;verbosity=detailed" \
        --results-directory "$TEST_RESULTS/integration"
    
    # Parar dependências
    docker-compose -f "$PROJECT_ROOT/deploy/docker-compose.test.yml" down
    
    echo "✅ Testes de integração concluídos"
fi

# Testes E2E
if [ "$TEST_TYPE" = "all" ] || [ "$TEST_TYPE" = "e2e" ]; then
    echo "🎭 Executando testes E2E..."
    
    # Iniciar aplicação
    cd "$PROJECT_ROOT"
    docker-compose -f deploy/docker-compose.yml up -d
    
    # Esperar aplicação
    sleep 45
    
    # Executar testes E2E
    cd "$PROJECT_ROOT/tests/E2E"
    npm ci
    npm run test:ci
    
    # Gerar relatório
    npm run report:generate
    
    echo "✅ Testes E2E concluídos"
fi

# Gerar relatório consolidado
echo "📊 Gerando relatório consolidado..."
cd "$TEST_RESULTS"

# Merge de coverage
if [ -d "unit-api" ]; then
    echo "📈 Merge de coverage da API..."
    # Comando para merge de coverage (varia por ferramenta)
    echo "Coverage files gerados em: $TEST_RESULTS"
fi

echo ""
echo "🎉 Testes concluídos!"
echo "📁 Resultados: $TEST_RESULTS"
echo "⏰ Timestamp: $TIMESTAMP"
