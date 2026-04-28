namespace CoopSystem.API.Infrastructure
{
    public class CoopSystemSettings
    {
        public string SystemName { get; set; } = "CoopSystem";
        public string Version { get; set; } = "1.0.0";
        public string[] EnableModules { get; set; } = Array.Empty<string>();
    }
}
