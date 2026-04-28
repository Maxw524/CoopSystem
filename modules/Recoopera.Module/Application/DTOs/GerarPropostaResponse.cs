using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Recoopera.Module.Application.DTOs
{
    public class GerarPropostaResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int PropostaId { get; set; }
        public string NumeroProposta { get; set; } = string.Empty;
    }
}
