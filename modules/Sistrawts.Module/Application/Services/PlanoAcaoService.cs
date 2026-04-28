using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SelectPdf;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Domain.Entities;
using Sistrawts.Module.Infrastructure;

namespace Sistrawts.Module.Application.Services
{
    public class PlanoAcaoService : IPlanoAcaoService
    {
        private readonly SistrawtsDbContext _context;
        private readonly ILogger<PlanoAcaoService> _logger;
        private readonly IEmailService _emailService;

        public PlanoAcaoService(SistrawtsDbContext context, ILogger<PlanoAcaoService> logger, IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
        }

        public async Task<IEnumerable<PlanoAcaoDto>> GetAllAsync(Guid userId)
        {
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
                return Enumerable.Empty<PlanoAcaoDto>();

            IQueryable<PlanoAcao> query = _context.PlanosAcao
                .Include(p => p.Responsavel)
                .Include(p => p.CriadoPor)
                .Include(p => p.MicroAcoes)
                    .ThenInclude(m => m.Responsavel);

            // Se não for admin, filtrar apenas planos vinculados ao usuário
            if (!usuario.Admin)
            {
                query = query.Where(p => 
                    p.ResponsavelId == userId || // É responsável do plano
                    p.CriadoPorId == userId || // Criou o plano
                    p.MicroAcoes.Any(m => m.ResponsavelId == userId) // É responsável de alguma micro-ação
                );
            }

            var planos = await query
                .OrderByDescending(p => p.DataCriacao)
                .ToListAsync();

            return planos.Select(MapToDto);
        }

        public async Task<PlanoAcaoDto?> GetByIdAsync(Guid id, Guid userId)
        {
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
                return null;

            var plano = await _context.PlanosAcao
                .Include(p => p.Responsavel)
                .Include(p => p.CriadoPor)
                .Include(p => p.MicroAcoes)
                    .ThenInclude(m => m.Responsavel)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plano == null)
                return null;

            // Verificar se o usuário tem permissão para ver este plano
            if (!usuario.Admin)
            {
                var temAcesso = plano.ResponsavelId == userId || // É responsável do plano
                               plano.CriadoPorId == userId || // Criou o plano
                               plano.MicroAcoes.Any(m => m.ResponsavelId == userId); // É responsável de alguma micro-ação

                if (!temAcesso)
                    return null; // Usuário não tem permissão para ver este plano
            }

            return MapToDto(plano);
        }

        public async Task<PlanoAcaoDto> CreateAsync(CreatePlanoAcaoDto dto, Guid criadoPorId)
        {
            var usuarioCriador = await _context.Usuarios.FindAsync(criadoPorId);
            if (usuarioCriador == null || !usuarioCriador.Admin)
                throw new UnauthorizedAccessException("Apenas administradores podem cadastrar planos de acao");

            var responsavel = await _context.Usuarios.FindAsync(dto.ResponsavelId);
            if (responsavel == null)
                throw new ArgumentException("Responsavel do plano nao encontrado");

            var plano = new PlanoAcao
            {
                Titulo = dto.Titulo,
                Descricao = dto.Descricao,
                DataInicio = dto.DataInicio,
                PrevisaoConclusao = dto.PrevisaoConclusao,
                ResponsavelId = dto.ResponsavelId,
                CriadoPorId = criadoPorId,
                DataCriacao = DateTime.Now,
                DataAtualizacao = DateTime.Now
            };

            _context.PlanosAcao.Add(plano);
            await _context.SaveChangesAsync();

            await _context.Entry(plano)
                .Reference(p => p.Responsavel)
                .LoadAsync();

            await _context.Entry(plano)
                .Reference(p => p.CriadoPor)
                .LoadAsync();

            // Enviar e-mail de notificação em background (não bloqueia a resposta)
            var planoDto = MapToDto(plano);
            _ = Task.Run(async () => 
            {
                try
                {
                    await _emailService.EnviarEmailPlanoAcaoAtribuido(planoDto);
                }
                catch (Exception ex)
                {
                    // Log de erro de e-mail não deve afetar a operação principal
                    // Em produção, poderia usar um sistema de logging mais robusto
                    Console.WriteLine($"Erro ao enviar e-mail em background: {ex.Message}");
                }
            });

            return planoDto;
        }

        public async Task<PlanoAcaoDto?> UpdateAsync(Guid id, UpdatePlanoAcaoDto dto, Guid userId)
        {
            var plano = await _context.PlanosAcao
                .Include(p => p.Responsavel)
                .Include(p => p.CriadoPor)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plano == null)
                return null;

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null || (!usuario.Admin && plano.ResponsavelId != userId))
                throw new UnauthorizedAccessException("Sem permissao para atualizar este plano");

            var isAdmin = usuario.Admin;

            plano.Titulo = dto.Titulo;
            plano.Descricao = dto.Descricao;
            plano.Trativa = dto.Trativa;
            plano.Relatorio = dto.Relatorio;

            if (isAdmin)
            {
                plano.DataInicio = dto.DataInicio;
                plano.PrevisaoConclusao = dto.PrevisaoConclusao;

                if (dto.ResponsavelId.HasValue && dto.ResponsavelId.Value != Guid.Empty)
                    plano.ResponsavelId = dto.ResponsavelId.Value;
            }
            else
            {
                if (dto.DataInicio.Date != plano.DataInicio.Date || dto.PrevisaoConclusao.Date != plano.PrevisaoConclusao.Date)
                    throw new UnauthorizedAccessException("Somente administradores podem alterar datas do plano");

                if (dto.ResponsavelId.HasValue && dto.ResponsavelId.Value != plano.ResponsavelId)
                    throw new UnauthorizedAccessException("Somente administradores podem alterar o responsavel do plano");
            }

            plano.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            await _context.Entry(plano)
                .Reference(p => p.Responsavel)
                .LoadAsync();

            await _context.Entry(plano)
                .Reference(p => p.CriadoPor)
                .LoadAsync();

            return MapToDto(plano);
        }

        public async Task<bool> DeleteAsync(Guid id, Guid userId)
        {
            var plano = await _context.PlanosAcao.FindAsync(id);
            if (plano == null)
                return false;

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null || !usuario.Admin)
                throw new UnauthorizedAccessException("Apenas administradores podem excluir planos");

            _context.PlanosAcao.Remove(plano);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<PlanoAcaoDto>> GetByResponsavelIdAsync(Guid responsavelId)
        {
            var planos = await _context.PlanosAcao
                .Include(p => p.Responsavel)
                .Include(p => p.CriadoPor)
                .Include(p => p.MicroAcoes)
                    .ThenInclude(m => m.Responsavel)
                .Where(p => p.ResponsavelId == responsavelId)
                .OrderByDescending(p => p.DataCriacao)
                .ToListAsync();

            return planos.Select(MapToDto);
        }

        public async Task<bool> AtualizarPercentualConclusaoAsync(Guid planoAcaoId)
        {
            var plano = await _context.PlanosAcao
                .Include(p => p.MicroAcoes)
                .FirstOrDefaultAsync(p => p.Id == planoAcaoId);

            if (plano == null)
                return false;

            if (plano.MicroAcoes.Any())
            {
                var concluidas = plano.MicroAcoes.Count(m => m.Concluida);
                plano.PercentualConclusao = concluidas * 100 / plano.MicroAcoes.Count;
            }
            else
            {
                plano.PercentualConclusao = 0;
            }

            plano.DataAtualizacao = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AtualizarTrativaAsync(Guid id, string trativa, Guid userId)
        {
            var plano = await _context.PlanosAcao
                .Include(p => p.Responsavel)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plano == null)
                return false;

            if (plano.ResponsavelId != userId)
                throw new UnauthorizedAccessException("Apenas o responsavel pode atualizar a trativa");

            plano.Trativa = trativa;
            plano.DataAtualizacao = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AtualizarRelatorioAsync(Guid id, string relatorio, Guid userId)
        {
            var plano = await _context.PlanosAcao
                .Include(p => p.Responsavel)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plano == null)
                return false;

            if (plano.ResponsavelId != userId)
                throw new UnauthorizedAccessException("Apenas o responsavel pode atualizar o relatorio");

            plano.Relatorio = relatorio;
            plano.DataAtualizacao = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<byte[]?> GerarRelatorioPdfAsync(Guid id, Guid userId)
        {
            var plano = await _context.PlanosAcao
                .Include(p => p.Responsavel)
                .Include(p => p.CriadoPor)
                .Include(p => p.MicroAcoes)
                    .ThenInclude(m => m.Responsavel)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plano == null)
                return null;

            // Verificar permissão
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
                throw new UnauthorizedAccessException("Usuario nao encontrado");

            // Se não for admin, verificar se tem acesso ao plano
            if (!usuario.Admin)
            {
                var temAcesso = plano.ResponsavelId == userId || // É responsável do plano
                               plano.CriadoPorId == userId || // Criou o plano
                               plano.MicroAcoes.Any(m => m.ResponsavelId == userId); // É responsável de alguma micro-ação

                if (!temAcesso)
                    throw new UnauthorizedAccessException("Usuario nao tem permissao para ver este relatorio");
            }

            // Gerar HTML do relatório
            var html = GerarHtmlRelatorio(plano);
            
            // Converter HTML para PDF
            return GerarPdfFromHtml(html);
        }

        private static PlanoAcaoDto MapToDto(PlanoAcao plano)
        {
            return new PlanoAcaoDto
            {
                Id = plano.Id,
                Titulo = plano.Titulo,
                Descricao = plano.Descricao,
                DataInicio = plano.DataInicio,
                PrevisaoConclusao = plano.PrevisaoConclusao,
                DataConclusao = plano.DataConclusao,
                PercentualConclusao = plano.PercentualConclusao,
                Trativa = plano.Trativa,
                Relatorio = plano.Relatorio,
                ResponsavelId = plano.ResponsavelId,
                ResponsavelNome = plano.Responsavel?.NomeCompleto ?? string.Empty,
                ResponsavelEmail = plano.Responsavel?.Email ?? string.Empty,
                CriadoPorId = plano.CriadoPorId,
                CriadoPorNome = plano.CriadoPor?.NomeCompleto ?? string.Empty,
                DataCriacao = plano.DataCriacao,
                DataAtualizacao = plano.DataAtualizacao,
                MicroAcoes = plano.MicroAcoes.Select(MapMicroAcaoToDto).ToList()
            };
        }

        private static MicroAcaoDto MapMicroAcaoToDto(MicroAcao microAcao)
        {
            return new MicroAcaoDto
            {
                Id = microAcao.Id,
                Titulo = microAcao.Titulo,
                Descricao = microAcao.Descricao,
                DataInicio = microAcao.DataInicio,
                PrevisaoConclusao = microAcao.PrevisaoConclusao,
                DataConclusao = microAcao.DataConclusao,
                Concluida = microAcao.Concluida,
                ArquivoComprovacao = microAcao.ArquivoComprovacao,
                PlanoAcaoId = microAcao.PlanoAcaoId,
                PlanoAcaoTitulo = microAcao.PlanoAcao?.Titulo ?? string.Empty,
                ResponsavelId = microAcao.ResponsavelId,
                ResponsavelNome = microAcao.Responsavel?.NomeCompleto ?? string.Empty,
                ResponsavelEmail = microAcao.Responsavel?.Email ?? string.Empty,
                CriadoPorId = microAcao.CriadoPorId,
                CriadoPorNome = microAcao.CriadoPor?.NomeCompleto ?? string.Empty,
                DataCriacao = microAcao.DataCriacao,
                DataAtualizacao = microAcao.DataAtualizacao
            };
        }

        private string GerarHtmlRelatorio(PlanoAcao plano)
        {
            var html = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Relatório do Plano de Ação</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .header {{ border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }}
        .section {{ margin-bottom: 30px; }}
        .micro-acao {{ border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }}
        .status-concluida {{ color: #28a745; }}
        .status-andamento {{ color: #dc3545; }}
        .progress-bar {{ width: 200px; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }}
        .progress-fill {{ height: 100%; background: #28a745; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>Relatório do Plano de Ação</h1>
        <h2>{plano.Titulo}</h2>
        <p><strong>Responsável:</strong> {plano.Responsavel?.NomeCompleto}</p>
        <p><strong>Período:</strong> {plano.DataInicio:dd/MM/yyyy} a {plano.PrevisaoConclusao:dd/MM/yyyy}</p>
        <p><strong>Criado em:</strong> {plano.DataCriacao:dd/MM/yyyy HH:mm}</p>
    </div>

    <div class='section'>
        <h3>Informações Gerais</h3>
        {(!string.IsNullOrEmpty(plano.Descricao) ? $"<p><strong>Descrição:</strong> {plano.Descricao}</p>" : "")}
        {(!string.IsNullOrEmpty(plano.Relatorio) ? $"<p><strong>Relatório:</strong><br/>{plano.Relatorio.Replace("\n", "<br/>")}</p>" : "")}
        
        <p><strong>Progresso Geral:</strong></p>
        <div class='progress-bar'>
            <div class='progress-fill' style='width: {plano.PercentualConclusao}%'></div>
        </div>
        <p>{plano.PercentualConclusao:F1}% concluído</p>
    </div>

    <div class='section'>
        <h3>Micro-ações ({plano.MicroAcoes.Count})</h3>";

            foreach (var microAcao in plano.MicroAcoes.OrderBy(m => m.DataInicio))
            {
                html += $@"
        <div class='micro-acao'>
            <h4>{microAcao.Titulo}</h4>
            <p><strong>Responsável:</strong> {microAcao.Responsavel?.NomeCompleto}</p>
            <p><strong>Período:</strong> {microAcao.DataInicio:dd/MM/yyyy} a {microAcao.PrevisaoConclusao:dd/MM/yyyy}</p>
            <p><strong>Status:</strong> <span class='{(microAcao.Concluida ? "status-concluida" : "status-andamento")}'>{(microAcao.Concluida ? "Concluída" : "Em Andamento")}</span></p>
            {(!string.IsNullOrEmpty(microAcao.Descricao) ? $"<p><strong>Descrição:</strong> {microAcao.Descricao}</p>" : "")}
            {(!string.IsNullOrEmpty(microAcao.Trativa) ? $"<p><strong>Trativa:</strong><br/>{microAcao.Trativa.Replace("\n", "<br/>")}</p>" : "")}
            {(microAcao.DataConclusao.HasValue ? $"<p><strong>Concluída em:</strong> {microAcao.DataConclusao.Value:dd/MM/yyyy}</p>" : "")}
        </div>";
            }

            html += @"
    </div>

    <div class='section'>
        <p><em>Relatório gerado em " + DateTime.Now.ToString("dd/MM/yyyy HH:mm") + @"</em></p>
    </div>
</body>
</html>";

            return html;
        }

        private byte[] GerarPdfFromHtml(string html)
        {
            try
            {
                // Criar um HTML completo e estilizado
                var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Relatório do Plano de Ação</title>
    <style>
        body {{ 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6;
            color: #333;
        }}
        .header {{ 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }}
        .section {{ 
            margin-bottom: 30px; 
            page-break-inside: avoid;
        }}
        .micro-acao {{ 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin-bottom: 15px; 
            border-radius: 5px; 
            background: #f9f9f9;
            page-break-inside: avoid;
        }}
        .status-concluida {{ 
            color: #28a745; 
            font-weight: bold;
        }}
        .status-andamento {{ 
            color: #dc3545; 
            font-weight: bold;
        }}
        .progress-bar {{ 
            width: 200px; 
            height: 20px; 
            background: #f0f0f0; 
            border-radius: 10px; 
            overflow: hidden; 
            border: 1px solid #ddd;
        }}
        .progress-fill {{ 
            height: 100%; 
            background: #28a745; 
        }}
        h1 {{ color: #2c3e50; font-size: 28px; }}
        h2 {{ color: #34495e; font-size: 22px; }}
        h3 {{ color: #7f8c8d; font-size: 18px; }}
        h4 {{ color: #34495e; font-size: 16px; }}
        strong {{ color: #2c3e50; }}
        @page {{
            margin: 2cm;
            size: A4;
        }}
    </style>
</head>
<body>
    {html}
</body>
</html>";

                // Usar Select.HtmlToPdf para gerar PDF real
                var converter = new HtmlToPdf();
                
                // Configurar opções do PDF
                converter.Options.PdfPageSize = PdfPageSize.A4;
                converter.Options.PdfPageOrientation = PdfPageOrientation.Portrait;
                converter.Options.MarginTop = 20;
                converter.Options.MarginBottom = 20;
                converter.Options.MarginLeft = 20;
                converter.Options.MarginRight = 20;
                
                // Converter HTML para PDF
                var doc = converter.ConvertHtmlString(htmlContent);
                
                // Salvar em bytes
                var pdfBytes = doc.Save();
                
                return pdfBytes;
            }
            catch (Exception ex)
            {
                // Em caso de erro com Select.HtmlToPdf, fallback para HTML
                _logger.LogError(ex, "Erro ao gerar PDF com Select.HtmlToPdf, usando fallback");
                var errorText = $"Erro ao gerar PDF: {ex.Message}\n\n{html}";
                return System.Text.Encoding.UTF8.GetBytes(errorText);
            }
        }
    }
}
