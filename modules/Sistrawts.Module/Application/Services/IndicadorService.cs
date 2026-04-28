using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Domain.Entities;
using Sistrawts.Module.Infrastructure;

namespace Sistrawts.Module.Application.Services
{
    public class IndicadorService : IIndicadorService
    {
        private readonly SistrawtsDbContext _context;
        private readonly ILogger<IndicadorService> _logger;

        public IndicadorService(SistrawtsDbContext context, ILogger<IndicadorService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Categorias
        public async Task<IEnumerable<CategoriaIndicadorDto>> GetAllCategoriasAsync()
        {
            var categorias = await _context.CategoriasIndicadores
                .OrderBy(c => c.Nome)
                .ToListAsync();

            return categorias.Select(c => new CategoriaIndicadorDto
            {
                Id = c.Id,
                Nome = c.Nome,
                Descricao = c.Descricao,
                DataCriacao = c.DataCriacao,
                DataAtualizacao = c.DataAtualizacao
            });
        }

        public async Task<CategoriaIndicadorDto?> GetCategoriaByIdAsync(int id)
        {
            var categoria = await _context.CategoriasIndicadores.FindAsync(id);
            if (categoria == null) return null;

            return new CategoriaIndicadorDto
            {
                Id = categoria.Id,
                Nome = categoria.Nome,
                Descricao = categoria.Descricao,
                DataCriacao = categoria.DataCriacao,
                DataAtualizacao = categoria.DataAtualizacao
            };
        }

        public async Task<CategoriaIndicadorDto> CreateCategoriaAsync(CreateCategoriaIndicadorDto dto)
        {
            var categoria = new CategoriaIndicador
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
                DataCriacao = DateTime.Now,
                DataAtualizacao = DateTime.Now
            };

            _context.CategoriasIndicadores.Add(categoria);
            await _context.SaveChangesAsync();

            return new CategoriaIndicadorDto
            {
                Id = categoria.Id,
                Nome = categoria.Nome,
                Descricao = categoria.Descricao,
                DataCriacao = categoria.DataCriacao,
                DataAtualizacao = categoria.DataAtualizacao
            };
        }

        public async Task<CategoriaIndicadorDto?> UpdateCategoriaAsync(int id, UpdateCategoriaIndicadorDto dto)
        {
            var categoria = await _context.CategoriasIndicadores.FindAsync(id);
            if (categoria == null) return null;

            categoria.Nome = dto.Nome;
            categoria.Descricao = dto.Descricao;
            categoria.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            return new CategoriaIndicadorDto
            {
                Id = categoria.Id,
                Nome = categoria.Nome,
                Descricao = categoria.Descricao,
                DataCriacao = categoria.DataCriacao,
                DataAtualizacao = categoria.DataAtualizacao
            };
        }

        public async Task<bool> DeleteCategoriaAsync(int id)
        {
            var categoria = await _context.CategoriasIndicadores.FindAsync(id);
            if (categoria == null) return false;

            _context.CategoriasIndicadores.Remove(categoria);
            await _context.SaveChangesAsync();
            return true;
        }

        // Indicadores
        public async Task<IEnumerable<IndicadorDto>> GetAllIndicadoresAsync()
        {
            var indicadores = await _context.Indicadores
                .Include(i => i.Categoria)
                .Include(i => i.MetasMensais)
                    .ThenInclude(m => m.Subcategoria)
                .Include(i => i.ResultadosMensais)
                    .ThenInclude(r => r.Subcategoria)
                .Include(i => i.Subcategorias)
                    .ThenInclude(isb => isb.Subcategoria)
                .OrderBy(i => i.Categoria.Nome)
                .ThenBy(i => i.NomeMeta)
                .ToListAsync();

            return indicadores.Select(MapToDto);
        }

        public async Task<IndicadorDto?> GetIndicadorByIdAsync(int id)
        {
            var indicador = await _context.Indicadores
                .Include(i => i.Categoria)
                .Include(i => i.MetasMensais)
                    .ThenInclude(m => m.Subcategoria)
                .Include(i => i.ResultadosMensais)
                    .ThenInclude(r => r.Subcategoria)
                .Include(i => i.Subcategorias)
                    .ThenInclude(isb => isb.Subcategoria)
                .FirstOrDefaultAsync(i => i.Id == id);

            return indicador != null ? MapToDto(indicador) : null;
        }

        public async Task<IndicadorDto> CreateIndicadorAsync(CreateIndicadorDto dto)
        {
            var indicador = new Indicador
            {
                NomeMeta = dto.NomeMeta,
                Descricao = dto.Descricao,
                CategoriaId = dto.CategoriaId,
                EhPercentual = dto.EhPercentual,
                QuantoMaiorMelhor = dto.QuantoMaiorMelhor,
                DataCriacao = DateTime.Now,
                DataAtualizacao = DateTime.Now
            };

            // Adicionar metas mensais
            foreach (var metaDto in dto.MetasMensais)
            {
                indicador.MetasMensais.Add(new MetaMensal
                {
                    Ano = metaDto.Ano,
                    Mes = metaDto.Mes,
                    ValorMeta = metaDto.ValorMeta,
                    SubcategoriaId = metaDto.SubcategoriaId
                });
            }

            _context.Indicadores.Add(indicador);
            await _context.SaveChangesAsync();

            return await GetIndicadorByIdAsync(indicador.Id) ?? throw new InvalidOperationException("Falha ao recuperar indicador criado");
        }

        public async Task<IndicadorDto?> UpdateIndicadorAsync(int id, UpdateIndicadorDto dto)
        {
            var indicador = await _context.Indicadores
                .Include(i => i.MetasMensais)
                .FirstOrDefaultAsync(i => i.Id == id);
            
            if (indicador == null) return null;

            // Atualizar dados básicos
            indicador.NomeMeta = dto.NomeMeta;
            indicador.Descricao = dto.Descricao;
            indicador.CategoriaId = dto.CategoriaId;
            indicador.EhPercentual = dto.EhPercentual;
            indicador.QuantoMaiorMelhor = dto.QuantoMaiorMelhor;
            indicador.DataAtualizacao = DateTime.Now;

            // Remover metas existentes
            var metasExistentes = indicador.MetasMensais.ToList();
            _context.MetasMensais.RemoveRange(metasExistentes);

            // Adicionar novas metas
            foreach (var metaDto in dto.MetasMensais)
            {
                indicador.MetasMensais.Add(new MetaMensal
                {
                    Ano = metaDto.Ano,
                    Mes = metaDto.Mes,
                    ValorMeta = metaDto.ValorMeta,
                    SubcategoriaId = metaDto.SubcategoriaId
                });
            }

            await _context.SaveChangesAsync();

            return await GetIndicadorByIdAsync(indicador.Id);
        }

        public async Task<bool> DeleteIndicadorAsync(int id)
        {
            var indicador = await _context.Indicadores.FindAsync(id);
            if (indicador == null) return false;

            _context.Indicadores.Remove(indicador);
            await _context.SaveChangesAsync();
            return true;
        }

        // Resultados
        public async Task<ResultadoMensalDto> CreateResultadoAsync(CreateResultadoMensalDto dto)
        {
            var resultado = new ResultadoMensal
            {
                IndicadorId = dto.IndicadorId,
                SubcategoriaId = dto.SubcategoriaId,
                Ano = dto.Ano,
                Mes = dto.Mes,
                ValorResultado = dto.ValorResultado,
                DataRegistro = DateTime.Now
            };

            _context.ResultadosMensais.Add(resultado);
            await _context.SaveChangesAsync();

            // Buscar meta para calcular se bateu (considerando subcategoria)
            var meta = await _context.MetasMensais
                .FirstOrDefaultAsync(m => m.IndicadorId == dto.IndicadorId 
                                      && m.Ano == dto.Ano 
                                      && m.Mes == dto.Mes
                                      && m.SubcategoriaId == dto.SubcategoriaId);

            var indicador = await _context.Indicadores.FindAsync(dto.IndicadorId);

            bool bateuMeta = false;
            decimal valorMeta = meta?.ValorMeta ?? 0;
            decimal percentualAtingido = 0;

            if (meta != null && indicador != null)
            {
                if (indicador.QuantoMaiorMelhor)
                {
                    bateuMeta = dto.ValorResultado >= meta.ValorMeta;
                }
                else
                {
                    bateuMeta = dto.ValorResultado <= meta.ValorMeta;
                }

                if (meta.ValorMeta != 0)
                {
                    percentualAtingido = (dto.ValorResultado / meta.ValorMeta) * 100;
                }
            }

            return new ResultadoMensalDto
            {
                Id = resultado.Id,
                IndicadorId = resultado.IndicadorId,
                Ano = resultado.Ano,
                Mes = resultado.Mes,
                ValorResultado = resultado.ValorResultado,
                DataRegistro = resultado.DataRegistro,
                BateuMeta = bateuMeta,
                ValorMeta = valorMeta,
                PercentualAtingido = percentualAtingido
            };
        }

        public async Task<ResultadoMensalDto> UpdateResultadoAsync(CreateResultadoMensalDto dto)
        {
            // Buscar resultado existente considerando também a subcategoria
            var resultadoExistente = await _context.ResultadosMensais
                .FirstOrDefaultAsync(r => r.IndicadorId == dto.IndicadorId 
                                       && r.Ano == dto.Ano 
                                       && r.Mes == dto.Mes
                                       && r.SubcategoriaId == dto.SubcategoriaId);

            if (resultadoExistente != null)
            {
                // Atualizar resultado existente
                resultadoExistente.ValorResultado = dto.ValorResultado;
                resultadoExistente.DataRegistro = DateTime.Now;
                await _context.SaveChangesAsync();
            }
            else
            {
                // Criar novo resultado se não existir
                return await CreateResultadoAsync(dto);
            }

            // Buscar meta para calcular se bateu (considerando subcategoria)
            var meta = await _context.MetasMensais
                .FirstOrDefaultAsync(m => m.IndicadorId == dto.IndicadorId 
                                      && m.Ano == dto.Ano 
                                      && m.Mes == dto.Mes
                                      && m.SubcategoriaId == dto.SubcategoriaId);

            var indicador = await _context.Indicadores.FindAsync(dto.IndicadorId);

            bool bateuMeta = false;
            decimal valorMeta = meta?.ValorMeta ?? 0;
            decimal percentualAtingido = 0;

            if (meta != null && indicador != null)
            {
                if (indicador.QuantoMaiorMelhor)
                {
                    bateuMeta = resultadoExistente.ValorResultado >= valorMeta;
                }
                else
                {
                    bateuMeta = resultadoExistente.ValorResultado <= valorMeta;
                }

                if (valorMeta > 0)
                {
                    percentualAtingido = (resultadoExistente.ValorResultado / valorMeta) * 100;
                }
            }

            return new ResultadoMensalDto
            {
                Id = resultadoExistente.Id,
                IndicadorId = resultadoExistente.IndicadorId,
                Ano = resultadoExistente.Ano,
                Mes = resultadoExistente.Mes,
                ValorResultado = resultadoExistente.ValorResultado,
                DataRegistro = resultadoExistente.DataRegistro,
                BateuMeta = bateuMeta,
                ValorMeta = valorMeta,
                PercentualAtingido = percentualAtingido
            };
        }

        public async Task<IEnumerable<ResultadoMensalDto>> GetResultadosByIndicadorAsync(int indicadorId)
        {
            var resultados = await _context.ResultadosMensais
                .Where(r => r.IndicadorId == indicadorId)
                .OrderByDescending(r => r.Ano)
                .ThenByDescending(r => r.Mes)
                .ToListAsync();

            var indicador = await _context.Indicadores.FindAsync(indicadorId);
            var metas = await _context.MetasMensais
                .Where(m => m.IndicadorId == indicadorId)
                .ToListAsync();

            var resultList = new List<ResultadoMensalDto>();

            foreach (var resultado in resultados)
            {
                var meta = metas.FirstOrDefault(m => m.Ano == resultado.Ano 
                                              && m.Mes == resultado.Mes
                                              && m.SubcategoriaId == resultado.SubcategoriaId);
                bool bateuMeta = false;
                decimal valorMeta = meta?.ValorMeta ?? 0;
                decimal percentualAtingido = 0;

                if (meta != null && indicador != null)
                {
                    if (indicador.QuantoMaiorMelhor)
                    {
                        bateuMeta = resultado.ValorResultado >= meta.ValorMeta;
                    }
                    else
                    {
                        bateuMeta = resultado.ValorResultado <= meta.ValorMeta;
                    }

                    if (meta.ValorMeta != 0)
                    {
                        percentualAtingido = (resultado.ValorResultado / meta.ValorMeta) * 100;
                    }
                }

                resultList.Add(new ResultadoMensalDto
                {
                    Id = resultado.Id,
                    IndicadorId = resultado.IndicadorId,
                    Ano = resultado.Ano,
                    Mes = resultado.Mes,
                    ValorResultado = resultado.ValorResultado,
                    DataRegistro = resultado.DataRegistro,
                    BateuMeta = bateuMeta,
                    ValorMeta = valorMeta,
                    PercentualAtingido = percentualAtingido
                });
            }

            return resultList;
        }

        public async Task<bool> DeleteResultadoAsync(int id)
        {
            var resultado = await _context.ResultadosMensais.FindAsync(id);
            if (resultado == null) return false;

            _context.ResultadosMensais.Remove(resultado);
            await _context.SaveChangesAsync();
            return true;
        }

        // Dashboard
        public async Task<IEnumerable<DashboardIndicadorDto>> GetDashboardAsync()
        {
            var indicadores = await _context.Indicadores
                .Include(i => i.Categoria)
                .Include(i => i.ResultadosMensais)
                .Include(i => i.MetasMensais)
                .OrderBy(i => i.Categoria.Nome)
                .ThenBy(i => i.NomeMeta)
                .ToListAsync();

            var dashboardList = new List<DashboardIndicadorDto>();

            foreach (var indicador in indicadores)
            {
                var resultados = await GetResultadosByIndicadorAsync(indicador.Id);
                var ultimosResultados = resultados.Take(12).ToList(); // Últimos 12 meses

                var totalMesesBateuMeta = resultados.Count(r => r.BateuMeta);
                var totalMesesRegistrados = resultados.Count();
                
                decimal percentualGeral;
                
                // Se for indicador percentual, calcula baseado na soma total
                if (indicador.EhPercentual)
                {
                    var somaResultados = resultados.Sum(r => r.ValorResultado);
                    var somaMetas = resultados.Sum(r => r.ValorMeta);
                    percentualGeral = somaMetas > 0 ? (somaResultados / somaMetas) * 100 : 0;
                }
                else
                {
                    // Para indicadores não percentuais, usa a média dos percentuais
                    percentualGeral = totalMesesRegistrados > 0 
                        ? resultados.Average(r => r.PercentualAtingido) 
                        : 0;
                }
                var statusCor = GetStatusCor(percentualGeral);
                var status = statusCor.status;
                var cor = statusCor.cor;

                dashboardList.Add(new DashboardIndicadorDto
                {
                    Id = indicador.Id,
                    NomeMeta = indicador.NomeMeta,
                    CategoriaNome = indicador.Categoria.Nome,
                    EhPercentual = indicador.EhPercentual,
                    QuantoMaiorMelhor = indicador.QuantoMaiorMelhor,
                    UltimosResultados = ultimosResultados,
                    PercentualGeral = Math.Round(percentualGeral, 2),
                    TotalMesesBateuMeta = totalMesesBateuMeta,
                    TotalMesesRegistrados = totalMesesRegistrados,
                    MediaAtingimento = Math.Round(percentualGeral, 2),
                    StatusGeral = status,
                    CorStatus = cor
                });
            }

            return dashboardList;
        }

        public async Task<IndicadorDto?> GetIndicadorComResultadosAsync(int id, int ano, int mes)
        {
            var indicador = await _context.Indicadores
                .Include(i => i.Categoria)
                .Include(i => i.MetasMensais)
                .Include(i => i.ResultadosMensais)
                .FirstOrDefaultAsync(i => i.Id == id);

            return indicador != null ? MapToDto(indicador) : null;
        }

        private static IndicadorDto MapToDto(Indicador indicador)
        {
            return new IndicadorDto
            {
                Id = indicador.Id,
                NomeMeta = indicador.NomeMeta,
                Descricao = indicador.Descricao,
                CategoriaId = indicador.CategoriaId,
                CategoriaNome = indicador.Categoria.Nome,
                EhPercentual = indicador.EhPercentual,
                QuantoMaiorMelhor = indicador.QuantoMaiorMelhor,
                DataCriacao = indicador.DataCriacao,
                DataAtualizacao = indicador.DataAtualizacao,
                MetasMensais = indicador.MetasMensais
                    .OrderBy(m => m.Ano)
                    .ThenBy(m => m.Mes)
                    .Select(m => new MetaMensalDto
                    {
                        Id = m.Id,
                        IndicadorId = m.IndicadorId,
                        SubcategoriaId = m.SubcategoriaId,
                        Ano = m.Ano,
                        Mes = m.Mes,
                        ValorMeta = m.ValorMeta,
                        SubcategoriaNome = m.Subcategoria != null ? m.Subcategoria.Nome : null
                    }).ToList(),
                ResultadosMensais = indicador.ResultadosMensais
                    .OrderByDescending(r => r.Ano)
                    .ThenByDescending(r => r.Mes)
                    .Select(r => new ResultadoMensalDto
                    {
                        Id = r.Id,
                        IndicadorId = r.IndicadorId,
                        SubcategoriaId = r.SubcategoriaId,
                        Ano = r.Ano,
                        Mes = r.Mes,
                        ValorResultado = r.ValorResultado,
                        DataRegistro = r.DataRegistro,
                        SubcategoriaNome = r.Subcategoria != null ? r.Subcategoria.Nome : null
                    }).ToList(),
                Subcategorias = indicador.Subcategorias
                    .Select(isb => new IndicadorSubcategoriaDto
                    {
                        IndicadorId = isb.IndicadorId,
                        SubcategoriaId = isb.SubcategoriaId,
                        SubcategoriaNome = isb.Subcategoria.Nome
                    }).ToList()
            };
        }

        // Subcategorias
        public async Task<IEnumerable<SubcategoriaIndicadorDto>> GetAllSubcategoriasAsync()
        {
            var subcategorias = await _context.SubcategoriasIndicadores
                .OrderBy(s => s.Nome)
                .ToListAsync();

            return subcategorias.Select(s => new SubcategoriaIndicadorDto
            {
                Id = s.Id,
                Nome = s.Nome,
                Descricao = s.Descricao,
                DataCriacao = s.DataCriacao,
                DataAtualizacao = s.DataAtualizacao,
                QuantidadeIndicadores = s.Indicadores.Count
            });
        }

        public async Task<SubcategoriaIndicadorDto?> GetSubcategoriaByIdAsync(int id)
        {
            var subcategoria = await _context.SubcategoriasIndicadores
                .FirstOrDefaultAsync(s => s.Id == id);

            if (subcategoria == null) return null;

            return new SubcategoriaIndicadorDto
            {
                Id = subcategoria.Id,
                Nome = subcategoria.Nome,
                Descricao = subcategoria.Descricao,
                DataCriacao = subcategoria.DataCriacao,
                DataAtualizacao = subcategoria.DataAtualizacao,
                QuantidadeIndicadores = subcategoria.Indicadores.Count
            };
        }

        public async Task<SubcategoriaIndicadorDto> CreateSubcategoriaAsync(CreateSubcategoriaIndicadorDto dto)
        {
            var subcategoria = new SubcategoriaIndicador
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
                DataCriacao = DateTime.Now,
                DataAtualizacao = DateTime.Now
            };

            _context.SubcategoriasIndicadores.Add(subcategoria);
            await _context.SaveChangesAsync();

            return new SubcategoriaIndicadorDto
            {
                Id = subcategoria.Id,
                Nome = subcategoria.Nome,
                Descricao = subcategoria.Descricao,
                DataCriacao = subcategoria.DataCriacao,
                DataAtualizacao = subcategoria.DataAtualizacao,
                QuantidadeIndicadores = 0
            };
        }

        public async Task<SubcategoriaIndicadorDto?> UpdateSubcategoriaAsync(int id, UpdateSubcategoriaIndicadorDto dto)
        {
            var subcategoria = await _context.SubcategoriasIndicadores
                .FirstOrDefaultAsync(s => s.Id == id);

            if (subcategoria == null) return null;

            subcategoria.Nome = dto.Nome;
            subcategoria.Descricao = dto.Descricao;
            subcategoria.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            return new SubcategoriaIndicadorDto
            {
                Id = subcategoria.Id,
                Nome = subcategoria.Nome,
                Descricao = subcategoria.Descricao,
                DataCriacao = subcategoria.DataCriacao,
                DataAtualizacao = subcategoria.DataAtualizacao,
                QuantidadeIndicadores = subcategoria.Indicadores.Count
            };
        }

        public async Task<bool> DeleteSubcategoriaAsync(int id)
        {
            var subcategoria = await _context.SubcategoriasIndicadores
                .FirstOrDefaultAsync(s => s.Id == id);

            if (subcategoria == null) return false;

            _context.SubcategoriasIndicadores.Remove(subcategoria);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> VincularIndicadorSubcategoriasAsync(int indicadorId, List<int> subcategoriaIds)
        {
            var indicador = await _context.Indicadores
                .Include(i => i.Subcategorias)
                .FirstOrDefaultAsync(i => i.Id == indicadorId);

            if (indicador == null) return false;

            // Remover vínculos existentes
            indicador.Subcategorias.Clear();

            // Adicionar novos vínculos
            foreach (var subcategoriaId in subcategoriaIds)
            {
                var subcategoria = await _context.SubcategoriasIndicadores
                    .FirstOrDefaultAsync(s => s.Id == subcategoriaId);

                if (subcategoria != null)
                {
                    indicador.Subcategorias.Add(new IndicadorSubcategoria
                    {
                        IndicadorId = indicadorId,
                        SubcategoriaId = subcategoriaId
                    });
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DesvincularIndicadorSubcategoriaAsync(int indicadorId, int subcategoriaId)
        {
            var vinculo = await _context.IndicadoresSubcategorias
                .FirstOrDefaultAsync(isb => isb.IndicadorId == indicadorId && isb.SubcategoriaId == subcategoriaId);

            if (vinculo == null) return false;

            _context.IndicadoresSubcategorias.Remove(vinculo);
            await _context.SaveChangesAsync();

            return true;
        }

        private static (string status, string cor) GetStatusCor(decimal percentual)
        {
            return (percentual >= 90 ? ("Excelente", "#22c55e") :
                   percentual >= 75 ? ("Bom", "#eab308") :
                   percentual >= 60 ? ("Regular", "#f97316") :
                   ("Ruim", "#ef4444"));
        }
    }
}
