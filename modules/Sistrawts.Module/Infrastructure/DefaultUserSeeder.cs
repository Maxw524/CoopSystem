using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Sistrawts.Module.Infrastructure
{
    public static class DefaultUserSeeder
    {
        public static async Task SeedDefaultUserAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();

            var context = scope.ServiceProvider.GetRequiredService<SistrawtsDbContext>();
            var logger = scope.ServiceProvider
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("DefaultUserSeeder");

            const string defaultUsername = "Coop";
            const string defaultPassword = "123456";

            var user = await context.Usuarios
                .FirstOrDefaultAsync(u => u.Username == defaultUsername);

            var hash = BCrypt.Net.BCrypt.HashPassword(defaultPassword);

            if (user == null)
            {
                user = new Domain.Entities.Usuario
                {
                    Id = Guid.NewGuid(),
                    Username = defaultUsername,
                    NomeCompleto = "Administrador do Sistema",
                    Email = "credipinho@sicoobcredipinho.com.br",
                    Admin = true,
                    PermiteSistrawts = true,
                    PermiteJuridico = true,
                    PermiteSimuladorTaxa = true,
                    Ativo = true,
                    DataCriacao = DateTime.UtcNow
                };

                context.Usuarios.Add(user);

                logger.LogInformation("Usuário padrão criado automaticamente.");
            }
            else
            {
                logger.LogInformation("Usuário padrão já existe. Resetando senha...");
            }

            // 🔐 Sempre reseta a senha para garantir login
            user.SenhaHash = hash;
            user.Ativo = true;
            user.DataAtualizacao = DateTime.UtcNow;

            await context.SaveChangesAsync();

            logger.LogInformation("Senha do usuário padrão atualizada com sucesso.");
        }
    }
}