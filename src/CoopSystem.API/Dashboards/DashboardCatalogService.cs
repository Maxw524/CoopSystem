using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Options;

namespace CoopSystem.API.Dashboards;

public sealed class DashboardCatalogService : IDashboardCatalogService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip
    };

    private readonly IOptionsMonitor<DashboardCatalogOptions> _options;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<DashboardCatalogService> _logger;

    public DashboardCatalogService(
        IOptionsMonitor<DashboardCatalogOptions> options,
        IWebHostEnvironment environment,
        ILogger<DashboardCatalogService> logger)
    {
        _options = options;
        _environment = environment;
        _logger = logger;
    }

    public IReadOnlyList<DashboardCatalogItem> GetDashboards(bool includeDisabled = false)
    {
        var discovered = DiscoverDashboards().Dashboards;

        return includeDisabled
            ? discovered
            : discovered.Where(item => item.Enabled && item.IsConfigured).ToList();
    }

    public IReadOnlyList<DashboardCatalogItem> GetPermissionCatalog(bool includeDisabled = false)
    {
        var discovered = DiscoverDashboards().Permissions;

        return includeDisabled
            ? discovered
            : discovered.Where(item => item.Enabled && item.IsConfigured).ToList();
    }

    public DashboardCatalogItem? GetBySlug(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return null;
        }

        return DiscoverDashboards()
            .Dashboards
            .FirstOrDefault(item => string.Equals(item.Slug, slug.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    private DashboardDiscoveryResult DiscoverDashboards()
    {
        var rootPath = DashboardPathResolver.ResolveRootPath(_options, _environment, _logger);
        if (rootPath is null)
        {
            return DashboardDiscoveryResult.Empty;
        }

        try
        {
            var manifests = Directory
                .EnumerateFiles(rootPath, "dashboard.json", SearchOption.AllDirectories)
                .ToList();

            var permissions = new List<DashboardCatalogItem>();
            var dashboards = new List<DashboardCatalogItem>();

            foreach (var manifestPath in manifests)
            {
                var discovered = TryLoadDashboardCollection(manifestPath);
                if (discovered is null)
                {
                    continue;
                }

                permissions.Add(discovered.PermissionItem);
                dashboards.AddRange(discovered.Dashboards);
            }

            return new DashboardDiscoveryResult(
                permissions
                    .OrderBy(item => item.Group, StringComparer.OrdinalIgnoreCase)
                    .ThenBy(item => item.Order)
                    .ThenBy(item => item.CollectionTitle, StringComparer.OrdinalIgnoreCase)
                    .ToList(),
                dashboards
                    .OrderBy(item => item.Group, StringComparer.OrdinalIgnoreCase)
                    .ThenBy(item => item.Order)
                    .ThenBy(item => item.CollectionTitle, StringComparer.OrdinalIgnoreCase)
                    .ThenBy(item => item.PageOrder)
                    .ThenBy(item => item.Title, StringComparer.OrdinalIgnoreCase)
                    .ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao descobrir dashboards em {RootPath}", rootPath);
            return DashboardDiscoveryResult.Empty;
        }
    }

    private DashboardCollectionDiscovery? TryLoadDashboardCollection(string manifestPath)
    {
        try
        {
            var json = File.ReadAllText(manifestPath);
            var manifest = JsonSerializer.Deserialize<DashboardManifestDocument>(json, SerializerOptions) ?? new DashboardManifestDocument();

            var directoryPath = Path.GetDirectoryName(manifestPath) ?? string.Empty;
            var folderName = new DirectoryInfo(directoryPath).Name;
            var collectionSlug = NormalizeSlug(manifest.Slug, folderName);

            if (string.IsNullOrWhiteSpace(collectionSlug))
            {
                _logger.LogWarning("Dashboard ignorado porque nao foi possivel resolver o slug em {ManifestPath}", manifestPath);
                return null;
            }

            var collectionTitle = string.IsNullOrWhiteSpace(manifest.Title) ? folderName : manifest.Title.Trim();
            var group = string.IsNullOrWhiteSpace(manifest.Group) ? "Dashboards" : manifest.Group.Trim();
            var description = manifest.Description?.Trim() ?? string.Empty;
            var permissionKey = string.IsNullOrWhiteSpace(manifest.PermissionKey)
                ? $"dashboard:{collectionSlug}"
                : manifest.PermissionKey.Trim();
            var baseEmbedUrl = string.IsNullOrWhiteSpace(manifest.EmbedUrl)
                ? null
                : manifest.EmbedUrl.Trim().TrimEnd('/');
            var icon = string.IsNullOrWhiteSpace(manifest.Icon) ? "bar-chart" : manifest.Icon.Trim();
            var lastModifiedAtUtc = File.GetLastWriteTimeUtc(manifestPath);
            var permissionItem = new DashboardCatalogItem(
                collectionSlug,
                collectionTitle,
                description,
                group,
                collectionSlug,
                collectionTitle,
                permissionKey,
                baseEmbedUrl,
                icon,
                manifest.Order ?? 0,
                0,
                manifest.Enabled,
                !string.IsNullOrWhiteSpace(baseEmbedUrl),
                new DateTimeOffset(lastModifiedAtUtc, TimeSpan.Zero));

            var dashboards = BuildDashboardPages(
                manifest,
                directoryPath,
                folderName,
                collectionSlug,
                collectionTitle,
                description,
                group,
                permissionKey,
                baseEmbedUrl,
                icon,
                manifest.Order ?? 0,
                lastModifiedAtUtc);

            return new DashboardCollectionDiscovery(permissionItem, dashboards);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Dashboard ignorado por manifesto invalido em {ManifestPath}", manifestPath);
            return null;
        }
    }

    private List<DashboardCatalogItem> BuildDashboardPages(
        DashboardManifestDocument manifest,
        string directoryPath,
        string folderName,
        string collectionSlug,
        string collectionTitle,
        string manifestDescription,
        string group,
        string permissionKey,
        string? baseEmbedUrl,
        string icon,
        int order,
        DateTime manifestLastModifiedAtUtc)
    {
        var items = new List<DashboardCatalogItem>();
        var usedSlugs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var rootScriptPath = ResolveRootScriptPath(manifest, directoryPath);
        if (!string.IsNullOrWhiteSpace(rootScriptPath) && File.Exists(rootScriptPath))
        {
            var rootPageTitle = ResolveRootPageTitle(manifest, rootScriptPath);
            items.Add(CreatePageItem(
                slug: CreateUniqueSlug(usedSlugs, collectionSlug),
                title: rootPageTitle,
                description: string.IsNullOrWhiteSpace(manifestDescription)
                    ? $"Dashboard principal da colecao {collectionTitle}."
                    : manifestDescription,
                group: group,
                collectionSlug: collectionSlug,
                collectionTitle: collectionTitle,
                permissionKey: permissionKey,
                embedUrl: baseEmbedUrl,
                icon: icon,
                order: order,
                pageOrder: 0,
                enabled: manifest.Enabled,
                lastModifiedAtUtc: File.GetLastWriteTimeUtc(rootScriptPath)));
        }

        var pagesDirectory = Path.Combine(directoryPath, "pages");
        if (Directory.Exists(pagesDirectory))
        {
            var pageFiles = Directory
                .EnumerateFiles(pagesDirectory, "*.py", SearchOption.TopDirectoryOnly)
                .Select(filePath => new PageDescriptor(filePath))
                .OrderBy(page => page.SortBucket)
                .ThenBy(page => page.SortOrder)
                .ThenBy(page => page.Title, StringComparer.OrdinalIgnoreCase)
                .ToList();

            for (var index = 0; index < pageFiles.Count; index++)
            {
                var page = pageFiles[index];
                var normalizedPageSlug = NormalizeSlug(page.Title, page.UrlPathname);
                var pageSlug = string.IsNullOrWhiteSpace(normalizedPageSlug)
                    ? $"{collectionSlug}-{index + 1}"
                    : $"{collectionSlug}--{normalizedPageSlug}";

                items.Add(CreatePageItem(
                    slug: CreateUniqueSlug(usedSlugs, pageSlug),
                    title: page.Title,
                    description: $"Dashboard da colecao {collectionTitle}.",
                    group: group,
                    collectionSlug: collectionSlug,
                    collectionTitle: collectionTitle,
                    permissionKey: permissionKey,
                    embedUrl: BuildPageEmbedUrl(baseEmbedUrl, page.UrlPathname),
                    icon: icon,
                    order: order,
                    pageOrder: index + 1,
                    enabled: manifest.Enabled,
                    lastModifiedAtUtc: File.GetLastWriteTimeUtc(page.FilePath)));
            }
        }

        if (items.Count > 0)
        {
            return items;
        }

        return new List<DashboardCatalogItem>
        {
            CreatePageItem(
                slug: CreateUniqueSlug(usedSlugs, collectionSlug),
                title: collectionTitle,
                description: manifestDescription,
                group: group,
                collectionSlug: collectionSlug,
                collectionTitle: collectionTitle,
                permissionKey: permissionKey,
                embedUrl: baseEmbedUrl,
                icon: icon,
                order: order,
                pageOrder: 0,
                enabled: manifest.Enabled,
                lastModifiedAtUtc: manifestLastModifiedAtUtc)
        };
    }

    private static DashboardCatalogItem CreatePageItem(
        string slug,
        string title,
        string description,
        string group,
        string collectionSlug,
        string collectionTitle,
        string permissionKey,
        string? embedUrl,
        string icon,
        int order,
        int pageOrder,
        bool enabled,
        DateTime lastModifiedAtUtc)
    {
        return new DashboardCatalogItem(
            slug,
            title,
            description,
            group,
            collectionSlug,
            collectionTitle,
            permissionKey,
            embedUrl,
            icon,
            order,
            pageOrder,
            enabled,
            !string.IsNullOrWhiteSpace(embedUrl),
            new DateTimeOffset(lastModifiedAtUtc, TimeSpan.Zero));
    }

    private static string? ResolveRootScriptPath(DashboardManifestDocument manifest, string directoryPath)
    {
        if (!string.IsNullOrWhiteSpace(manifest.ScriptPath))
        {
            return Path.IsPathRooted(manifest.ScriptPath)
                ? manifest.ScriptPath
                : Path.GetFullPath(Path.Combine(directoryPath, manifest.ScriptPath));
        }

        return Directory
            .EnumerateFiles(directoryPath, "*.py", SearchOption.TopDirectoryOnly)
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();
    }

    private static string ResolveRootPageTitle(DashboardManifestDocument manifest, string rootScriptPath)
    {
        var fileTitle = PageDescriptor.ResolvePageTitle(rootScriptPath);

        return string.IsNullOrWhiteSpace(fileTitle)
            ? (string.IsNullOrWhiteSpace(manifest.Title) ? Path.GetFileNameWithoutExtension(rootScriptPath) : manifest.Title.Trim())
            : fileTitle;
    }

    private static string? BuildPageEmbedUrl(string? baseEmbedUrl, string? pageUrlPathname)
    {
        if (string.IsNullOrWhiteSpace(baseEmbedUrl))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(pageUrlPathname))
        {
            return baseEmbedUrl;
        }

        return $"{baseEmbedUrl}/{pageUrlPathname}";
    }

    private static string CreateUniqueSlug(HashSet<string> usedSlugs, string baseSlug)
    {
        var slug = string.IsNullOrWhiteSpace(baseSlug) ? "dashboard" : baseSlug.Trim('-');
        var candidate = slug;
        var suffix = 2;

        while (!usedSlugs.Add(candidate))
        {
            candidate = $"{slug}-{suffix}";
            suffix++;
        }

        return candidate;
    }

    private static string NormalizeSlug(string? manifestSlug, string folderName)
    {
        var source = string.IsNullOrWhiteSpace(manifestSlug) ? folderName : manifestSlug.Trim();
        if (string.IsNullOrWhiteSpace(source))
        {
            return string.Empty;
        }

        var normalizedSource = source.Normalize(NormalizationForm.FormD);
        var chars = normalizedSource
            .Where(ch => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch) != System.Globalization.UnicodeCategory.NonSpacingMark)
            .Select(char.ToLowerInvariant)
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
            .ToArray();

        var slug = new string(chars);

        while (slug.Contains("--", StringComparison.Ordinal))
        {
            slug = slug.Replace("--", "-", StringComparison.Ordinal);
        }

        return slug.Trim('-');
    }

    private sealed record DashboardCollectionDiscovery(
        DashboardCatalogItem PermissionItem,
        List<DashboardCatalogItem> Dashboards);

    private sealed record DashboardDiscoveryResult(
        IReadOnlyList<DashboardCatalogItem> Permissions,
        IReadOnlyList<DashboardCatalogItem> Dashboards)
    {
        public static DashboardDiscoveryResult Empty { get; } = new(
            Array.Empty<DashboardCatalogItem>(),
            Array.Empty<DashboardCatalogItem>());
    }

    private sealed class PageDescriptor
    {
        private static readonly char[] PrefixSeparators = ['_', '-', ' '];

        public PageDescriptor(string filePath)
        {
            FilePath = filePath;

            var fileName = Path.GetFileNameWithoutExtension(filePath);
            var identifier = ExtractIdentifier(fileName);

            Title = string.IsNullOrWhiteSpace(identifier)
                ? fileName
                : CondenseWhitespace(identifier.Replace('_', ' ')).Trim();

            UrlPathname = string.IsNullOrWhiteSpace(identifier)
                ? string.Empty
                : BuildUrlPathname(identifier);

            var numberPrefix = ExtractNumberPrefix(fileName);
            SortBucket = numberPrefix.HasValue ? 0 : 1;
            SortOrder = numberPrefix ?? int.MaxValue;
        }

        public string FilePath { get; }
        public string Title { get; }
        public string UrlPathname { get; }
        public int SortBucket { get; }
        public int SortOrder { get; }

        public static string ResolvePageTitle(string filePath)
        {
            return new PageDescriptor(filePath).Title;
        }

        private static int? ExtractNumberPrefix(string fileName)
        {
            var index = 0;
            while (index < fileName.Length && char.IsDigit(fileName[index]))
            {
                index++;
            }

            if (index == 0)
            {
                return null;
            }

            return int.TryParse(fileName[..index], out var number) ? number : null;
        }

        private static string ExtractIdentifier(string fileName)
        {
            var index = 0;
            while (index < fileName.Length && char.IsDigit(fileName[index]))
            {
                index++;
            }

            while (index < fileName.Length && PrefixSeparators.Contains(fileName[index]))
            {
                index++;
            }

            return index >= fileName.Length ? string.Empty : fileName[index..];
        }

        private static string BuildUrlPathname(string identifier)
        {
            var builder = new StringBuilder();
            var previousWasJoiner = false;

            foreach (var character in identifier.Trim())
            {
                if (character == ' ' || character == '_')
                {
                    if (!previousWasJoiner)
                    {
                        builder.Append('_');
                        previousWasJoiner = true;
                    }

                    continue;
                }

                builder.Append(char.ToLowerInvariant(character));
                previousWasJoiner = false;
            }

            return builder.ToString().Trim('_');
        }

        private static string CondenseWhitespace(string value)
        {
            var builder = new StringBuilder();
            var previousWasWhitespace = false;

            foreach (var character in value)
            {
                if (char.IsWhiteSpace(character))
                {
                    if (!previousWasWhitespace)
                    {
                        builder.Append(' ');
                        previousWasWhitespace = true;
                    }

                    continue;
                }

                builder.Append(character);
                previousWasWhitespace = false;
            }

            return builder.ToString();
        }
    }
}
