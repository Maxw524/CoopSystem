using System.ComponentModel.DataAnnotations;

namespace Sistrawts.Module.Application.DTOs
{
    public class SetorDto
    {
        public Guid Id { get; set; }

        [Required(ErrorMessage = "O nome e obrigatorio")]
        [StringLength(100, ErrorMessage = "O nome deve ter no maximo 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "A descricao deve ter no maximo 500 caracteres")]
        public string Descricao { get; set; } = string.Empty;

        public bool Ativo { get; set; } = true;
        public DateTime DataCriacao { get; set; }
        public DateTime DataAtualizacao { get; set; }
    }

    public class CreateSetorDto
    {
        [Required(ErrorMessage = "O nome e obrigatorio")]
        [StringLength(100, ErrorMessage = "O nome deve ter no maximo 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "A descricao deve ter no maximo 500 caracteres")]
        public string Descricao { get; set; } = string.Empty;
    }

    public class UpdateSetorDto
    {
        [Required(ErrorMessage = "O nome e obrigatorio")]
        [StringLength(100, ErrorMessage = "O nome deve ter no maximo 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "A descricao deve ter no maximo 500 caracteres")]
        public string Descricao { get; set; } = string.Empty;

        public bool Ativo { get; set; } = true;
    }
}
