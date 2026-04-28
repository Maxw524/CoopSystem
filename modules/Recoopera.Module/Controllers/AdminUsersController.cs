using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Recoopera.Module.Application.Interfaces;

namespace Recoopera.Module.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/users")]
public class AdminUsersController : ControllerBase
{
    private readonly IUserStore _store;
    private readonly PasswordHasher _hasher;

    public AdminUsersController(IUserStore store, PasswordHasher hasher)
    {
        _store = store;
        _hasher = hasher;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var users = await _store.GetAllAsync();

        return Ok(users.Select(u => new
        {
            u.Id,
            u.Username,
            u.NomeCompleto,
            u.Email,
            u.Ativo,
            Roles = u.Roles ?? new List<string>(),
            Permissions = u.Permissions ?? new List<string>()
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest(new { message = "Username e Password obrigatorios" });
        }

        var username = req.Username.Trim();
        var existing = await _store.FindByUsernameAsync(username);
        if (existing is not null)
        {
            return Conflict(new { message = "Username ja existe" });
        }

        var (hash, salt) = _hasher.HashPassword(req.Password);
        var roles = req.Roles is { Count: > 0 }
            ? req.Roles.Distinct().ToList()
            : new List<string> { "Operador" };

        var user = await _store.AddAsync(
            username,
            hash,
            salt,
            roles,
            req.NomeCompleto,
            req.Email,
            req.Ativo ?? true);

        return Ok(new
        {
            user.Id,
            user.Username,
            user.NomeCompleto,
            user.Email,
            Roles = roles,
            Permissions = new List<string>()
        });
    }

    [HttpPut("{id:guid}/password")]
    public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NewPassword))
        {
            return BadRequest(new { message = "NewPassword obrigatorio" });
        }

        var user = await _store.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "Usuario nao encontrado" });
        }

        var (hash, salt) = _hasher.HashPassword(req.NewPassword);
        await _store.UpdatePasswordAsync(id, hash, salt);

        return Ok(new { message = "Senha atualizada" });
    }

    [HttpPut("{id:guid}/roles")]
    public async Task<IActionResult> ChangeRoles(Guid id, [FromBody] ChangeRolesRequest req)
    {
        var user = await _store.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "Usuario nao encontrado" });
        }

        var roles = req.Roles?.Distinct().ToList() ?? new List<string>();
        await _store.UpdateRolesAsync(id, roles);

        return Ok(new { message = "Roles atualizadas", roles });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await _store.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "Usuario nao encontrado" });
        }

        await _store.DeleteAsync(id);
        return Ok(new { message = "Usuario desativado" });
    }
}

public record CreateUserRequest(
    string Username,
    string Password,
    string? NomeCompleto = null,
    string? Email = null,
    bool? Ativo = null,
    List<string>? Roles = null);

public record ChangePasswordRequest(string NewPassword);
public record ChangeRolesRequest(List<string>? Roles);
