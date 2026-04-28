using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Sistrawts.Module.Infrastructure;

public sealed class SistrawtsDbContextFactory : IDesignTimeDbContextFactory<SistrawtsDbContext>
{
    public SistrawtsDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();

        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection não configurada. " +
                "Defina via variável de ambiente ConnectionStrings__DefaultConnection.");
        }

        var optionsBuilder = new DbContextOptionsBuilder<SistrawtsDbContext>();

        optionsBuilder.UseSqlServer(connectionString, sql =>
            sql.MigrationsAssembly(typeof(SistrawtsDbContext).Assembly.GetName().Name));

        return new SistrawtsDbContext(optionsBuilder.Options);
    }

    private static IConfiguration BuildConfiguration()
    {
        var rootPath = FindSolutionRoot();
        var apiConfigPath = Path.Combine(rootPath, "src", "CoopSystem.API");

        return new ConfigurationBuilder()
            .SetBasePath(Directory.Exists(apiConfigPath) ? apiConfigPath : Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Production.json", optional: true)
            .AddEnvironmentVariables()
            .Build();
    }

    private static string FindSolutionRoot()
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());

        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "CoopSystem.sln")))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        return Directory.GetCurrentDirectory();
    }
}