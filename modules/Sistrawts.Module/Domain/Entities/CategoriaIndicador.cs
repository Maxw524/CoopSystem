using System.ComponentModel.DataAnnotations;

namespace Sistrawts.Module.Domain.Entities
{
    public class CategoriaIndicador
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Descricao { get; set; }
        
        public DateTime DataCriacao { get; set; } = DateTime.Now;
        public DateTime DataAtualizacao { get; set; } = DateTime.Now;
        
        // Relacionamento
        public virtual ICollection<Indicador> Indicadores { get; set; } = new List<Indicador>();
    }
}
