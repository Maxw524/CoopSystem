using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sistrawts.Module.Infrastructure;

namespace Sistrawts.Module.Application.BackgroundServices;

public class PlanoAcaoVencimentoService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PlanoAcaoVencimentoService> _logger;

    public PlanoAcaoVencimentoService(
        IServiceScopeFactory scopeFactory,
        ILogger<PlanoAcaoVencimentoService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Serviço de verificação de vencimento de planos iniciado");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await VerificarVencimentosAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao verificar vencimentos de planos");
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private async Task VerificarVencimentosAsync(CancellationToken cancellationToken)
    {
        // ✅ CRIA ESCOPO NOVO A CADA EXECUÇÃO
        using var scope = _scopeFactory.CreateScope();

        // ✅ RESOLVE DbContext DENTRO DO ESCOPO
        var context = scope.ServiceProvider.GetRequiredService<SistrawtsDbContext>();

        // ✅ MANTÉM SUA LÓGICA ORIGINAL
        var planos = await context.PlanosAcao
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Verificação executada. {Quantidade} planos encontrados.", planos.Count);

        // 👉 AQUI VOCÊ COLOCA O RESTO DA SUA LÓGICA ORIGINAL
    }
}