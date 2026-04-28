using System.Threading.Tasks;
using System.Collections.Generic;
using Recoopera.Module.Domain.Entities;

namespace Recoopera.Module.Application.Interfaces
{
    public interface IContratoService
    {
        Task<List<Contrato>> ObterContratosAsync();
        Task<Contrato?> ObterContratoPorIdAsync(int id);
        Task<bool> SalvarContratoAsync(Contrato contrato);
        Task<bool> ExcluirContratoAsync(int id);
    }
}
