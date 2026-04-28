namespace Sistrawts.Module.Application.DTOs
{
    public class IndicadorDto
    {
        public int Id { get; set; }
        public string NomeMeta { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int CategoriaId { get; set; }
        public string CategoriaNome { get; set; } = string.Empty;
        public bool EhPercentual { get; set; }
        public bool QuantoMaiorMelhor { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime DataAtualizacao { get; set; }
        
        public List<MetaMensalDto> MetasMensais { get; set; } = new();
        public List<ResultadoMensalDto> ResultadosMensais { get; set; } = new();
        public List<IndicadorSubcategoriaDto> Subcategorias { get; set; } = new();
    }
    
    public class MetaMensalDto
    {
        public int Id { get; set; }
        public int IndicadorId { get; set; }
        public int? SubcategoriaId { get; set; }
        public int Ano { get; set; }
        public int Mes { get; set; }
        public decimal ValorMeta { get; set; }
        public string? SubcategoriaNome { get; set; }
        public string MesAno => $"{Mes:D2}/{Ano}";
        public string NomeMes => new DateTime(Ano, Mes, 1).ToString("MMMM", new System.Globalization.CultureInfo("pt-BR"));
    }
    
    public class ResultadoMensalDto
    {
        public int Id { get; set; }
        public int IndicadorId { get; set; }
        public int? SubcategoriaId { get; set; }
        public int Ano { get; set; }
        public int Mes { get; set; }
        public decimal ValorResultado { get; set; }
        public DateTime DataRegistro { get; set; }
        public string? SubcategoriaNome { get; set; }
        public string MesAno => $"{Mes:D2}/{Ano}";
        public string NomeMes => new DateTime(Ano, Mes, 1).ToString("MMMM", new System.Globalization.CultureInfo("pt-BR"));
        public bool BateuMeta { get; set; }
        public decimal ValorMeta { get; set; }
        public decimal PercentualAtingido { get; set; }
    }
    
    public class CreateIndicadorDto
    {
        public string NomeMeta { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int CategoriaId { get; set; }
        public bool EhPercentual { get; set; }
        public bool QuantoMaiorMelhor { get; set; }
        public List<CreateMetaMensalDto> MetasMensais { get; set; } = new();
    }
    
    public class CreateMetaMensalDto
    {
        public int Ano { get; set; }
        public int Mes { get; set; }
        public decimal ValorMeta { get; set; }
        public int? SubcategoriaId { get; set; }
    }
    
    public class UpdateIndicadorDto
    {
        public string NomeMeta { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int CategoriaId { get; set; }
        public bool EhPercentual { get; set; }
        public bool QuantoMaiorMelhor { get; set; }
        public List<CreateMetaMensalDto> MetasMensais { get; set; } = new();
    }
    
    public class CreateResultadoMensalDto
    {
        public int IndicadorId { get; set; }
        public int? SubcategoriaId { get; set; }
        public int Ano { get; set; }
        public int Mes { get; set; }
        public decimal ValorResultado { get; set; }
    }
    
    public class DashboardIndicadorDto
    {
        public int Id { get; set; }
        public string NomeMeta { get; set; } = string.Empty;
        public string CategoriaNome { get; set; } = string.Empty;
        public bool EhPercentual { get; set; }
        public bool QuantoMaiorMelhor { get; set; }
        
        public List<ResultadoMensalDto> UltimosResultados { get; set; } = new();
        public decimal PercentualGeral { get; set; }
        public int TotalMesesBateuMeta { get; set; }
        public int TotalMesesRegistrados { get; set; }
        public decimal MediaAtingimento { get; set; }
        public string StatusGeral { get; set; } = string.Empty; // "Excelente", "Bom", "Regular", "Ruim"
        public string CorStatus { get; set; } = string.Empty; // "#22c55e", "#eab308", "#ef4444"
    }
    
    // Subcategorias
    public class SubcategoriaIndicadorDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime DataAtualizacao { get; set; }
        public int QuantidadeIndicadores { get; set; }
    }
    
    public class CreateSubcategoriaIndicadorDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
    }
    
    public class UpdateSubcategoriaIndicadorDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
    }
    
    public class IndicadorSubcategoriaDto
    {
        public int IndicadorId { get; set; }
        public int SubcategoriaId { get; set; }
        public string SubcategoriaNome { get; set; } = string.Empty;
    }
    
    public class CreateIndicadorSubcategoriaDto
    {
        public int IndicadorId { get; set; }
        public List<int> SubcategoriaIds { get; set; } = new();
    }
}
