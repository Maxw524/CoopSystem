using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Recoopera.Module.Application.DTOs;
using Recoopera.Module.Application.Services;
using Recoopera.Module.Application.Calculos;
using Recoopera.Module.Infrastructure.Excel.Interfaces;
using Recoopera.Module.Infrastructure.Excel.Local;
using Recoopera.Module.Domain.Services;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/renegociacoes")]
public class RenegociacaoController : ControllerBase
{
    private readonly RenegociacaoService _service;
    private readonly ICalculoNegociacaoService _calculo;
    private readonly IOperacoesAdvogadosExcelRepository _operAdvRepo;
    private readonly IRenegociacaoDomainService _domainService;

    public RenegociacaoController(
        RenegociacaoService service,
        ICalculoNegociacaoService calculo,
        IOperacoesAdvogadosExcelRepository operAdvRepo,
        IRenegociacaoDomainService domainService)
    {
        _service = service;
        _calculo = calculo;
        _operAdvRepo = operAdvRepo;
        _domainService = domainService;
    }

    [HttpGet("{cpfCnpj}")]
    public async Task<IActionResult> BuscarContratos(string cpfCnpj)
    {
        var contratosExcel = await _service.BuscarContratosAsync(cpfCnpj);
        var calculados = _calculo.CalcularLista(contratosExcel);
        var ajuizados = _operAdvRepo.GetContratosAjuizados();
        var ajuizadosSet = new HashSet<string>(ajuizados);

        var payload = _domainService.ProcessarContratos(calculados, ajuizadosSet);

        return Ok(payload);
    }

    [HttpGet("pesquisar-por-nome/{nome}")]
    public async Task<IActionResult> PesquisarPorNome(string nome)
    {
        try
        {
            var contratosExcel = await _service.PesquisarPorNomeAsync(nome);
            var calculados = _calculo.CalcularLista(contratosExcel);
            var ajuizados = _operAdvRepo.GetContratosAjuizados();
            var ajuizadosSet = new HashSet<string>(ajuizados);

            var payload = _domainService.ProcessarContratos(calculados, ajuizadosSet);

            return Ok(payload);
        }
        catch (Exception ex)
        {
            return BadRequest(new { erro = ex.Message });
        }
    }

    [HttpPost("consolidar")]
    public async Task<IActionResult> Consolidar([FromBody] RenegociacaoRequestDto request)
    {
        var resultado = await _service.ConsolidarAsync(request.Cpf, request.ContratosSelecionados);
        return Ok(resultado);
    }

    [HttpPost("simular")]
    public async Task<IActionResult> Simular([FromBody] CalculoRenegociacaoRequest request)
    {
        var resultado = await _service.SimularAsync(request);
        return Ok(resultado);
    }

    [HttpGet("grid/{cpfCnpj}")]
    public async Task<IActionResult> BuscarContratosGrid(string cpfCnpj)
    {
        var contratosExcel = await _service.BuscarContratosAsync(cpfCnpj);
        var calculados = _calculo.CalcularLista(contratosExcel);
        var ajuizados = _operAdvRepo.GetContratosAjuizados();
        var ajuizadosSet = new HashSet<string>(ajuizados);

        var grid = _domainService.ProcessarContratos(calculados, ajuizadosSet);

        return Ok(grid);
    }

    [HttpPost("limpar-cache")]
    public IActionResult LimparCache()
    {
        try
        {
            OperacoesAdvogadosExcelLocalRepository.LimparCache();
            
            return Ok(new { mensagem = "Cache das planilhas limpo com sucesso!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { erro = ex.Message });
        }
    }
}
