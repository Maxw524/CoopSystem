using Microsoft.AspNetCore.Http;
using Sistrawts.Module.Application.DTOs;

namespace Sistrawts.Module.Application.Services
{
    public interface IMicroAcaoService
    {
        Task<IEnumerable<MicroAcaoDto>> GetAllAsync();
        Task<MicroAcaoDto?> GetByIdAsync(int id);
        Task<MicroAcaoDto> CreateAsync(CreateMicroAcaoDto dto, Guid criadoPorId);
        Task<MicroAcaoDto?> UpdateAsync(int id, UpdateMicroAcaoDto dto, Guid userId);
        Task<bool> DeleteAsync(int id, Guid userId);
        Task<IEnumerable<MicroAcaoDto>> GetByPlanoAcaoIdAsync(Guid planoAcaoId);
        Task<IEnumerable<MicroAcaoDto>> GetByResponsavelIdAsync(Guid responsavelId);
        Task<bool> MarcarComoConcluidaAsync(int id, Guid userId);
        Task<string?> UploadComprovacaoAsync(int id, IFormFile file, Guid userId);
    }
}
