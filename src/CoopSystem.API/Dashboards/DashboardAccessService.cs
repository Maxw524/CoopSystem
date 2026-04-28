using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Sistrawts.Module.Application.Security;
using Sistrawts.Module.Infrastructure;

namespace CoopSystem.API.Dashboards;

public sealed class DashboardAccessService : IDashboardAccessService
{
    private readonly SistrawtsDbContext _dbContext;

    public DashboardAccessService(SistrawtsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<HashSet<string>> GetGrantedPermissionsAsync(ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        // Todos usuários autenticados têm acesso a todos dashboards
        // O controle de visibilidade é feito no próprio Streamlit (Python)
        if (user?.Identity?.IsAuthenticated == true)
        {
            return new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "*"
            };
        }

        return new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    }

    public async Task<bool> CanAccessAsync(ClaimsPrincipal user, string permissionKey, CancellationToken cancellationToken = default)
    {
        // Todos usuários autenticados podem acessar dashboards
        // O controle de visibilidade é feito no próprio Streamlit (Python)
        return user?.Identity?.IsAuthenticated == true;
    }
}
