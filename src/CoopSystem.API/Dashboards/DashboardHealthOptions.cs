namespace CoopSystem.API.Dashboards;

public class DashboardHealthOptions
{
    /// <summary>
    /// Intervalo em minutos entre verificações de saúde dos dashboards
    /// </summary>
    public int HealthCheckIntervalMinutes { get; set; } = 2;

    /// <summary>
    /// Tempo em segundos para esperar antes de reiniciar um dashboard que falhou
    /// </summary>
    public int RestartDelaySeconds { get; set; } = 30;

    /// <summary>
    /// Número máximo de tentativas de reinicialização antes de desistir
    /// </summary>
    public int MaxRestartAttempts { get; set; } = 3;

    /// <summary>
    /// Timeout em segundos para verificar se o dashboard está respondendo
    /// </summary>
    public int HealthCheckTimeoutSeconds { get; set; } = 10;

    /// <summary>
    /// Intervalo em minutos para considerar um dashboard não saudável se não responder
    /// </summary>
    public int UnhealthyThresholdMinutes { get; set; } = 5;

    /// <summary>
    /// Habilita logging detalhado para debugging
    /// </summary>
    public bool EnableDetailedLogging { get; set; } = false;
}
