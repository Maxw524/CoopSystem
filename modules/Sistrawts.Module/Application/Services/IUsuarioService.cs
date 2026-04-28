using Sistrawts.Module.Application.DTOs;

namespace Sistrawts.Module.Application.Services
{
    public interface IUsuarioService
    {
        Task<IEnumerable<UsuarioDto>> GetAllAsync();
        Task<UsuarioDto?> GetByIdAsync(Guid id);
        Task<UsuarioDto?> GetByUsernameAsync(string username);
        Task<UsuarioDto> CreateAsync(CreateUsuarioDto dto);
        Task<UsuarioDto?> UpdateAsync(Guid id, UpdateUsuarioDto dto);
        Task<bool> AtualizarSenhaAsync(Guid id, string novaSenha);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> AutenticarAsync(string username, string senha);
        Task<string> GerarTokenJwtAsync(UsuarioDto usuario);
    }
}
