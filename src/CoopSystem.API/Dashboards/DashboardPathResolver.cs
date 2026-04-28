using Microsoft.Extensions.Options;

namespace CoopSystem.API.Dashboards;

public static class DashboardPathResolver
{
    public static string? ResolveRootPath(
        IOptionsMonitor<DashboardCatalogOptions> options,
        IWebHostEnvironment environment,
        ILogger logger)
    {
        var configuredPath = options.CurrentValue.RootPath;
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            var fullConfiguredPath = Path.GetFullPath(Environment.ExpandEnvironmentVariables(configuredPath.Trim()));
            if (Directory.Exists(fullConfiguredPath))
            {
                logger.LogInformation("Catalogo de dashboards usando pasta configurada em {RootPath}", fullConfiguredPath);
                return fullConfiguredPath;
            }

            logger.LogWarning("Pasta configurada para dashboards nao encontrada: {RootPath}", fullConfiguredPath);
        }

        var searchBases = new[]
        {
            environment.ContentRootPath,
            AppContext.BaseDirectory,
            Directory.GetCurrentDirectory()
        }
        .Where(path => !string.IsNullOrWhiteSpace(path))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToList();

        foreach (var basePath in searchBases)
        {
            var resolved = FindDashboardsFolder(basePath);
            if (resolved is not null)
            {
                logger.LogInformation("Catalogo de dashboards localizado em {RootPath} a partir de {BasePath}", resolved, basePath);
                return resolved;
            }
        }

        logger.LogWarning("Nenhuma pasta Dashboards foi encontrada. Bases pesquisadas: {Bases}", string.Join(" | ", searchBases));
        return null;
    }

    private static string? FindDashboardsFolder(string startPath)
    {
        var current = new DirectoryInfo(Path.GetFullPath(startPath));

        while (current is not null)
        {
            var candidate = Path.Combine(current.FullName, "Dashboards");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            current = current.Parent;
        }

        return null;
    }
}
