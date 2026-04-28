using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Recoopera.Module.Application.DTOs;

namespace Recoopera.Module.Application.Interfaces
{
    public interface ICalculoRenegociacaoService
    {
        Task<ResultadoCalculoResponse> CalcularAsync(CalculoRenegociacaoRequest request);
    }
}
