using Sistrawts.Module.Application.DTOs;

namespace Sistrawts.Module.Application.Services
{
    public interface ISetorService
    {
        Task<IEnumerable<SetorDto>> GetAllAsync();
        Task<SetorDto?> GetByIdAsync(Guid id);
        Task<SetorDto> CreateAsync(CreateSetorDto dto);
        Task<SetorDto?> UpdateAsync(Guid id, UpdateSetorDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
