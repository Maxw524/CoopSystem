using System.Threading.Tasks;
using System.Collections.Generic;
using Recoopera.Module.Domain.Entities;

namespace Recoopera.Module.Application.Interfaces
{
    public interface IPropostaService
    {
        Task<List<Proposta>> ObterPropostasAsync();
        Task<Proposta?> ObterPropostaPorIdAsync(int id);
        Task<bool> SalvarPropostaAsync(Proposta proposta);
        Task<bool> ExcluirPropostaAsync(int id);
    }
}
