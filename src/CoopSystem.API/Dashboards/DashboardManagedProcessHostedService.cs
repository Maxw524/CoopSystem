using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace CoopSystem.API.Dashboards;

public sealed class DashboardManagedProcessHostedService : IHostedService, IDisposable
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip
    };

    private readonly IOptionsMonitor<DashboardCatalogOptions> _options;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<DashboardManagedProcessHostedService> _logger;
    private readonly List<Process> _managedProcesses = new();

    public DashboardManagedProcessHostedService(
        IOptionsMonitor<DashboardCatalogOptions> options,
        IWebHostEnvironment environment,
        ILogger<DashboardManagedProcessHostedService> logger)
    {
        _options = options;
        _environment = environment;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var rootPath = DashboardPathResolver.ResolveRootPath(_options, _environment, _logger);
        if (rootPath is null)
        {
            return Task.CompletedTask;
        }

        foreach (var manifestPath in Directory.EnumerateFiles(rootPath, "dashboard.json", SearchOption.AllDirectories))
        {
            TryStartManagedDashboard(manifestPath);
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        foreach (var process in _managedProcesses.Where(process => !process.HasExited))
        {
            try
            {
                process.Kill(entireProcessTree: true);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao encerrar processo do dashboard gerenciado. PID={Pid}", process.Id);
            }
        }

        return Task.CompletedTask;
    }

    public void Dispose()
    {
        foreach (var process in _managedProcesses)
        {
            process.Dispose();
        }
    }

    private void TryStartManagedDashboard(string manifestPath)
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

            if (manifest.Port is null || manifest.Port <= 0)
            {
                _logger.LogWarning("Dashboard com AutoStart habilitado mas sem porta valida em {ManifestPath}", manifestPath);
                return;
            }

            if (string.IsNullOrWhiteSpace(manifest.ScriptPath))
            {
                _logger.LogWarning("Dashboard com AutoStart habilitado mas sem ScriptPath em {ManifestPath}", manifestPath);
                return;
            }

            var dashboardDirectory = Path.GetDirectoryName(manifestPath) ?? _environment.ContentRootPath;
            var scriptPath = Path.IsPathRooted(manifest.ScriptPath)
                ? manifest.ScriptPath
                : Path.GetFullPath(Path.Combine(dashboardDirectory, manifest.ScriptPath));

            if (!File.Exists(scriptPath))
            {
                _logger.LogWarning("Script do dashboard nao encontrado em {ScriptPath}", scriptPath);
                return;
            }

            var pythonExecutable = string.IsNullOrWhiteSpace(manifest.PythonExecutable)
                ? _options.CurrentValue.PythonExecutable
                : manifest.PythonExecutable.Trim();

            var arguments =
                $"-m streamlit run \"{scriptPath}\" --server.port {manifest.Port.Value} --server.address 0.0.0.0 --server.headless true --server.enableCORS true --server.enableXsrfProtection false --server.enableWebsocketCompression false";

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
                    RedirectStandardError = true
                },
                EnableRaisingEvents = true
            };

            var slug = string.IsNullOrWhiteSpace(manifest.Slug)
                ? new DirectoryInfo(dashboardDirectory).Name
                : manifest.Slug.Trim();

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
                _logger.LogWarning("Processo do dashboard {Slug} finalizado com codigo {ExitCode}", slug, process.ExitCode);
            };

            if (!process.Start())
            {
                _logger.LogWarning("Nao foi possivel iniciar o processo do dashboard {Slug}", slug);
                process.Dispose();
                return;
            }

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            _managedProcesses.Add(process);

            _logger.LogInformation(
                "Dashboard {Slug} iniciado automaticamente em porta {Port} usando script {ScriptPath}",
                slug,
                manifest.Port.Value,
                scriptPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao iniciar dashboard gerenciado a partir de {ManifestPath}", manifestPath);
        }
    }
}
