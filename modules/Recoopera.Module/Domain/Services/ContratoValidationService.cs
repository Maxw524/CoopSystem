using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using Recoopera.Module.Application.DTOs;

namespace Recoopera.Module.Domain.Services
{
    public interface IContratoValidationService
    {
        ValidationResult ValidarContratosParaRenegociacao(List<ContratoExcelDto> contratos, List<string> contratosSelecionados, HashSet<string> contratosAjuizados);
        ValidationResult ValidarSimulacao(CalculoRenegociacaoRequest request, HashSet<string> contratosAjuizados);
    }

    public class ContratoValidationService : IContratoValidationService
    {
        public ValidationResult ValidarContratosParaRenegociacao(List<ContratoExcelDto> contratos, List<string> contratosSelecionados, HashSet<string> contratosAjuizados)
        {
            var resultado = new ValidationResult();

            var selecionadosDigits = new HashSet<string>(
                contratosSelecionados.Select(SomenteNumeros),
                StringComparer.Ordinal
            );

            var contratosValidos = contratos
                .Where(c => selecionadosDigits.Contains(SomenteNumeros(c.NumeroContrato)))
                .ToList();

            if (!contratosValidos.Any())
            {
                resultado.AddErro("Nenhum contrato válido selecionado.");
                return resultado;
            }

            var bloqueados = contratosValidos
                .Where(c => contratosAjuizados.Contains(SomenteNumeros(c.NumeroContrato)))
                .Select(c => c.NumeroContrato)
                .ToList();

            if (bloqueados.Count > 0)
            {
                resultado.AddErro($"Os contratos [{string.Join(", ", bloqueados)}] constam em ações ajuizadas e não podem ser renegociados.");
            }

            return resultado;
        }

        public ValidationResult ValidarSimulacao(CalculoRenegociacaoRequest request, HashSet<string> contratosAjuizados)
        {
            var resultado = new ValidationResult();

            if (request.Contratos == null || !request.Contratos.Any())
            {
                resultado.AddErro("Nenhum contrato selecionado para simulação.");
                return resultado;
            }

            var contratosAjuizadosSelecionados = request.Contratos
                .Where(c => !string.IsNullOrWhiteSpace(c.NumeroContrato) &&
                            contratosAjuizados.Contains(SomenteNumeros(c.NumeroContrato)))
                .Select(c => c.NumeroContrato!)
                .ToList();

            if (contratosAjuizadosSelecionados.Any())
            {
                resultado.AddErro($"Os contratos [{string.Join(", ", contratosAjuizadosSelecionados)}] constam em ações ajuizadas e não podem ser renegociados.");
            }

            return resultado;
        }

        private static string SomenteNumeros(string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor)) return string.Empty;
            return new string(valor.Where(char.IsDigit).ToArray());
        }
    }

    public class ValidationResult
    {
        public bool IsValid => !Erros.Any();
        public List<string> Erros { get; private set; } = new List<string>();

        public void AddErro(string erro)
        {
            Erros.Add(erro);
        }

        public void LancarErroSeInvalido()
        {
            if (!IsValid)
            {
                throw new Exception(string.Join("; ", Erros));
            }
        }
    }
}
