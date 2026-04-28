using System.ComponentModel.DataAnnotations;

namespace Sistrawts.Module.Application.DTOs
{
    public class UsuarioDto
    {
        public Guid Id { get; set; }

        [Required(ErrorMessage = "O username e obrigatorio")]
        [StringLength(200, ErrorMessage = "O username deve ter no maximo 200 caracteres")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "O nome completo e obrigatorio")]
        [StringLength(400, ErrorMessage = "O nome completo deve ter no maximo 400 caracteres")]
        public string NomeCompleto { get; set; } = string.Empty;

        [Required(ErrorMessage = "O e-mail e obrigatorio")]
        [EmailAddress(ErrorMessage = "Formato de e-mail invalido")]
        [StringLength(400, ErrorMessage = "O e-mail deve ter no maximo 400 caracteres")]
        public string Email { get; set; } = string.Empty;

        public bool Ativo { get; set; } = true;
        public bool Admin { get; set; }
        public bool PermiteJuridico { get; set; }
        public bool PermiteSistrawts { get; set; }
        public bool PermiteSimuladorTaxa { get; set; }
        public List<string> Permissoes { get; set; } = new();
        public Guid? SetorId { get; set; }
        public string Setor { get; set; } = string.Empty;
        public DateTime DataCriacao { get; set; }
        public DateTime DataAtualizacao { get; set; }
    }

    public class CreateUsuarioDto
    {
        [Required(ErrorMessage = "O username e obrigatorio")]
        [StringLength(200, ErrorMessage = "O username deve ter no maximo 200 caracteres")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "O nome completo e obrigatorio")]
        [StringLength(400, ErrorMessage = "O nome completo deve ter no maximo 400 caracteres")]
        public string NomeCompleto { get; set; } = string.Empty;

        [Required(ErrorMessage = "O e-mail e obrigatorio")]
        [EmailAddress(ErrorMessage = "Formato de e-mail invalido")]
        [StringLength(400, ErrorMessage = "O e-mail deve ter no maximo 400 caracteres")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "A senha e obrigatoria")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "A senha deve ter entre 6 e 100 caracteres")]
        public string Senha { get; set; } = string.Empty;

        public bool Admin { get; set; }
        public bool PermiteJuridico { get; set; }
        public bool PermiteSistrawts { get; set; }
        public bool PermiteSimuladorTaxa { get; set; }
        public List<string> Permissoes { get; set; } = new();
        public Guid? SetorId { get; set; }
    }

    public class UpdateUsuarioDto
    {
        [Required(ErrorMessage = "O nome completo e obrigatorio")]
        [StringLength(400, ErrorMessage = "O nome completo deve ter no maximo 400 caracteres")]
        public string NomeCompleto { get; set; } = string.Empty;

        [Required(ErrorMessage = "O e-mail e obrigatorio")]
        [EmailAddress(ErrorMessage = "Formato de e-mail invalido")]
        [StringLength(400, ErrorMessage = "O e-mail deve ter no maximo 400 caracteres")]
        public string Email { get; set; } = string.Empty;

        public bool Ativo { get; set; } = true;
        public bool Admin { get; set; }
        public bool PermiteJuridico { get; set; }
        public bool PermiteSistrawts { get; set; }
        public bool PermiteSimuladorTaxa { get; set; }
        public List<string> Permissoes { get; set; } = new();
        public Guid? SetorId { get; set; }
    }
}
