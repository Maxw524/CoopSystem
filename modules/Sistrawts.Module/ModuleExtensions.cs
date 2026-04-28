using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Sistrawts.Module.Application.Services;
using Sistrawts.Module.Application.Settings;
using Sistrawts.Module.Infrastructure;

namespace Sistrawts.Module
{
    public static class ModuleExtensions
    {
        public static IServiceCollection AddSistrawtsModule(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // ✅ Registrar DbContext SEM fallback para localhost
            services.AddDbContext<SistrawtsDbContext>((serviceProvider, options) =>
            {
                var connectionString =
                    configuration.GetConnectionString("DefaultConnection");

                // ✅ Impede usar placeholder do appsettings
                if (string.IsNullOrWhiteSpace(connectionString) ||
                    connectionString.Contains("__SET_IN_SECRET_STORE__"))
                {
                    throw new InvalidOperationException(
                        "ConnectionStrings:DefaultConnection não configurada. " +
                        "Defina via variável de ambiente ConnectionStrings__DefaultConnection.");
                }

                options.UseSqlServer(connectionString, sql =>
                    sql.MigrationsAssembly(
                        typeof(SistrawtsDbContext).Assembly.GetName().Name));
            });

            // ✅ Serviços do módulo
            services.AddScoped<IPlanoAcaoService, PlanoAcaoService>();
            services.AddScoped<IMicroAcaoService, MicroAcaoService>();
            services.AddScoped<IUsuarioService, UsuarioService>();
            services.AddScoped<ISetorService, SetorService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IIndicadorService, IndicadorService>();

            // ✅ Config Email
            services.Configure<EmailSettings>(
                configuration.GetSection("EmailSettings"));

            return services;
        }
    }
}