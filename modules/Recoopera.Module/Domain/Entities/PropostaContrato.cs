using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Recoopera.Module.Domain.Entities
{
    public class PropostaContrato
    {
        public int Id { get; set; }
        public string NumeroContrato { get; set; } = string.Empty;
        public DateTime DataProposta { get; set; }
        public decimal Valor { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
