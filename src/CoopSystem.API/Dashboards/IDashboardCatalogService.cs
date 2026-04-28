namespace CoopSystem.API.Dashboards;

public interface IDashboardCatalogService
{
    IReadOnlyList<DashboardCatalogItem> GetDashboards(bool includeDisabled = false);
    IReadOnlyList<DashboardCatalogItem> GetPermissionCatalog(bool includeDisabled = false);
    DashboardCatalogItem? GetBySlug(string slug);
}
