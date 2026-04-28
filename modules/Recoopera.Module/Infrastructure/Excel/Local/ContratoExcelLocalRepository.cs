using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using OfficeOpenXml;
using Recoopera.Module.Application.DTOs;
using Recoopera.Module.Infrastructure.Excel.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Globalization;

namespace Recoopera.Module.Infrastructure.Excel.Local;

public class ContratoExcelLocalRepository : IContratoExcelRepository
{
    private readonly string _filePath;

    public ContratoExcelLocalRepository(IConfiguration configuration, IHostEnvironment environment)
    {
        var basePath = configuration["ExcelSettings:BasePath"]
            ?? throw new InvalidOperationException("ExcelSettings:BasePath não configurado.");

        var fileName = configuration["ExcelSettings:ContratoFile"]
            ?? throw new InvalidOperationException("ExcelSettings:ContratoFile não configurado.");

        var resolvedBasePath = ExcelPathResolver.ResolveBasePath(basePath, environment);
        _filePath = Path.Combine(resolvedBasePath, fileName);
    }

    public Task<List<ContratoExcelDto>> BuscarPorCpfAsync(string cpf)
    {
        if (!File.Exists(_filePath))
            throw new FileNotFoundException("Planilha não encontrada.", _filePath);

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        cpf = SomenteNumeros(cpf);

        var contratos = new List<ContratoExcelDto>();

        using var stream = new FileStream(
            _filePath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.ReadWrite
        );

        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets[0];

        if (worksheet.Dimension == null)
            return Task.FromResult(contratos);

        var rows = worksheet.Dimension.Rows;

        for (int row = 2; row <= rows; row++)
        {
            var cpfPlanilha = SomenteNumeros(worksheet.Cells[row, 3].Text);

            if (cpfPlanilha != cpf)
                continue;

            contratos.Add(new ContratoExcelDto
            {
                DataMovimento = LerData(worksheet.Cells[row, 1].Text),
                NomeCliente = worksheet.Cells[row, 2].Text.Trim(),
                CpfCnpj = cpfPlanilha,

                NumeroContrato = worksheet.Cells[row, 5].Text.Trim(),
                SubmodalidadeBacen = worksheet.Cells[row, 6].Text.Trim(),
                SituacaoContrato = worksheet.Cells[row, 7].Text.Trim(),
                TipoContrato = worksheet.Cells[row, 8].Text.Trim(),

                TaxaOperacaoPercentual = LerDecimal(worksheet.Cells[row, 9].Text),

                QuantidadeParcelas = LerInt(worksheet.Cells[row, 11].Text),
                QuantidadeParcelasAbertas = LerInt(worksheet.Cells[row, 12].Text),
                QuantidadeParcelasPagas = LerInt(worksheet.Cells[row, 13].Text),

                // ?? Referência / exibição
                ValorContrato = LerDecimal(worksheet.Cells[row, 14].Text),

                // ? FONTE DA VERDADE
                ValorSaldoContabilBruto = LerDecimal(worksheet.Cells[row, 15].Text),

                DiasAtrasoParcela = LerInt(worksheet.Cells[row, 16].Text),
                DataPrejuizo = LerDataNula(worksheet.Cells[row, 17].Text),

                RendaBrutaMensal = LerDecimal(worksheet.Cells[row, 18].Text),
                TipoRenda = worksheet.Cells[row, 19].Text.Trim(),

                ValorPago = LerDecimal(worksheet.Cells[row, 20].Text)
            });


        }

        return Task.FromResult(contratos);
    }

    // ==========================
    // Helpers
    // ==========================

    private static string SomenteNumeros(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return string.Empty;

        return new string(valor.Where(char.IsDigit).ToArray());
    }

    private static decimal LerDecimal(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return 0;

        decimal.TryParse(valor, NumberStyles.Any, new CultureInfo("pt-BR"), out var resultado);
        return resultado;
    }

    private static int LerInt(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return 0;

        int.TryParse(valor, out var resultado);
        return resultado;
    }

    private static DateTime LerData(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return DateTime.MinValue;

        DateTime.TryParse(valor, new CultureInfo("pt-BR"), DateTimeStyles.None, out var data);
        return data;
    }

    private static DateTime? LerDataNula(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;

        if (DateTime.TryParse(valor, new CultureInfo("pt-BR"), DateTimeStyles.None, out var data))
            return data;

        return null;
    }

    public Task<List<ContratoExcelDto>> PesquisarPorNomeAsync(string nome)
    {
        if (!File.Exists(_filePath))
            throw new FileNotFoundException("Planilha não encontrada.", _filePath);

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        if (string.IsNullOrWhiteSpace(nome))
            return Task.FromResult(new List<ContratoExcelDto>());

        var contratos = new List<ContratoExcelDto>();

        using var stream = new FileStream(
            _filePath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.ReadWrite
        );

        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets[0];

        if (worksheet.Dimension == null)
            return Task.FromResult(contratos);

        var rows = worksheet.Dimension.Rows;

        for (int row = 2; row <= rows; row++)
        {
            var nomeCliente = worksheet.Cells[row, 2].Text?.Trim().ToUpperInvariant() ?? string.Empty;

            if (nomeCliente.StartsWith(nome.Trim().ToUpperInvariant()))
            {
                var contrato = new ContratoExcelDto
                {
                    DataMovimento = LerDataNula(worksheet.Cells[row, 1].Text) ?? DateTime.MinValue,
                    NomeCliente = worksheet.Cells[row, 2].Text,
                    CpfCnpj = worksheet.Cells[row, 3].Text,
                    NumeroContrato = worksheet.Cells[row, 4].Text,
                    SubmodalidadeBacen = worksheet.Cells[row, 5].Text,
                    SituacaoContrato = worksheet.Cells[row, 6].Text,
                    TipoContrato = worksheet.Cells[row, 7].Text,
                    TaxaOperacaoPercentual = LerDecimal(worksheet.Cells[row, 11].Text),
                    QuantidadeParcelas = LerInt(worksheet.Cells[row, 12].Text),
                    QuantidadeParcelasPagas = LerInt(worksheet.Cells[row, 13].Text),
                    QuantidadeParcelasAbertas = LerInt(worksheet.Cells[row, 14].Text),
                    ValorContrato = LerDecimal(worksheet.Cells[row, 8].Text),
                    DiasAtrasoParcela = LerInt(worksheet.Cells[row, 16].Text),
                    DataPrejuizo = LerDataNula(worksheet.Cells[row, 17].Text),
                    RendaBrutaMensal = LerDecimal(worksheet.Cells[row, 18].Text),
                    TipoRenda = worksheet.Cells[row, 19].Text.Trim(),
                    ValorPago = LerDecimal(worksheet.Cells[row, 20].Text),
                    ValorSaldoContabilBruto = LerDecimal(worksheet.Cells[row, 10].Text)
                };

                contratos.Add(contrato);
            }
        }

        return Task.FromResult(contratos);
    }
}

