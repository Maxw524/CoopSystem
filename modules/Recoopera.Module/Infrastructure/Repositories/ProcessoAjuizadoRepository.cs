using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Recoopera.Module.Infrastructure.Data;

namespace Recoopera.Module.Infrastructure.Repositories
{
    public class ProcessoAjuizadoRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProcessoAjuizadoRepository> _logger;

        public ProcessoAjuizadoRepository(AppDbContext context, ILogger<ProcessoAjuizadoRepository> logger)
        {
            _context = context;
            _logger = logger;
        }
    }
}
