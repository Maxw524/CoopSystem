using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
namespace Recoopera.Module.Infrastructure.Excel.Interfaces;

public interface IOperacoesAdvogadosExcelRepository
{
    HashSet<string> GetContratosAjuizados();
}
