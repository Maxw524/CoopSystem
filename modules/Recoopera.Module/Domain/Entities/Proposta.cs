using Recoopera.Module.Application.Enums;

public class Proposta
{
    public int Id { get; set; }
    public required string CPF { get; set; } = string.Empty;
    public decimal ValorTotal { get; set; }
    public decimal TaxaFinal { get; set; }
    public int Parcelas { get; set; }
    public decimal? Entrada { get; set; }
    public TipoProposta TipoProposta { get; set; }
    public required StatusProposta Status { get; set; }
    public DateTime DataCriacao { get; set; }
}
