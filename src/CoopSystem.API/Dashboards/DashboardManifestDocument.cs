namespace CoopSystem.API.Dashboards;

public sealed class DashboardManifestDocument
{
    public string? Slug { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Group { get; set; }
    public string? PermissionKey { get; set; }
    public string? EmbedUrl { get; set; }
    public string? Icon { get; set; }
    public int? Order { get; set; }
    public bool Enabled { get; set; } = true;
    public bool AutoStart { get; set; }
    public string? ScriptPath { get; set; }
    public int? Port { get; set; }
    public string? PythonExecutable { get; set; }
}
