namespace Recoopera.Module.Infrastructure.Excel
{
    public class UploadSettings
    {
        public string ApiKey { get; set; } = string.Empty;
        public string BaseFolder { get; set; } = "Arquivos";
        public string[] AllowedNames { get; set; } = Array.Empty<string>();
    }
}
