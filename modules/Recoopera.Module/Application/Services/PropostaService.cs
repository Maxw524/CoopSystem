using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Recoopera.Module.Infrastructure.Data;

namespace Recoopera.Module.Application.Services
{
    public class PropostaService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<PropostaService> _logger;

        public PropostaService(AppDbContext context, ILogger<PropostaService> logger)
        {
            _context = context;
            _logger = logger;
        }
    }
}
