using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sistrawts.Module.Domain.Entities
{
    public class Usuario
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(200)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [StringLength(400)]
        public string NomeCompleto { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(400)]
        public string Email { get; set; } = string.Empty;

        public string SenhaHash { get; set; } = string.Empty;

        public bool Ativo { get; set; } = true;

        public bool Admin { get; set; } = false;
        public bool PermiteJuridico { get; set; } = false;
        public bool PermiteSistrawts { get; set; } = false;
        public bool PermiteSimuladorTaxa { get; set; } = false;
        public string PermissoesJson { get; set; } = "[]";

        public Guid? SetorId { get; set; }

        [StringLength(100)]
        public string Setor { get; set; } = string.Empty;

        public DateTime DataCriacao { get; set; } = DateTime.Now;

        public DateTime DataAtualizacao { get; set; } = DateTime.Now;

        public virtual ICollection<PlanoAcao> PlanosCriados { get; set; } = new List<PlanoAcao>();
        public virtual ICollection<PlanoAcao> PlanosResponsavel { get; set; } = new List<PlanoAcao>();
        public virtual ICollection<MicroAcao> MicroAcoesCriadas { get; set; } = new List<MicroAcao>();
        public virtual ICollection<MicroAcao> MicroAcoesResponsavel { get; set; } = new List<MicroAcao>();
    }
}
