using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Domain.Entities;
using Sistrawts.Module.Infrastructure;

namespace Sistrawts.Module.Application.Services
{
    public class MicroAcaoService : IMicroAcaoService
    {
        private readonly SistrawtsDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IEmailService _emailService;

        public MicroAcaoService(SistrawtsDbContext context, IWebHostEnvironment environment, IEmailService emailService)
        {
            _context = context;
            _environment = environment;
            _emailService = emailService;
        }

        public async Task<IEnumerable<MicroAcaoDto>> GetAllAsync()
        {
            var microAcoes = await _context.MicroAcoes
                .Include(m => m.PlanoAcao)
                .Include(m => m.Responsavel)
                .Include(m => m.CriadoPor)
                .OrderByDescending(m => m.DataCriacao)
                .ToListAsync();

            return microAcoes.Select(MapToDto);
        }

        public async Task<MicroAcaoDto?> GetByIdAsync(int id)
        {
            var microAcao = await _context.MicroAcoes
                .Include(m => m.PlanoAcao)
                .Include(m => m.Responsavel)
                .Include(m => m.CriadoPor)
                .FirstOrDefaultAsync(m => m.Id == id);

            return microAcao != null ? MapToDto(microAcao) : null;
        }

        public async Task<MicroAcaoDto> CreateAsync(CreateMicroAcaoDto dto, Guid criadoPorId)
        {
            var usuarioCriador = await _context.Usuarios.FindAsync(criadoPorId);
            if (usuarioCriador == null || !usuarioCriador.Admin)
                throw new UnauthorizedAccessException("Apenas administradores podem cadastrar micro acoes");

            var plano = await _context.PlanosAcao.FindAsync(dto.PlanoAcaoId);
            if (plano == null)
                throw new ArgumentException("Plano de acao nao encontrado");

            var responsavel = await _context.Usuarios.FindAsync(dto.ResponsavelId);
            if (responsavel == null)
                throw new ArgumentException("Responsavel da micro acao nao encontrado");

            var microAcao = new MicroAcao
            {
                Titulo = dto.Titulo,
                Descricao = dto.Descricao,
                Trativa = dto.Trativa,
                DataInicio = dto.DataInicio,
                PrevisaoConclusao = dto.PrevisaoConclusao,
                PlanoAcaoId = dto.PlanoAcaoId,
                ResponsavelId = dto.ResponsavelId,
                CriadoPorId = criadoPorId,
                DataCriacao = DateTime.Now,
                DataAtualizacao = DateTime.Now
            };

            _context.MicroAcoes.Add(microAcao);
            await _context.SaveChangesAsync();

            await _context.Entry(microAcao)
                .Reference(m => m.PlanoAcao)
                .LoadAsync();

            await _context.Entry(microAcao)
                .Reference(m => m.Responsavel)
                .LoadAsync();

            await _context.Entry(microAcao)
                .Reference(m => m.CriadoPor)
                .LoadAsync();

            await AtualizarPercentualPlanoAsync(dto.PlanoAcaoId);

            // Enviar e-mail de notificação
            var microAcaoDto = MapToDto(microAcao);
            await _emailService.EnviarEmailMicroAcaoAtribuida(microAcaoDto);

            return microAcaoDto;
        }

        public async Task<MicroAcaoDto?> UpdateAsync(int id, UpdateMicroAcaoDto dto, Guid userId)
        {
            var microAcao = await _context.MicroAcoes
                .Include(m => m.PlanoAcao)
                .Include(m => m.Responsavel)
                .Include(m => m.CriadoPor)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (microAcao == null)
                return null;

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
                throw new UnauthorizedAccessException("Sem permissao para atualizar esta micro acao");

            var isAdmin = usuario.Admin;
            var isPlanoResponsavel = microAcao.PlanoAcao.ResponsavelId == userId;
            var isMicroResponsavel = microAcao.ResponsavelId == userId;
            var isSomenteResponsavelDaMicro = isMicroResponsavel && !isAdmin && !isPlanoResponsavel;

            if (!isAdmin && !isPlanoResponsavel && !isMicroResponsavel)
                throw new UnauthorizedAccessException("Sem permissao para atualizar esta micro acao");

            if (isSomenteResponsavelDaMicro)
            {
                if (!string.Equals(dto.Titulo, microAcao.Titulo, StringComparison.Ordinal) ||
                    !string.Equals(dto.Descricao, microAcao.Descricao, StringComparison.Ordinal))
                {
                    throw new UnauthorizedAccessException("Somente administradores ou responsavel do plano podem editar titulo e descricao da micro acao");
                }
            }
            else
            {
                microAcao.Titulo = dto.Titulo;
                microAcao.Descricao = dto.Descricao;
            }

            microAcao.Trativa = dto.Trativa;
            microAcao.Concluida = dto.Concluida;

            if (isAdmin)
            {
                microAcao.DataInicio = dto.DataInicio;
                microAcao.PrevisaoConclusao = dto.PrevisaoConclusao;
            }
            else if (dto.DataInicio.Date != microAcao.DataInicio.Date || dto.PrevisaoConclusao.Date != microAcao.PrevisaoConclusao.Date)
            {
                throw new UnauthorizedAccessException("Somente administradores podem alterar datas da micro acao");
            }

            if (dto.ResponsavelId.HasValue && dto.ResponsavelId.Value != Guid.Empty && dto.ResponsavelId.Value != microAcao.ResponsavelId)
            {
                if (!isAdmin && !isPlanoResponsavel)
                    throw new UnauthorizedAccessException("Somente administradores ou responsavel do plano podem redirecionar micro acoes");

                microAcao.ResponsavelId = dto.ResponsavelId.Value;
            }

            microAcao.DataAtualizacao = DateTime.Now;

            if (dto.Concluida && !microAcao.DataConclusao.HasValue)
            {
                microAcao.DataConclusao = DateTime.Now;
            }
            else if (!dto.Concluida)
            {
                microAcao.DataConclusao = null;
            }

            await _context.SaveChangesAsync();

            await _context.Entry(microAcao)
                .Reference(m => m.Responsavel)
                .LoadAsync();

            await AtualizarPercentualPlanoAsync(microAcao.PlanoAcaoId);

            return MapToDto(microAcao);
        }

        public async Task<bool> DeleteAsync(int id, Guid userId)
        {
            var microAcao = await _context.MicroAcoes.FindAsync(id);
            if (microAcao == null)
                return false;

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null || !usuario.Admin)
                throw new UnauthorizedAccessException("Apenas administradores podem excluir micro acoes");

            var planoAcaoId = microAcao.PlanoAcaoId;
            _context.MicroAcoes.Remove(microAcao);
            await _context.SaveChangesAsync();

            await AtualizarPercentualPlanoAsync(planoAcaoId);

            return true;
        }

        public async Task<IEnumerable<MicroAcaoDto>> GetByPlanoAcaoIdAsync(Guid planoAcaoId)
        {
            var microAcoes = await _context.MicroAcoes
                .Include(m => m.PlanoAcao)
                .Include(m => m.Responsavel)
                .Include(m => m.CriadoPor)
                .Where(m => m.PlanoAcaoId == planoAcaoId)
                .OrderBy(m => m.DataInicio)
                .ToListAsync();

            return microAcoes.Select(MapToDto);
        }

        public async Task<IEnumerable<MicroAcaoDto>> GetByResponsavelIdAsync(Guid responsavelId)
        {
            var microAcoes = await _context.MicroAcoes
                .Include(m => m.PlanoAcao)
                .Include(m => m.Responsavel)
                .Include(m => m.CriadoPor)
                .Where(m => m.ResponsavelId == responsavelId)
                .OrderByDescending(m => m.DataCriacao)
                .ToListAsync();

            return microAcoes.Select(MapToDto);
        }

        public async Task<bool> MarcarComoConcluidaAsync(int id, Guid userId)
        {
            var microAcao = await _context.MicroAcoes.FindAsync(id);
            if (microAcao == null)
                return false;

            if (microAcao.ResponsavelId != userId)
                throw new UnauthorizedAccessException("Apenas o responsavel pode marcar a micro acao como concluida");

            microAcao.Concluida = true;
            microAcao.DataConclusao = DateTime.Now;
            microAcao.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            await AtualizarPercentualPlanoAsync(microAcao.PlanoAcaoId);

            return true;
        }

        public async Task<string?> UploadComprovacaoAsync(int id, IFormFile file, Guid userId)
        {
            var microAcao = await _context.MicroAcoes.FindAsync(id);
            if (microAcao == null)
                return null;

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
                throw new UnauthorizedAccessException("Usuario nao encontrado");

            if (microAcao.ResponsavelId != userId && !usuario.Admin)
                throw new UnauthorizedAccessException("Apenas o responsavel ou admin pode fazer upload de comprovantes");

            if (file == null || file.Length == 0)
                throw new ArgumentException("Arquivo invalido");

            var allowedExtensions = new[] { ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException("Tipo de arquivo nao permitido");

            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "comprovantes");
            Directory.CreateDirectory(uploadsPath);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            microAcao.ArquivoComprovacao = $"/uploads/comprovantes/{uniqueFileName}";
            microAcao.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            return microAcao.ArquivoComprovacao;
        }

        private async Task AtualizarPercentualPlanoAsync(Guid planoAcaoId)
        {
            var plano = await _context.PlanosAcao
                .Include(p => p.MicroAcoes)
                .FirstOrDefaultAsync(p => p.Id == planoAcaoId);

            if (plano != null)
            {
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
            }
        }

        private static MicroAcaoDto MapToDto(MicroAcao microAcao)
        {
            return new MicroAcaoDto
            {
                Id = microAcao.Id,
                Titulo = microAcao.Titulo,
                Descricao = microAcao.Descricao,
                Trativa = microAcao.Trativa,
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
    }
}
