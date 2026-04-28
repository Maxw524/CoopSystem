using Microsoft.Extensions.Hosting;

namespace Recoopera.Module.Infrastructure.Excel;

internal static class ExcelPathResolver
{
    public static string ResolveBasePath(string configuredBasePath, IHostEnvironment environment)
    {
        if (Path.IsPathRooted(configuredBasePath))
        {
            return configuredBasePath;
        }

        var candidates = new[]
        {
            Path.GetFullPath(Path.Combine(environment.ContentRootPath, configuredBasePath)),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, configuredBasePath))
        };

        foreach (var candidate in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (Directory.Exists(candidate))
            {
                return candidate;
            }
        }

        var fallbackFolderName = GetFallbackFolderName(configuredBasePath);
        if (!string.IsNullOrWhiteSpace(fallbackFolderName))
        {
            foreach (var root in new[] { environment.ContentRootPath, AppContext.BaseDirectory }.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var resolved = FindFolderInParents(root, fallbackFolderName);
                if (resolved is not null)
                {
                    return resolved;
                }
            }
        }

        return candidates[0];
    }

    private static string? FindFolderInParents(string startPath, string folderName)
    {
        var directory = new DirectoryInfo(startPath);

        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, folderName);
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        return null;
    }

    private static string? GetFallbackFolderName(string configuredBasePath)
    {
        var trimmed = configuredBasePath.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return null;
        }

        return Path.GetFileName(trimmed);
    }
}
