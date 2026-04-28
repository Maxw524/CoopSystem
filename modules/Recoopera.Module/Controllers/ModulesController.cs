using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;

namespace Recoopera.Module.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ModulesController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ILogger<ModulesController> _logger;

    public ModulesController(IConfiguration config, ILogger<ModulesController> logger)
    {
        _config = config;
        _logger = logger;
    }

    [HttpGet("info")]
    public IActionResult GetModulesInfo()
    {
        var modules = new List<object>
        {
            new
            {
                id = "recoopera",
                name = "Recoopera",
                description = "Módulo de renegociação de dívidas e recuperação de crédito",
                enabled = true,
                version = "1.0.0",
                features = new[] { "Propostas", "Simulação", "Relatórios" }
            },
            new
            {
                id = "juridico",
                name = "Jurídico",
                description = "Módulo de gestão jurídica",
                enabled = true,
                version = "1.0.0",
                features = new[] { "Processos", "Advogados", "Relatórios" }
            },
            new
            {
                id = "credito",
                name = "Crédito",
                description = "Módulo de análise e concessão de crédito",
                enabled = true,
                version = "1.0.0",
                features = new[] { "Simulador", "Checklist", "Análise" }
            },
            new
            {
                id = "admin",
                name = "Administração",
                description = "Módulo administrativo do sistema",
                enabled = true,
                version = "1.0.0",
                features = new[] { "Usuários", "Taxas", "Configurações" }
            }
        };

        return Ok(modules);
    }

    [HttpGet("recoopera/stats")]
    public IActionResult GetRecooperaStats()
    {
        // Simulação de estatísticas - em produção viria do banco de dados
        var stats = new
        {
            totalPropostas = 1234,
            propostasAprovadas = 856,
            propostasPendentes = 234,
            propostasRejeitadas = 144,
            valorTotal = "R$ 2.345.678,90",
            valorAprovado = "R$ 1.876.543,21",
            taxaAprovacao = 69.4
        };

        return Ok(stats);
    }
}
