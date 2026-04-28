using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;

namespace Recoopera.Module.Application.DTOs
{
    public class ContratoRenegociacaoDto
    {
        public DateTime DataMovimento { get; set; }
        public string NomeCliente { get; set; } = string.Empty;
        public string CpfCnpj { get; set; } = string.Empty;
        public string NumeroContrato { get; set; } = string.Empty;
        public string SubmodalidadeBacen { get; set; } = string.Empty;
        public string SituacaoContrato { get; set; } = string.Empty;
        public string TipoContrato { get; set; } = string.Empty;

        public decimal? TaxaOperacaoPercentualOriginal { get; set; }
        public decimal? TaxaOperacaoPercentualEfetiva { get; set; }
        public decimal? TaxaOperacaoPercentual { get; set; }

        public decimal? ValorContrato { get; set; }
        public decimal? ValorPago { get; set; }

        public int DiasAtrasoParcela { get; set; }
        public decimal? ValorSaldoContabilBruto { get; set; }
        public decimal? SaldoBaseNegociacao { get; set; }
        public decimal? ValorSaldoContabilBrutoAjustado { get; set; }

        public decimal TotalDevido { get; set; }

        public bool? AplicouTaxaFallback { get; set; }
        public decimal? JurosAplicadosFallback { get; set; }
        public bool? EhPrejuizo { get; set; }

        public bool EhAjuizado { get; set; }
        public bool PodeSelecionar { get; set; }
    }
}
