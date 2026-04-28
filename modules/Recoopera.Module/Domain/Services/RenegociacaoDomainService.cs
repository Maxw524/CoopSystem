using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using Recoopera.Module.Application.DTOs;
using Recoopera.Module.Application.Calculos;
using Recoopera.Module.Infrastructure.Excel.Interfaces;

namespace Recoopera.Module.Domain.Services
{
    public interface IRenegociacaoDomainService
    {
        ContratoRenegociacaoDto ProcessarContrato(ContratoNegociacaoDto contrato, HashSet<string> contratosAjuizados);
        IEnumerable<ContratoRenegociacaoDto> ProcessarContratos(IEnumerable<ContratoNegociacaoDto> contratos, HashSet<string> contratosAjuizados);
        bool EhContratoAjuizado(string numeroContrato, HashSet<string> contratosAjuizados);
        decimal ConverterPercentParaTaxaDecimalAm(decimal taxaPercentual);
        string SomenteNumeros(string? valor);
    }

    public class RenegociacaoDomainService : IRenegociacaoDomainService
    {
        public ContratoRenegociacaoDto ProcessarContrato(ContratoNegociacaoDto contrato, HashSet<string> contratosAjuizados)
        {
            var numeroContratoDigits = SomenteNumeros(contrato.NumeroContrato);
            bool ehAjuizado = EhContratoAjuizado(numeroContratoDigits, contratosAjuizados);

            decimal principal = Convert.ToDecimal(contrato.ValorSaldoContabilBrutoAjustado);
            decimal taxaContratoAm = ConverterPercentParaTaxaDecimalAm(Convert.ToDecimal(contrato.TaxaOperacaoPercentualEfetiva));
            int diasAtraso = contrato.DiasAtrasoParcela < 0 ? 0 : contrato.DiasAtrasoParcela;

            var (taxaMoraAm, multaRate) = CalcularTaxasMoraEMulta(contrato, diasAtraso);

            var calc = CalculadoraRenegociacao.Calcular(
                principal: principal,
                diasAtraso: diasAtraso,
                taxaContratoAm: taxaContratoAm,
                taxaMoraAm: taxaMoraAm,
                multaRate: multaRate,
                baseDiasMes: 30,
                modelo: ModeloCalculo.Separado,
                arredondar: 2
            );

            return new ContratoRenegociacaoDto
            {
                DataMovimento = contrato.DataMovimento,
                NomeCliente = contrato.NomeCliente,
                CpfCnpj = contrato.CpfCnpj,
                NumeroContrato = contrato.NumeroContrato,
                SubmodalidadeBacen = contrato.SubmodalidadeBacen,
                SituacaoContrato = contrato.SituacaoContrato,
                TipoContrato = contrato.TipoContrato,
                TaxaOperacaoPercentualOriginal = contrato.TaxaOperacaoPercentualOriginal,
                TaxaOperacaoPercentualEfetiva = contrato.TaxaOperacaoPercentualEfetiva,
                TaxaOperacaoPercentual = contrato.TaxaOperacaoPercentualEfetiva,
                ValorContrato = contrato.ValorContrato,
                ValorPago = contrato.ValorPago,
                DiasAtrasoParcela = contrato.DiasAtrasoParcela,
                ValorSaldoContabilBruto = contrato.ValorSaldoContabilBruto,
                SaldoBaseNegociacao = contrato.ValorSaldoContabilBrutoAjustado,
                ValorSaldoContabilBrutoAjustado = contrato.ValorSaldoContabilBrutoAjustado,
                TotalDevido = calc.TotalComMulta,
                AplicouTaxaFallback = contrato.AplicouTaxaFallback,
                JurosAplicadosFallback = contrato.JurosAplicados,
                EhPrejuizo = contrato.EhPrejuizo,
                EhAjuizado = ehAjuizado,
                PodeSelecionar = !ehAjuizado
            };
        }

        public IEnumerable<ContratoRenegociacaoDto> ProcessarContratos(IEnumerable<ContratoNegociacaoDto> contratos, HashSet<string> contratosAjuizados)
        {
            return contratos.Select(c => ProcessarContrato(c, contratosAjuizados));
        }

        public bool EhContratoAjuizado(string numeroContrato, HashSet<string> contratosAjuizados)
        {
            return !string.IsNullOrEmpty(numeroContrato) && contratosAjuizados.Contains(numeroContrato);
        }

        public decimal ConverterPercentParaTaxaDecimalAm(decimal taxaPercentual)
        {
            if (taxaPercentual <= 0m) return 0m;

            if (taxaPercentual > 100m)
                return taxaPercentual / 10000m;

            if (taxaPercentual > 0m && taxaPercentual < 1m)
                return taxaPercentual / 100m;

            return taxaPercentual / 100m;
        }

        public string SomenteNumeros(string? valor)
        {
            return string.IsNullOrWhiteSpace(valor)
                ? ""
                : new string(valor.Where(char.IsDigit).ToArray());
        }

        private (decimal taxaMoraAm, decimal multaRate) CalcularTaxasMoraEMulta(ContratoNegociacaoDto contrato, int diasAtraso)
        {
            bool ehTaxaFallback = contrato.AplicouTaxaFallback == true;
            bool ehPrejuizoComTaxaFallback = ehTaxaFallback && contrato.EhPrejuizo == true;

            if (ehPrejuizoComTaxaFallback)
                return (0m, 0m);

            decimal taxaMoraBase = 0.0032m;
            decimal taxaMoraAm = (diasAtraso > 250) ? (taxaMoraBase / 2) : taxaMoraBase;
            decimal multaRate = 0.02m;

            return (taxaMoraAm, multaRate);
        }
    }
}
