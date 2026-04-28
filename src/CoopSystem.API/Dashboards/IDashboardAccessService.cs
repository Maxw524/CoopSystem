using System.Security.Claims;

namespace CoopSystem.API.Dashboards;

public interface IDashboardAccessService
{
    Task<HashSet<string>> GetGrantedPermissionsAsync(ClaimsPrincipal user, CancellationToken cancellationToken = default);
    Task<bool> CanAccessAsync(ClaimsPrincipal user, string permissionKey, CancellationToken cancellationToken = default);
}
