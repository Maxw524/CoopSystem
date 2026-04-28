using Microsoft.EntityFrameworkCore;
using Sistrawts.Module.Application.DTOs;
using Sistrawts.Module.Domain.Entities;
using Sistrawts.Module.Infrastructure;

namespace Sistrawts.Module.Application.Services
{
    public class SetorService : ISetorService
    {
        private readonly SistrawtsDbContext _context;

        public SetorService(SistrawtsDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SetorDto>> GetAllAsync()
        {
            var setores = await _context.Setores
                .OrderBy(s => s.Nome)
                .ToListAsync();

            return setores.Select(MapToDto);
        }

        public async Task<SetorDto?> GetByIdAsync(Guid id)
        {
            var setor = await _context.Setores.FindAsync(id);
            return setor != null ? MapToDto(setor) : null;
        }

        public async Task<SetorDto> CreateAsync(CreateSetorDto dto)
        {
            if (await _context.Setores.AnyAsync(s => s.Nome == dto.Nome))
                throw new ArgumentException("Nome de setor já existe");

            var setor = new Setor
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
                Ativo = true,
                DataCriacao = DateTime.Now,
                DataAtualizacao = DateTime.Now
            };

            _context.Setores.Add(setor);
            await _context.SaveChangesAsync();

            return MapToDto(setor);
        }

        public async Task<SetorDto?> UpdateAsync(Guid id, UpdateSetorDto dto)
        {
            var setor = await _context.Setores.FindAsync(id);
            if (setor == null)
                return null;

            if (await _context.Setores.AnyAsync(s => s.Nome == dto.Nome && s.Id != id))
                throw new ArgumentException("Nome de setor já existe");

            setor.Nome = dto.Nome;
            setor.Descricao = dto.Descricao;
            setor.Ativo = dto.Ativo;
            setor.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();
            return MapToDto(setor);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var setor = await _context.Setores.FindAsync(id);
            if (setor == null)
                return false;

            _context.Setores.Remove(setor);
            await _context.SaveChangesAsync();
            return true;
        }

        private static SetorDto MapToDto(Setor setor)
        {
            return new SetorDto
            {
                Id = setor.Id,
                Nome = setor.Nome,
                Descricao = setor.Descricao,
                Ativo = setor.Ativo,
                DataCriacao = setor.DataCriacao,
                DataAtualizacao = setor.DataAtualizacao
            };
        }
    }
}
