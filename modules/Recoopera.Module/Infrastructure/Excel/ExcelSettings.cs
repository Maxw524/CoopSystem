using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Recoopera.Module.Infrastructure.Excel;

public class ExcelSettings
{
    public string? BasePath { get; set; }
    public string? ContratoFile { get; set; }
    public string? OperacoesAdvogadosFile { get; set; }
}
