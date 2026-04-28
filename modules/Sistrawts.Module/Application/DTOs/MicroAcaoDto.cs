using System.ComponentModel.DataAnnotations;

namespace Sistrawts.Module.Application.DTOs
{
    public class MicroAcaoDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O titulo e obrigatorio")]
        [StringLength(200, ErrorMessage = "O titulo deve ter no maximo 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "A descricao deve ter no maximo 1000 caracteres")]
        public string Descricao { get; set; } = string.Empty;

        [StringLength(2000, ErrorMessage = "A trativa deve ter no maximo 2000 caracteres")]
        public string Trativa { get; set; } = string.Empty;

        [Required(ErrorMessage = "A data de inicio e obrigatoria")]
        public DateTime DataInicio { get; set; }

        [Required(ErrorMessage = "A previsao de conclusao e obrigatoria")]
        public DateTime PrevisaoConclusao { get; set; }

        public DateTime? DataConclusao { get; set; }
        public bool Concluida { get; set; }
        public string? ArquivoComprovacao { get; set; }
        public Guid PlanoAcaoId { get; set; }
        public string PlanoAcaoTitulo { get; set; } = string.Empty;

        [Required(ErrorMessage = "O responsavel e obrigatorio")]
        public Guid ResponsavelId { get; set; }

        public string ResponsavelNome { get; set; } = string.Empty;
        public string ResponsavelEmail { get; set; } = string.Empty;
        public Guid CriadoPorId { get; set; }
        public string CriadoPorNome { get; set; } = string.Empty;
        public DateTime DataCriacao { get; set; }
        public DateTime DataAtualizacao { get; set; }
    }

    public class CreateMicroAcaoDto
    {
        [Required(ErrorMessage = "O titulo e obrigatorio")]
        [StringLength(200, ErrorMessage = "O titulo deve ter no maximo 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "A descricao deve ter no maximo 1000 caracteres")]
        public string Descricao { get; set; } = string.Empty;

        [StringLength(2000, ErrorMessage = "A trativa deve ter no maximo 2000 caracteres")]
        public string Trativa { get; set; } = string.Empty;

        [Required(ErrorMessage = "A data de inicio e obrigatoria")]
        public DateTime DataInicio { get; set; }

        [Required(ErrorMessage = "A previsao de conclusao e obrigatoria")]
        public DateTime PrevisaoConclusao { get; set; }

        [Required(ErrorMessage = "O plano de acao e obrigatorio")]
        public Guid PlanoAcaoId { get; set; }

        [Required(ErrorMessage = "O responsavel e obrigatorio")]
        public Guid ResponsavelId { get; set; }
    }

    public class UpdateMicroAcaoDto
    {
        [Required(ErrorMessage = "O titulo e obrigatorio")]
        [StringLength(200, ErrorMessage = "O titulo deve ter no maximo 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "A descricao deve ter no maximo 1000 caracteres")]
        public string Descricao { get; set; } = string.Empty;

        [StringLength(2000, ErrorMessage = "A trativa deve ter no maximo 2000 caracteres")]
        public string Trativa { get; set; } = string.Empty;

        [Required(ErrorMessage = "A data de inicio e obrigatoria")]
        public DateTime DataInicio { get; set; }

        [Required(ErrorMessage = "A previsao de conclusao e obrigatoria")]
        public DateTime PrevisaoConclusao { get; set; }

        public Guid? ResponsavelId { get; set; }
        public bool Concluida { get; set; }
    }
}
