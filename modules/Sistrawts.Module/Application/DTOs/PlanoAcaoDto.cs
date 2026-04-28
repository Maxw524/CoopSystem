using System.ComponentModel.DataAnnotations;

namespace Sistrawts.Module.Application.DTOs
{
    public class PlanoAcaoDto
    {
        public Guid Id { get; set; }

        [Required(ErrorMessage = "O titulo e obrigatorio")]
        [StringLength(200, ErrorMessage = "O titulo deve ter no maximo 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "A descricao deve ter no maximo 1000 caracteres")]
        public string Descricao { get; set; } = string.Empty;

        [Required(ErrorMessage = "A data de inicio e obrigatoria")]
        public DateTime DataInicio { get; set; }

        [Required(ErrorMessage = "A previsao de conclusao e obrigatoria")]
        public DateTime PrevisaoConclusao { get; set; }

        public DateTime? DataConclusao { get; set; }
        public decimal PercentualConclusao { get; set; }
        public string Trativa { get; set; } = string.Empty;
        public string Relatorio { get; set; } = string.Empty;

        [Required(ErrorMessage = "O responsavel e obrigatorio")]
        public Guid ResponsavelId { get; set; }

        public string ResponsavelNome { get; set; } = string.Empty;
        public string ResponsavelEmail { get; set; } = string.Empty;
        public Guid CriadoPorId { get; set; }
        public string CriadoPorNome { get; set; } = string.Empty;
        public DateTime DataCriacao { get; set; }
        public DateTime DataAtualizacao { get; set; }
        public List<MicroAcaoDto> MicroAcoes { get; set; } = new();
    }

    public class CreatePlanoAcaoDto
    {
        [Required(ErrorMessage = "O titulo e obrigatorio")]
        [StringLength(200, ErrorMessage = "O titulo deve ter no maximo 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "A descricao deve ter no maximo 1000 caracteres")]
        public string Descricao { get; set; } = string.Empty;

        [Required(ErrorMessage = "A data de inicio e obrigatoria")]
        public DateTime DataInicio { get; set; }

        [Required(ErrorMessage = "A previsao de conclusao e obrigatoria")]
        public DateTime PrevisaoConclusao { get; set; }

        [Required(ErrorMessage = "O responsavel e obrigatorio")]
        public Guid ResponsavelId { get; set; }
    }

    public class UpdatePlanoAcaoDto
    {
        [Required(ErrorMessage = "O titulo e obrigatorio")]
        [StringLength(200, ErrorMessage = "O titulo deve ter no maximo 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "A descricao deve ter no maximo 1000 caracteres")]
        public string Descricao { get; set; } = string.Empty;

        [Required(ErrorMessage = "A data de inicio e obrigatoria")]
        public DateTime DataInicio { get; set; }

        [Required(ErrorMessage = "A previsao de conclusao e obrigatoria")]
        public DateTime PrevisaoConclusao { get; set; }

        public Guid? ResponsavelId { get; set; }
        public string Trativa { get; set; } = string.Empty;
        public string Relatorio { get; set; } = string.Empty;
    }
}
