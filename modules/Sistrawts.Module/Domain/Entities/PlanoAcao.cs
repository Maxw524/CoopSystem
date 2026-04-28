using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sistrawts.Module.Domain.Entities
{
    public class PlanoAcao
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(1000)]
        public string Descricao { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.DateTime)]
        public DateTime DataInicio { get; set; }

        [Required]
        [DataType(DataType.DateTime)]
        public DateTime PrevisaoConclusao { get; set; }

        [DataType(DataType.DateTime)]
        public DateTime? DataConclusao { get; set; }

        public int PercentualConclusao { get; set; } = 0;

        [StringLength(2000)]
        public string Trativa { get; set; } = string.Empty;

        [StringLength(4000)]
        public string Relatorio { get; set; } = string.Empty;

        [Required]
        public Guid ResponsavelId { get; set; }

        [ForeignKey("ResponsavelId")]
        public virtual Usuario Responsavel { get; set; } = null!;

        [Required]
        public Guid CriadoPorId { get; set; }

        [ForeignKey("CriadoPorId")]
        public virtual Usuario CriadoPor { get; set; } = null!;

        public DateTime DataCriacao { get; set; } = DateTime.Now;

        public DateTime DataAtualizacao { get; set; } = DateTime.Now;

        public virtual ICollection<MicroAcao> MicroAcoes { get; set; } = new List<MicroAcao>();
    }
}
