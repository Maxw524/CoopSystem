using System.Security.Claims;

namespace Sistrawts.Module.Controllers
{
    internal static class ControllerUserIdHelper
    {
        public static Guid GetRequiredUserId(ClaimsPrincipal user)
        {
            var rawValue = user.FindFirstValue(ClaimTypes.NameIdentifier);

            if (Guid.TryParse(rawValue, out var userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("Token inválido ou sem identificador do usuário.");
        }
    }
}
