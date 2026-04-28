using Sistrawts.Module.Application.DTOs;

namespace Sistrawts.Module.Application.Services
{
    public interface IPlanoAcaoService
    {
        Task<IEnumerable<PlanoAcaoDto>> GetAllAsync(Guid userId);
        Task<PlanoAcaoDto?> GetByIdAsync(Guid id, Guid userId);
        Task<PlanoAcaoDto> CreateAsync(CreatePlanoAcaoDto dto, Guid criadoPorId);
        Task<PlanoAcaoDto?> UpdateAsync(Guid id, UpdatePlanoAcaoDto dto, Guid userId);
        Task<bool> DeleteAsync(Guid id, Guid userId);
        Task<IEnumerable<PlanoAcaoDto>> GetByResponsavelIdAsync(Guid responsavelId);
        Task<bool> AtualizarPercentualConclusaoAsync(Guid planoAcaoId);
        Task<bool> AtualizarTrativaAsync(Guid id, string trativa, Guid userId);
        Task<bool> AtualizarRelatorioAsync(Guid id, string relatorio, Guid userId);
        Task<byte[]?> GerarRelatorioPdfAsync(Guid id, Guid userId);
    }
}
