using System.Reflection;

namespace Sistrawts.Module.Controllers
{
    public static class AssemblyReference
    {
        public static readonly Assembly Assembly = typeof(AssemblyReference).Assembly;
    }
}
