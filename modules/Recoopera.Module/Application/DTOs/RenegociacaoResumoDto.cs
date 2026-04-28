using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
namespace Recoopera.Module.Application.DTOs
{
    public class RenegociacaoResumoDto
    {
        public required string Cpf { get; set; } = string.Empty;
        public decimal ValorTotal { get; set; }
        public decimal TaxaAplicada { get; set; }
        public int QuantidadeContratos { get; set; }
    }
}
