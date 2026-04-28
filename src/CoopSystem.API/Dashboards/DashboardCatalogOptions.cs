namespace CoopSystem.API.Dashboards;

public sealed class DashboardCatalogOptions
{
    public string? RootPath { get; set; }
    public string PythonExecutable { get; set; } = "py";
}
