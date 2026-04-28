using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Recoopera.Module.Controllers
{
    public class PropostaController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
