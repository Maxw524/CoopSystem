# Script para gerar certificado SSL autoassinado para desenvolvimento
# Execute como Administrador

Write-Host "Gerando certificado SSL para CoopSystem..." -ForegroundColor Green

# Criar diretório se não existir
if (-not (Test-Path "certs")) {
    New-Item -ItemType Directory -Path "certs" -Force
}

# Gerar certificado autoassinado válido por 1 ano
$pfxPassword = ConvertTo-SecureString -String "Credi3135" -Force -AsPlainText

try {
    # Gerar certificado
    $cert = New-SelfSignedCertificate -DnsName "localhost","172.19.51.133" -CertStoreLocation "cert:\LocalMachine\My" -KeyUsage KeyEncipherment,DigitalSignature -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1") -NotAfter (Get-Date).AddYears(1)
    
    # Exportar para PFX
    Export-PfxCertificate -Cert $cert -FilePath "certs\CoopSystem.pfx" -Password $pfxPassword
    
    # Importar para Trusted Root para evitar avisos
    Import-Certificate -FilePath "certs\CoopSystem.cer" -CertStoreLocation "cert:\LocalMachine\Root"
    
    Write-Host "✅ Certificado gerado com sucesso!" -ForegroundColor Green
    Write-Host "📁 Arquivo: certs\CoopSystem.pfx" -ForegroundColor Yellow
    Write-Host "🔐 Senha: Credi3135" -ForegroundColor Yellow
    Write-Host "🌐 Válido para: localhost, 172.19.51.133" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Erro ao gerar certificado: $_" -ForegroundColor Red
    Write-Host "Execute este script como Administrador" -ForegroundColor Yellow
}

Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute: dotnet run --project src/CoopSystem.API" -ForegroundColor White
Write-Host "2. Acesse: https://172.19.51.133:5001" -ForegroundColor White
Write-Host "3. Aceite o certificado no navegador (se necessário)" -ForegroundColor White
