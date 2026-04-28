using Microsoft.EntityFrameworkCore;
using Recoopera.Module.Data;

namespace CoopSystem.API.Infrastructure
{
    // Contexto compartilhado para autenticação do sistema
    public class AuthDbContext : Microsoft.EntityFrameworkCore.DbContext
    {
        public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }

        // Mapear entidades do módulo que precisam persistência
        public DbSet<AppUser> Users { get; set; } = null!;
        public DbSet<UserRole> UserRoles { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Configurar chave composta para UserRole
            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.Role });
        
            // Aplicar configurações do módulo Recoopera
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppUser).Assembly);
        }
    }
}
