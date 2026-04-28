using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Application.Security;
using Sistrawts.Module.Domain.Entities;
using Sistrawts.Module.Infrastructure;

namespace Sistrawts.Module.Application.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly SistrawtsDbContext _context;
        private readonly IConfiguration _configuration;

        public UsuarioService(SistrawtsDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<IEnumerable<UsuarioDto>> GetAllAsync()
        {
            var usuarios = await _context.Usuarios
                .OrderBy(u => u.NomeCompleto)
                .ToListAsync();

            return usuarios.Select(MapToDto);
        }

        public async Task<UsuarioDto?> GetByIdAsync(Guid id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            return usuario != null ? MapToDto(usuario) : null;
        }

        public async Task<UsuarioDto?> GetByUsernameAsync(string username)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Username == username);
            
            return usuario != null ? MapToDto(usuario) : null;
        }

        public async Task<UsuarioDto> CreateAsync(CreateUsuarioDto dto)
        {
            // Verificar se username já existe
            if (await _context.Usuarios.AnyAsync(u => u.Username == dto.Username))
                throw new ArgumentException("Username já existe");

            // Verificar se e-mail já existe
            if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email))
                throw new ArgumentException("E-mail já existe");

            // Buscar nome do setor se SetorId foi fornecido
            string nomeSetor = "";
            if (dto.SetorId.HasValue && dto.SetorId.Value != Guid.Empty)
            {
                var setor = await _context.Setores.FindAsync(dto.SetorId.Value);
                if (setor != null)
                {
                    nomeSetor = setor.Nome;
                }
            }

            var usuario = new Usuario
            {
                Username = dto.Username,
                NomeCompleto = dto.NomeCompleto,
                Email = dto.Email,
                SenhaHash = HashSenha(dto.Senha),
                Admin = dto.Admin,
                PermiteJuridico = dto.Admin || dto.PermiteJuridico,
                PermiteSistrawts = dto.Admin || dto.PermiteSistrawts,
                PermiteSimuladorTaxa = dto.Admin || dto.PermiteSimuladorTaxa,
                SetorId = dto.SetorId,
                Setor = nomeSetor,
                DataCriacao = DateTime.Now,
                DataAtualizacao = DateTime.Now
            };

            UsuarioPermissionMapper.ApplyPermissions(usuario, dto.Permissoes);

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return MapToDto(usuario);
        }

        public async Task<UsuarioDto?> UpdateAsync(Guid id, UpdateUsuarioDto dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return null;

            // Verificar se e-mail já existe para outro usuário
            if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email && u.Id != id))
                throw new ArgumentException("E-mail já existe");

            // Buscar nome do setor se SetorId foi fornecido
            string nomeSetor = "";
            if (dto.SetorId.HasValue && dto.SetorId.Value != Guid.Empty)
            {
                var setor = await _context.Setores.FindAsync(dto.SetorId.Value);
                if (setor != null)
                {
                    nomeSetor = setor.Nome;
                }
            }

            usuario.NomeCompleto = dto.NomeCompleto;
            usuario.Email = dto.Email;
            usuario.Ativo = dto.Ativo;
            usuario.Admin = dto.Admin;
            usuario.PermiteJuridico = dto.Admin || dto.PermiteJuridico;
            usuario.PermiteSistrawts = dto.Admin || dto.PermiteSistrawts;
            usuario.PermiteSimuladorTaxa = dto.Admin || dto.PermiteSimuladorTaxa;
            usuario.SetorId = dto.SetorId;
            usuario.Setor = nomeSetor;
            UsuarioPermissionMapper.ApplyPermissions(usuario, dto.Permissoes);
            usuario.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();
            return MapToDto(usuario);
        }

        public async Task<bool> AtualizarSenhaAsync(Guid id, string novaSenha)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return false;

            usuario.SenhaHash = HashSenha(novaSenha);
            usuario.DataAtualizacao = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return false;

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AutenticarAsync(string username, string senha)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Username == username && u.Ativo);

            if (usuario == null)
                return false;

            return VerificarSenha(senha, usuario.SenhaHash);
        }

        public Task<string> GerarTokenJwtAsync(UsuarioDto usuario)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT:Key não configurado");
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT:Issuer não configurado");
            var jwtAudience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT:Audience não configurado");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var roles = UsuarioRoleMapper.BuildRoles(usuario);
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, usuario.Username),
                new Claim(ClaimTypes.Email, usuario.Email),
                new Claim("NomeCompleto", usuario.NomeCompleto),
                new Claim("PermiteJuridico", usuario.PermiteJuridico.ToString()),
                new Claim("PermiteSistrawts", usuario.PermiteSistrawts.ToString()),
                new Claim("PermiteSimuladorTaxa", usuario.PermiteSimuladorTaxa.ToString())
            };

            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
            claims.AddRange(usuario.Permissoes.Select(permission => new Claim("permission", permission)));

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.Now.AddHours(24),
                signingCredentials: credentials
            );

            return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
        }

        private static UsuarioDto MapToDto(Usuario usuario)
        {
            return new UsuarioDto
            {
                Id = usuario.Id,
                Username = usuario.Username,
                NomeCompleto = usuario.NomeCompleto,
                Email = usuario.Email,
                Ativo = usuario.Ativo,
                Admin = usuario.Admin,
                PermiteJuridico = usuario.PermiteJuridico,
                PermiteSistrawts = usuario.PermiteSistrawts,
                PermiteSimuladorTaxa = usuario.PermiteSimuladorTaxa,
                Permissoes = UsuarioPermissionMapper.BuildPermissions(usuario),
                Setor = usuario.Setor,
                DataCriacao = usuario.DataCriacao,
                DataAtualizacao = usuario.DataAtualizacao
            };
        }

        private static string HashSenha(string senha)
        {
            return BCrypt.Net.BCrypt.HashPassword(senha);
        }

        private static bool VerificarSenha(string senha, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(senha, hash);
        }
    }
}
