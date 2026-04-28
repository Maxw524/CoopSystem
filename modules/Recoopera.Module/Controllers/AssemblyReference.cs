using System.Reflection;

namespace Recoopera.Module.Controllers;

public static class AssemblyReference
{
    public static readonly Assembly Assembly = typeof(AssemblyReference).Assembly;
}
