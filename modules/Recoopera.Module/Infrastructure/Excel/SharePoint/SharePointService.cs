using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Recoopera.Module.Infrastructure.Excel.SharePoint
{
    public class SharePointService
    {
        private readonly ILogger<SharePointService> _logger;
        private readonly IConfiguration _configuration;

        public SharePointService(ILogger<SharePointService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }
    }
}
