using System.Text.Json;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Domain.Entities;

namespace Sistrawts.Module.Application.Security
{
    public static class UsuarioPermissionMapper
    {
        private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

        public static List<string> BuildPermissions(Usuario usuario)
        {
            return Deserialize(usuario.PermissoesJson);
        }

        public static List<string> BuildPermissions(UsuarioDto usuario)
        {
            return Normalize(usuario.Permissoes);
        }

        public static void ApplyPermissions(Usuario usuario, IEnumerable<string>? permissions)
        {
            usuario.PermissoesJson = Serialize(permissions);
        }

        public static List<string> Deserialize(string? permissionsJson)
        {
            if (string.IsNullOrWhiteSpace(permissionsJson))
            {
                return new List<string>();
            }

            try
            {
                var parsed = JsonSerializer.Deserialize<List<string>>(permissionsJson, SerializerOptions);
                return Normalize(parsed);
            }
            catch
            {
                return new List<string>();
            }
        }

        public static string Serialize(IEnumerable<string>? permissions)
        {
            return JsonSerializer.Serialize(Normalize(permissions), SerializerOptions);
        }

        private static List<string> Normalize(IEnumerable<string>? permissions)
        {
            return permissions?
                .Where(permission => !string.IsNullOrWhiteSpace(permission))
                .Select(permission => permission.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(permission => permission, StringComparer.OrdinalIgnoreCase)
                .ToList()
                ?? new List<string>();
        }
    }
}
