# Script para testar o sistema de recuperação automática de dashboards
# Simula falhas no Streamlit e verifica a reinicialização automática

Write-Host "=== Teste de Recuperação Automática de Dashboards ===" -ForegroundColor Cyan

# Função para verificar se o dashboard está rodando
function Test-DashboardHealth {
    param(
        [string]$Port = "8501"
    )
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/_stcore/health" -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Função para matar o processo do Streamlit
function Kill-StreamlitProcess {
    param(
        [string]$Port = "8501"
    )
    
    try {
        $process = Get-Process | Where-Object { $_.ProcessName -like "*python*" -and $_.CommandLine -like "*streamlit*" -and $_.CommandLine -like "*$Port*" }
        if ($process) {
            Write-Host "Matando processo Streamlit na porta $Port (PID: $($process.Id))" -ForegroundColor Yellow
            $process.Kill()
            return $true
        }
        else {
            Write-Host "Nenhum processo Streamlit encontrado na porta $Port" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "Erro ao matar processo: $_" -ForegroundColor Red
        return $false
    }
}

# Função para monitorar logs da API
function Monitor-APILogs {
    param(
        [int]$Duration = 120
    )
    
    Write-Host "Monitorando logs da API por $Duration segundos..." -ForegroundColor Green
    
    $endTime = (Get-Date).AddSeconds($Duration)
    
    while ((Get-Date) -lt $endTime) {
        # Verificar logs recentes da API
        $logPath = "C:\CoopSystem\src\CoopSystem.API\bin\Debug\net8.0\logs"
        if (Test-Path $logPath) {
            $latestLog = Get-ChildItem $logPath -Filter "coopsystem-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            
            if ($latestLog) {
                $recentLogs = Get-Content $latestLog.FullName -Tail 10
                foreach ($log in $recentLogs) {
                    if ($log -match "Dashboard.*recuperacao-prejuizo") {
                        Write-Host "API Log: $log" -ForegroundColor Gray
                    }
                }
            }
        }
        
        Start-Sleep -Seconds 5
    }
}

# Teste 1: Verificar estado inicial
Write-Host "`n1. Verificando estado inicial do dashboard..." -ForegroundColor Cyan
$initialHealth = Test-DashboardHealth
if ($initialHealth) {
    Write-Host "Dashboard está saudável" -ForegroundColor Green
}
else {
    Write-Host "Dashboard não está respondendo" -ForegroundColor Red
}

# Teste 2: Simular falha
Write-Host "`n2. Simulando falha do dashboard..." -ForegroundColor Cyan
$killResult = Kill-StreamlitProcess
if ($killResult) {
    Write-Host "Falha simulada com sucesso" -ForegroundColor Green
}
else {
    Write-Host "Não foi possível simular a falha" -ForegroundColor Yellow
}

# Teste 3: Aguardar recuperação
Write-Host "`n3. Aguardando recuperação automática (60 segundos)..." -ForegroundColor Cyan
$recovered = $false
for ($i = 1; $i -le 12; $i++) {
    Start-Sleep -Seconds 5
    $health = Test-DashboardHealth
    if ($health) {
        Write-Host "Dashboard recuperado em $($i * 5) segundos!" -ForegroundColor Green
        $recovered = $true
        break
    }
    else {
        Write-Host "Aguardando recuperação... ($($i * 5)s)" -ForegroundColor Yellow
    }
}

if (-not $recovered) {
    Write-Host "Dashboard não foi recuperado automaticamente" -ForegroundColor Red
}

# Teste 4: Verificar logs
Write-Host "`n4. Verificando logs de recuperação..." -ForegroundColor Cyan
$logPath = "C:\CoopSystem\src\CoopSystem.API\bin\Debug\net8.0\logs"
if (Test-Path $logPath) {
    $latestLog = Get-ChildItem $logPath -Filter "coopsystem-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($latestLog) {
        Write-Host "Logs recentes de recuperação:" -ForegroundColor White
        $recoveryLogs = Get-Content $latestLog.FullName | Where-Object { 
            $_ -match "Dashboard.*recuperacao-prejuizo.*finalizado" -or 
            $_ -match "Reiniciando dashboard" -or 
            $_ -match "tentativa"
        } | Select-Object -Last 5
        
        foreach ($log in $recoveryLogs) {
            Write-Host "  $log" -ForegroundColor Gray
        }
    }
}

# Resultado final
Write-Host "`n=== Resultado do Teste ===" -ForegroundColor Cyan
if ($recovered) {
    Write-Host "SUCESSO: Sistema de recuperação automática funcionou!" -ForegroundColor Green
}
else {
    Write-Host "FALHA: Sistema não recuperou o dashboard automaticamente" -ForegroundColor Red
    Write-Host "Verifique os logs para mais detalhes" -ForegroundColor Yellow
}

Write-Host "`nPara monitorar em tempo real:" -ForegroundColor Cyan
Write-Host "Get-Content '$logPath\coopsystem-*.log' -Wait -Tail 10" -ForegroundColor White
