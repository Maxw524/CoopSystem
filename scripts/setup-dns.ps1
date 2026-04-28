# Script para configurar DNS local para o certificado SSL
# Execute como Administrador

Write-Host "Configurando DNS local para certificado SSL..." -ForegroundColor Green

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$entry = "172.19.51.133`tcoopsystem.sicoobcredipinho.com.br"

try {
    # Verificar se entrada já existe
    $hostsContent = Get-Content $hostsPath
    if ($hostsContent -match "coopsystem.sicoobcredipinho.com.br") {
        Write-Host "Entrada DNS já existe no arquivo hosts." -ForegroundColor Yellow
    } else {
        # Adicionar entrada ao arquivo hosts
        Add-Content -Path $hostsPath -Value $entry
        Write-Host "Entrada DNS adicionada com sucesso!" -ForegroundColor Green
        Write-Host "172.19.51.133 -> coopsystem.sicoobcredipinho.com.br" -ForegroundColor White
    }
    
    Write-Host "`nAgora você pode acessar:" -ForegroundColor Cyan
    Write-Host "https://coopsystem.sicoobcredipinho.com.br:5001" -ForegroundColor White
    Write-Host "http://coopsystem.sicoobcredipinho.com.br:5000" -ForegroundColor White
    
    # Limpar cache DNS
    Write-Host "`nLimpando cache DNS..." -ForegroundColor Yellow
    Clear-DnsClientCache
    Write-Host "Cache DNS limpo!" -ForegroundColor Green
    
} catch {
    Write-Host "Erro ao configurar DNS: $_" -ForegroundColor Red
    Write-Host "Execute este script como Administrador" -ForegroundColor Yellow
}

Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Reinicie a API: dotnet run" -ForegroundColor White
Write-Host "2. Acesse: https://coopsystem.sicoobcredipinho.com.br:5001" -ForegroundColor White
Write-Host "3. O certificado será reconhecido como válido" -ForegroundColor White
