namespace Recoopera.Module.Domain.Entities
{
    public class Contrato
    {
        public int Id { get; set; }
        public string? NomeCliente { get; set; }
        public decimal ValorOriginal { get; set; }
        public decimal ValorSaldo { get; set; }
        public DateTime DataVencimento { get; set; }
        public bool EstaAjuizado { get; set; }
    }
}
