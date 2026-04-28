using System.ComponentModel.DataAnnotations;

namespace Sistrawts.Module.Domain.Entities
{
    public class Indicador
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string NomeMeta { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? Descricao { get; set; }
        
        public int CategoriaId { get; set; }
        
        // Tipo do indicador: Percentual (true) ou Decimal (false)
        public bool EhPercentual { get; set; }
        
        // Critério: true = quanto maior melhor, false = quanto menor melhor
        public bool QuantoMaiorMelhor { get; set; }
        
        public DateTime DataCriacao { get; set; } = DateTime.Now;
        public DateTime DataAtualizacao { get; set; } = DateTime.Now;
        
        // Relacionamentos
        public virtual CategoriaIndicador Categoria { get; set; } = null!;
        public virtual ICollection<MetaMensal> MetasMensais { get; set; } = new List<MetaMensal>();
        public virtual ICollection<ResultadoMensal> ResultadosMensais { get; set; } = new List<ResultadoMensal>();
        public virtual ICollection<IndicadorSubcategoria> Subcategorias { get; set; } = new List<IndicadorSubcategoria>();
    }
    
    public class MetaMensal
    {
        public int Id { get; set; }
        public int IndicadorId { get; set; }
        public int? SubcategoriaId { get; set; }
        public int Ano { get; set; }
        public int Mes { get; set; } // 1-12
        public decimal ValorMeta { get; set; }
        
        public virtual Indicador Indicador { get; set; } = null!;
        public virtual SubcategoriaIndicador? Subcategoria { get; set; }
    }
    
    public class ResultadoMensal
    {
        public int Id { get; set; }
        public int IndicadorId { get; set; }
        public int? SubcategoriaId { get; set; }
        public int Ano { get; set; }
        public int Mes { get; set; } // 1-12
        public decimal ValorResultado { get; set; }
        public DateTime DataRegistro { get; set; } = DateTime.Now;
        
        public virtual Indicador Indicador { get; set; } = null!;
        public virtual SubcategoriaIndicador? Subcategoria { get; set; }
    }
}
