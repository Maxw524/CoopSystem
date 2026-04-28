using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Net.Sockets;

namespace CoopSystem.API.Dashboards;

[ApiController]
[Route("dashboards")]
[AllowAnonymous]
public sealed class PublicDashboardsController : ControllerBase
{
    private readonly IDashboardCatalogService _catalogService;

    public PublicDashboardsController(IDashboardCatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    [HttpGet]
    public IActionResult List()
    {
        var dashboards = _catalogService.GetDashboards();
        
        // Retornar apenas dashboards enabled e configured para acesso público
        var publicDashboards = dashboards
            .Where(item => item.Enabled && item.IsConfigured)
            .Select(ResolveTemplates)
            .ToList();

        return Ok(publicDashboards);
    }

    [HttpGet("{slug}")]
    public IActionResult GetBySlug(string slug)
    {
        var dashboard = _catalogService.GetBySlug(slug);
        if (dashboard is null || !dashboard.Enabled || !dashboard.IsConfigured)
        {
            return NotFound(new { message = "Dashboard nao encontrado" });
        }

        return Ok(ResolveTemplates(dashboard));
    }

    private DashboardCatalogItem ResolveTemplates(DashboardCatalogItem item)
    {
        if (string.IsNullOrWhiteSpace(item.EmbedUrl))
        {
            return item;
        }

        var resolvedEmbedUrl = item.EmbedUrl
            .Replace("{SCHEME}", Request.Scheme, StringComparison.OrdinalIgnoreCase)
            .Replace("{HOST}", Request.Host.Value, StringComparison.OrdinalIgnoreCase);

        // Se o URL contém localhost, substituir pelo IP da máquina para acesso remoto
        if (resolvedEmbedUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase))
        {
            var localIp = GetLocalIpAddress();
            if (!string.IsNullOrEmpty(localIp))
            {
                resolvedEmbedUrl = resolvedEmbedUrl.Replace("localhost", localIp, StringComparison.OrdinalIgnoreCase);
            }
        }

        return item with
        {
            EmbedUrl = resolvedEmbedUrl
        };
    }

    private static string GetLocalIpAddress()
    {
        try
        {
            // Tentar obter o IP da interface de rede ativa (não loopback)
            var host = Dns.GetHostEntry(Dns.GetHostName());
            foreach (var ip in host.AddressList)
            {
                if (ip.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(ip))
                {
                    return ip.ToString();
                }
            }
        }
        catch
        {
            // Ignorar erros e retornar null
        }
        return null;
    }
}
