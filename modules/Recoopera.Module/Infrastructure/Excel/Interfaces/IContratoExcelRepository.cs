using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Recoopera.Module.Application.DTOs;

namespace Recoopera.Module.Infrastructure.Excel.Interfaces;

public interface IContratoExcelRepository
{
    Task<List<ContratoExcelDto>> BuscarPorCpfAsync(string cpf);
    Task<List<ContratoExcelDto>> PesquisarPorNomeAsync(string nome);
}
