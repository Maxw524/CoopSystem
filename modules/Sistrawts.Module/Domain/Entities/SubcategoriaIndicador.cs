using System.ComponentModel.DataAnnotations;

namespace Sistrawts.Module.Domain.Entities
{
    public class SubcategoriaIndicador
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Nome { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string? Descricao { get; set; }
        
        public DateTime DataCriacao { get; set; }
        public DateTime DataAtualizacao { get; set; }
        
        // Relacionamento com indicadores (muitos para muitos)
        public List<IndicadorSubcategoria> Indicadores { get; set; } = new();
    }
    
    // Tabela de junção para relacionamento muitos-para-muitos
    public class IndicadorSubcategoria
    {
        public int IndicadorId { get; set; }
        public int SubcategoriaId { get; set; }
        
        public Indicador Indicador { get; set; } = null!;
        public SubcategoriaIndicador Subcategoria { get; set; } = null!;
    }
}
