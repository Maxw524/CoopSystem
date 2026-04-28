using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Recoopera.Module.Application.Interfaces;
using Recoopera.Module.Application.Services;
using Recoopera.Module.Domain.Services;
using Recoopera.Module.Infrastructure.Excel;
using Recoopera.Module.Infrastructure.Excel.Interfaces;
using Recoopera.Module.Infrastructure.Excel.Local;
using Recoopera.Module.Services;
using Sistrawts.Module.Infrastructure; // ✅ IMPORTANTE

namespace Recoopera.Module
{
    public static class ModuleExtensions
    {
        public static IServiceCollection AddRecooperaModule(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // ✅ GARANTE QUE O SistrawtsDbContext SERÁ USADO PELO RECOOPERA
            services.AddScoped<SistrawtsDbContext>();

            // ✅ Configurações
            services.Configure<ExcelSettings>(configuration.GetSection("ExcelSettings"));
            services.Configure<UploadSettings>(configuration.GetSection("UploadSettings"));

            // ✅ Repositórios
            services.AddSingleton<IOperacoesAdvogadosExcelRepository, OperacoesAdvogadosExcelLocalRepository>();
            services.AddScoped<IContratoExcelRepository, ContratoExcelLocalRepository>();

            // ✅ Serviços
            services.AddScoped<RenegociacaoService>();
            services.AddScoped<ICalculoNegociacaoService, CalculoNegociacaoService>();
            services.AddScoped<ICalculoRenegociacaoService, CalculoRenegociacaoService>();
            services.AddSingleton<TaxasCampanhaStore>();

            services.AddScoped<IUserStore, SqlUserStore>();
            services.AddSingleton<PasswordHasher>();

            services.AddScoped<IRenegociacaoDomainService, RenegociacaoDomainService>();
            services.AddScoped<IContratoValidationService, ContratoValidationService>();
            services.AddScoped<RenegociacaoEngine>();

            return services;
        }
    }
}
