using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Hosting;

namespace CoopSystem.API.Dashboards;

public sealed class DashboardHealthMonitorService : BackgroundService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip
    };

    private readonly IOptionsMonitor<DashboardCatalogOptions> _options;
    private readonly IOptionsMonitor<DashboardHealthOptions> _healthOptions;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<DashboardHealthMonitorService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly Dictionary<string, DashboardProcessInfo> _dashboardProcesses = new();

    public DashboardHealthMonitorService(
        IOptionsMonitor<DashboardCatalogOptions> options,
        IOptionsMonitor<DashboardHealthOptions> healthOptions,
        IWebHostEnvironment environment,
        ILogger<DashboardHealthMonitorService> logger,
        IServiceProvider serviceProvider)
    {
        _options = options;
        _healthOptions = healthOptions;
        _environment = environment;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Iniciando serviço de monitoramento de dashboards");

        // Inicializar dashboards na primeira execução
        await InitializeDashboardsAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckDashboardHealthAsync(stoppingToken);
                var healthOptions = _healthOptions.CurrentValue;
                await Task.Delay(TimeSpan.FromMinutes(healthOptions.HealthCheckIntervalMinutes), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro durante verificação de saúde dos dashboards");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }

    private async Task InitializeDashboardsAsync(CancellationToken cancellationToken)
    {
        var rootPath = DashboardPathResolver.ResolveRootPath(_options, _environment, _logger);
        if (rootPath is null)
        {
            return;
        }

        foreach (var manifestPath in Directory.EnumerateFiles(rootPath, "dashboard.json", SearchOption.AllDirectories))
        {
            await TryStartManagedDashboardAsync(manifestPath, cancellationToken);
        }
    }

    private async Task CheckDashboardHealthAsync(CancellationToken cancellationToken)
    {
        var processesToRestart = new List<string>();

        foreach (var (slug, processInfo) in _dashboardProcesses.ToList())
        {
            if (processInfo.Process.HasExited)
            {
                var healthOptions = _healthOptions.CurrentValue;
                _logger.LogWarning(
                    "Dashboard {Slug} finalizado inesperadamente. Código: {ExitCode}, Tentativas: {Attempts}/{MaxAttempts}",
                    slug,
                    processInfo.Process.ExitCode,
                    processInfo.RestartAttempts,
                    healthOptions.MaxRestartAttempts);

                if (processInfo.RestartAttempts < healthOptions.MaxRestartAttempts)
                {
                    processesToRestart.Add(slug);
                }
                else
                {
                    _logger.LogError(
                        "Dashboard {Slug} atingiu o número máximo de tentativas de reinicialização ({MaxAttempts}). Desistindo.",
                        slug,
                        healthOptions.MaxRestartAttempts);
                    
                    _dashboardProcesses.Remove(slug);
                }
            }
            else if (processInfo.LastHealthCheck.AddMinutes(5) < DateTime.UtcNow)
            {
                // Verificar se o processo está respondendo
                if (!await IsDashboardHealthyAsync(processInfo, cancellationToken))
                {
                    _logger.LogWarning("Dashboard {Slug} não está respondendo. Programando reinicialização.", slug);
                    processesToRestart.Add(slug);
                }
                else
                {
                    processInfo.LastHealthCheck = DateTime.UtcNow;
                }
            }
        }

        // Reiniciar dashboards que falharam
        foreach (var slug in processesToRestart)
        {
            if (_dashboardProcesses.TryGetValue(slug, out var processInfo))
            {
                var healthOptions = _healthOptions.CurrentValue;
                _logger.LogInformation("Reiniciando dashboard {Slug} em {Delay} segundos...", slug, healthOptions.RestartDelaySeconds);
                await Task.Delay(TimeSpan.FromSeconds(healthOptions.RestartDelaySeconds), cancellationToken);
                await RestartDashboardAsync(processInfo, cancellationToken);
            }
        }
    }

    private async Task<bool> IsDashboardHealthyAsync(DashboardProcessInfo processInfo, CancellationToken cancellationToken)
    {
        try
        {
            if (processInfo.Port <= 0) return false;

            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(10);

            var response = await httpClient.GetAsync($"http://localhost:{processInfo.Port}/_stcore/health", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private async Task RestartDashboardAsync(DashboardProcessInfo processInfo, CancellationToken cancellationToken)
    {
        try
        {
            // Limpar processo anterior
            if (!processInfo.Process.HasExited)
            {
                try
                {
                    processInfo.Process.Kill(entireProcessTree: true);
                    await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erro ao encerrar processo do dashboard {Slug}", processInfo.Slug);
                }
            }

            processInfo.Process.Dispose();

            // Reiniciar com tentativa incrementada
            processInfo.RestartAttempts++;
            await StartDashboardProcessAsync(processInfo.ManifestPath, processInfo.Slug, processInfo.RestartAttempts, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao reiniciar dashboard {Slug}", processInfo.Slug);
        }
    }

    private async Task TryStartManagedDashboardAsync(string manifestPath, CancellationToken cancellationToken)
    {
        try
        {
            var manifest = JsonSerializer.Deserialize<DashboardManifestDocument>(
                File.ReadAllText(manifestPath),
                SerializerOptions);

            if (manifest is null || !manifest.Enabled || !manifest.AutoStart)
            {
                return;
            }

            var slug = string.IsNullOrWhiteSpace(manifest.Slug)
                ? new DirectoryInfo(Path.GetDirectoryName(manifestPath)!).Name
                : manifest.Slug.Trim();

            await StartDashboardProcessAsync(manifestPath, slug, 0, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao inicializar dashboard a partir de {ManifestPath}", manifestPath);
        }
    }

    private async Task StartDashboardProcessAsync(string manifestPath, string slug, int restartAttempts, CancellationToken cancellationToken)
    {
        var manifest = JsonSerializer.Deserialize<DashboardManifestDocument>(
            File.ReadAllText(manifestPath),
            SerializerOptions)!;

        var dashboardDirectory = Path.GetDirectoryName(manifestPath) ?? _environment.ContentRootPath;
        var scriptPath = Path.IsPathRooted(manifest.ScriptPath)
            ? manifest.ScriptPath
            : Path.GetFullPath(Path.Combine(dashboardDirectory!, manifest.ScriptPath!));

        if (!File.Exists(scriptPath))
        {
            _logger.LogError("Script do dashboard não encontrado em {ScriptPath}", scriptPath);
            return;
        }

        var pythonExecutable = string.IsNullOrWhiteSpace(manifest.PythonExecutable)
            ? _options.CurrentValue.PythonExecutable
            : manifest.PythonExecutable.Trim();

        var arguments =
            $"-m streamlit run \"{scriptPath}\" --server.port {manifest.Port.Value} --server.address 0.0.0.0 --server.headless true --server.enableCORS true --server.enableXsrfProtection false";

        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = pythonExecutable,
                Arguments = arguments,
                WorkingDirectory = dashboardDirectory,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                EnvironmentVariables =
                {
                    ["PYTHONUNBUFFERED"] = "1",
                    ["STREAMLIT_SERVER_HEADLESS"] = "true"
                }
            },
            EnableRaisingEvents = true
        };

        process.OutputDataReceived += (_, args) =>
        {
            if (!string.IsNullOrWhiteSpace(args.Data))
            {
                _logger.LogInformation("[Dashboard:{Slug}] {Message}", slug, args.Data);
            }
        };

        process.ErrorDataReceived += (_, args) =>
        {
            if (!string.IsNullOrWhiteSpace(args.Data))
            {
                _logger.LogWarning("[Dashboard:{Slug}] {Message}", slug, args.Data);
            }
        };

        process.Exited += (_, _) =>
        {
            var exitCode = process.ExitCode;
            _logger.LogWarning("Processo do dashboard {Slug} finalizado. Código: {ExitCode}, Tentativas: {Attempts}", slug, exitCode, restartAttempts);
        };

        if (!process.Start())
        {
            _logger.LogError("Não foi possível iniciar o processo do dashboard {Slug}", slug);
            process.Dispose();
            return;
        }

        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        // Aguardar um pouco para verificar se o processo iniciou corretamente
        await Task.Delay(TimeSpan.FromSeconds(3), cancellationToken);

        if (process.HasExited)
        {
            _logger.LogError("Dashboard {Slug} falhou ao iniciar. Código: {ExitCode}", slug, process.ExitCode);
            process.Dispose();
            return;
        }

        // Atualizar ou adicionar informações do processo
        _dashboardProcesses[slug] = new DashboardProcessInfo
        {
            Slug = slug,
            Process = process,
            ManifestPath = manifestPath,
            Port = manifest.Port ?? 0,
            RestartAttempts = restartAttempts,
            LastHealthCheck = DateTime.UtcNow,
            StartTime = DateTime.UtcNow
        };

        var attemptText = restartAttempts > 0 ? $" (tentativa {restartAttempts})" : "";
        _logger.LogInformation(
            "Dashboard {Slug} iniciado{AttemptText} na porta {Port} usando script {ScriptPath}",
            slug,
            attemptText,
            manifest.Port ?? 0,
            scriptPath);
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Parando serviço de monitoramento de dashboards");

        foreach (var (slug, processInfo) in _dashboardProcesses)
        {
            try
            {
                if (!processInfo.Process.HasExited)
                {
                    _logger.LogInformation("Encerrando dashboard {Slug}", slug);
                    processInfo.Process.Kill(entireProcessTree: true);
                    await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erro ao encerrar dashboard {Slug}", slug);
            }
            finally
            {
                processInfo.Process.Dispose();
            }
        }

        _dashboardProcesses.Clear();
        await base.StopAsync(cancellationToken);
    }

    private class DashboardProcessInfo
    {
        public required string Slug { get; init; }
        public required Process Process { get; init; }
        public required string ManifestPath { get; init; }
        public required int Port { get; init; }
        public required int RestartAttempts { get; set; }
        public required DateTime LastHealthCheck { get; set; }
        public required DateTime StartTime { get; init; }
    }
}
