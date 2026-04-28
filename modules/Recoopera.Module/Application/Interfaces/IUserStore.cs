namespace Recoopera.Module.Application.Interfaces;

public interface IUserStore
{
    Task<UserDto?> FindByUsernameAsync(string username);
    Task<List<UserDto>> GetAllAsync();
    Task<UserDto> AddAsync(
        string username,
        string passwordHash,
        string passwordSalt,
        List<string> roles,
        string? nomeCompleto = null,
        string? email = null,
        bool ativo = true);
    Task UpdatePasswordAsync(Guid id, string passwordHash, string passwordSalt);
    Task UpdateRolesAsync(Guid id, List<string> roles);
    Task DeleteAsync(Guid id);
    Task<UserDto?> FindByIdAsync(Guid id);
}

public record UserDto(
    Guid Id,
    string Username,
    string PasswordHash,
    string PasswordSalt,
    List<string> Roles,
    List<string> Permissions,
    string NomeCompleto,
    string Email,
    bool Ativo);
