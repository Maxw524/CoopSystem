using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
namespace Recoopera.Module.Application.DTOs
{
    public class RenegociacaoRequestDto
    {
        public required string Cpf { get; set; } = string.Empty;
        public required List<string> ContratosSelecionados { get; set; } = new();
    }
}
