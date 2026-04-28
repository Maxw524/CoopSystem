using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Domain.Entities;

namespace Sistrawts.Module.Application.Security
{
    public static class UsuarioRoleMapper
    {
        public static List<string> BuildRoles(Usuario usuario)
        {
            return BuildRoles(
                usuario.Admin,
                usuario.PermiteJuridico,
                usuario.PermiteSistrawts,
                usuario.PermiteSimuladorTaxa);
        }

        public static List<string> BuildRoles(UsuarioDto usuario)
        {
            return BuildRoles(
                usuario.Admin,
                usuario.PermiteJuridico,
                usuario.PermiteSistrawts,
                usuario.PermiteSimuladorTaxa);
        }

        public static void ApplyRoles(Usuario usuario, IEnumerable<string> roles)
        {
            var normalizedRoles = roles
                .Where(role => !string.IsNullOrWhiteSpace(role))
                .Select(role => role.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            usuario.Admin = normalizedRoles.Contains("Admin");
            usuario.PermiteJuridico = usuario.Admin || normalizedRoles.Contains("Juridico");
            usuario.PermiteSistrawts = usuario.Admin || normalizedRoles.Contains("Sistrawts");
            usuario.PermiteSimuladorTaxa = usuario.Admin
                || normalizedRoles.Contains("Credito I")
                || normalizedRoles.Contains("CreditoI")
                || normalizedRoles.Contains("SimuladorTaxa");
        }

        private static List<string> BuildRoles(
            bool admin,
            bool permiteJuridico,
            bool permiteSistrawts,
            bool permiteSimuladorTaxa)
        {
            var roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (admin)
            {
                roles.Add("Admin");
            }

            if (permiteJuridico || admin)
            {
                roles.Add("Juridico");
            }

            if (permiteSimuladorTaxa || admin)
            {
                roles.Add("Credito I");
            }

            if (permiteSistrawts || admin)
            {
                roles.Add("Sistrawts");
            }

            if (roles.Count == 0)
            {
                roles.Add("Operador");
            }

            return roles.ToList();
        }
    }
}
