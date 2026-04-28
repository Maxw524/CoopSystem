using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Recoopera.Module.Application.DTOs
{
    public class ClientLogDto
    {
        public string Level { get; set; } = "error"; // debug | info | warn | error
        public string Message { get; set; } = "";
        public string? Stack { get; set; }
        public string? Url { get; set; }
        public string? Route { get; set; }
        public string? UserAgent { get; set; }
        public string? CorrelationId { get; set; }

        // contextos úteis
        public string? CpfCnpj { get; set; }
        public object? Extra { get; set; }

        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
    }
}
