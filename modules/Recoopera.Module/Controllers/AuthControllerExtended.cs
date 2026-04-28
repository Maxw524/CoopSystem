using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Recoopera.Module.Application.Interfaces;

namespace Recoopera.Module.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthControllerExtended : ControllerBase
{
    private readonly IUserStore _store;
    private readonly PasswordHasher _hasher;
    private readonly ILogger<AuthControllerExtended> _logger;

    public AuthControllerExtended(
        IUserStore store,
        PasswordHasher hasher,
        ILogger<AuthControllerExtended> logger)
    {
        _store = store;
        _hasher = hasher;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest(new { message = "Username e Password sao obrigatorios" });
        }

        var username = req.Username.Trim();
        var existingUser = await _store.FindByUsernameAsync(username);
        if (existingUser is not null)
        {
            return BadRequest(new { message = "Usuario ja existe" });
        }

        var (hash, salt) = _hasher.HashPassword(req.Password);
        var roles = req.Roles?.Any() == true ? req.Roles : new List<string> { "Operador" };
        var user = await _store.AddAsync(
            username,
            hash,
            salt,
            roles,
            req.NomeCompleto,
            req.Email);

        return Ok(new
        {
            message = "Usuario criado com sucesso",
            user = user.Username,
            roles = user.Roles
        });
    }

    [HttpPost("create-default-users")]
    public async Task<IActionResult> CreateDefaultUsers()
    {
        try
        {
            var existingAdmin = await _store.FindByUsernameAsync("admin");
            if (existingAdmin is null)
            {
                var (adminHash, adminSalt) = _hasher.HashPassword("admin123");
                await _store.AddAsync(
                    "admin",
                    adminHash,
                    adminSalt,
                    new List<string> { "Admin" },
                    "Administrador CoopSystem",
                    "admin@coopsystem.local");
            }

            var existingOperador = await _store.FindByUsernameAsync("operador");
            if (existingOperador is null)
            {
                var (opHash, opSalt) = _hasher.HashPassword("operador123");
                await _store.AddAsync(
                    "operador",
                    opHash,
                    opSalt,
                    new List<string> { "Operador" },
                    "Operador CoopSystem",
                    "operador@coopsystem.local");
            }

            return Ok(new { message = "Usuarios padrao criados com sucesso" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar usuarios padrao");
            return StatusCode(500, new { message = "Erro ao criar usuarios padrao" });
        }
    }
}

public record RegisterRequest(
    string Username,
    string Password,
    string? NomeCompleto = null,
    string? Email = null,
    List<string>? Roles = null);
