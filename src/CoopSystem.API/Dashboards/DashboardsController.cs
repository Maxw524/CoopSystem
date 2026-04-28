using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Net.Sockets;

namespace CoopSystem.API.Dashboards;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class DashboardsController : ControllerBase
{
    private readonly IDashboardCatalogService _catalogService;
    private readonly IDashboardAccessService _accessService;
    private readonly ILogger<DashboardsController> _logger;

    public DashboardsController(
        IDashboardCatalogService catalogService,
        IDashboardAccessService accessService,
        ILogger<DashboardsController> logger)
    {
        _catalogService = catalogService;
        _accessService = accessService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var dashboards = _catalogService.GetDashboards();

        // Todos usuarios autenticados veem todos dashboards
        // Controle de conteudo eh feito no Streamlit (Python)
        _logger.LogInformation("List() chamado. Usuario autenticado: {IsAuth}, Role: {Role}", 
            User?.Identity?.IsAuthenticated, 
            User?.IsInRole("Admin") == true ? "Admin" : "User");

        return Ok(dashboards.Select(ResolveTemplates));
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public IActionResult ListPublic()
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
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var dashboard = _catalogService.GetBySlug(slug);
        if (dashboard is null || !dashboard.Enabled || !dashboard.IsConfigured)
        {
            return NotFound(new { message = "Dashboard nao encontrado" });
        }

        if (!await _accessService.CanAccessAsync(User, dashboard.PermissionKey, cancellationToken))
        {
            return Forbid();
        }

        return Ok(ResolveTemplates(dashboard));
    }

    [HttpGet("admin/catalog")]
    [Authorize(Roles = "Admin")]
    public IActionResult AdminCatalog()
    {
        _logger.LogInformation("AdminCatalog chamado. Usuario: {User}, Roles: {Roles}", User.Identity?.Name, string.Join(",", User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value)));
        var catalog = _catalogService.GetPermissionCatalog(includeDisabled: true);
        _logger.LogInformation("Catalogo retornado com {Count} itens", catalog.Count);
        return Ok(catalog.Select(ResolveTemplates));
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
                _logger.LogDebug("Substituido localhost por {LocalIp} no embedUrl", localIp);
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
