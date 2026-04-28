using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
namespace Recoopera.Module.Application.DTOs;

public class BuscarContratosRequest
{
    public string CPF { get; set; } = string.Empty;
}
