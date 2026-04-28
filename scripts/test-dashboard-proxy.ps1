# Script para testar o proxy reverso de dashboards
# Execute este script após iniciar a API para verificar se os dashboards funcionam via HTTPS

Write-Host "Testando proxy reverso de dashboards..." -ForegroundColor Green

# Testar se a API está respondendo
try {
    $apiResponse = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5
    Write-Host "✓ API está respondendo" -ForegroundColor Green
} catch {
    Write-Host "✗ API não está respondendo em http://localhost:5000" -ForegroundColor Red
    Write-Host "Inicie a API primeiro com: dotnet run --project src/CoopSystem.API" -ForegroundColor Yellow
    exit 1
}

# Testar se o dashboard Streamlit está rodando
try {
    $streamlitResponse = Invoke-WebRequest -Uri "http://localhost:8501" -Method GET -TimeoutSec 5
    Write-Host "✓ Streamlit está respondendo na porta 8501" -ForegroundColor Green
} catch {
    Write-Host "✗ Streamlit não está respondendo em http://localhost:8501" -ForegroundColor Red
    Write-Host "Verifique se o dashboard foi iniciado automaticamente pela API" -ForegroundColor Yellow
}

# Testar proxy reverso
try {
    $proxyResponse = Invoke-WebRequest -Uri "http://localhost:5000/dashboard-proxy/recuperacao-prejuizo" -Method GET -TimeoutSec 10
    Write-Host "✓ Proxy reverso está funcionando" -ForegroundColor Green
    Write-Host "Status Code: $($proxyResponse.StatusCode)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Proxy reverso não está funcionando" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`nResumo da solução implementada:" -ForegroundColor Cyan
Write-Host "1. Proxy reverso em /dashboard-proxy/{slug} para rotear requisições HTTPS para Streamlit HTTP" -ForegroundColor White
Write-Host "2. Configuração CORS habilitada no Streamlit (--server.enableCORS true)" -ForegroundColor White
Write-Host "3. embedUrl atualizada para usar proxy: {SCHEME}://{HOST}/dashboard-proxy/recuperacao-prejuizo" -ForegroundColor White
Write-Host "4. HttpClientFactory configurado para suporte ao proxy" -ForegroundColor White

Write-Host "`nPara testar via HTTPS na intranet:" -ForegroundColor Green
Write-Host "1. Acesse: https://172.19.51.133/dashboard-proxy/recuperacao-prejuizo" -ForegroundColor White
Write-Host "2. Verifique no console do navegador se não há mais erros de mixed content" -ForegroundColor White
