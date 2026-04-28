using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Recoopera.Module.Infrastructure.Data;

namespace Recoopera.Module.Infrastructure.Repositories
{
    public class ContratoRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ContratoRepository> _logger;

        public ContratoRepository(AppDbContext context, ILogger<ContratoRepository> logger)
        {
            _context = context;
            _logger = logger;
        }
    }
}
