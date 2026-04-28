using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Application.Security;
using Sistrawts.Module.Application.Services;

namespace Sistrawts.Module.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        public UsuarioController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<UsuarioDto>>> GetAll()
        {
            var usuarios = await _usuarioService.GetAllAsync();
            return Ok(usuarios);
        }

        [HttpGet("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<UsuarioDto>> GetById(Guid id)
        {
            var usuario = await _usuarioService.GetByIdAsync(id);
            if (usuario == null)
                return NotFound();

            return Ok(usuario);
        }

        [HttpPost]
        public async Task<ActionResult<UsuarioDto>> Create([FromBody] CreateUsuarioDto dto)
        {
            try
            {
                var usuario = await _usuarioService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = usuario.Id }, usuario);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<UsuarioDto>> Update(Guid id, [FromBody] UpdateUsuarioDto dto)
        {
            try
            {
                var usuario = await _usuarioService.UpdateAsync(id, dto);
                if (usuario == null)
                    return NotFound();

                return Ok(usuario);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult> Delete(Guid id)
        {
            var result = await _usuarioService.DeleteAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPut("{id:guid}/senha")]
        [Authorize]
        public async Task<ActionResult> AtualizarSenha(Guid id, [FromBody] AtualizarSenhaRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NovaSenha) || dto.NovaSenha.Trim().Length < 6)
                return BadRequest("A nova senha deve ter ao menos 6 caracteres");

            var requisitanteId = ControllerUserIdHelper.GetRequiredUserId(User);
            var requisitanteAdmin = User.IsInRole("Admin");

            if (!requisitanteAdmin && requisitanteId != id)
                return Forbid();

            var atualizado = await _usuarioService.AtualizarSenhaAsync(id, dto.NovaSenha.Trim());
            if (!atualizado)
                return NotFound();

            return NoContent();
        }

        [HttpGet("setor")]
        [Authorize]
        public async Task<ActionResult<object>> GetSetorUsuarioLogado()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized("Usuário não identificado");
                }

                var usuario = await _usuarioService.GetByIdAsync(userId);
                if (usuario == null)
                {
                    return NotFound("Usuário não encontrado");
                }

                return Ok(new 
                { 
                    userId = usuario.Id,
                    username = usuario.Username,
                    nomeCompleto = usuario.NomeCompleto,
                    setor = usuario.Setor ?? "Não definido"
                });
            }
            catch (Exception)
            {
                return StatusCode(500, "Erro ao obter setor do usuário");
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<string>> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                var autenticado = await _usuarioService.AutenticarAsync(request.Username, request.Senha);
                if (!autenticado)
                    return Unauthorized("Credenciais inválidas");

                var usuario = await _usuarioService.GetByUsernameAsync(request.Username);
                if (usuario == null)
                    return Unauthorized("Usuário não encontrado");

                var token = await _usuarioService.GerarTokenJwtAsync(usuario);
                var roles = UsuarioRoleMapper.BuildRoles(usuario);
                return Ok(new { token, usuario, roles });
            }
            catch (Exception)
            {
                return StatusCode(500, "Erro ao realizar login");
            }
        }
    }

    public class LoginRequestDto
    {
        public string Username { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
    }

    public class AtualizarSenhaRequestDto
    {
        public string NovaSenha { get; set; } = string.Empty;
    }

}
