using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Recoopera.Module.Application.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Recoopera.Module.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserStore _store;
    private readonly PasswordHasher _hasher;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUserStore store,
        PasswordHasher hasher,
        IConfiguration config,
        ILogger<AuthController> logger)
    {
        _store = store;
        _hasher = hasher;
        _config = config;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest(new { message = "Username e Password sao obrigatorios" });
        }

        var username = req.Username.Trim();
        var user = await _store.FindByUsernameAsync(username);

        if (user is null)
        {
            _logger.LogWarning("LOGIN FAIL: usuario nao encontrado [{Username}]", username);
            return Unauthorized(new { message = "Credenciais invalidas" });
        }

        if (!user.Ativo)
        {
            _logger.LogWarning("LOGIN FAIL: usuario inativo [{Username}]", username);
            return Unauthorized(new { message = "Usuario inativo" });
        }

        var ok = _hasher.Verify(req.Password, user.PasswordHash, user.PasswordSalt);
        if (!ok)
        {
            _logger.LogWarning("LOGIN FAIL: senha invalida para userId={UserId} [{Username}]", user.Id, user.Username);
            return Unauthorized(new { message = "Credenciais invalidas" });
        }

        var jwtKey = _config["Jwt:Key"];
        var jwtIssuer = _config["Jwt:Issuer"];
        var jwtAudience = _config["Jwt:Audience"];

        if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
        {
            return StatusCode(500, new { message = "Jwt:Key/Jwt:Issuer/Jwt:Audience nao configurados" });
        }

        var roles = user.Roles is { Count: > 0 }
            ? user.Roles
            : new List<string> { "Operador" };
        var permissions = user.Permissions is { Count: > 0 }
            ? user.Permissions
            : new List<string>();

        var now = DateTime.UtcNow;
        var expires = now.AddHours(2);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new("NomeCompleto", user.NomeCompleto),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        claims.AddRange(permissions.Select(permission => new Claim("permission", permission)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: creds);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new
        {
            token = tokenString,
            user = user.Username,
            usuario = new
            {
                id = user.Id,
                username = user.Username,
                nomeCompleto = user.NomeCompleto,
                email = user.Email,
                admin = roles.Contains("Admin"),
                permiteJuridico = roles.Contains("Admin") || roles.Contains("Juridico"),
                permiteSistrawts = roles.Contains("Admin") || roles.Contains("Sistrawts"),
                permiteSimuladorTaxa = roles.Contains("Admin") || roles.Contains("Credito I"),
                permissions
            },
            nomeCompleto = user.NomeCompleto,
            email = user.Email,
            roles,
            permissions,
            expiresAt = expires,
            expiresIn = (int)(expires - now).TotalSeconds
        });
    }
}

public record LoginRequest(string Username, string Password);
