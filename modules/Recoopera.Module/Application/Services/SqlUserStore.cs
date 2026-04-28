using Microsoft.EntityFrameworkCore;
using Recoopera.Module.Application.Interfaces;
using Sistrawts.Module.Application.Security;
using Sistrawts.Module.Domain.Entities;
using Sistrawts.Module.Infrastructure;

namespace Recoopera.Module.Services;

public class SqlUserStore : IUserStore
{
    private readonly SistrawtsDbContext _db;

    public SqlUserStore(SistrawtsDbContext db)
    {
        _db = db;
    }

    public async Task<UserDto?> FindByUsernameAsync(string username)
    {
        var normalizedUsername = username.Trim();
        var user = await _db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == normalizedUsername);

        return user is null ? null : MapToDto(user);
    }

    public async Task<List<UserDto>> GetAllAsync()
    {
        var users = await _db.Usuarios
            .AsNoTracking()
            .OrderBy(u => u.NomeCompleto)
            .ToListAsync();

        return users.Select(MapToDto).ToList();
    }

    public async Task<UserDto> AddAsync(
        string username,
        string passwordHash,
        string passwordSalt,
        List<string> roles,
        string? nomeCompleto = null,
        string? email = null,
        bool ativo = true)
    {
        _ = passwordSalt;

        var normalizedUsername = username.Trim();

        if (await _db.Usuarios.AnyAsync(u => u.Username == normalizedUsername))
        {
            throw new InvalidOperationException("Username ja existe");
        }

        var resolvedEmail = ResolveEmail(email, normalizedUsername);

        if (await _db.Usuarios.AnyAsync(u => u.Email == resolvedEmail))
        {
            throw new InvalidOperationException("E-mail ja existe");
        }

        var user = new Usuario
        {
            Id = Guid.NewGuid(),
            Username = normalizedUsername,
            NomeCompleto = string.IsNullOrWhiteSpace(nomeCompleto) ? normalizedUsername : nomeCompleto.Trim(),
            Email = resolvedEmail,
            SenhaHash = passwordHash,
            Ativo = ativo,
            DataCriacao = DateTime.Now,
            DataAtualizacao = DateTime.Now
        };

        UsuarioRoleMapper.ApplyRoles(user, roles);
        UsuarioPermissionMapper.ApplyPermissions(user, Array.Empty<string>());

        _db.Usuarios.Add(user);
        await _db.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task UpdatePasswordAsync(Guid id, string passwordHash, string passwordSalt)
    {
        _ = passwordSalt;

        var user = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return;
        }

        user.SenhaHash = passwordHash;
        user.DataAtualizacao = DateTime.Now;
        await _db.SaveChangesAsync();
    }

    public async Task<UserDto?> FindByIdAsync(Guid id)
    {
        var user = await _db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        return user is null ? null : MapToDto(user);
    }

    public async Task UpdateRolesAsync(Guid id, List<string> roles)
    {
        var user = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return;
        }

        UsuarioRoleMapper.ApplyRoles(user, roles);
        user.DataAtualizacao = DateTime.Now;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return;
        }

        user.Ativo = false;
        UsuarioRoleMapper.ApplyRoles(user, Array.Empty<string>());
        UsuarioPermissionMapper.ApplyPermissions(user, Array.Empty<string>());
        user.DataAtualizacao = DateTime.Now;
        await _db.SaveChangesAsync();
    }

    private static UserDto MapToDto(Usuario user)
    {
        return new UserDto(
            user.Id,
            user.Username,
            user.SenhaHash,
            string.Empty,
            UsuarioRoleMapper.BuildRoles(user),
            UsuarioPermissionMapper.BuildPermissions(user),
            user.NomeCompleto,
            user.Email,
            user.Ativo);
    }

    private static string ResolveEmail(string? email, string username)
    {
        if (!string.IsNullOrWhiteSpace(email))
        {
            return email.Trim();
        }

        var safeUsername = new string(username
            .Trim()
            .ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
            .ToArray())
            .Trim('-');

        if (string.IsNullOrWhiteSpace(safeUsername))
        {
            safeUsername = "usuario";
        }

        return $"{safeUsername}-{Guid.NewGuid():N}@coopsystem.local";
    }
}
