namespace CoopSystem.API.Dashboards;

public sealed record DashboardCatalogItem(
    string Slug,
    string Title,
    string Description,
    string Group,
    string CollectionSlug,
    string CollectionTitle,
    string PermissionKey,
    string? EmbedUrl,
    string Icon,
    int Order,
    int PageOrder,
    bool Enabled,
    bool IsConfigured,
    DateTimeOffset LastModifiedAtUtc);
