namespace Sistrawts.Module.Application.DTOs
{
    public class CategoriaIndicadorDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime DataAtualizacao { get; set; }
    }
    
    public class CreateCategoriaIndicadorDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
    }
    
    public class UpdateCategoriaIndicadorDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
    }
}
